// import React from 'react';

// const InputArea = ({ 
//   isListening, 
//   isMicDisabled, 
//   speechText, 
//   onToggleMic, 
//   isProcessing,
//   isPreviewing,
//   recordingTime,
//   audioUrl,
//   onPlayAudio,
//   audioRef,
//   isWaitingForLLM // Add this new prop
// }) => {
//   const handleSubmit = (e) => {
//     e.preventDefault();
//   };

//   const getMicButtonLabel = () => {
//     if (isMicDisabled) return 'Microphone not available';
//     if (isWaitingForLLM) return 'Processing...';
//     if (isPreviewing) return 'Send recording';
//     return isListening ? 'Stop recording' : 'Start recording';
//   };

//   // Microphone SVG Icon
//   const MicIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M12 14C13.66 14 14.99 12.66 14.99 11L15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.3 11C17.3 14 14.76 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.23 19 14.41 19 11H17.3Z" fill="currentColor"/>
//     </svg>
//   );

//   // Stop SVG Icon
//   const StopIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M6 6H18V18H6V6Z" fill="currentColor"/>
//     </svg>
//   );

//   // Send SVG Icon
//   const SendIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
//     </svg>
//   );

//   // Play SVG Icon
//   const PlayIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M8 5v14l11-7z" fill="currentColor"/>
//     </svg>
//   );

//   // Disabled SVG Icon
//   const DisabledIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
//     </svg>
//   );

//   // Processing SVG Icon
//   const ProcessingIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
//     </svg>
//   );

//   return (
//     <form className="input-area" onSubmit={handleSubmit}>
//       {isPreviewing ? (
//         <div className="preview-container">
//           <div className="preview-audio">
//             <audio ref={audioRef} src={audioUrl} />
//             <button 
//               type="button"
//               className="play-button"
//               onClick={onPlayAudio}
//               aria-label="Play recording"
//             >
//               <PlayIcon />
//             </button>
//             <div className="preview-text">Tap to play your recording</div>
//           </div>
//         </div>
//       ) : (
//         <input
//           type="text"
//           value={speechText}
//           readOnly
//           placeholder={isListening ? "Listening..." : "Click mic to record..."}
//           aria-label="Speech input display"
//         />
//       )}
      
//       <div className="input-controls">
//         {isListening && !isPreviewing && (
//           <div className="recording-timer">
//             {recordingTime}s
//           </div>
//         )}
        
//         <button 
//           type="button"
//           className={`mic ${isListening ? 'listening' : ''} ${isPreviewing ? 'send' : ''} ${isWaitingForLLM ? 'processing' : ''}`}
//           onClick={onToggleMic}
//           disabled={isMicDisabled || isProcessing || isWaitingForLLM} // Disable when waiting for LLM
//           aria-label={getMicButtonLabel()}
//         >
//           {isMicDisabled ? (
//             <DisabledIcon />
//           ) : isWaitingForLLM ? (
//             <ProcessingIcon />
//           ) : isPreviewing ? (
//             <SendIcon />
//           ) : isListening ? (
//             <StopIcon />
//           ) : (
//             <MicIcon />
//           )}
//         </button>
//       </div>
//     </form>
//   );
// };

// export default InputArea;

import React from 'react';

const InputArea = ({ 
  isListening, 
  isMicDisabled, 
  speechText, 
  onToggleMic, 
  isProcessing,
  isPreviewing,
  recordingTime,
  audioUrl,
  onPlayAudio,
  audioRef,
  isWaitingForLLM
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const getMicButtonLabel = () => {
    if (isMicDisabled) return 'Microphone not available';
    if (isWaitingForLLM) return 'Processing...';
    if (isPreviewing) return 'Send recording';
    return isListening ? 'Stop recording' : 'Start recording';
  };

  // Microphone SVG Icon
  const MicIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 14C13.66 14 14.99 12.66 14.99 11L15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.3 11C17.3 14 14.76 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.23 19 14.41 19 11H17.3Z" fill="currentColor"/>
    </svg>
  );

  // Stop SVG Icon
  const StopIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6H18V18H6V6Z" fill="currentColor"/>
    </svg>
  );

  // Send SVG Icon
  const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
    </svg>
  );

  // Play SVG Icon
  const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5v14l11-7z" fill="currentColor"/>
    </svg>
  );

  // Disabled SVG Icon
  const DisabledIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
    </svg>
  );

  // Processing SVG Icon
  const ProcessingIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
    </svg>
  );

  return (
    <form className="input-area" onSubmit={handleSubmit}>
      {/* Always show the speech text input */}
      <input
        type="text"
        value={speechText}
        readOnly
        placeholder={isListening ? "Listening..." : "Click mic to record..."}
        aria-label="Speech input display"
        className={isPreviewing ? 'with-preview' : ''}
      />
      
      {/* Show preview controls when available */}
      {isPreviewing && (
        <div className="preview-container">
          <div className="preview-audio">
            <audio ref={audioRef} src={audioUrl} />
            <button 
              type="button"
              className="play-button"
              onClick={onPlayAudio}
              aria-label="Play recording"
            >
              <PlayIcon />
            </button>
            <div className="preview-text">Tap to play your recording</div>
          </div>
        </div>
      )}
      
      <div className="input-controls">
        {isListening && !isPreviewing && (
          <div className="recording-timer">
            {recordingTime}s
          </div>
        )}
        
        <button 
          type="button"
          className={`mic ${isListening ? 'listening' : ''} ${isPreviewing ? 'send' : ''} ${isWaitingForLLM ? 'processing' : ''}`}
          onClick={onToggleMic}
          disabled={isMicDisabled || isProcessing || isWaitingForLLM}
          aria-label={getMicButtonLabel()}
        >
          {isMicDisabled ? (
            <DisabledIcon />
          ) : isWaitingForLLM ? (
            <ProcessingIcon />
          ) : isPreviewing ? (
            <SendIcon />
          ) : isListening ? (
            <StopIcon />
          ) : (
            <MicIcon />
          )}
        </button>
      </div>
    </form>
  );
};

export default InputArea;
