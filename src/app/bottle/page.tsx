'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { VoiceInput } from '@/components/ui/voice-input';
import { Slider } from '@/components/ui/slider';
import { 
  Loader2, Send, FlaskConical, Droplets, Wind, ThermometerSun,
  Fish, Leaf, Mountain, ArrowLeft, Sparkles, Sun, Plus, Minus,
  Circle, Square, Hexagon
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 瓶子形状配置
const BOTTLE_SHAPES = [
  { id: 'round', name: '圆瓶', icon: Circle, description: '经典圆形，适合观察' },
  { id: 'square', name: '方瓶', icon: Square, description: '方形设计，空间大' },
  { id: 'hexagon', name: '六角瓶', icon: Hexagon, description: '六角形，更美观' },
];

// 水生生态瓶元素
const WATER_ELEMENTS = {
  animals: [
    { id: 'zebra-fish', name: '斑马鱼', icon: '🐟', max: 5, hint: '活泼好动，需氧量大' },
    { id: 'apple-snail', name: '苹果螺', icon: '🐌', max: 3, hint: '吃藻类，清洁水质' },
  ],
  plants: [
    { id: 'waterweed', name: '蜈蚣草', icon: '🌿', max: 10, hint: '产生氧气，净化水质' },
    { id: 'duckweed', name: '浮萍', icon: '🍃', max: 20, hint: '浮在水面，遮阳降温' },
  ],
  materials: [
    { id: 'water', name: '水', icon: '💧', max: 1, hint: '生命之源' },
    { id: 'sand', name: '底砂', icon: '⬜', max: 1, hint: '固定植物根系' },
    { id: 'stone', name: '石头', icon: '🪨', max: 5, hint: '装饰和躲避场所' },
  ],
};

// 陆生生态瓶元素
const LAND_ELEMENTS = {
  animals: [
    { id: 'earthworm', name: '蚯蚓', icon: '🪱', max: 5, hint: '松土，分解有机物' },
    { id: 'ant', name: '蚂蚁', icon: '🐜', max: 10, hint: '清理食物残渣' },
    { id: 'pillbug', name: '鼠妇', icon: '🪲', max: 5, hint: '吃腐烂植物' },
  ],
  plants: [
    { id: 'moss', name: '苔藓', icon: '🌱', max: 10, hint: '保持湿度，产生氧气' },
    { id: 'small-fern', name: '小蕨类', icon: '🌿', max: 3, hint: '装饰，增加绿意' },
  ],
  materials: [
    { id: 'soil', name: '土壤', icon: '🟤', max: 1, hint: '植物生长基础' },
    { id: 'gravel', name: '石子', icon: '⚪', max: 10, hint: '装饰和排水' },
    { id: 'dead-wood', name: '枯木', icon: '🪵', max: 3, hint: '昆虫栖息地' },
  ],
};

// 计算环境指标
function calculateEnvironment(elements: Record<string, number>, bottleType: 'water' | 'land') {
  let oxygen = 50;
  let waste = 30;
  let stability = 50;

  if (bottleType === 'water') {
    // 水生生态瓶计算
    oxygen += (elements['waterweed'] || 0) * 5;
    oxygen += (elements['duckweed'] || 0) * 2;
    oxygen -= (elements['zebra-fish'] || 0) * 3;
    oxygen -= (elements['apple-snail'] || 0) * 1;
    
    waste += (elements['zebra-fish'] || 0) * 5;
    waste += (elements['apple-snail'] || 0) * 2;
    waste -= (elements['waterweed'] || 0) * 2;
    waste -= (elements['apple-snail'] || 0) * 3;
  } else {
    // 陆生生态瓶计算
    oxygen += (elements['moss'] || 0) * 4;
    oxygen += (elements['small-fern'] || 0) * 5;
    oxygen -= (elements['earthworm'] || 0) * 0.5;
    oxygen -= (elements['ant'] || 0) * 0.2;
    oxygen -= (elements['pillbug'] || 0) * 0.5;
    
    waste += (elements['ant'] || 0) * 1;
    waste -= (elements['earthworm'] || 0) * 5;
    waste -= (elements['pillbug'] || 0) * 3;
  }

  // 计算稳定性
  const idealOxygen = bottleType === 'water' ? 70 : 65;
  stability = 100 - Math.abs(oxygen - idealOxygen) - Math.abs(waste - 30);
  
  return {
    oxygen: Math.max(0, Math.min(100, oxygen)),
    waste: Math.max(0, Math.min(100, waste)),
    stability: Math.max(0, Math.min(100, stability)),
  };
}

export default function BottlePage() {
  const [bottleType, setBottleType] = useState<'water' | 'land' | null>(null);
  const [bottleShape, setBottleShape] = useState<string | null>(null);
  const [elements, setElements] = useState<Record<string, number>>({});
  const [lightHours, setLightHours] = useState(8);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const envData = calculateEnvironment(elements, bottleType || 'water');
  const currentElements = bottleType === 'water' ? WATER_ELEMENTS : LAND_ELEMENTS;

  useEffect(() => {
    if (bottleType && messages.length === 0) {
      const initialMessage = bottleType === 'water'
        ? `你好！我是生态瓶设计助手 🧪

让我们来设计一个水生生态瓶吧！

第一步：选择瓶子的形状 🍶
不同形状的瓶子有什么优缺点呢？你可以点击看看！

然后我们再往瓶子里添加生物和材料。`
        : `你好！我是生态瓶设计助手 🧪

让我们来设计一个陆生生态瓶吧！

第一步：选择瓶子的形状 🍶
不同形状的瓶子有什么优缺点呢？你可以点击看看！

然后我们再往瓶子里添加生物和材料。`;
      
      setMessages([{ role: 'assistant', content: initialMessage }]);
    }
  }, [bottleType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
          bottleType,
          selectedElements: elements,
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

  const handleElementChange = (elementId: string, delta: number) => {
    setElements(prev => {
      const current = prev[elementId] || 0;
      const newValue = Math.max(0, current + delta);
      return { ...prev, [elementId]: newValue };
    });
  };

  // 选择类型界面
  if (!bottleType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <FlaskConical className="w-8 h-8 text-blue-600" />
              设计生态瓶
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600 dark:text-gray-300 text-lg">
              你想制作哪种类型的生态瓶？
            </p>
            <div className="grid grid-cols-2 gap-6">
              <Button
                onClick={() => setBottleType('water')}
                className="h-40 flex flex-col gap-3 bg-gradient-to-br from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white"
              >
                <Droplets className="w-14 h-14" />
                <span className="text-xl font-bold">水生生态瓶</span>
                <span className="text-sm opacity-90">鱼、水草、螺...</span>
              </Button>
              <Button
                onClick={() => setBottleType('land')}
                className="h-40 flex flex-col gap-3 bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white"
              >
                <Leaf className="w-14 h-14" />
                <span className="text-xl font-bold">陆生生态瓶</span>
                <span className="text-sm opacity-90">苔藓、蚯蚓、蚂蚁...</span>
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
    <div className="h-screen overflow-hidden bg-gradient-to-b from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white/50 dark:bg-gray-900/50 flex-shrink-0">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => bottleShape ? setBottleShape(null) : setBottleType(null)}>
          <ArrowLeft className="w-4 h-4" />
          {bottleShape ? '重选瓶子' : '返回'}
        </Button>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-blue-700">
            设计{bottleType === 'water' ? '水生' : '陆生'}生态瓶
          </span>
        </div>
        <div className="w-16" />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex gap-3 p-3 min-h-0">
        {/* 左列：生态瓶展示 + 指标 */}
        <div className="w-1/3 flex flex-col gap-3 min-h-0">
          {/* 生态瓶展示 */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="py-2 px-3 flex-shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-500" />
                生态瓶 🏺
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-3 min-h-0">
              {!bottleShape ? (
                <div className="space-y-4 w-full">
                  <p className="text-sm text-gray-600 text-center">选择瓶子形状：</p>
                  <div className="grid grid-cols-3 gap-2">
                    {BOTTLE_SHAPES.map(shape => {
                      const IconComp = shape.icon;
                      return (
                        <button
                          key={shape.id}
                          onClick={() => setBottleShape(shape.id)}
                          className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center gap-2"
                        >
                          <IconComp className="w-10 h-10 text-blue-500" />
                          <span className="text-xs font-medium">{shape.name}</span>
                          <span className="text-[10px] text-gray-400">{shape.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  {/* 瓶子图片区域 */}
                  <div className="flex-1 relative rounded-lg bg-gradient-to-b from-blue-100/50 to-green-100/50 dark:from-blue-900/30 dark:to-green-900/30 border-2 border-dashed border-blue-300 flex items-center justify-center min-h-0">
                    <div className="text-center">
                      <FlaskConical className="w-16 h-16 mx-auto text-blue-400 mb-2" />
                      <p className="text-xs text-gray-500">你的{BOTTLE_SHAPES.find(s => s.id === bottleShape)?.name}</p>
                      
                      {/* 已添加的元素 */}
                      <div className="mt-3 flex flex-wrap justify-center gap-1">
                        {Object.entries(elements).map(([id, count]) => {
                          if (count === 0) return null;
                          const allElements = [...currentElements.animals, ...currentElements.plants, ...currentElements.materials];
                          const element = allElements.find(e => e.id === id);
                          if (!element) return null;
                          return (
                            <span key={id} className="text-lg" title={`${element.name} x${count}`}>
                              {element.icon}
                              {count > 1 && <sup className="text-[10px]">{count}</sup>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* 光照调节 */}
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>☀️ 光照时间</span>
                      <span className="font-bold">{lightHours}小时/天</span>
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
              )}
            </CardContent>
          </Card>

          {/* 环境指标 */}
          {bottleShape && (
            <Card className="flex-shrink-0">
              <CardContent className="p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Wind className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-bold text-blue-600">{envData.oxygen}%</p>
                    <p className="text-[10px] text-gray-500">溶氧量</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <ThermometerSun className="w-4 h-4 mx-auto text-red-500 mb-1" />
                    <p className="text-lg font-bold text-red-600">{envData.waste}%</p>
                    <p className="text-[10px] text-gray-500">废物浓度</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Sparkles className="w-4 h-4 mx-auto text-green-500 mb-1" />
                    <p className="text-lg font-bold text-green-600">{envData.stability}%</p>
                    <p className="text-[10px] text-gray-500">稳定性</p>
                  </div>
                </div>
                <p className="text-[10px] text-center text-gray-500">
                  💡 健康标准：溶氧量60-80%，废物浓度&lt;40%
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 中列：元素选择 */}
        <Card className="w-1/3 flex flex-col min-h-0">
          <CardHeader className="py-2 px-3 border-b flex-shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-500" />
              添加生物和材料
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 min-h-0">
            {!bottleShape ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                请先选择瓶子形状
              </div>
            ) : (
              <div className="space-y-4">
                {/* 动物 */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">🐾 生物</h4>
                  <div className="space-y-2">
                    {currentElements.animals.map(element => (
                      <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{element.icon}</span>
                          <div>
                            <p className="text-xs font-medium">{element.name}</p>
                            <p className="text-[10px] text-gray-400">{element.hint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleElementChange(element.id, -1)} disabled={!elements[element.id]}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleElementChange(element.id, 1)} disabled={(elements[element.id] || 0) >= element.max}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 植物 */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">🌱 植物</h4>
                  <div className="space-y-2">
                    {currentElements.plants.map(element => (
                      <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{element.icon}</span>
                          <div>
                            <p className="text-xs font-medium">{element.name}</p>
                            <p className="text-[10px] text-gray-400">{element.hint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleElementChange(element.id, -1)} disabled={!elements[element.id]}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleElementChange(element.id, 1)} disabled={(elements[element.id] || 0) >= element.max}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 非生物 */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">🪨 非生物</h4>
                  <div className="space-y-2">
                    {currentElements.materials.map(element => (
                      <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{element.icon}</span>
                          <div>
                            <p className="text-xs font-medium">{element.name}</p>
                            <p className="text-[10px] text-gray-400">{element.hint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleElementChange(element.id, -1)} disabled={!elements[element.id]}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleElementChange(element.id, 1)} disabled={(elements[element.id] || 0) >= element.max}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右列：AI对话 */}
        <Card className="w-1/3 flex flex-col min-h-0">
          <CardHeader className="py-2 px-3 border-b flex-shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              AI助手 🤖
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
  );
}
