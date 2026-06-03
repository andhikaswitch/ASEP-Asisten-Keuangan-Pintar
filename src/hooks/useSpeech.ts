import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech(language = 'id-ID') {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
        
        // Auto-stop after 3.5 seconds of silence
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, 3500);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn('Speech Recognition is not supported in this browser.');
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (isListening) return;
    setTranscript('');
    try {
      recognitionRef.current?.start();
      setIsListening(true);
      
      // Stop automatically if they say nothing for 6 seconds initially
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 6000);
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  }, [isListening]);


  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      console.error(e);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    // Some basic cleanup for characters that TTS might struggle with
    const cleanText = text.replace(/[*#_`]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language;
    utterance.rate = 1.0; // Slightly lazy speed fitting Gintoki? 0.9?
    utterance.pitch = 0.9; // Lower pitch
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if(onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript: () => setTranscript('')
  };
}
