from flask import Flask, request, jsonify
import requests
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration for the LLM 
API_KEY = "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"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "<YOUR_SITE_URL>",
    "X-Title": "<YOUR_SITE_NAME>"
}
saved_emotion = None

# Text generation function
def generate_text(prompt):
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers=HEADERS,
        data=json.dumps({
            "model": "deepseek/deepseek-chat-v3-0324:free",
            "messages": [{"role": "user", "content": prompt}]
        })
    )
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content']
    else:
        print("Error:", response.status_code, response.text)
        return None

@app.route('/generate', methods=['POST'])
def generate_response():
    data = request.json
    user_message = data.get('message', '')
    emotion = data.get('emotion', '')

    print(data)
    print("Emotion detected:", emotion)
    saved_emotion = emotion

    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    
    # Create a prompt that includes the user's message and detected emotion
    if emotion:
        prompt = f"Answer in Bangla. ব্যবহারকারী বলেছেন: '{user_message}'। ব্যবহারকারীর আবেগ সনাক্ত হয়েছে: {emotion}। এই আবেগ বিবেচনা করে ব্যবহারকারীর প্রতি সহানুভূতিশীল এবং সহায়ক প্রতিক্রিয়া দিন।"
        print("Prompt with emotion:", prompt)
    else:
        prompt = f"ব্যবহারকারী বলেছেন: '{user_message}'। ব্যবহারকারীর প্রতি সহানুভূতিশীল এবং সহায়ক প্রতিক্রিয়া দিন।"
    
    response_text = generate_text(prompt)
    
    if response_text:
        emotion_prefix = f"(Emotion: {saved_emotion})\n\n"
        response_text = emotion_prefix + response_text
        print("Generated response:", (response_text))
        return jsonify({"response":response_text})
    else:
        return jsonify({"error": "Failed to generate response"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', 
            port=7000,
            ssl_context=('cert/cert.crt', 
                         'cert/cert.key'),
            debug=True)