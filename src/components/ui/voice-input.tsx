'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

export function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 检查浏览器支持
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      setIsSupported(hasMediaDevices && hasMediaRecorder);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      });

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());
        
        // 合并音频数据
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });

        // 转为 base64 并发送到后端识别
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setErrorMessage('请允许麦克风权限');
        } else if (error.name === 'NotFoundError') {
          setErrorMessage('未找到麦克风设备');
        } else {
          setErrorMessage('启动录音失败');
        }
      } else {
        setErrorMessage('启动录音失败');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // 转换为 base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          // 发送到后端识别
          const response = await fetch('/api/asr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioData: base64Data }),
          });

          const result = await response.json();

          if (result.success && result.text) {
            onTranscript(result.text);
          } else {
            setErrorMessage(result.error || '语音识别失败');
          }
        } catch (error) {
          console.error('ASR request error:', error);
          setErrorMessage('语音识别请求失败');
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage('音频处理失败');
        setIsProcessing(false);
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Process audio error:', error);
      setErrorMessage('音频处理失败');
      setIsProcessing(false);
    }
  };

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
          title="浏览器不支持语音识别"
        >
          <AlertCircle className="w-4 h-4 text-gray-400" />
        </Button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          浏览器不支持语音识别
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
        disabled={disabled || isSupported === null || isProcessing}
        className={`h-8 w-8 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''} ${isProcessing ? 'bg-blue-500' : ''}`}
        title={isListening ? '点击停止录音' : isProcessing ? '正在识别...' : '点击开始语音输入'}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isListening ? (
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

      {/* 识别中提示 */}
      {isProcessing && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-blue-500 text-white text-xs rounded whitespace-nowrap">
          ⏳ 正在识别...
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
