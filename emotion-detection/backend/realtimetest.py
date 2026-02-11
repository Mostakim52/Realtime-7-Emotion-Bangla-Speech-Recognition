# pip install librosa soundfile numpy sklearn pyaudio
import librosa
import soundfile
import os
import glob
import pickle
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score
import pyaudio
import wave

# Emotions in your BanglaMOOD dataset (based on folder names)
emotions = {
    'Angry': 'angry',
    'Disappointment': 'disappointment', 
    'Excitement': 'excitement',
    'Fear': 'fear',
    'Happy': 'happy',
    'Neutral': 'neutral',
    'Sad': 'sad',
    'Surprised': 'surprised'
}

# Emotions to observe (update based on which emotions you want to include)
observed_emotions = ['angry', 'fear', 'happy', 'neutral', 'sad', 'surprised', 'excitement', 'diappointment']

# Initialize the Multi Layer Perceptron Classifier
model = MLPClassifier(alpha=0.01, batch_size=256, epsilon=1e-08,
                      hidden_layer_sizes=(300,), learning_rate='adaptive', max_iter=500)

# Recording user audio
def recordAudio():
    chunk = 1024  # Record in chunks of 1024 samples
    sample_format = pyaudio.paInt16  # 16 bits per sample
    channels = 1
    fs = 48100  # Record at 48100 samples per second
    seconds = 5
    filename = "Predict-Record-Audio.wav"

    p = pyaudio.PyAudio()  # Create an interface to PortAudio

    print('Recording')

    stream = p.open(format=sample_format,
                    channels=channels,
                    rate=fs,
                    frames_per_buffer=chunk,
                    input=True)

    frames = []  # Initialize array to store frames

    # Store data in chunks for specified seconds
    for i in range(0, int(fs / chunk * seconds)):
        data = stream.read(chunk)
        frames.append(data)

    # Stop and close the stream
    stream.stop_stream()
    stream.close()
    # Terminate the PortAudio interface
    p.terminate()

    print('Finished recording')

    # Save the recorded data as a WAV file
    wf = wave.open(filename, 'wb')
    wf.setnchannels(channels)
    wf.setsampwidth(p.get_sample_size(sample_format))
    wf.setframerate(fs)
    wf.writeframes(b''.join(frames))
    wf.close()

# Extract features (mfcc, chroma, mel) from a sound file
def extract_feature(file_name, mfcc, chroma, mel):
    with soundfile.SoundFile(file_name) as sound_file:
        X = sound_file.read(dtype="float32")
        sample_rate = sound_file.samplerate
        if chroma:
            stft = np.abs(librosa.stft(X))
        result = np.array([])
        if mfcc:
            mfccs = np.mean(librosa.feature.mfcc(
                y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
            result = np.hstack((result, mfccs))
        if chroma:
            chroma = np.mean(librosa.feature.chroma_stft(
                S=stft, sr=sample_rate).T, axis=0)
            result = np.hstack((result, chroma))
        if mel:
            mel = np.mean(librosa.feature.melspectrogram(
                y=X, sr=sample_rate).T, axis=0)
            result = np.hstack((result, mel))
    return result

# Load the data and extract features for each sound file
def load_data(test_size=0.2):
    x, y = [], []
    
    # Update this path to your dataset location
    base_path = "C:\\Users\\klauz\\Desktop\\BanglaMOOD_Processed_Gender_Reorganized\\BanglaMOOD_copy"
    
    # Traverse through emotion folders and both gender subfolders
    for emotion_folder in emotions.keys():
        emotion_path = os.path.join(base_path, emotion_folder)
        if not os.path.exists(emotion_path):
            continue
            
        emotion_label = emotions[emotion_folder]
        
        # Skip emotions not in observed_emotions
        if emotion_label not in observed_emotions:
            continue
            
        # Get all WAV files from both Female and Male subfolders
        pattern = os.path.join(emotion_path, "*", "*.wav")
        files = glob.glob(pattern)
        
        for file in files:
            try:
                feature = extract_feature(file, mfcc=True, chroma=True, mel=True)
                x.append(feature)
                y.append(emotion_label)
                print(f"Processed: {file} -> {emotion_label}")
            except Exception as e:
                print(f"Error processing {file}: {str(e)}")
                continue
    
    print(f"Total samples loaded: {len(x)}")
    return train_test_split(np.array(x), y, test_size=test_size, random_state=9)

# Train model
def trainModel():
    # Split the dataset
    x_train, x_test, y_train, y_test = load_data(test_size=0.25)
    
    # Get the shape of the training and testing datasets
    print((x_train.shape[0], x_test.shape[0]))

    # Get the number of features extracted
    print(f'Features extracted: {x_train.shape[1]}')

    # Train the model
    model.fit(x_train, y_train)

    # Predict for the test set
    y_pred = model.predict(x_test)

    # Calculate the accuracy of our model
    accuracy = accuracy_score(y_true=y_test, y_pred=y_pred)

    # Print the accuracy
    print("Accuracy: {:.2f}%".format(accuracy*100))

# Record your audio and predict emotion
def record_predictAudio():
    x_predictAudio = []
    recordAudio() # Record audio to predict
    file = "Predict-Record-Audio.wav" # Recorded audio filepath
    featurePredictAudio = extract_feature(file, mfcc=True, chroma=True, mel=True) # Extract features of recorded audio
    x_predictAudio.append(featurePredictAudio)
    y_predictAudio = model.predict(np.array(x_predictAudio))
    print("Emotion Predicted: {}".format(y_predictAudio))

# Predict on pre-recorded audio
def predictAudio():
    file = input("Please enter path to your file.\n")
    x_predictAudio = []
    featurePredictAudio = extract_feature(file, mfcc=True, chroma=True, mel=True) # Extract features of recorded audio
    x_predictAudio.append(featurePredictAudio)
    y_predictAudio = model.predict(np.array(x_predictAudio))
    print("Emotion Predicted: {}".format(y_predictAudio))

while True:
    choice = int(input("Enter 1 to create and train model. \nEnter 2 to record and predict audio. \nEnter 3 to predict on pre-recorded audio. \nEnter 4 to quit. \n"))
    if choice == 1:
        trainModel()
    elif choice == 2:
        record_predictAudio()
    elif choice == 3:
        predictAudio()
    else:
        quit()
