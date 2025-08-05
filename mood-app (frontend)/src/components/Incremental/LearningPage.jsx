import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LearningPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const intervalIdRef = useRef(null);

  const startTimer = () => {
    intervalIdRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(intervalIdRef.current);
    intervalIdRef.current = null;
  };

  const startAudioAnalysis = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    analyserRef.current = audioContext.createAnalyser();
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    microphoneRef.current = audioContext.createMediaStreamSource(stream);
    microphoneRef.current.connect(analyserRef.current);

    const updateVolume = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const avg = sum / bufferLength;
      const normalized = Math.min(100, Math.max(0, (avg / 255) * 100));
      setVolumeLevel(normalized);
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (analyserRef.current) analyserRef.current.disconnect();
    if (microphoneRef.current) microphoneRef.current.disconnect();
    setVolumeLevel(0);
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const encodeWAVFromAudioBuffer = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16;
    const numSamples = audioBuffer.length;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = audioBuffer.getChannelData(ch)[i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        stopAudioAnalysis();
        stopTimer();

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const wavBlob = encodeWAVFromAudioBuffer(audioBuffer);
        setAudioBlob(wavBlob);

        /*
        // --- Send wavBlob to backend server (commented out) ---
        const formData = new FormData();
        formData.append('audio', wavBlob, 'recording.wav');

        try {
          const response = await fetch('https://your-backend-api.com/upload', {
            method: 'POST',
            body: formData,
            // headers: { 'Authorization': 'Bearer your-token' }, // if needed
          });

          if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('Upload success:', result);
        } catch (error) {
          console.error('Upload failed:', error);
        }
        */
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
      startAudioAnalysis(stream);
    } catch (err) {
      alert('Microphone access denied.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
      stopAudioAnalysis();
      stopTimer();
    };
  }, []);

  return (
    <div className="learning-container">
      <div className="learning-header">
        <Link to="/" className="back-button">←</Link>
        <h1>Incremental Learning</h1>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="learning-content">
        <div className="learning-card">
          <h1>Voice Emotion Recorder</h1>
          <form className="learning-form">
            <label>Model Selection</label>
            <select className="input-field">
              <option value="model1">Model 1</option>
              <option value="model2">Model 2</option>
            </select>

            <label>Emotion Selection</label>
            <select className="input-field">
              <option value="neutral">Neutral</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="angry">Angry</option>
              <option value="fear">Fear</option>
              <option value="surprised">Surprised</option>
              <option value="excited">Excited</option>
            </select>

            <div className="recording-controls">
              {!isRecording ? (
                <button type="button" onClick={startRecording} className="record-button">
                  Start Recording
                </button>
              ) : (
                <button type="button" onClick={stopRecording} className="record-button stop-button">
                  Stop
                </button>
              )}
            </div>

            {isRecording && (
              <div className="recording-progress">
                <div className="waveform-container">
                  <div className="waveform-bar" style={{ width: `${volumeLevel}%` }}></div>
                </div>
                <div className="timer">{`${recordingTime}s`}</div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
