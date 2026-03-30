'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { VoiceInput } from '@/components/ui/voice-input';
import { 
  Loader2, Send, FlaskConical, Droplets, Wind, Thermometer, 
  Fish, Bird, Leaf, TreePine, Mountain, ArrowLeft,
  Circle, Square, Triangle
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface EcoElement {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'animal' | 'plant' | 'material';
  effect: {
    oxygen?: number;
    humidity?: number;
    temperature?: number;
  };
}

const ECO_ELEMENTS: EcoElement[] = [
  { id: 'fish', name: '小鱼', icon: <Fish className="w-6 h-6" />, category: 'animal', effect: { oxygen: -5, humidity: 0 } },
  { id: 'snail', name: '蜗牛', icon: <Circle className="w-6 h-6" />, category: 'animal', effect: { oxygen: -2, humidity: 0 } },
  { id: 'bird', name: '小鸟', icon: <Bird className="w-6 h-6" />, category: 'animal', effect: { oxygen: -3, humidity: 0 } },
  { id: 'water-plant', name: '水草', icon: <Leaf className="w-6 h-6 text-green-500" />, category: 'plant', effect: { oxygen: 15, humidity: 5 } },
  { id: 'moss', name: '苔藓', icon: <Leaf className="w-6 h-6 text-emerald-600" />, category: 'plant', effect: { oxygen: 10, humidity: 10 } },
  { id: 'tree', name: '小树苗', icon: <TreePine className="w-6 h-6" />, category: 'plant', effect: { oxygen: 20, humidity: 8 } },
  { id: 'water', name: '水', icon: <Droplets className="w-6 h-6 text-blue-500" />, category: 'material', effect: { oxygen: 0, humidity: 30 } },
  { id: 'soil', name: '泥土', icon: <Mountain className="w-6 h-6 text-yellow-700" />, category: 'material', effect: { oxygen: 0, humidity: 5 } },
  { id: 'wood', name: '木头', icon: <Square className="w-6 h-6 text-amber-600" />, category: 'material', effect: { oxygen: 0, humidity: 3 } },
];

const BOTTLE_SHAPES = [
  { id: 'circle', name: '圆形', icon: <Circle className="w-8 h-8" /> },
  { id: 'square', name: '方形', icon: <Square className="w-8 h-8" /> },
  { id: 'triangle', name: '三角形', icon: <Triangle className="w-8 h-8" /> },
];

export default function BottlePage() {
  const [bottleType, setBottleType] = useState<'water' | 'land' | null>(null);
  const [bottleShape, setBottleShape] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是你的生态瓶设计助手 🧪\n\n让我们一起来设计一个微型生态系统吧！首先，你想制作什么类型的生态瓶呢？',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [envData, setEnvData] = useState({
    oxygen: 50,
    humidity: 50,
    stability: 50,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 计算环境数据
  useEffect(() => {
    let oxygen = 50;
    let humidity = 50;

    selectedElements.forEach(elementId => {
      const element = ECO_ELEMENTS.find(e => e.id === elementId);
      if (element) {
        oxygen += element.effect.oxygen || 0;
        humidity += element.effect.humidity || 0;
      }
    });

    // 限制范围在 0-100
    oxygen = Math.max(0, Math.min(100, oxygen));
    humidity = Math.max(0, Math.min(100, humidity));

    // 计算稳定性（基于平衡度）
    const stability = 100 - Math.abs(oxygen - 50) - Math.abs(humidity - 50);

    setEnvData({ oxygen, humidity, stability: Math.max(0, stability) });
  }, [selectedElements]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          context: 'bottle',
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

  const toggleElement = (elementId: string) => {
    setSelectedElements(prev => 
      prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    );
  };

  const getStatusColor = (value: number) => {
    if (value >= 70 && value <= 85) return 'bg-green-500';
    if (value >= 60 && value <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (value: number) => {
    if (value >= 70 && value <= 85) return '理想';
    if (value >= 60 && value <= 90) return '一般';
    return '需调整';
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + text);
  };

  if (!bottleType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <FlaskConical className="w-8 h-8 text-blue-600" />
              选择生态瓶类型
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600 dark:text-gray-300">
              你想制作哪种类型的生态瓶？
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setBottleType('water')}
                className="h-32 flex flex-col gap-3 bg-gradient-to-br from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600"
              >
                <Droplets className="w-12 h-12" />
                <span className="text-lg font-bold">水生生态瓶</span>
                <span className="text-sm opacity-90">适合水生植物和小鱼</span>
              </Button>
              <Button
                onClick={() => setBottleType('land')}
                className="h-32 flex flex-col gap-3 bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600"
              >
                <TreePine className="w-12 h-12" />
                <span className="text-lg font-bold">陆生生态瓶</span>
                <span className="text-sm opacity-90">适合植物和小昆虫</span>
              </Button>
            </div>
            <Link href="/">
              <Button variant="ghost" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900">
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
            <FlaskConical className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              设计{bottleType === 'water' ? '水生' : '陆生'}生态瓶
            </h1>
          </div>
          <div className="w-20" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: AI Chat */}
          <Card className="lg:col-span-1 h-[700px] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Leaf className="w-5 h-5 text-blue-500" />
                AI助手
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea ref={scrollRef} className="flex-1 p-4 h-0">
                <div className="space-y-3">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 border-t flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="提问..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                  />
                  <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Center: Element Selection */}
          <Card className="lg:col-span-1 h-[700px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="w-5 h-5 text-cyan-500" />
                选择生态元素
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              {!bottleShape ? (
                <div className="space-y-4">
                  <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
                    首先选择瓶子形状：
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {BOTTLE_SHAPES.map(shape => (
                      <Button
                        key={shape.id}
                        onClick={() => setBottleShape(shape.id)}
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                      >
                        {shape.icon}
                        <span className="text-xs">{shape.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      已选择：{BOTTLE_SHAPES.find(s => s.id === bottleShape)?.name}瓶子
                    </p>
                    <Button
                      onClick={() => setBottleShape(null)}
                      variant="link"
                      size="sm"
                      className="text-xs"
                    >
                      更改形状
                    </Button>
                  </div>

                  {['animal', 'plant', 'material'].map(category => (
                    <div key={category}>
                      <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
                        {category === 'animal' ? '🐾 动物' : category === 'plant' ? '🌱 植物' : '🪨 材料'}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {ECO_ELEMENTS.filter(e => e.category === category).map(element => (
                          <Button
                            key={element.id}
                            onClick={() => toggleElement(element.id)}
                            variant={selectedElements.includes(element.id) ? 'default' : 'outline'}
                            className={`h-16 flex flex-col gap-1 ${
                              selectedElements.includes(element.id) 
                                ? 'bg-blue-500 hover:bg-blue-600' 
                                : ''
                            }`}
                          >
                            {element.icon}
                            <span className="text-xs">{element.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Environment Data */}
          <Card className="lg:col-span-1 h-[700px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wind className="w-5 h-5 text-green-500" />
                环境数据
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-6">
              {/* Oxygen Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-sm">含氧量</span>
                  </div>
                  <span className="text-sm font-bold">{envData.oxygen}%</span>
                </div>
                <Progress value={envData.oxygen} className="h-2" />
                <p className="text-xs text-gray-500">
                  状态：<span className={envData.oxygen >= 70 && envData.oxygen <= 85 ? 'text-green-600 font-semibold' : 'text-yellow-600'}>{getStatusText(envData.oxygen)}</span>
                </p>
              </div>

              {/* Humidity Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-cyan-500" />
                    <span className="font-medium text-sm">湿度</span>
                  </div>
                  <span className="text-sm font-bold">{envData.humidity}%</span>
                </div>
                <Progress value={envData.humidity} className="h-2" />
                <p className="text-xs text-gray-500">
                  状态：<span className={envData.humidity >= 60 && envData.humidity <= 80 ? 'text-green-600 font-semibold' : 'text-yellow-600'}>{getStatusText(envData.humidity)}</span>
                </p>
              </div>

              {/* Stability */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-sm">生态稳定性</span>
                  </div>
                  <span className="text-sm font-bold">{envData.stability}%</span>
                </div>
                <Progress value={envData.stability} className="h-2" />
                <p className="text-xs text-gray-500">
                  {envData.stability >= 70 ? (
                    <span className="text-green-600 font-semibold">生态系统很稳定！</span>
                  ) : envData.stability >= 40 ? (
                    <span className="text-yellow-600">生态系统基本稳定</span>
                  ) : (
                    <span className="text-red-600">需要调整元素平衡</span>
                  )}
                </p>
              </div>

              {/* Selected Elements Summary */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">已选元素：</h4>
                {selectedElements.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedElements.map(elementId => {
                      const element = ECO_ELEMENTS.find(e => e.id === elementId);
                      return element ? (
                        <span
                          key={elementId}
                          className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs flex items-center gap-1"
                        >
                          {element.icon}
                          {element.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">还未选择任何元素</p>
                )}
              </div>

              {/* Tips */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  💡 <strong>提示：</strong>保持含氧量在70-85%，湿度在60-80%之间，可以让生态系统更稳定！
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
