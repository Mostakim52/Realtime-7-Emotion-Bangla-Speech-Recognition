import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatBox from './ChatBox';
import InputArea from './InputArea';
import { ENDPOINTS } from '../../utils/config';

const AssistantApp = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isMicDisabled, setIsMicDisabled] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emotionResult, setEmotionResult] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  
  // New states for recording timer and preview
  const [recordingTime, setRecordingTime] = useState(3);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  // New state to track LLM response
  const [isWaitingForLLM, setIsWaitingForLLM] = useState(false);
  
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isListeningRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const speechTextRef = useRef('');
  
  const isRecordingActiveRef = useRef(false);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('banglaMoodChats');
    const savedCurrentChatId = localStorage.getItem('banglaMoodCurrentChatId');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        const chatsWithDates = parsedChats.map(chat => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(chatsWithDates);
      } catch (error) {
        console.error('Error parsing saved chats:', error);
        setChats([]);
      }
    }
    if (savedCurrentChatId) {
      setCurrentChatId(parseInt(savedCurrentChatId));
    }
  }, []);
  
  // Save chats to localStorage when chats change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('banglaMoodChats', JSON.stringify(chats));
    }
  }, [chats]);
  
  useEffect(() => {
    if (currentChatId !== null) {
      localStorage.setItem('banglaMoodCurrentChatId', currentChatId.toString());
    }
  }, [currentChatId]);
  
  // Sync ref with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  
  // Initialize speech recognition
useEffect(() => {
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "bn-BD";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      setSpeechText(finalTranscriptRef.current + interimTranscript);
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      // Don't auto-send - let user choose via preview
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
  } else {
    setIsMicDisabled(true);
  }
  
  return () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Error stopping recognition on cleanup:', error);
      }
    }
  };
}, [currentChatId]);
  

  
  // Function to convert WebM to WAV
  const convertWebmToWav = async (webmBlob) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const numberOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length;
      const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
      const view = new DataView(buffer);
      
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * numberOfChannels * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numberOfChannels * 2, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * numberOfChannels * 2, true);
      
      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      return new Blob([buffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting WebM to WAV:', error);
      throw error;
    }
  };
  
  // Modified start recording function
  const startListeningAndRecording = async () => {
    if (!recognitionRef.current || isWaitingForLLM) return;
    
    try {
      // Reset states
      finalTranscriptRef.current = '';
      setSpeechText('');
      audioChunksRef.current = [];
      setEmotionResult(null);
      setRecordingTime(3);
      setIsPreviewing(false);
      setAudioUrl(null);
      
      // Mark recording as active
      isRecordingActiveRef.current = true;
      
      // Create a new chat if there isn't one already
      let chatId = currentChatId;
      if (!chatId) {
        chatId = createNewChat();
      }
      setActiveChatId(chatId);
      
      // Start speech recognition
      recognitionRef.current.start();
      setIsListening(true);
      
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(webmBlob);
        
        // Create URL for preview
        const url = URL.createObjectURL(webmBlob);
        setAudioUrl(url);
        setIsPreviewing(true);
        
        // Stop all tracks to free mic
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      
      // Start the 3-second timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            stopListeningAndRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsListening(false);
      isRecordingActiveRef.current = false;
    }
  };
  
  // Modified stop recording function
  const stopListeningAndRecording = () => {
    console.log('Stopping recording - marking as inactive');
    
    // Mark recording as inactive IMMEDIATELY to prevent further text processing
    isRecordingActiveRef.current = false;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsListening(false);
    
    // Add a small delay to ensure any pending recognition results are ignored
    setTimeout(() => {
      console.log('Recording period officially ended');
    }, 100);
  };
  
// Modified send recording function
  const sendRecording = async () => {
    if (!audioBlob) return;
    
    // Ensure recording is marked as inactive
    isRecordingActiveRef.current = false;
    
    setIsPreviewing(false);
    setIsWaitingForLLM(true);
    
    // Store the speech text before processing
    const text = finalTranscriptRef.current.trim();
    speechTextRef.current = text;
    
    // Add user message first
    if (text) {
      const userMessage = { text, type: 'user', timestamp: new Date() };
      addMessageToChat(activeChatId, userMessage);
      
      // Add processing message after user message
      const processingMessage = { 
        text: 'Processing your speech and detecting emotion...', 
        type: 'bot', 
        timestamp: new Date(),
        isProcessing: true
      };
      addMessageToChat(activeChatId, processingMessage);
    }
    
    // Clear the displayed text
    finalTranscriptRef.current = '';
    setSpeechText('');
    
    try {
      const wavBlob = await convertWebmToWav(audioBlob);
      detectEmotion(wavBlob);
    } catch (error) {
      console.error('Error converting audio:', error);
      setIsWaitingForLLM(false);
      
      const errorMessage = {
        text: 'Sorry, there was an error processing your audio. Please try again.',
        type: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      addMessageToChat(activeChatId, errorMessage);
    }
  };


  const toggleSpeechRecognition = () => {
    if (isPreviewing) {
      // If previewing, send the recording
      sendRecording();
    } else if (isListening) {
      // If recording, stop recording
      stopListeningAndRecording();
    } else {
      // If not recording, start recording
      startListeningAndRecording();
    }
  };
  
  // Play the recorded audio
  const playRecordedAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };
  
  // Detect emotion from audio
  const detectEmotion = async (audioBlob) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch(ENDPOINTS.DETECT_EMOTION, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setEmotionResult(data.emotion);
      
      // Get the stored speech text
      const text = speechTextRef.current;
      
      if (text) {
        // Remove the processing message
        setChats(prev => prev.map(chat => {
          if (chat.id === activeChatId) {
            return { 
              ...chat, 
              messages: chat.messages.filter(msg => !msg.isProcessing) 
            };
          }
          return chat;
        }));
        
        // Add emotion detection message
        const emotionMessage = {
          text: `Detected emotion: ${data.emotion}`,
          type: 'bot',
          timestamp: new Date(),
          isEmotion: true
        };
        addMessageToChat(activeChatId, emotionMessage);
        
        // Get LLM response with both text and emotion
        const llmResponse = await getLLMResponse(text, data.emotion);
        
        // Add the LLM response to the chat
        const botMessage = {
          text: llmResponse,
          type: 'bot',
          timestamp: new Date()
        };
        addMessageToChat(activeChatId, botMessage);
        
        // Clear the stored text
        speechTextRef.current = '';
      }
      
    } catch (error) {
      console.error('Error detecting emotion:', error);
      
      const errorMessage = {
        text: 'Sorry, I could not detect the emotion. Please try again.',
        type: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      addMessageToChat(activeChatId, errorMessage);
      
      // Even if emotion detection fails, still get LLM response with text
      const text = speechTextRef.current;
      if (text) {
        // Remove the processing message
        setChats(prev => prev.map(chat => {
          if (chat.id === activeChatId) {
            return { 
              ...chat, 
              messages: chat.messages.filter(msg => !msg.isProcessing) 
            };
          }
          return chat;
        }));
        
        // Get LLM response without emotion
        const llmResponse = await getLLMResponse(text, null);
        
        const botMessage = {
          text: llmResponse,
          type: 'bot',
          timestamp: new Date()
        };
        addMessageToChat(activeChatId, botMessage);
        
        speechTextRef.current = '';
      }
    } finally {
      setIsProcessing(false);
      setIsWaitingForLLM(false); // Re-enable recording button
      setActiveChatId(null);
    }
  };
  
  // Chat functions
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };
  
  const getCurrentChat = () => {
    return chats.find(chat => chat.id === currentChatId) || null;
  };
  
  const addMessageToChat = (chatId, message) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, messages: [...chat.messages, message] };
      }
      return chat;
    }));
  };
  
  const updateChatTitle = (chatId, firstMessage) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const title = firstMessage.split(' ').slice(0, 4).join(' ');
        return { ...chat, title: title.length > 20 ? title.substring(0, 20) + '...' : title };
      }
      return chat;
    }));
  };
  
  // Get LLM responses
  const getLLMResponse = async (text, emotion) => {
    try {
      const response = await fetch(ENDPOINTS.GENERATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          emotion: emotion || ''
        }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting LLM response:', error);
      return 'Sorry, I could not generate a response at the moment. Please try again later.';
    }
  };
  
  // Send text message
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    setIsWaitingForLLM(true); // Disable recording button
    
    let chatId = activeChatId || currentChatId;
    if (!chatId) {
      chatId = createNewChat();
    }
    
    const userMessage = { text, type: 'user', timestamp: new Date() };
    const currentChat = getCurrentChat();
    
    const isFirstMessage = !currentChat || currentChat.messages.length === 0;
    
    addMessageToChat(chatId, userMessage);
    
    if (isFirstMessage) {
      updateChatTitle(chatId, text);
    }
    
    if (!text.includes('Detected emotion:')) {
      const processingMessage = { 
        text: 'Processing your message...', 
        type: 'bot', 
        timestamp: new Date(),
        isProcessing: true
      };
      addMessageToChat(chatId, processingMessage);
      
      const llmResponse = await getLLMResponse(text, emotionResult);
      
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return { 
            ...chat, 
            messages: chat.messages.filter(msg => !msg.isProcessing) 
          };
        }
        return chat;
      }));
      
      const botMessage = {
        text: llmResponse,
        type: 'bot',
        timestamp: new Date()
      };
      addMessageToChat(chatId, botMessage);
    }
    
    setIsWaitingForLLM(false); // Re-enable recording button
  };
  
  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    setActiveChatId(null);
  };
  
  const handleNewChat = () => {
    createNewChat();
    setActiveChatId(null);
  };
  
  const currentChatMessages = getCurrentChat()?.messages || [];
  
  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  return (
    <div className="app">
      <Sidebar 
        chats={chats} 
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <div className="chat-container">
        <ChatBox messages={currentChatMessages} />
        <InputArea 
          isListening={isListening}
          isMicDisabled={isMicDisabled}
          speechText={speechText}
          onToggleMic={toggleSpeechRecognition}
          isProcessing={isProcessing}
          isPreviewing={isPreviewing}
          recordingTime={recordingTime}
          audioUrl={audioUrl}
          onPlayAudio={playRecordedAudio}
          audioRef={audioRef}
          isWaitingForLLM={isWaitingForLLM} // Pass this new prop
        />
      </div>
    </div>
  );
};

export default AssistantApp;
