// // import React, { useState } from 'react';
// // import EmotionDisplay from './components/EmotionDisplay';
// // import AudioRecorder from './components/AudioRecorder';
// // import './App.css';

// // function App() {
// //   const [currentEmotion, setCurrentEmotion] = useState('Say something to detect your mood');
// //   const [isProcessing, setIsProcessing] = useState(false);

// //   const handleNewEmotion = (emotion) => {
// //     setIsProcessing(false);
// //     setCurrentEmotion(emotion);
// //   };

// //   return (
// //     <div className="app">
// //       <p className="welcome-text">Welcome to our 7 class emotion detection system. Speak on the mic to test it out!</p>
// //       <EmotionDisplay emotion={currentEmotion} isProcessing={isProcessing} />
// //       <AudioRecorder 
// //         onDetectionStart={() => setIsProcessing(true)}
// //         onNewEmotion={handleNewEmotion}
// //       />
// //     </div>
// //   );
// // }

// // export default App;

// import React, { useState, useEffect } from 'react';
// import EmotionDisplay from './components/EmotionDisplay';
// import AudioRecorder from './components/AudioRecorder';
// import './App.css';

// function App() {
//   const [currentEmotion, setCurrentEmotion] = useState('Say something to detect your mood');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [useIncrementalModel, setUseIncrementalModel] = useState(false);

//   // Switch model when toggle changes
//   useEffect(() => {
//     handleModelSwitch(useIncrementalModel ? 'incremental' : 'original');
//   }, [useIncrementalModel]);

//   const handleModelSwitch = async (modelType) => {
//     try {
//       const response = await fetch('https://localhost:5000/switch-model', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ model_type: modelType }),
//       });

//       if (response.ok) {
//         setCurrentEmotion(`Switched to ${modelType} model. Say something to test!`);
//       } else {
//         const error = await response.json();
//         setCurrentEmotion(`Error: ${error.error}`);
//         setUseIncrementalModel(modelType !== 'incremental');
//       }
//     } catch (error) {
//       console.error('Failed to switch model:', error);
//       setCurrentEmotion('Network error when switching model');
//       setUseIncrementalModel(modelType !== 'incremental');
//     }
//   };

//   const handleNewEmotion = (emotion) => {
//     setIsProcessing(false);
//     setCurrentEmotion(emotion);
//   };

//   const handleToggleChange = () => {
//     setUseIncrementalModel(!useIncrementalModel);
//   };

//   return (
//     <div className="app">
//       <div className="header">
//         {/* <h1>7-Class Emotion Detection System</h1> */}
//         <p className="welcome-text">
//           Welcome to our 7 Bangla Speech Emotion Recognition system. Speak into the microphone to detect your mood!
//         </p>
//       </div>

//       <div className="model-selector">
//         <h3 className="model-selector__title">Choose your model</h3>
//         <button 
//           className={`model-toggle ${useIncrementalModel ? 'incremental' : 'normal'}`}
//           onClick={handleToggleChange}
//         >
//           {useIncrementalModel ? 'Incremental' : 'Normal'}
//         </button>
//       </div>

//       <EmotionDisplay emotion={currentEmotion} isProcessing={isProcessing} />

//       <AudioRecorder 
//         onDetectionStart={() => setIsProcessing(true)}
//         onNewEmotion={handleNewEmotion}
//       />
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react';
import EmotionDisplay from './components/EmotionDisplay';
import AudioRecorder from './components/AudioRecorder';
import './App.css';

function App() {
  const [currentEmotion, setCurrentEmotion] = useState('Press "Start Listening" to detect your mood');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useIncrementalModel, setUseIncrementalModel] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Switch model when toggle changes
  useEffect(() => {
    handleModelSwitch(useIncrementalModel ? 'incremental' : 'original');
  }, [useIncrementalModel]);

  const handleModelSwitch = async (modelType) => {
    try {
      const response = await fetch('https://localhost:5000/switch-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_type: modelType }),
      });

      if (response.ok) {
        setCurrentEmotion(`Switched to ${modelType} model. ${isListening ? 'Listening...' : 'Press "Start Listening" to test!'}`);
      } else {
        const error = await response.json();
        setCurrentEmotion(`Error: ${error.error}`);
        setUseIncrementalModel(modelType !== 'incremental');
      }
    } catch (error) {
      console.error('Failed to switch model:', error);
      setCurrentEmotion('Network error when switching model');
      setUseIncrementalModel(modelType !== 'incremental');
    }
  };

  const handleNewEmotion = (emotion) => {
    setIsProcessing(false);
    setCurrentEmotion(emotion);
  };

  const handleToggleChange = () => {
    setUseIncrementalModel(!useIncrementalModel);
  };

  const handleToggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setCurrentEmotion('Recording stopped. Press "Start Listening" to resume.');
      setIsProcessing(false);
    } else {
      setIsListening(true);
      setCurrentEmotion('Starting up... Please wait');
    }
  };

  return (
    <div className="app">
      <div className="header">
        <p className="welcome-text">
          Welcome to our 7 Bangla Speech Emotion Recognition system. Click "Start Listening" and speak into the microphone to detect your mood!
        </p>
      </div>

      <div className="model-selector">
        <h3 className="model-selector__title">Choose your model</h3>
        <button 
          className={`model-toggle ${useIncrementalModel ? 'incremental' : 'normal'}`}
          onClick={handleToggleChange}
        >
          {useIncrementalModel ? 'Incremental' : 'Normal'}
        </button>
      </div>

      <div className="listening-controls">
        <button 
          className={`listen-toggle ${isListening ? 'listening' : 'stopped'}`}
          onClick={handleToggleListening}
        >
          {isListening ? '⏹️ Stop Listening' : '🎤 Start Listening'}
        </button>
      </div>

      <EmotionDisplay emotion={currentEmotion} isProcessing={isProcessing} />

      <AudioRecorder 
        onDetectionStart={() => setIsProcessing(true)}
        onNewEmotion={handleNewEmotion}
        isActive={isListening}
      />
    </div>
  );
}

export default App;
