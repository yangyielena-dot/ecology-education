'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceInput } from '@/components/ui/voice-input';
import { Loader2, Send, Globe, Leaf, TreePine, Bird, Fish, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLearningRecord } from '@/hooks/useLearningRecord';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PlanetPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好，年轻的生态守护者！🌿 我是你的生态AI助手。让我们一起重建生态星球吧！\n\n请告诉我，你心目中的理想生态星球是什么样子的？你想在这个星球上看到哪些生物？什么样的环境？让我们一起创造一个充满生机的世界！',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 学习记录
  const { startSession, saveMessage, endSession, sessionId } = useLearningRecord({
    moduleType: 'planet',
  });

  // 创建学习会话
  useEffect(() => {
    startSession();
  }, [startSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // 保存用户消息
    saveMessage('user', userMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          context: 'planet',
          conversationHistory: messages 
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
        }

        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        // 保存AI回复
        saveMessage('assistant', assistantMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，出现了一些问题。请稍后再试。' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (isGeneratingImage) return;

    setIsGeneratingImage(true);
    try {
      const conversationText = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('。');

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `一个美丽的生态星球，${conversationText}。充满生机和活力，和谐的生态系统，梦幻般的自然景观，高质量数字艺术作品。` 
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">
              重建生态星球
            </h1>
          </div>
          <div className="w-20" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chat Section */}
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" />
                生态AI助手
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea ref={scrollRef} className="flex-1 p-4 h-0">
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                          <Leaf className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-blue-600">你</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-green-600 animate-pulse" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="描述你的生态星球..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Generation Section */}
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5 text-emerald-500" />
                你的生态星球
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
              {generatedImage ? (
                <div className="relative w-full h-full flex flex-col">
                  <div className="relative flex-1 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900">
                    <img
                      src={generatedImage}
                      alt="生成的生态星球"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
                    🌍 这就是你设计的生态星球！
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-200 to-emerald-300 dark:from-green-800 dark:to-emerald-700 flex items-center justify-center">
                    <Globe className="w-16 h-16 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-300">
                      与AI助手对话，描述你心目中的生态星球
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      包含动物、植物、河流、山脉等元素
                    </p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <Bird className="w-8 h-8 text-blue-500" />
                      <span className="text-xs text-gray-500 mt-1">动物</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <TreePine className="w-8 h-8 text-green-500" />
                      <span className="text-xs text-gray-500 mt-1">植物</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Fish className="w-8 h-8 text-cyan-500" />
                      <span className="text-xs text-gray-500 mt-1">水生生物</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full mt-4 space-y-2">
                <Button
                  onClick={generateImage}
                  disabled={isGeneratingImage || messages.length < 2}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      正在生成生态星球...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      生成我的生态星球图片 🎨
                    </>
                  )}
                </Button>
                {messages.length < 2 ? (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    💡 先与AI助手对话，描述你想创造的生态星球（环境、植物、动物等）
                  </p>
                ) : (
                  <p className="text-xs text-center text-green-600 dark:text-green-400 font-medium">
                    ✨ 点击按钮，看看你的生态星球是什么样子！
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">💡 小贴士</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• 描述你想在这个星球上看到的植物和动物</li>
            <li>• 告诉AI助手你希望星球有什么样的地形（山脉、河流、森林等）</li>
            <li>• 你可以询问关于生态系统的知识，AI会引导你学习</li>
            <li>• 当你描述完成后，点击"生成我的生态星球图片"看看你的创意！</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
