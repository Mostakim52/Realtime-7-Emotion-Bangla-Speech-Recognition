import React from 'react';

const EmotionDisplay = ({ emotion, isProcessing }) => {
  const emotionColors = {
    'Happy': '#FFA500',
    'Sad': '#0000FF',
    'Angry': '#FF0000',
    'Neutral': '#008000',
    'Fear': '#808080',
    'Disgust': '#800080',
    'Surprise': '#FFFF00',
    'Say something to detect your mood': '#000000',
    'Error': '#FF0000'
  };

  return (
    <div 
      className={`emotion-display ${isProcessing ? 'fade-out' : 'fade-in'}`}
      style={{ color: emotionColors[emotion] }}
    >
      {emotion}
    </div>
  );
};

export default EmotionDisplay;
