'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

// 类型定义
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function VoiceInput({ onTranscript, disabled = false, language = 'zh-CN' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 检查浏览器支持
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognitionAPI);
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    setErrorMessage(null);

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setErrorMessage('浏览器不支持语音');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // 根据错误类型显示不同提示
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setErrorMessage('请允许麦克风权限');
            break;
          case 'no-speech':
            setErrorMessage('未检测到语音');
            break;
          case 'audio-capture':
            setErrorMessage('无法访问麦克风');
            break;
          case 'network':
            setErrorMessage('网络错误');
            break;
          case 'aborted':
            setErrorMessage('录音已取消');
            break;
          default:
            setErrorMessage('语音识别失败');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
      setErrorMessage('启动语音识别失败');
    }
  }, [language, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // 清除错误提示
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // 不支持语音时，显示提示
  if (isSupported === false) {
    return (
      <div className="relative group">
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled
          className="opacity-50 cursor-not-allowed"
          title="浏览器不支持语音识别，请使用Chrome、Edge或Safari"
        >
          <AlertCircle className="w-4 h-4 text-gray-400" />
        </Button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          请使用Chrome/Edge浏览器
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        size="icon"
        variant={isListening ? 'default' : 'outline'}
        onClick={toggleListening}
        disabled={disabled || isSupported === null}
        className={`h-8 w-8 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
        title={isListening ? '点击停止录音' : '点击开始语音输入'}
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
      
      {/* 录音状态提示 */}
      {isListening && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap animate-pulse">
          🎤 正在录音...
        </div>
      )}
      
      {/* 错误提示 */}
      {errorMessage && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
