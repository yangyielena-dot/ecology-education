'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceInput } from '@/components/ui/voice-input';
import { Slider } from '@/components/ui/slider';
import { 
  Loader2, Send, FlaskConical, Droplets, Wind,
  ArrowLeft, Sparkles, Sun, Plus, Minus
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PlacedItem {
  id: string;
  elementId: string;
  emoji: string;
  x: number;
  y: number;
}

// 水生生态瓶元素
const WATER_ELEMENTS = {
  animals: [
    { id: 'zebra-fish', name: '斑马鱼', emoji: '🐟', max: 5, hint: '活泼好动，需要氧气' },
    { id: 'apple-snail', name: '苹果螺', emoji: '🐌', max: 5, hint: '吃藻类，清洁水质' },
  ],
  plants: [
    { id: 'waterweed', name: '蜈蚣草', emoji: '🌿', max: 10, hint: '产生氧气' },
    { id: 'duckweed', name: '浮萍', emoji: '🍀', max: 15, hint: '遮阳降温' },
  ],
  materials: [
    { id: 'sand', name: '底砂', emoji: '⬜', max: 1, hint: '铺满底部', fillBottom: true },
    { id: 'stone', name: '石头', emoji: '🪨', max: 5, hint: '装饰躲避' },
  ],
};

// 计算环境指标
function calculateEnvironment(elements: Record<string, number>) {
  const fishCount = elements['zebra-fish'] || 0;
  const snailCount = elements['apple-snail'] || 0;
  const waterweedCount = elements['waterweed'] || 0;
  const duckweedCount = elements['duckweed'] || 0;
  
  // 溶氧量计算
  let oxygen = 50;
  oxygen += waterweedCount * 4; // 水草产氧
  oxygen += duckweedCount * 1;  // 浮萍产氧
  oxygen -= fishCount * 6;      // 鱼耗氧
  oxygen -= snailCount * 1;     // 螺耗氧
  
  // 废物浓度
  let waste = 20;
  waste += fishCount * 8;       // 鱼产生废物
  waste += snailCount * 2;      // 螺产生废物
  waste -= snailCount * 3;      // 螺吃藻类
  waste -= waterweedCount * 2;  // 水草吸收
  
  // 稳定性
  const idealOxygen = 60;
  const stability = Math.max(0, 100 - Math.abs(oxygen - idealOxygen) - Math.abs(waste - 30));
  
  return {
    oxygen: Math.max(0, Math.min(100, Math.round(oxygen))),
    waste: Math.max(0, Math.min(100, Math.round(waste))),
    stability: Math.max(0, Math.min(100, Math.round(stability))),
  };
}

export default function BottlePage() {
  const [elements, setElements] = useState<Record<string, number>>({ hasWater: 1, sand: 0 });
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [lightHours, setLightHours] = useState(8);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottleRef = useRef<HTMLDivElement>(null);

  const envData = calculateEnvironment(elements);

  useEffect(() => {
    const initialMessage = `你好！我是生态瓶设计助手苗苗 🌱

这是一个空的水生生态瓶，让我们一起来设计它吧！

💡 建议：先铺好底砂，再添加植物，最后放小鱼。

你想先添加什么呢？`;
    setMessages([{ role: 'assistant', content: initialMessage }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 生成建议消息
  useEffect(() => {
    const fishCount = elements['zebra-fish'] || 0;
    const snailCount = elements['apple-snail'] || 0;
    const waterweedCount = elements['waterweed'] || 0;
    const duckweedCount = elements['duckweed'] || 0;
    
    // 当学生添加了元素后，AI主动提出质疑
    if (fishCount > 0 && waterweedCount === 0 && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && !lastMsg.content.includes('水草')) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🤔 我发现一个问题：

你放了 ${fishCount} 条小鱼，但是还没有水草哦！

小鱼需要氧气才能呼吸，而水草是氧气的"制造工厂"。没有水草，小鱼会缺氧的！

要不要添加一些水草呢？`
          }]);
        }, 1000);
      }
    }
  }, [elements]);

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
          bottleType: 'water',
          selectedElements: elements,
          envData: envData,
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
          assistantMessage += decoder.decode(value);
        }
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，出问题了，请重试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleElementChange = (elementId: string, delta: number, emoji: string) => {
    setElements(prev => {
      const current = prev[elementId] || 0;
      const newValue = Math.max(0, current + delta);
      return { ...prev, [elementId]: newValue };
    });
    
    // 添加时在生态瓶中放置
    if (delta > 0) {
      const bottle = bottleRef.current;
      if (bottle) {
        const rect = bottle.getBoundingClientRect();
        const newItem: PlacedItem = {
          id: `${elementId}-${Date.now()}`,
          elementId,
          emoji,
          x: Math.random() * (rect.width - 50) + 25,
          y: Math.random() * (rect.height - 100) + 70,
        };
        setPlacedItems(prev => [...prev, newItem]);
      }
    } else {
      // 移除最后一个
      setPlacedItems(prev => {
        const idx = prev.map(item => item.elementId).lastIndexOf(elementId);
        if (idx !== -1) {
          return prev.filter((_, i) => i !== idx);
        }
        return prev;
      });
    }
  };

  const handleDragStart = (itemId: string) => {
    setDraggingItem(itemId);
  };

  const handleDrag = useCallback((e: React.MouseEvent | React.TouchEvent, itemId: string) => {
    if (!bottleRef.current) return;
    const bottle = bottleRef.current;
    const rect = bottle.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = Math.max(20, Math.min(rect.width - 20, clientX - rect.left));
    const y = Math.max(70, Math.min(rect.height - 20, clientY - rect.top));
    
    setPlacedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, x, y } : item
    ));
  }, []);

  const handleDragEnd = () => {
    setDraggingItem(null);
  };

  const allElements = [...WATER_ELEMENTS.animals, ...WATER_ELEMENTS.plants, ...WATER_ELEMENTS.materials];

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-cyan-50 to-blue-100 dark:from-cyan-950 dark:to-blue-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white/50 dark:bg-gray-900/50 flex-shrink-0">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-blue-700">设计水生生态瓶</span>
        </div>
        <div className="w-16" />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex gap-3 p-3 min-h-0">
        {/* 左列：生态瓶展示 */}
        <div className="w-[45%] flex flex-col gap-3 min-h-0">
          {/* 生态瓶 */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 p-3 min-h-0">
              <div 
                ref={bottleRef}
                className="relative w-full h-full rounded-xl overflow-hidden border-4 border-cyan-200 dark:border-cyan-700"
                style={{
                  background: elements.sand > 0 
                    ? 'linear-gradient(to bottom, #e0f7fa 0%, #b2ebf2 30%, #80deea 100%)'
                    : 'linear-gradient(to bottom, #e0f7fa 0%, #b2ebf2 30%, #80deea 100%)',
                }}
                onMouseMove={(e) => draggingItem && handleDrag(e, draggingItem)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={(e) => draggingItem && handleDrag(e, draggingItem)}
                onTouchEnd={handleDragEnd}
              >
                {/* 水 - 70%高度 */}
                <div 
                  className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-blue-300/60 to-cyan-200/40"
                  style={{ height: '70%' }}
                />
                
                {/* 底砂 */}
                {elements.sand > 0 && (
                  <div 
                    className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-amber-300 to-amber-200"
                    style={{ height: '15%' }}
                  />
                )}
                
                {/* 放置的生物 */}
                {placedItems.map(item => (
                  <div
                    key={item.id}
                    className="absolute cursor-move select-none text-3xl transition-transform hover:scale-110"
                    style={{ left: item.x - 15, top: item.y - 15 }}
                    onMouseDown={() => handleDragStart(item.id)}
                    onTouchStart={() => handleDragStart(item.id)}
                  >
                    {item.emoji}
                  </div>
                ))}
                
                {/* 光照指示 */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-100/80 px-2 py-1 rounded-full">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-medium">{lightHours}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 环境指标 */}
          <Card className="flex-shrink-0">
            <CardContent className="p-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Wind className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500">溶氧量</span>
                  </div>
                  <p className={`text-2xl font-bold ${envData.oxygen >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                    {envData.oxygen}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Droplets className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-gray-500">废物</span>
                  </div>
                  <p className={`text-2xl font-bold ${envData.waste < 40 ? 'text-green-600' : 'text-red-500'}`}>
                    {envData.waste}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-500">稳定性</span>
                  </div>
                  <p className={`text-2xl font-bold ${envData.stability >= 50 ? 'text-green-600' : 'text-yellow-500'}`}>
                    {envData.stability}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 光照调节 */}
          <Card className="flex-shrink-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-yellow-500" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">光照时间</span>
                    <span className="font-bold">{lightHours} 小时/天</span>
                  </div>
                  <Slider
                    value={[lightHours]}
                    onValueChange={(v) => setLightHours(v[0])}
                    min={4}
                    max={14}
                    step={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右列：元素选择 + AI对话 */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* 元素选择 */}
          <Card className="flex-shrink-0">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">添加生物和材料</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 动物 */}
                {WATER_ELEMENTS.animals.map(element => (
                  <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{element.emoji}</span>
                      <div>
                        <p className="text-xs font-medium">{element.name}</p>
                        <p className="text-[10px] text-gray-400">{element.hint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, -1, element.emoji)} disabled={!elements[element.id]}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, 1, element.emoji)} disabled={(elements[element.id] || 0) >= element.max}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* 植物 */}
                {WATER_ELEMENTS.plants.map(element => (
                  <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{element.emoji}</span>
                      <div>
                        <p className="text-xs font-medium">{element.name}</p>
                        <p className="text-[10px] text-gray-400">{element.hint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, -1, element.emoji)} disabled={!elements[element.id]}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, 1, element.emoji)} disabled={(elements[element.id] || 0) >= element.max}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* 材料 */}
                {WATER_ELEMENTS.materials.map(element => (
                  <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{element.emoji}</span>
                      <div>
                        <p className="text-xs font-medium">{element.name}</p>
                        <p className="text-[10px] text-gray-400">{element.hint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, -1, element.emoji)} disabled={!elements[element.id]}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, 1, element.emoji)} disabled={(elements[element.id] || 0) >= element.max}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI对话 */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="py-2 px-3 border-b flex-shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI助手 🌱
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea ref={scrollRef} className="flex-1 p-3 h-0">
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded-lg p-2 text-xs ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-2 border-t flex-shrink-0">
                <div className="flex gap-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="提问..."
                    disabled={isLoading}
                    className="flex-1 h-8 text-xs"
                  />
                  <VoiceInput onTranscript={(text) => setInput(prev => prev + text)} disabled={isLoading} />
                  <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon" className="h-8 w-8 bg-blue-500">
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
