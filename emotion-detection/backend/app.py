import os
import random
import subprocess
import tempfile
import time
from typing import Optional, Tuple

import numpy as np
import requests
import torch
import torch.nn as nn
import torch.optim as optim
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from model import extract_features, load_model, predict_emotion

load_dotenv()

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


def _as_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _cleanup_file(path: Optional[str]) -> None:
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass


def _convert_to_wav(input_path: str, output_path: str) -> None:
    configured_bin = os.getenv("FFMPEG_BIN", "ffmpeg")

    # Resolve configured path relative to backend folder only when a relative path is provided.
    if configured_bin not in {"ffmpeg", "ffmpeg.exe"} and not os.path.isabs(configured_bin):
        configured_bin = os.path.join(BACKEND_DIR, configured_bin)

    local_ffmpeg = os.path.abspath(os.path.join(BACKEND_DIR, "..", "..", "ffmpeg", "bin", "ffmpeg.exe"))

    # Keep multiple candidates so a bad env var does not break cloud deployments.
    candidates = []
    for candidate in (configured_bin, "ffmpeg", "/usr/bin/ffmpeg", local_ffmpeg):
        if candidate and candidate not in candidates:
            candidates.append(candidate)

    last_error = None
    for candidate in candidates:
        try:
            subprocess.run(
                [candidate, "-y", "-i", input_path, output_path],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                timeout=20,
            )
            return
        except FileNotFoundError as exc:
            last_error = exc
            continue
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("Audio conversion timed out") from exc
        except subprocess.CalledProcessError as exc:
            details = exc.stderr.decode("utf-8", errors="ignore") if exc.stderr else ""
            raise RuntimeError(f"Audio conversion failed: {details[:300]}") from exc

    try:
        raise FileNotFoundError()
    except FileNotFoundError as exc:
        if last_error is not None:
            exc = last_error
        raise RuntimeError("ffmpeg not found. Install ffmpeg or set FFMPEG_BIN") from exc


def _active_api_key() -> Tuple[Optional[str], str]:
    if os.getenv("OPENROUTER_API_KEY"):
        return os.getenv("OPENROUTER_API_KEY"), "openrouter"
    if os.getenv("OPENAI_API_KEY"):
        return os.getenv("OPENAI_API_KEY"), "openai"
    if os.getenv("DEEPSEEK_API_KEY"):
        return os.getenv("DEEPSEEK_API_KEY"), "deepseek"
    return None, "none"


def _build_llm_headers(api_key: str) -> dict:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    site_url = os.getenv("OPENROUTER_SITE_URL", "")
    site_name = os.getenv("OPENROUTER_SITE_NAME", "")
    if site_url:
        headers["HTTP-Referer"] = site_url
    if site_name:
        headers["X-Title"] = site_name

    return headers


def _build_llm_prompt(user_message: str, emotion: str) -> str:
    if emotion:
        return (
            "Answer in Bangla. "
            f"ব্যবহারকারী বলেছেন: '{user_message}'। "
            f"ব্যবহারকারীর আবেগ সনাক্ত হয়েছে: {emotion}। "
            "এই আবেগ বিবেচনা করে ব্যবহারকারীর প্রতি সহানুভূতিশীল এবং সহায়ক প্রতিক্রিয়া দিন।"
        )
    return (
        "Answer in Bangla. "
        f"ব্যবহারকারী বলেছেন: '{user_message}'। "
        "ব্যবহারকারীর প্রতি সহানুভূতিশীল এবং সহায়ক প্রতিক্রিয়া দিন।"
    )


def _generate_text_with_retries(prompt: str, timeout: int = 15, max_retries: int = 3) -> Tuple[Optional[str], Optional[str]]:
    api_key, provider = _active_api_key()
    if not api_key:
        return None, "No API key configured (OPENROUTER_API_KEY / OPENAI_API_KEY / DEEPSEEK_API_KEY)."

    base_url = os.getenv("LLM_API_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
    model_name = os.getenv("LLM_MODEL", "z-ai/glm-4.5-air:free")

    headers = _build_llm_headers(api_key)
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
    }

    connect_timeout = max(3, min(timeout, 10))
    read_timeout = max(5, timeout)

    for attempt in range(max_retries):
        try:
            if attempt > 0:
                delay = min(2 ** attempt + random.uniform(0, 1), 10)
                app.logger.info("Retrying LLM call in %.2fs", delay)
                time.sleep(delay)

            response = requests.post(
                url=f"{base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=(connect_timeout, read_timeout),
            )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return content, None

            if response.status_code in {500, 502, 503, 504} and attempt < max_retries - 1:
                app.logger.warning("Provider %s temporary server error %s", provider, response.status_code)
                continue

            if response.status_code == 429:
                return None, "Rate limited by provider"
            if response.status_code == 401:
                return None, "Authentication failed (invalid API key)"
            if response.status_code == 403:
                return None, "Access forbidden for selected model"

            details = response.text[:300] if response.text else ""
            return None, f"Provider error {response.status_code}: {details}"

        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                continue
            return None, "LLM request timed out"
        except requests.exceptions.RequestException as exc:
            if attempt < max_retries - 1:
                continue
            return None, f"Network error: {exc}"
        except Exception as exc:
            return None, f"Unexpected generation error: {exc}"

    return None, "Max retries exceeded"


app = Flask(__name__)

cors_origins = os.getenv("CORS_ORIGINS", "*")
if cors_origins.strip() == "*":
    CORS(app)
else:
    CORS(app, resources={r"/*": {"origins": [o.strip() for o in cors_origins.split(",") if o.strip()]}})

max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "15"))
app.config["MAX_CONTENT_LENGTH"] = max_upload_mb * 1024 * 1024

EMOTIONS = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]

ORIGINAL_MODEL_PATH = os.getenv("ORIGINAL_MODEL_PATH", "bangla_emotion_model.pth")
INCREMENTAL_MODEL_PATH = os.getenv("INCREMENTAL_MODEL_PATH", "bangla_emotion_model_incremental.pth")

model = None
current_model_name = "none"


def _load_active_model(model_path: str, model_name: str):
    loaded = load_model(model_path)
    loaded.eval()
    app.logger.info("Loaded %s model from %s", model_name, model_path)
    return loaded


try:
    model = _load_active_model(ORIGINAL_MODEL_PATH, "original")
    current_model_name = "original"
except Exception as exc:
    app.logger.warning("Initial model load failed: %s", exc)

@app.route('/detect-emotion', methods=['POST'])
def detect_emotion():
    global model

    if model is None:
        return jsonify({"error": "Model is not loaded. Check model path and server logs."}), 503

    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    if not audio_file or not audio_file.filename:
        return jsonify({'error': 'Invalid audio file'}), 400

    input_fd, input_path = tempfile.mkstemp(prefix="emotion_in_", suffix=".webm")
    output_fd, output_path = tempfile.mkstemp(prefix="emotion_out_", suffix=".wav")
    os.close(input_fd)
    os.close(output_fd)

    audio_file.save(input_path)

    try:
        _convert_to_wav(input_path, output_path)

        features = extract_features(output_path)
        if features is None:
            return jsonify({'error': 'Feature extraction failed'}), 500

        prediction = predict_emotion(model, features)

        return jsonify({'emotion': prediction})
    except Exception as e:
        app.logger.exception("detect-emotion failed")
        return jsonify({'error': str(e)}), 500
    finally:
        _cleanup_file(input_path)
        _cleanup_file(output_path)

@app.route('/incremental-train', methods=['POST'])
def incremental_train():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    if 'emotion' not in request.form:
        return jsonify({'error': 'No emotion label provided'}), 400

    emotion_label = request.form['emotion']
    if emotion_label not in EMOTIONS:
        return jsonify({'error': f'Invalid emotion label. Must be one of: {EMOTIONS}'}), 400

    audio_file = request.files['audio']
    if not audio_file or not audio_file.filename:
        return jsonify({'error': 'Invalid audio file'}), 400

    input_fd, input_path = tempfile.mkstemp(prefix="inc_in_", suffix=".webm")
    output_fd, output_path = tempfile.mkstemp(prefix="inc_out_", suffix=".wav")
    os.close(input_fd)
    os.close(output_fd)

    audio_file.save(input_path)

    try:
        _convert_to_wav(input_path, output_path)

        features = extract_features(output_path)
        if features is None:
            return jsonify({'error': 'Feature extraction failed'}), 500

        base_model_path = INCREMENTAL_MODEL_PATH if os.path.exists(INCREMENTAL_MODEL_PATH) else ORIGINAL_MODEL_PATH
        training_model = load_model(base_model_path)
        training_model.train()

        emotion_idx = EMOTIONS.index(emotion_label)
        emotion_tensor = torch.tensor([emotion_idx], dtype=torch.long)

        max_len = 94
        if features.shape[0] < max_len:
            pad_width = ((0, max_len - features.shape[0]), (0, 0))
            features = np.pad(features, pad_width, mode='constant')
        else:
            features = features[:max_len, :]

        features_tensor = torch.from_numpy(features).float().unsqueeze(0)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(training_model.parameters(), lr=0.0001)

        optimizer.zero_grad()
        outputs = training_model(features_tensor)
        loss = criterion(outputs, emotion_tensor)
        loss.backward()
        optimizer.step()

        torch.save(training_model.state_dict(), INCREMENTAL_MODEL_PATH)

        return jsonify({
            'success': True,
            'message': f'Model updated with new sample. Emotion: {emotion_label}',
            'loss': float(loss.item())
        })

    except Exception as e:
        app.logger.exception("incremental-train failed")
        return jsonify({'error': str(e)}), 500
    finally:
        _cleanup_file(input_path)
        _cleanup_file(output_path)

@app.route('/switch-model', methods=['POST'])
def switch_model():
    global model, current_model_name

    payload = request.get_json(silent=True) or {}
    model_type = payload.get('model_type')
    if model_type not in ['original', 'incremental']:
        return jsonify({'error': 'Invalid model type. Must be "original" or "incremental"'}), 400

    try:
        if model_type == 'original':
            model = _load_active_model(ORIGINAL_MODEL_PATH, 'original')
        else:
            if not os.path.exists(INCREMENTAL_MODEL_PATH):
                return jsonify({'error': 'Incremental model not found. Please train the model first.'}), 404
            model = _load_active_model(INCREMENTAL_MODEL_PATH, 'incremental')

        current_model_name = model_type
        return jsonify({
            'success': True,
            'message': f'Switched to {model_type} model'
        })
    except Exception as e:
        app.logger.exception("switch-model failed")
        return jsonify({'error': str(e)}), 500


@app.route('/generate', methods=['POST'])
def generate_response():
    started_at = time.monotonic()
    data = request.get_json(silent=True) or {}
    user_message = (data.get('message') or '').strip()
    emotion = (data.get('emotion') or '').strip()

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    app.logger.info('generate request received (emotion=%s, message_len=%d)', emotion or 'none', len(user_message))
    prompt = _build_llm_prompt(user_message, emotion)
    response_text, error = _generate_text_with_retries(prompt, timeout=15, max_retries=3)

    if response_text:
        if emotion:
            response_text = f"(Emotion: {emotion})\\n\\n{response_text}"
        app.logger.info('generate request completed in %.2fs', time.monotonic() - started_at)
        return jsonify({'response': response_text})

    app.logger.warning('generate request failed in %.2fs: %s', time.monotonic() - started_at, error)
    return jsonify({'error': f'Failed to generate response: {error}'}), 502


@app.route('/model-info', methods=['GET'])
def model_info():
    info = {
        'original_model': {
            'exists': os.path.exists(ORIGINAL_MODEL_PATH),
            'path': ORIGINAL_MODEL_PATH
        },
        'incremental_model': {
            'exists': os.path.exists(INCREMENTAL_MODEL_PATH),
            'path': INCREMENTAL_MODEL_PATH
        },
        'current_model': current_model_name,
        'emotions': EMOTIONS
    }
    return jsonify(info)


@app.route('/health', methods=['GET'])
def health_check():
    _, provider = _active_api_key()
    return jsonify(
        {
            'status': 'healthy',
            'provider': provider,
            'model': os.getenv('LLM_MODEL', 'z-ai/glm-4.5-air:free'),
            'api_base_url': os.getenv('LLM_API_BASE_URL', 'https://openrouter.ai/api/v1'),
            'current_emotion_model': current_model_name,
        }
    )

if __name__ == '__main__':
    host = os.getenv('BACKEND_HOST', '0.0.0.0')
    port = int(os.getenv('BACKEND_PORT', '5000'))
    debug = _as_bool(os.getenv('BACKEND_DEBUG', 'false'))

    enable_ssl = _as_bool(os.getenv('ENABLE_SSL', 'false'))
    cert_path = os.getenv('SSL_CERT_PATH', 'cert/cert.crt')
    key_path = os.getenv('SSL_KEY_PATH', 'cert/cert.key')

    ssl_context = None
    if enable_ssl:
        if os.path.exists(cert_path) and os.path.exists(key_path):
            ssl_context = (cert_path, key_path)
        else:
            app.logger.warning('ENABLE_SSL=true but cert/key not found; starting without SSL')

    app.run(host=host, port=port, ssl_context=ssl_context, debug=debug)
