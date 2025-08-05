import React from 'react'

const InputArea = ({ isListening, isMicDisabled, speechText, onToggleMic }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    // Form submission is handled by the mic button
  }

  // Get appropriate aria-label for accessibility
  const getMicButtonLabel = () => {
    if (isMicDisabled) return 'Microphone not available';
    return isListening ? 'Stop listening' : 'Start listening';
  }

  // Microphone SVG Icon
  const MicIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 14C13.66 14 14.99 12.66 14.99 11L15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.3 11C17.3 14 14.76 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.23 19 14.41 19 11H17.3Z" fill="currentColor"/>
    </svg>
  )

  // Stop SVG Icon
  const StopIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6H18V18H6V6Z" fill="currentColor"/>
    </svg>
  )

  // Disabled SVG Icon
  const DisabledIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
    </svg>
  )

  return (
    <form className="input-area" onSubmit={handleSubmit}>
      <input
        type="text"
        value={speechText}
        readOnly
        placeholder={isListening ? "Listening... Speak now" : "Click mic to speak..."}
        aria-label="Speech input display"
      />
      <button 
        type="button"
        className={`mic ${isListening ? 'listening' : ''}`}
        onClick={onToggleMic} // Direct function call
        disabled={isMicDisabled}
        aria-label={getMicButtonLabel()}
      >
        {isMicDisabled ? <DisabledIcon /> : isListening ? <StopIcon /> : <MicIcon />}
      </button>
    </form>
  )
}

export default InputArea