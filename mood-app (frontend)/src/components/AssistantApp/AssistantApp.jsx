import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatBox from './ChatBox';
import InputArea from './InputArea';

const AssistantApp = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isMicDisabled, setIsMicDisabled] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [audioBlob, setAudioBlob] = useState(null); // New state for recorded audio blob

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isListeningRef = useRef(false); // Track listening state more reliably

  const mediaRecorderRef = useRef(null); // MediaRecorder ref
  const audioChunksRef = useRef([]); // Recorded audio chunks

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
        handleAutoSend();
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsMicDisabled(true);
    }

    // Cleanup
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

  // Handle auto-send after speech recognition stops
  const handleAutoSend = () => {
    if (finalTranscriptRef.current.trim()) {
      sendMessage(finalTranscriptRef.current.trim());
      finalTranscriptRef.current = '';
      setSpeechText('');
    }
  };

  // --- New functions to handle MediaRecorder alongside speech recognition ---

  // Start both speech recognition and audio recording
  const startListeningAndRecording = async () => {
    if (!recognitionRef.current) return;

    try {
      // Reset transcript and audio chunks
      finalTranscriptRef.current = '';
      setSpeechText('');
      audioChunksRef.current = [];

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

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);

        // Optional: Send to backend here (commented out)
        /*
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        fetch('https://your-backend-api.com/upload-audio', {
          method: 'POST',
          body: formData,
          // headers: { 'Authorization': 'Bearer your-token' }, // if needed
        })
          .then(res => {
            if (!res.ok) throw new Error('Upload failed');
            return res.json();
          })
          .then(data => console.log('Upload success:', data))
          .catch(err => console.error('Upload error:', err));
        */

        // Stop all tracks to free mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsListening(false);
    }
  };

  // Stop both speech recognition and audio recording
  const stopListeningAndRecording = () => {
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
  };

  // Toggle mic controls both speech and recording
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopListeningAndRecording();
    } else {
      startListeningAndRecording();
    }
  };

  // --- Your existing chat functions ---

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

  const updateChatTitle = (chatId, firstMessage) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId && chat.title === 'New Chat') {
        const title = firstMessage.split(' ').slice(0, 4).join(' ');
        return { ...chat, title: title.length > 20 ? title.substring(0, 20) + '...' : title };
      }
      return chat;
    }));
  };

  const addMessageToChat = (chatId, message) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, messages: [...chat.messages, message] };
      }
      return chat;
    }));
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    let chatId = currentChatId;
    if (!chatId) {
      chatId = createNewChat();
    }

    const userMessage = { text, type: 'user', timestamp: new Date() };

    let currentChat = chats.find(chat => chat.id === chatId);
    const willBeFirstMessage = currentChat && currentChat.messages.length === 0 && currentChat.title === 'New Chat';

    addMessageToChat(chatId, userMessage);

    if (willBeFirstMessage) {
      updateChatTitle(chatId, text);
    }

    setTimeout(() => {
      const botResponse = "🤖 Dummy response for: " + text;
      const botMessage = { text: botResponse, type: 'bot', timestamp: new Date() };
      addMessageToChat(chatId, botMessage);
    }, 800);
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const handleNewChat = () => {
    createNewChat();
  };

  const currentChatMessages = getCurrentChat()?.messages || [];

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
          onToggleMic={toggleSpeechRecognition} // Controls both speech recog & recording
        />
      </div>
    </div>
  );
};

export default AssistantApp;
