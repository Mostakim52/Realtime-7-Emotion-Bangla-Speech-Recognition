from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import torch
import torch.nn as nn
import torch.optim as optim
import traceback
import numpy as np
from model import load_model, extract_features, predict_emotion

app = Flask(__name__)
CORS(app)

# Update emotions to match the training data
EMOTIONS = [
    "Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"
]

ORIGINAL_MODEL_PATH = 'bangla_emotion_model.pth'
INCREMENTAL_MODEL_PATH = 'bangla_emotion_model_incremental.pth'

# Load the model
model = load_model('bangla_emotion_model.pth')
model.eval()

@app.route('/detect-emotion', methods=['POST'])
def detect_emotion():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
        
    audio_file = request.files['audio']
    input_path = 'temp_input.webm'
    output_path = 'temp_output.wav'
    audio_file.save(input_path)
    
    try:
        # Convert webm to wav
        subprocess.run(['ffmpeg', '-y', '-i', input_path, output_path], check=True)
        
        # Extract features
        features = extract_features(output_path)
        if features is None:
            return jsonify({'error': 'Feature extraction failed'}), 500
        
        # Predict emotion
        prediction = predict_emotion(model, features)
        
        # Clean up files
        # os.remove(input_path)
        # os.remove(output_path)
        
        return jsonify({'emotion': prediction})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/incremental-train', methods=['POST'])
def incremental_train():
    # Check if audio file and emotion label are provided
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    if 'emotion' not in request.form:
        return jsonify({'error': 'No emotion label provided'}), 400
    
    emotion_label = request.form['emotion']
    if emotion_label not in EMOTIONS:
        return jsonify({'error': f'Invalid emotion label. Must be one of: {EMOTIONS}'}), 400
    
    audio_file = request.files['audio']
    input_path = 'temp_input_incremental.webm'
    output_path = 'temp_output_incremental.wav'
    audio_file.save(input_path)
    
    try:
        # Convert webm to wav
        subprocess.run(['ffmpeg', '-y', '-i', input_path, output_path], check=True)
        
        # Extract features
        features = extract_features(output_path)
        if features is None:
            return jsonify({'error': 'Feature extraction failed'}), 500
        
        # Load the model for training
        model = load_model(ORIGINAL_MODEL_PATH)
        model.train()  # Set to training mode
        
        # Convert emotion label to index
        emotion_idx = EMOTIONS.index(emotion_label)
        emotion_tensor = torch.tensor([emotion_idx], dtype=torch.long)
        
        # Pad features to match training (max_len=94)
        max_len = 94
        if features.shape[0] < max_len:
            pad_width = ((0, max_len - features.shape[0]), (0, 0))
            features = np.pad(features, pad_width, mode='constant')
        else:
            features = features[:max_len, :]
        
        # Convert to tensor and add batch dimension
        features_tensor = torch.from_numpy(features).float().unsqueeze(0)
        
        # Define loss function and optimizer with small learning rate
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.0001)  # Small learning rate for incremental learning
        
        # Training step for one epoch
        optimizer.zero_grad()
        outputs = model(features_tensor)
        loss = criterion(outputs, emotion_tensor)
        loss.backward()
        optimizer.step()
        
        # Save the updated model to the incremental model path
        torch.save(model.state_dict(), INCREMENTAL_MODEL_PATH)
        
        # Clean up files
        # os.remove(input_path)
        # os.remove(output_path)
        
        return jsonify({
            'success': True,
            'message': f'Model updated with new sample. Emotion: {emotion_label}',
            'loss': float(loss.item())
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/switch-model', methods=['POST'])
def switch_model():
    global model
    
    model_type = request.json.get('model_type')
    if model_type not in ['original', 'incremental']:
        return jsonify({'error': 'Invalid model type. Must be "original" or "incremental"'}), 400
    
    try:
        if model_type == 'original':
            model = load_model(ORIGINAL_MODEL_PATH)
        else:
            if not os.path.exists(INCREMENTAL_MODEL_PATH):
                return jsonify({'error': 'Incremental model not found. Please train the model first.'}), 404
            model = load_model(INCREMENTAL_MODEL_PATH)
        
        model.eval()
        return jsonify({
            'success': True,
            'message': f'Switched to {model_type} model'
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


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
        'current_model': 'original' if os.path.exists(ORIGINAL_MODEL_PATH) else 'none',
        'emotions': EMOTIONS
    }
    return jsonify(info)

if __name__ == '__main__':
    app.run(host='0.0.0.0', 
            port=5000, 
            ssl_context=('cert/cert.crt', 
                         'cert/cert.key'),
            debug=False)
