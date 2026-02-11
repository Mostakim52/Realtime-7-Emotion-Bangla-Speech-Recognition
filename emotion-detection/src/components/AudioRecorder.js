// // import React, { useEffect, useRef, useCallback } from 'react';

// // const AudioRecorder = ({ onDetectionStart, onNewEmotion }) => {
// //   const isMountedRef = useRef(true);
// //   const timeoutRef = useRef(null);
// //   const streamRef = useRef(null);
// //   const mediaRecorderRef = useRef(null);

// //   // Configuration
// //   const RECORDING_DURATION = 3000; // 3 seconds
// //   const DELAY_BETWEEN_RECORDINGS = 7000; // 7 seconds
// //   const API_ENDPOINT = 'http://localhost:5000/detect-emotion';

// //   const cleanup = useCallback(() => {
// //     // Clear any pending timeouts
// //     if (timeoutRef.current) {
// //       clearTimeout(timeoutRef.current);
// //       timeoutRef.current = null;
// //     }

// //     // Stop media recorder if active
// //     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
// //       mediaRecorderRef.current.stop();
// //     }

// //     // Stop media stream
// //     if (streamRef.current) {
// //       streamRef.current.getTracks().forEach(track => track.stop());
// //       streamRef.current = null;
// //     }
// //   }, []);

// //   const getSupportedMimeType = useCallback(() => {
// //     const types = ['audio/webm', 'audio/mp4', 'audio/wav'];
// //     return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
// //   }, []);

// //   const recordAudio = useCallback(async () => {
// //     if (!isMountedRef.current) return;

// //     try {
// //       console.log('🎤 Starting audio recording...');
      
// //       // Get fresh media stream
// //       const stream = await navigator.mediaDevices.getUserMedia({ 
// //         audio: {
// //           echoCancellation: true,
// //           noiseSuppression: true,
// //           autoGainControl: true
// //         }
// //       });
      
// //       streamRef.current = stream;
// //       const mimeType = getSupportedMimeType();
      
// //       const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
// //       mediaRecorderRef.current = mediaRecorder;
      
// //       const chunks = [];

// //       // Set up event handlers
// //       mediaRecorder.ondataavailable = (event) => {
// //         if (event.data.size > 0) {
// //           chunks.push(event.data);
// //           console.log(`📊 Audio chunk received: ${event.data.size} bytes`);
// //         }
// //       };

// //       mediaRecorder.onstop = async () => {
// //         console.log('⏹️ Recording stopped, processing audio...');
        
// //         try {
// //           // Clean up stream immediately
// //           stream.getTracks().forEach(track => track.stop());
// //           streamRef.current = null;

// //           if (chunks.length === 0) {
// //             console.warn('⚠️ No audio data recorded');
// //             if (isMountedRef.current) {
// //               onNewEmotion('No audio detected');
// //             }
// //             scheduleNextRecording();
// //             return;
// //           }

// //           const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
// //           console.log(`📦 Audio blob created: ${audioBlob.size} bytes`);

// //           // Notify UI that processing is starting
// //           if (isMountedRef.current) {
// //             onDetectionStart();
// //           }

// //           await sendAudioToBackend(audioBlob);
// //         } catch (error) {
// //           console.error('❌ Error processing recorded audio:', error);
// //           if (isMountedRef.current) {
// //             onNewEmotion('Processing error');
// //           }
// //         }

// //         scheduleNextRecording();
// //       };

// //       mediaRecorder.onerror = (event) => {
// //         console.error('❌ MediaRecorder error:', event.error);
// //         cleanup();
// //         if (isMountedRef.current) {
// //           onNewEmotion('Recording error');
// //         }
// //         scheduleNextRecording();
// //       };

// //       // Start recording
// //       mediaRecorder.start();
// //       console.log(`⏱️ Recording for ${RECORDING_DURATION}ms...`);

// //       // Stop recording after specified duration
// //       setTimeout(() => {
// //         if (mediaRecorder.state === 'recording') {
// //           mediaRecorder.stop();
// //         }
// //       }, RECORDING_DURATION);

// //     } catch (error) {
// //       console.error('❌ Error accessing microphone:', error);
// //       cleanup();
// //       if (isMountedRef.current) {
// //         onNewEmotion('Microphone error');
// //       }
// //       scheduleNextRecording();
// //     }
// //   }, [getSupportedMimeType, onDetectionStart, onNewEmotion]);

// //   const sendAudioToBackend = useCallback(async (audioBlob) => {
// //     try {
// //       console.log('🚀 Sending audio to backend...');
      
// //       const formData = new FormData();
// //       formData.append('audio', audioBlob, 'recording.webm');

// //       const response = await fetch(API_ENDPOINT, {
// //         method: 'POST',
// //         body: formData,
// //         // Add timeout to prevent hanging requests
// //         signal: AbortSignal.timeout(10000) // 10 second timeout
// //       });

// //       if (!response.ok) {
// //         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
// //       }

// //       const result = await response.json();
// //       console.log('✅ Backend response:', result);

// //       if (isMountedRef.current && result.emotion) {
// //         onNewEmotion(result.emotion);
// //       } else {
// //         console.warn('⚠️ No emotion in response');
// //         if (isMountedRef.current) {
// //           onNewEmotion('No emotion detected');
// //         }
// //       }

// //     } catch (error) {
// //       console.error('❌ Network error:', error);
// //       if (isMountedRef.current) {
// //         if (error.name === 'AbortError') {
// //           onNewEmotion('Request timeout');
// //         } else {
// //           onNewEmotion('Network error');
// //         }
// //       }
// //     }
// //   }, [onNewEmotion]);

// //   const scheduleNextRecording = useCallback(() => {
// //     if (!isMountedRef.current) return;

// //     console.log(`⏳ Waiting ${DELAY_BETWEEN_RECORDINGS}ms before next recording...`);
    
// //     timeoutRef.current = setTimeout(() => {
// //       if (isMountedRef.current) {
// //         console.log('🔄 Starting next recording cycle');
// //         recordAudio();
// //       }
// //     }, DELAY_BETWEEN_RECORDINGS);
// //   }, [recordAudio]);

// //   useEffect(() => {
// //     isMountedRef.current = true;
    
// //     console.log('🎵 AudioRecorder component mounted, starting first recording');
    
// //     // Start the first recording cycle
// //     recordAudio();

// //     // Cleanup function
// //     return () => {
// //       console.log('🛑 AudioRecorder component unmounting, cleaning up...');
// //       isMountedRef.current = false;
// //       cleanup();
// //     };
// //   }, [recordAudio, cleanup]);

// //   return null;
// // };

// // export default AudioRecorder;


// // import React, { useEffect, useRef, useCallback } from 'react';

// // const AudioRecorder = ({ onDetectionStart, onNewEmotion }) => {
// //   const isMountedRef = useRef(true);
// //   const isRecordingRef = useRef(false); // Prevent overlapping recordings
// //   const timeoutRef = useRef(null);
// //   const streamRef = useRef(null);
// //   const mediaRecorderRef = useRef(null);

// //   const RECORDING_DURATION = 3000; // 3 seconds
// //   const DELAY_BETWEEN_RECORDINGS = 7000; // 7 seconds
// //   const API_ENDPOINT = 'http://localhost:5000/detect-emotion';

// //   const cleanup = useCallback(() => {
// //     if (timeoutRef.current) {
// //       clearTimeout(timeoutRef.current);
// //       timeoutRef.current = null;
// //     }

// //     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
// //       mediaRecorderRef.current.stop();
// //     }

// //     if (streamRef.current) {
// //       streamRef.current.getTracks().forEach(track => track.stop());
// //       streamRef.current = null;
// //     }
// //   }, []);

// //   const getSupportedMimeType = useCallback(() => {
// //     const types = ['audio/webm', 'audio/mp4', 'audio/wav'];
// //     return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
// //   }, []);

// //   const sendAudioToBackend = useCallback(async (audioBlob) => {
// //     try {
// //       console.log('🚀 Sending audio to backend...');
// //       const formData = new FormData();
// //       formData.append('audio', audioBlob, 'recording.webm');

// //       const response = await fetch(API_ENDPOINT, {
// //         method: 'POST',
// //         body: formData,
// //         signal: AbortSignal.timeout(10000)
// //       });

// //       if (!response.ok) {
// //         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
// //       }

// //       const result = await response.json();
// //       console.log('✅ Backend response:', result);

// //       if (isMountedRef.current && result.emotion) {
// //         onNewEmotion(result.emotion);
// //       } else if (isMountedRef.current) {
// //         console.warn('⚠️ No emotion in response');
// //         onNewEmotion('No emotion detected');
// //       }
// //     } catch (error) {
// //       console.error('❌ Network error:', error);
// //       if (isMountedRef.current) {
// //         if (error.name === 'AbortError') {
// //           onNewEmotion('Request timeout');
// //         } else {
// //           onNewEmotion('Network error');
// //         }
// //       }
// //     }
// //   }, [onNewEmotion]);

// //   const scheduleNextRecording = useCallback(() => {
// //     if (!isMountedRef.current) return;

// //     if (timeoutRef.current) {
// //       clearTimeout(timeoutRef.current);
// //     }

// //     console.log(`⏳ Waiting ${DELAY_BETWEEN_RECORDINGS}ms before next recording...`);

// //     timeoutRef.current = setTimeout(() => {
// //       if (isMountedRef.current) {
// //         console.log('🔄 Starting next recording cycle');
// //         recordAudio();
// //       }
// //     }, DELAY_BETWEEN_RECORDINGS);
// //   }, []);

// //   const recordAudio = useCallback(async () => {
// //     if (!isMountedRef.current || isRecordingRef.current) return;

// //     isRecordingRef.current = true;

// //     try {
// //       console.log('🎤 Starting audio recording...');
// //       const stream = await navigator.mediaDevices.getUserMedia({
// //         audio: {
// //           echoCancellation: true,
// //           noiseSuppression: true,
// //           autoGainControl: true
// //         }
// //       });

// //       streamRef.current = stream;
// //       const mimeType = getSupportedMimeType();
// //       const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
// //       mediaRecorderRef.current = mediaRecorder;

// //       const chunks = [];

// //       mediaRecorder.ondataavailable = (event) => {
// //         if (event.data.size > 0) {
// //           chunks.push(event.data);
// //           console.log(`📊 Audio chunk received: ${event.data.size} bytes`);
// //         }
// //       };

// //       mediaRecorder.onstop = async () => {
// //         console.log('⏹️ Recording stopped, processing audio...');
// //         try {
// //           stream.getTracks().forEach(track => track.stop());
// //           streamRef.current = null;

// //           if (chunks.length === 0) {
// //             console.warn('⚠️ No audio data recorded');
// //             if (isMountedRef.current) {
// //               onNewEmotion('No audio detected');
// //             }
// //             return;
// //           }

// //           const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
// //           console.log(`📦 Audio blob created: ${audioBlob.size} bytes`);

// //           if (isMountedRef.current) {
// //             onDetectionStart();
// //           }

// //           await sendAudioToBackend(audioBlob);
// //         } catch (error) {
// //           console.error('❌ Error processing recorded audio:', error);
// //           if (isMountedRef.current) {
// //             onNewEmotion('Processing error');
// //           }
// //         } finally {
// //           isRecordingRef.current = false;
// //           scheduleNextRecording();
// //         }
// //       };

// //       mediaRecorder.onerror = (event) => {
// //         console.error('❌ MediaRecorder error:', event.error);
// //         cleanup();
// //         if (isMountedRef.current) {
// //           onNewEmotion('Recording error');
// //         }
// //         isRecordingRef.current = false;
// //         scheduleNextRecording();
// //       };

// //       mediaRecorder.start();
// //       console.log(`⏱️ Recording for ${RECORDING_DURATION}ms...`);

// //       setTimeout(() => {
// //         if (mediaRecorder.state === 'recording') {
// //           mediaRecorder.stop();
// //         }
// //       }, RECORDING_DURATION);

// //     } catch (error) {
// //       console.error('❌ Error accessing microphone:', error);
// //       cleanup();
// //       if (isMountedRef.current) {
// //         onNewEmotion('Microphone error');
// //       }
// //       isRecordingRef.current = false;
// //       scheduleNextRecording();
// //     }
// //   }, [getSupportedMimeType, onDetectionStart, onNewEmotion, sendAudioToBackend, cleanup, scheduleNextRecording]);

// //   useEffect(() => {
// //     isMountedRef.current = true;
// //     console.log('🎵 AudioRecorder component mounted, starting first recording');
// //     recordAudio();

// //     return () => {
// //       console.log('🛑 AudioRecorder component unmounting, cleaning up...');
// //       isMountedRef.current = false;
// //       cleanup();
// //     };
// //   }, [recordAudio, cleanup]);

// //   return null;
// // };

// // export default AudioRecorder;


// // import React, { useEffect, useRef, useCallback } from 'react';

// // const AudioRecorder = ({ onDetectionStart, onNewEmotion }) => {
// //   const isMountedRef = useRef(true);
// //   const isRecordingRef = useRef(false);
// //   const timeoutRef = useRef(null);
// //   const streamRef = useRef(null);
// //   const mediaRecorderRef = useRef(null);

// //   const RECORDING_DURATION = 3000;
// //   const DELAY_BETWEEN_RECORDINGS = 3000;
// //   const API_ENDPOINT = 'http://localhost:5000/detect-emotion';
  

// //   const cleanup = useCallback(() => {
// //     if (timeoutRef.current) {
// //       clearTimeout(timeoutRef.current);
// //       timeoutRef.current = null;
// //     }

// //     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
// //       mediaRecorderRef.current.stop();
// //     }

// //     if (streamRef.current) {
// //       streamRef.current.getTracks().forEach(track => track.stop());
// //       streamRef.current = null;
// //     }
// //   }, []);

// //   const getSupportedMimeType = useCallback(() => {
// //     const types = ['audio/webm', 'audio/mp4', 'audio/wav'];
// //     return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
// //   }, []);

// //   const sendAudioToBackend = useCallback(async (audioBlob) => {
// //     try {
// //       console.log('🚀 Sending audio to backend...');
// //       const formData = new FormData();
// //       formData.append('audio', audioBlob, 'recording.webm');

// //       const response = await fetch(API_ENDPOINT, {
// //         method: 'POST',
// //         body: formData,
// //         signal: AbortSignal.timeout(10000)
// //       });

// //       if (!response.ok) {
// //         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
// //       }

// //       const result = await response.json();
// //       console.log('✅ Backend response:', result);

// //       if (isMountedRef.current && result.emotion) {
// //         onNewEmotion(result.emotion);
// //       } else if (isMountedRef.current) {
// //         console.warn('⚠️ No emotion in response');
// //         onNewEmotion('No emotion detected');
// //       }
// //     } catch (error) {
// //       console.error('❌ Network error:', error);
// //       if (isMountedRef.current) {
// //         onNewEmotion(error.name === 'AbortError' ? 'Request timeout' : 'Network error');
// //       }
// //     }
// //   }, [onNewEmotion]);

// //   const scheduleNextRecording = useCallback(() => {
// //     if (!isMountedRef.current) return;

// //     if (timeoutRef.current) {
// //       clearTimeout(timeoutRef.current);
// //     }

// //     console.log(`⏳ Waiting ${DELAY_BETWEEN_RECORDINGS}ms before next recording...`);

// //     timeoutRef.current = setTimeout(() => {
// //       if (isMountedRef.current) {
// //         console.log('🔄 Starting next recording cycle');
// //         recordAudio();
// //       }
// //     }, DELAY_BETWEEN_RECORDINGS);
// //   }, []);

// //   const recordAudio = useCallback(async () => {
// //     if (!isMountedRef.current || isRecordingRef.current) return;

// //     // 🔐 Microphone permission check
// //     try {
// //       if (navigator.permissions) {
// //         const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
// //         console.log(`🎧 Microphone permission status: ${permissionStatus.state}`);

// //         if (permissionStatus.state === 'denied') {
// //           console.warn('❌ Microphone permission denied');
// //           if (isMountedRef.current) {
// //             onNewEmotion('Microphone permission denied');
// //           }
// //           scheduleNextRecording();
// //           return;
// //         }
// //       }
// //     } catch (err) {
// //       console.warn('⚠️ Permissions API unsupported or failed');
// //       // Continue and let getUserMedia prompt
// //     }

// //     isRecordingRef.current = true;

// //     try {
// //       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
// //         throw new Error('getUserMedia not supported');
// //       }

// //       console.log('🎤 Starting audio recording...');
// //       const stream = await navigator.mediaDevices.getUserMedia({
// //         audio: {
// //           echoCancellation: true,
// //           noiseSuppression: true,
// //           autoGainControl: true
// //         }
// //       });

// //       streamRef.current = stream;
// //       const mimeType = getSupportedMimeType();
// //       const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
// //       mediaRecorderRef.current = mediaRecorder;

// //       const chunks = [];

// //       mediaRecorder.ondataavailable = (event) => {
// //         if (event.data.size > 0) {
// //           chunks.push(event.data);
// //           console.log(`📊 Audio chunk received: ${event.data.size} bytes`);
// //         }
// //       };

// //       mediaRecorder.onstop = async () => {
// //         console.log('⏹️ Recording stopped, processing audio...');
// //         try {
// //           stream.getTracks().forEach(track => track.stop());
// //           streamRef.current = null;

// //           if (chunks.length === 0) {
// //             console.warn('⚠️ No audio data recorded');
// //             if (isMountedRef.current) {
// //               onNewEmotion('No audio detected');
// //             }
// //             return;
// //           }

// //           const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
// //           console.log(`📦 Audio blob created: ${audioBlob.size} bytes`);

// //           if (isMountedRef.current) {
// //             onDetectionStart();
// //           }

// //           await sendAudioToBackend(audioBlob);
// //         } catch (error) {
// //           console.error('❌ Error processing recorded audio:', error);
// //           if (isMountedRef.current) {
// //             onNewEmotion('Processing error');
// //           }
// //         } finally {
// //           isRecordingRef.current = false;
// //           scheduleNextRecording();
// //         }
// //       };

// //       mediaRecorder.onerror = (event) => {
// //         console.error('❌ MediaRecorder error:', event.error);
// //         cleanup();
// //         if (isMountedRef.current) {
// //           onNewEmotion('Recording error');
// //         }
// //         isRecordingRef.current = false;
// //         scheduleNextRecording();
// //       };

// //       mediaRecorder.start();
// //       console.log(`⏱️ Recording for ${RECORDING_DURATION}ms...`);

// //       setTimeout(() => {
// //         if (mediaRecorder.state === 'recording') {
// //           mediaRecorder.stop();
// //         }
// //       }, RECORDING_DURATION);

// //     } catch (error) {
// //       console.error('❌ Error accessing microphone:', error);
// //       cleanup();
// //       if (isMountedRef.current) {
// //         onNewEmotion(error.message.includes('denied') ? 'Microphone permission denied' : 'Microphone error');
// //       }
// //       isRecordingRef.current = false;
// //       scheduleNextRecording();
// //     }
// //   }, [
// //     getSupportedMimeType,
// //     onDetectionStart,
// //     onNewEmotion,
// //     sendAudioToBackend,
// //     cleanup,
// //     scheduleNextRecording
// //   ]);

// //   useEffect(() => {
// //     isMountedRef.current = true;
// //     console.log('🎵 AudioRecorder component mounted, starting first recording');
// //     recordAudio();

// //     return () => {
// //       console.log('🛑 AudioRecorder component unmounting, cleaning up...');
// //       isMountedRef.current = false;
// //       cleanup();
// //     };
// //   }, [recordAudio, cleanup]);

// //   return null;
// // };

// // export default AudioRecorder;






// import { useEffect, useRef, useCallback } from 'react';

// const AudioRecorder = ({ onDetectionStart, onNewEmotion }) => {
//   const isMountedRef = useRef(true);
//   const isRecordingRef = useRef(false);
//   const timeoutRef = useRef(null);
//   const streamRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const audioContextRef = useRef(null);

//   const RECORDING_DURATION = 3000;
//   const DELAY_BETWEEN_RECORDINGS = 0;
//   const API_ENDPOINT = 'https://localhost:5000/detect-emotion';
  
//   // Voice activity detection thresholds
//   const MIN_VOLUME_THRESHOLD = 0.005;
//   const MIN_SPEECH_DURATION = 1.0;
//   const SILENCE_THRESHOLD = 0.005;

//   const cleanup = useCallback(() => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//       timeoutRef.current = null;
//     }

//     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//       mediaRecorderRef.current.stop();
//     }

//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//     }

//     if (audioContextRef.current) {
//       audioContextRef.current.close();
//       audioContextRef.current = null;
//     }
//   }, []);

//   const analyzeAudioBlob = useCallback(async (audioBlob) => {
//     try {
//       console.log('🔍 Analyzing audio for voice activity...');
      
//       const arrayBuffer = await audioBlob.arrayBuffer();
      
//       if (!audioContextRef.current) {
//         audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
//       }
      
//       const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
//       const channelData = audioBuffer.getChannelData(0);
      
//       let rms = 0;
//       let speechSamples = 0;
//       const sampleRate = audioBuffer.sampleRate;
//       const windowSize = Math.floor(sampleRate * 0.1);
      
//       for (let i = 0; i < channelData.length; i += windowSize) {
//         let windowRms = 0;
//         const windowEnd = Math.min(i + windowSize, channelData.length);
        
//         for (let j = i; j < windowEnd; j++) {
//           windowRms += channelData[j] * channelData[j];
//         }
        
//         windowRms = Math.sqrt(windowRms / (windowEnd - i));
        
//         if (windowRms > SILENCE_THRESHOLD) {
//           speechSamples++;
//           rms += windowRms;
//         }
//       }
      
//       const averageRms = speechSamples > 0 ? rms / speechSamples : 0;
//       const speechDuration = (speechSamples * windowSize) / sampleRate;
      
//       console.log(`📊 Audio analysis: RMS=${averageRms.toFixed(4)}, Speech duration=${speechDuration.toFixed(2)}s`);
      
//       const hasVoiceActivity = averageRms > MIN_VOLUME_THRESHOLD && speechDuration > MIN_SPEECH_DURATION;
      
//       return {
//         hasVoiceActivity,
//         averageRms,
//         speechDuration,
//         totalDuration: channelData.length / sampleRate
//       };
      
//     } catch (error) {
//       console.error('❌ Error analyzing audio:', error);
//       return { hasVoiceActivity: true, error: true };
//     }
//   }, [MIN_VOLUME_THRESHOLD, MIN_SPEECH_DURATION, SILENCE_THRESHOLD]);

//   const sendAudioToBackend = useCallback(async (audioBlob) => {
//     try {
//       console.log('🚀 Sending audio to backend...');
//       const formData = new FormData();
//       formData.append('audio', audioBlob, 'recording.webm');

//       const response = await fetch(API_ENDPOINT, {
//         method: 'POST',
//         body: formData,
//         signal: AbortSignal.timeout(10000)
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }

//       const result = await response.json();
//       console.log('✅ Backend response:', result);

//       if (isMountedRef.current && result.emotion) {
//         onNewEmotion(result.emotion);
//       } else if (isMountedRef.current) {
//         console.warn('⚠️ No emotion in response');
//         onNewEmotion('No emotion detected');
//       }
//     } catch (error) {
//       console.error('❌ Network error:', error);
//       if (isMountedRef.current) {
//         onNewEmotion(error.name === 'AbortError' ? 'Request timeout' : 'Network error');
//       }
//     }
//   }, [onNewEmotion]);

//   // ✅ FIXED: Define scheduleNextRecording function
//   const scheduleNextRecording = useCallback(() => {
//     if (!isMountedRef.current) return;

//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }

//     console.log(`⏳ Waiting ${DELAY_BETWEEN_RECORDINGS}ms before next recording...`);

//     timeoutRef.current = setTimeout(() => {
//       if (isMountedRef.current) {
//         console.log('🔄 Starting next recording cycle');
//         recordAudio();
//       }
//     }, DELAY_BETWEEN_RECORDINGS);
//   }, [DELAY_BETWEEN_RECORDINGS]);

//   // ✅ FIXED: Define recordAudio function
//   const recordAudio = useCallback(async () => {
//     if (!isMountedRef.current || isRecordingRef.current) return;

//     isRecordingRef.current = true;

//     try {
//       console.log('🎤 Starting audio recording...');
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: false,
//           autoGainControl: false,
//           sampleRate: 16000
//         }
//       });

//       streamRef.current = stream;
//       const mimeType = 'audio/webm';
//       const mediaRecorder = new MediaRecorder(stream, { mimeType });
//       mediaRecorderRef.current = mediaRecorder;

//       const chunks = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           chunks.push(event.data);
//           console.log(`📊 Audio chunk received: ${event.data.size} bytes`);
//         }
//       };

//       mediaRecorder.onstop = async () => {
//         console.log('⏹️ Recording stopped, analyzing audio...');
//         try {
//           stream.getTracks().forEach(track => track.stop());
//           streamRef.current = null;

//           if (chunks.length === 0) {
//             console.warn('⚠️ No audio data recorded');
//             if (isMountedRef.current) {
//               onNewEmotion('No audio detected');
//             }
//             return;
//           }

//           const audioBlob = new Blob(chunks, { type: mimeType });
//           console.log(`📦 Audio blob created: ${audioBlob.size} bytes`);

//           const analysis = await analyzeAudioBlob(audioBlob);
          
//           if (!analysis.hasVoiceActivity) {
//             console.log('🔇 No voice activity detected, skipping backend processing');
//             if (isMountedRef.current) {
//               onNewEmotion('Listening...');
//             }
//             return;
//           }

//           console.log('🗣️ Voice activity detected, processing...');
//           if (isMountedRef.current) {
//             onDetectionStart();
//           }

//           await sendAudioToBackend(audioBlob);
          
//         } catch (error) {
//           console.error('❌ Error processing recorded audio:', error);
//           if (isMountedRef.current) {
//             onNewEmotion('Processing error');
//           }
//         } finally {
//           isRecordingRef.current = false;
//           scheduleNextRecording();
//         }
//       };

//       mediaRecorder.onerror = (event) => {
//         console.error('❌ MediaRecorder error:', event.error);
//         cleanup();
//         if (isMountedRef.current) {
//           onNewEmotion('Recording error');
//         }
//         isRecordingRef.current = false;
//         scheduleNextRecording();
//       };

//       mediaRecorder.start();
//       console.log(`⏱️ Recording for ${RECORDING_DURATION}ms...`);

//       setTimeout(() => {
//         if (mediaRecorder.state === 'recording') {
//           mediaRecorder.stop();
//         }
//       }, RECORDING_DURATION);

//     } catch (error) {
//       console.error('❌ Error accessing microphone:', error);
//       cleanup();
//       if (isMountedRef.current) {
//         onNewEmotion('Microphone error');
//       }
//       isRecordingRef.current = false;
//       scheduleNextRecording();
//     }
//   }, [
//     analyzeAudioBlob, 
//     sendAudioToBackend, 
//     onDetectionStart, 
//     onNewEmotion, 
//     cleanup, 
//     scheduleNextRecording,
//     RECORDING_DURATION
//   ]);

//   // ✅ FIXED: Now useEffect is used
//   useEffect(() => {
//     isMountedRef.current = true;
//     console.log('🎵 AudioRecorder component mounted, starting first recording');
//     recordAudio();

//     return () => {
//       console.log('🛑 AudioRecorder component unmounting, cleaning up...');
//       isMountedRef.current = false;
//       cleanup();
//     };
//   }, [recordAudio, cleanup]);

//   return null;
// };

// export default AudioRecorder;


import { useEffect, useRef, useCallback } from 'react';

const AudioRecorder = ({ onDetectionStart, onNewEmotion, isActive }) => {
  const isMountedRef = useRef(true);
  const isRecordingRef = useRef(false);
  const timeoutRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isActiveRef = useRef(isActive); // Track isActive in a ref to avoid stale closures

  const RECORDING_DURATION = 3000;
  const DELAY_BETWEEN_RECORDINGS = 0;
  const API_ENDPOINT = 'https://localhost:5000/detect-emotion';
  
  // Voice activity detection thresholds
  const MIN_VOLUME_THRESHOLD = 0.005;
  const MIN_SPEECH_DURATION = 1.0;
  const SILENCE_THRESHOLD = 0.005;

  // Update ref whenever isActive changes
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up all resources...');
    
    // Clear BOTH timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      console.log('⏹️ Cleared scheduling timeout');
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
      console.log('⏹️ Cleared recording timeout');
    }

    // Abort any ongoing fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log('🚫 Aborted fetch request');
    }

    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        console.log('⏹️ Stopped media recorder');
      } catch (error) {
        console.log('⚠️ MediaRecorder already stopped');
      }
      mediaRecorderRef.current = null;
    }

    // Stop and release media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Microphone track stopped');
      });
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
      console.log('🔊 Audio context closed');
    }

    // Reset recording state
    isRecordingRef.current = false;
    console.log('✅ Cleanup completed');
  }, []);

  const analyzeAudioBlob = useCallback(async (audioBlob) => {
    // Check if still active before processing
    if (!isActiveRef.current || !isMountedRef.current) {
      console.log('🚫 Skipping audio analysis - recording stopped');
      return { hasVoiceActivity: false, stopped: true };
    }

    try {
      console.log('🔍 Analyzing audio for voice activity...');
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      let rms = 0;
      let speechSamples = 0;
      const sampleRate = audioBuffer.sampleRate;
      const windowSize = Math.floor(sampleRate * 0.1);
      
      for (let i = 0; i < channelData.length; i += windowSize) {
        let windowRms = 0;
        const windowEnd = Math.min(i + windowSize, channelData.length);
        
        for (let j = i; j < windowEnd; j++) {
          windowRms += channelData[j] * channelData[j];
        }
        
        windowRms = Math.sqrt(windowRms / (windowEnd - i));
        
        if (windowRms > SILENCE_THRESHOLD) {
          speechSamples++;
          rms += windowRms;
        }
      }
      
      const averageRms = speechSamples > 0 ? rms / speechSamples : 0;
      const speechDuration = (speechSamples * windowSize) / sampleRate;
      
      console.log(`📊 Audio analysis: RMS=${averageRms.toFixed(4)}, Speech duration=${speechDuration.toFixed(2)}s`);
      
      const hasVoiceActivity = averageRms > MIN_VOLUME_THRESHOLD && speechDuration > MIN_SPEECH_DURATION;
      
      return {
        hasVoiceActivity,
        averageRms,
        speechDuration,
        totalDuration: channelData.length / sampleRate
      };
      
    } catch (error) {
      console.error('❌ Error analyzing audio:', error);
      return { hasVoiceActivity: true, error: true };
    }
  }, [MIN_VOLUME_THRESHOLD, MIN_SPEECH_DURATION, SILENCE_THRESHOLD]);

  const sendAudioToBackend = useCallback(async (audioBlob) => {
    if (!isActiveRef.current || !isMountedRef.current) {
      console.log('🚫 Skipping backend request - recording stopped');
      return;
    }

    try {
      console.log('🚀 Sending audio to backend...');
      
      abortControllerRef.current = new AbortController();
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Backend response:', result);

      if (isMountedRef.current && isActiveRef.current && result.emotion) {
        onNewEmotion(result.emotion);
      } else if (isMountedRef.current && isActiveRef.current) {
        console.warn('⚠️ No emotion in response');
        onNewEmotion('No emotion detected');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 Request aborted (recording stopped)');
        return;
      }
      
      console.error('❌ Network error:', error);
      if (isMountedRef.current && isActiveRef.current) {
        onNewEmotion('Network error');
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [onNewEmotion]);

  const scheduleNextRecording = useCallback(() => {
    if (!isMountedRef.current || !isActiveRef.current) {
      console.log('🚫 Not scheduling next recording - stopped or unmounted');
      return;
    }

    // Prevent multiple scheduling
    if (timeoutRef.current) {
      console.log('⚠️ Recording already scheduled, skipping');
      return;
    }

    console.log(`⏳ Waiting ${DELAY_BETWEEN_RECORDINGS}ms before next recording...`);

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (isMountedRef.current && isActiveRef.current && !isRecordingRef.current) {
        console.log('🔄 Starting next recording cycle');
        recordAudio();
      } else {
        console.log('🚫 Skipping next recording - conditions not met');
      }
    }, DELAY_BETWEEN_RECORDINGS);
  }, [DELAY_BETWEEN_RECORDINGS]);

  const recordAudio = useCallback(async () => {
    if (!isMountedRef.current || isRecordingRef.current || !isActiveRef.current) {
      console.log('🚫 Skipping recording - not active or already recording');
      return;
    }

    isRecordingRef.current = true;

    try {
      console.log('🎤 Starting audio recording...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000
        }
      });

      // Check again after async operation
      if (!isActiveRef.current || !isMountedRef.current) {
        console.log('🚫 Recording stopped while getting media stream');
        stream.getTracks().forEach(track => track.stop());
        isRecordingRef.current = false;
        return;
      }

      streamRef.current = stream;
      const mimeType = 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log(`📊 Audio chunk received: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped, analyzing audio...');
        
        // Clear the recording timeout since recording stopped
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        
        try {
          // Clean up stream first
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          // Check if we should continue processing
          if (!isActiveRef.current || !isMountedRef.current) {
            console.log('🚫 Skipping audio processing - recording stopped');
            isRecordingRef.current = false;
            return;
          }

          if (chunks.length === 0) {
            console.warn('⚠️ No audio data recorded');
            if (isMountedRef.current && isActiveRef.current) {
              onNewEmotion('No audio detected');
            }
            isRecordingRef.current = false;
            scheduleNextRecording();
            return;
          }

          const audioBlob = new Blob(chunks, { type: mimeType });
          console.log(`📦 Audio blob created: ${audioBlob.size} bytes`);

          const analysis = await analyzeAudioBlob(audioBlob);
          
          // Check if analysis was stopped due to inactive state
          if (analysis.stopped) {
            isRecordingRef.current = false;
            return;
          }
          
          if (!isActiveRef.current || !isMountedRef.current) {
            console.log('🚫 Skipping backend processing - recording stopped after analysis');
            isRecordingRef.current = false;
            return;
          }
          
          if (!analysis.hasVoiceActivity) {
            console.log('🔇 No voice activity detected, skipping backend processing');
            if (isMountedRef.current && isActiveRef.current) {
              onNewEmotion('Listening...');
            }
            isRecordingRef.current = false;
            scheduleNextRecording();
            return;
          }

          console.log('🗣️ Voice activity detected, processing...');
          if (isMountedRef.current && isActiveRef.current) {
            onDetectionStart();
          }

          await sendAudioToBackend(audioBlob);
          
        } catch (error) {
          console.error('❌ Error processing recorded audio:', error);
          if (isMountedRef.current && isActiveRef.current) {
            onNewEmotion('Processing error');
          }
        } finally {
          isRecordingRef.current = false;
          if (isActiveRef.current && isMountedRef.current) {
            scheduleNextRecording();
          }
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        mediaRecorderRef.current = null;
        isRecordingRef.current = false;
        
        if (isMountedRef.current && isActiveRef.current) {
          onNewEmotion('Recording error');
          scheduleNextRecording();
        }
      };

      // Check one more time before starting
      if (!isActiveRef.current || !isMountedRef.current) {
        console.log('🚫 Recording stopped before starting MediaRecorder');
        stream.getTracks().forEach(track => track.stop());
        isRecordingRef.current = false;
        return;
      }

      mediaRecorder.start();
      console.log(`⏱️ Recording for ${RECORDING_DURATION}ms...`);

      // CRITICAL: Check isActive before setting timeout
      if (!isActiveRef.current || !isMountedRef.current) {
        console.log('🚫 Recording stopped before setting timeout');
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        isRecordingRef.current = false;
        return;
      }

      // Store the recording timeout so we can clear it if needed
      recordingTimeoutRef.current = setTimeout(() => {
        recordingTimeoutRef.current = null;
        if (mediaRecorder.state === 'recording' && isActiveRef.current) {
          console.log('⏰ Recording duration completed, stopping...');
          mediaRecorder.stop();
        }
      }, RECORDING_DURATION);

    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      isRecordingRef.current = false;
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (isMountedRef.current && isActiveRef.current) {
        onNewEmotion('Microphone error');
        scheduleNextRecording();
      }
    }
  }, [
    analyzeAudioBlob, 
    sendAudioToBackend, 
    onDetectionStart, 
    onNewEmotion, 
    scheduleNextRecording,
    RECORDING_DURATION
  ]);

  useEffect(() => {
    if (isActive) {
      console.log('🎵 Starting audio recording...');
      recordAudio();
    } else {
      console.log('⏸️ Stopping audio recording...');
      cleanup();
      if (isMountedRef.current) {
        onNewEmotion('Recording stopped');
      }
    }
  }, [isActive, recordAudio, cleanup, onNewEmotion]);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎵 AudioRecorder component mounted');

    return () => {
      console.log('🛑 AudioRecorder component unmounting, cleaning up...');
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return null;
};

export default AudioRecorder;
