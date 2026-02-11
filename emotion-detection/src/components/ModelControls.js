import React from 'react';
import './ModelControls.css';

const ModelControls = ({ 
  currentModel, 
  modelInfo, 
  onModelSwitch, 
  onToggleTraining, 
  showTraining 
}) => {
  const emotions = [
    "Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"
  ];

  return (
    <div className="model-controls">
      <div className="model-status">
        <h3>Model Status</h3>
        <div className="current-model">
          Current Model: <span className="model-name">{currentModel}</span>
        </div>
        
        {modelInfo && (
          <div className="model-info">
            <div className="model-availability">
              <span className={`status ${modelInfo.original_model.exists ? 'available' : 'unavailable'}`}>
                Original Model: {modelInfo.original_model.exists ? '✓' : '✗'}
              </span>
              <span className={`status ${modelInfo.incremental_model.exists ? 'available' : 'unavailable'}`}>
                Incremental Model: {modelInfo.incremental_model.exists ? '✓' : '✗'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="model-actions">
        <div className="switch-buttons">
          <button
            onClick={() => onModelSwitch('original')}
            disabled={currentModel === 'original' || !modelInfo?.original_model.exists}
            className={`switch-btn ${currentModel === 'original' ? 'active' : ''}`}
          >
            Use Original Model
          </button>
          <button
            onClick={() => onModelSwitch('incremental')}
            disabled={currentModel === 'incremental' || !modelInfo?.incremental_model.exists}
            className={`switch-btn ${currentModel === 'incremental' ? 'active' : ''}`}
          >
            Use Incremental Model
          </button>
        </div>

        <button
          onClick={onToggleTraining}
          className={`training-toggle ${showTraining ? 'active' : ''}`}
        >
          {showTraining ? 'Hide Training' : 'Show Training Panel'}
        </button>
      </div>

      <div className="supported-emotions">
        <h4>Supported Emotions:</h4>
        <div className="emotion-tags">
          {emotions.map(emotion => (
            <span key={emotion} className="emotion-tag">{emotion}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelControls;
