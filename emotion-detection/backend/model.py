import torch
import torch.nn as nn
import librosa
import numpy as np

# Configuration parameters
SAMPLE_RATE = 16000
DURATION = 3
N_MFCC = 40

class EmotionModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes):
        super(EmotionModel, self).__init__()
        self.conv1 = nn.Conv1d(input_size, 64, kernel_size=5, padding=2)
        self.bn1 = nn.BatchNorm1d(64)
        self.pool1 = nn.MaxPool1d(2)
        self.dropout1 = nn.Dropout(0.3)
        
        self.conv2 = nn.Conv1d(64, 128, kernel_size=5, padding=2)
        self.bn2 = nn.BatchNorm1d(128)
        self.pool2 = nn.MaxPool1d(2)
        self.dropout2 = nn.Dropout(0.3)
        
        self.lstm1 = nn.LSTM(128, hidden_size, num_layers, batch_first=True, dropout=0.3, bidirectional=True)
        self.lstm2 = nn.LSTM(hidden_size*2, hidden_size, num_layers, batch_first=True, dropout=0.3, bidirectional=True)
        
        self.fc1 = nn.Linear(hidden_size*2, 64)
        self.fc2 = nn.Linear(64, num_classes)
        self.relu = nn.ReLU()
        self.dropout3 = nn.Dropout(0.3)
        
    def forward(self, x):
        x = x.permute(0, 2, 1)
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.pool1(x)
        x = self.dropout1(x)
        
        x = self.conv2(x)
        x = self.bn2(x)
        x = self.relu(x)
        x = self.pool2(x)
        x = self.dropout2(x)
        
        x = x.permute(0, 2, 1)
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)
        x = x[:, -1, :]
        
        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout3(x)
        x = self.fc2(x)
        return x

def extract_features(file_path):
    try:
        audio, sr = librosa.load(file_path, sr=SAMPLE_RATE, duration=DURATION)
        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC)
        return mfcc.T
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

def load_model(model_path):
    # Model parameters (must match training)
    input_size = N_MFCC  # 40
    hidden_size = 128
    num_layers = 2
    num_classes = 7  # Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise
    
    model = EmotionModel(input_size, hidden_size, num_layers, num_classes)
    model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()
    return model

def predict_emotion(model, features):
    # Pad sequences to match training (max_len=94)
    max_len = 94
    if features.shape[0] < max_len:
        pad_width = ((0, max_len - features.shape[0]), (0, 0))
        features = np.pad(features, pad_width, mode='constant')
    else:
        features = features[:max_len, :]
    
    # Convert to tensor and add batch dimension
    features_tensor = torch.from_numpy(features).float().unsqueeze(0)
    
    with torch.no_grad():
        output = model(features_tensor)
        pred_idx = torch.argmax(output, dim=1).item()
        emotions = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]
        return emotions[pred_idx]