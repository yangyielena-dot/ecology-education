'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  size: 'normal' | 'small';
}

interface ElementType {
  id: string;
  name: string;
  emoji: string;
  max: number;
  hint: string;
  size?: 'normal' | 'small';
  noDisplay?: boolean;
}

interface ElementsConfig {
  animals: ElementType[];
  plants: ElementType[];
  materials: ElementType[];
}

// 水生生态瓶元素
const WATER_ELEMENTS: ElementsConfig = {
  animals: [
    { id: 'zebra-fish', name: '斑马鱼', emoji: '🐟', max: 5, hint: '活泼好动，需要氧气', size: 'normal' },
    { id: 'apple-snail', name: '苹果螺', emoji: '🐌', max: 5, hint: '吃藻类，清洁水质', size: 'small' },
  ],
  plants: [
    { id: 'waterweed', name: '蜈蚣草', emoji: '🌿', max: 10, hint: '产生氧气', size: 'normal' },
    { id: 'duckweed', name: '浮萍', emoji: '🍀', max: 15, hint: '遮阳降温', size: 'normal' },
  ],
  materials: [
    { id: 'sand', name: '底砂', emoji: '⬜', max: 1, hint: '铺满底部', size: 'normal', noDisplay: true },
    { id: 'stone', name: '石头', emoji: '🪨', max: 5, hint: '装饰躲避', size: 'normal' },
  ],
};

// 陆生生态瓶元素
const LAND_ELEMENTS: ElementsConfig = {
  animals: [
    { id: 'earthworm', name: '蚯蚓', emoji: '🪱', max: 5, hint: '松土高手', size: 'small' },
    { id: 'ant', name: '蚂蚁', emoji: '🐜', max: 10, hint: '清理残渣', size: 'small' },
    { id: 'pillbug', name: '鼠妇', emoji: '🪲', max: 5, hint: '分解枯叶', size: 'small' },
    { id: 'beetle', name: '小甲虫', emoji: '🪲', max: 5, hint: '捕食害虫', size: 'small' },
  ],
  plants: [
    { id: 'moss', name: '苔藓', emoji: '🌱', max: 10, hint: '保持湿度', size: 'normal' },
  ],
  materials: [
    { id: 'soil', name: '土壤', emoji: '⬜', max: 1, hint: '铺满底部', size: 'normal', noDisplay: true },
    { id: 'pebble', name: '石子', emoji: '🪨', max: 10, hint: '排水装饰', size: 'small' },
    { id: 'deadwood', name: '枯木', emoji: '🪵', max: 3, hint: '昆虫栖息', size: 'normal' },
  ],
};

// 计算环境指标 - 水生
function calculateWaterEnvironment(elements: Record<string, number>) {
  const fishCount = elements['zebra-fish'] || 0;
  const snailCount = elements['apple-snail'] || 0;
  const waterweedCount = elements['waterweed'] || 0;
  const duckweedCount = elements['duckweed'] || 0;
  
  let oxygen = 50;
  oxygen += waterweedCount * 4;
  oxygen += duckweedCount * 1;
  oxygen -= fishCount * 6;
  oxygen -= snailCount * 1;
  
  let waste = 20;
  waste += fishCount * 8;
  waste += snailCount * 2;
  waste -= snailCount * 3;
  waste -= waterweedCount * 2;
  
  const idealOxygen = 60;
  const stability = Math.max(0, 100 - Math.abs(oxygen - idealOxygen) - Math.abs(waste - 30));
  
  return {
    oxygen: Math.max(0, Math.min(100, Math.round(oxygen))),
    waste: Math.max(0, Math.min(100, Math.round(waste))),
    stability: Math.max(0, Math.min(100, Math.round(stability))),
  };
}

// 计算环境指标 - 陆生
function calculateLandEnvironment(elements: Record<string, number>) {
  const earthwormCount = elements['earthworm'] || 0;
  const antCount = elements['ant'] || 0;
  const pillbugCount = elements['pillbug'] || 0;
  const beetleCount = elements['beetle'] || 0;
  const mossCount = elements['moss'] || 0;
  
  let humidity = 50;
  humidity += mossCount * 3;
  humidity -= antCount * 1;
  
  let organic = 30;
  organic += earthwormCount * 5;
  organic += pillbugCount * 3;
  organic -= mossCount * 2;
  
  const totalAnimals = earthwormCount + antCount + pillbugCount + beetleCount;
  const stability = Math.max(0, 100 - Math.abs(humidity - 60) - Math.abs(organic - 40) - Math.max(0, totalAnimals - 10) * 3);
  
  return {
    oxygen: Math.max(0, Math.min(100, Math.round(humidity))),
    waste: Math.max(0, Math.min(100, Math.round(organic))),
    stability: Math.max(0, Math.min(100, Math.round(stability))),
  };
}

// 生成反馈消息 - 水生
function generateWaterFeedback(
  prevCount: number,
  currCount: number,
  elementName: string,
  emoji: string,
  envData: ReturnType<typeof calculateWaterEnvironment>
): string | null {
  if (currCount <= prevCount) return null;
  
  switch (elementName) {
    case 'zebra-fish':
      if (envData.oxygen < 40) {
        return `小鱼来了！🐟 看看左边的溶氧量指标——它的颜色是什么？这个数值说明了什么？`;
      }
      return "小鱼来了！🐟 观察一下溶氧量的变化，你发现了什么？";
    case 'apple-snail':
      return "苹果螺入住啦！🐌 看看废物浓度的变化，你发现了什么？";
    case 'waterweed':
      return "水草来了！🌿 观察一下溶氧量有什么变化？";
    case 'duckweed':
      return "浮萍漂浮在水面！🍀 它们会影响生态瓶里的什么呢？观察一下各项数据？";
    case 'sand':
      return "底砂铺好了！观察一下你的生态瓶，还有什么可以添加的吗？";
    case 'stone':
      return "石头放好了！🪨 它们在生态瓶里会起到什么作用呢？";
    default:
      return null;
  }
}

// 生成反馈消息 - 陆生
function generateLandFeedback(
  prevCount: number,
  currCount: number,
  elementName: string,
  emoji: string,
  envData: ReturnType<typeof calculateLandEnvironment>
): string | null {
  if (currCount <= prevCount) return null;
  
  switch (elementName) {
    case 'earthworm':
      return "蚯蚓入住啦！🪱 它们会帮忙松土。观察一下有机物的变化？";
    case 'ant':
      return "蚂蚁来了！🐜 它们很勤劳。看看各项指标的变化？";
    case 'pillbug':
      return "鼠妇入住啦！🪲 它们喜欢潮湿的环境。观察一下湿度指标？";
    case 'beetle':
      return "小甲虫来了！🪲 它们是小小捕食者。看看数据有什么变化？";
    case 'moss':
      return "苔藓来了！🌱 观察一下湿度指标的变化，你发现了什么？";
    case 'soil':
      return "土壤铺好了！这是小生物们的家。还要添加什么吗？";
    case 'pebble':
      return "石子放好了！🪨 它们可以帮助排水，观察一下各项数据？";
    case 'deadwood':
      return "枯木放好了！🪵 小昆虫们可以在上面休息。看看数据有什么变化？";
    default:
      return null;
  }
}

export default function BottlePage() {
  const [bottleType, setBottleType] = useState<'water' | 'land' | null>(null);
  const [elements, setElements] = useState<Record<string, number>>({});
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [lightHours, setLightHours] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bottleRef = useRef<HTMLDivElement>(null);

  const currentElements = bottleType === 'water' ? WATER_ELEMENTS : LAND_ELEMENTS;
  const envData = bottleType === 'water' 
    ? calculateWaterEnvironment(elements) 
    : calculateLandEnvironment(elements);

  // 初始化消息
  useEffect(() => {
    if (bottleType) {
      const typeName = bottleType === 'water' ? '水生' : '陆生';
      const initialMessage = `你好！我是生态瓶设计助手苗苗 🌱

这是一个空的${typeName}生态瓶，让我们一起来设计它吧！

你可以从右边选择生物和材料添加到生态瓶中。试试看！`;
      setMessages([{ role: 'assistant', content: initialMessage }]);
      setElements({});
      setPlacedItems([]);
      setLightHours(0);
    }
  }, [bottleType]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          bottleType: bottleType,
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

  const handleElementChange = (elementId: string, delta: number, emoji: string, size: 'normal' | 'small' = 'normal', noDisplay: boolean = false) => {
    const prevCount = elements[elementId] || 0;
    
    setElements(prev => {
      const current = prev[elementId] || 0;
      const newValue = Math.max(0, current + delta);
      return { ...prev, [elementId]: newValue };
    });
    
    // 添加时在生态瓶中放置并生成反馈
    if (delta > 0) {
      const newCount = prevCount + 1;
      
      // 生成反馈
      const feedback = bottleType === 'water'
        ? generateWaterFeedback(prevCount, newCount, elementId, emoji, envData)
        : generateLandFeedback(prevCount, newCount, elementId, emoji, envData);
      
      if (feedback) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: feedback }]);
        }, 300);
      }
      
      // 添加到生态瓶显示
      if (!noDisplay) {
        const bottle = bottleRef.current;
        if (bottle) {
          const rect = bottle.getBoundingClientRect();
          const newItem: PlacedItem = {
            id: `${elementId}-${Date.now()}`,
            elementId,
            emoji,
            x: Math.random() * (rect.width - 50) + 25,
            y: Math.random() * (rect.height - 100) + 70,
            size,
          };
          setPlacedItems(prev => [...prev, newItem]);
        }
      }
    } else {
      // 移除
      setPlacedItems(prev => {
        const idx = prev.map(item => item.elementId).lastIndexOf(elementId);
        if (idx !== -1) {
          return prev.filter((_, i) => i !== idx);
        }
        return prev;
      });
    }
  };

  // 选择类型界面
  if (!bottleType) {
    return (
      <div className="h-screen bg-gradient-to-b from-cyan-50 to-blue-100 dark:from-cyan-950 dark:to-blue-900 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white/50 dark:bg-gray-900/50 flex-shrink-0">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-700">设计生态瓶</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-center mb-2 text-blue-700">选择生态瓶类型</h2>
            <p className="text-center text-gray-600 mb-8">你想设计哪种生态瓶呢？</p>
            
            <div className="grid grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-400"
                onClick={() => setBottleType('water')}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-4">🐟</div>
                  <h3 className="text-xl font-bold text-blue-700 mb-2">水生生态瓶</h3>
                  <p className="text-sm text-gray-600">
                    小鱼、水草、螺...<br />
                    打造水下小世界
                  </p>
                  <div className="mt-4 flex justify-center gap-2 text-2xl">
                    🐟 🐌 🌿 🍀 🪨
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-400"
                onClick={() => setBottleType('land')}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-4">🌱</div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">陆生生态瓶</h3>
                  <p className="text-sm text-gray-600">
                    蚂蚁、蚯蚓、苔藓...<br />
                    创造陆地小生态
                  </p>
                  <div className="mt-4 flex justify-center gap-2 text-2xl">
                    🐜 🪱 🪲 🌱 🪵
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 主设计界面
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-cyan-50 to-blue-100 dark:from-cyan-950 dark:to-blue-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white/50 dark:bg-gray-900/50 flex-shrink-0">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setBottleType(null)}>
          <ArrowLeft className="w-4 h-4" />
          重选
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
        {/* 左列：生态瓶展示 */}
        <div className="w-[45%] flex flex-col gap-2 min-h-0">
          {/* 生态瓶 */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 p-2 min-h-0">
              <div 
                ref={bottleRef}
                className={`relative w-full h-full rounded-xl overflow-hidden border-4 ${
                  bottleType === 'water' ? 'border-cyan-200 dark:border-cyan-700' : 'border-green-200 dark:border-green-700'
                }`}
                style={{
                  background: bottleType === 'water'
                    ? 'linear-gradient(to bottom, #e0f7fa 0%, #b2ebf2 30%, #80deea 100%)'
                    : 'linear-gradient(to bottom, #dcedc8 0%, #c5e1a5 50%, #8bc34a 100%)',
                }}
                onMouseMove={(e) => {
                  if (!draggingItem || !bottleRef.current) return;
                  const rect = bottleRef.current.getBoundingClientRect();
                  const x = Math.max(20, Math.min(rect.width - 20, e.clientX - rect.left));
                  const y = Math.max(70, Math.min(rect.height - 20, e.clientY - rect.top));
                  setPlacedItems(prev => prev.map(item => 
                    item.id === draggingItem ? { ...item, x, y } : item
                  ));
                }}
                onMouseUp={() => setDraggingItem(null)}
                onMouseLeave={() => setDraggingItem(null)}
              >
                {/* 水生 - 水层 */}
                {bottleType === 'water' && (
                  <div 
                    className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-blue-300/60 to-cyan-200/40"
                    style={{ height: '70%' }}
                  />
                )}
                
                {/* 底砂/土壤 */}
                {(bottleType === 'water' && elements.sand > 0) && (
                  <div 
                    className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-amber-300 to-amber-200"
                    style={{ height: '15%' }}
                  />
                )}
                {(bottleType === 'land' && elements.soil > 0) && (
                  <div 
                    className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-amber-700 to-amber-600"
                    style={{ height: '30%' }}
                  />
                )}
                
                {/* 放置的生物 */}
                {placedItems.map(item => (
                  <div
                    key={item.id}
                    className={`absolute cursor-move select-none transition-transform hover:scale-110 ${item.size === 'small' ? 'text-xl' : 'text-3xl'}`}
                    style={{ left: item.x - (item.size === 'small' ? 10 : 15), top: item.y - (item.size === 'small' ? 10 : 15) }}
                    onMouseDown={() => setDraggingItem(item.id)}
                    onTouchStart={() => setDraggingItem(item.id)}
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
            <CardContent className="p-2">
              <div className="grid grid-cols-3 gap-2">
                {bottleType === 'water' ? (
                  <>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Wind className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-gray-500">溶氧量</span>
                      </div>
                      <p className={`text-xl font-bold ${envData.oxygen >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                        {envData.oxygen}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Droplets className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-gray-500">废物</span>
                      </div>
                      <p className={`text-xl font-bold ${envData.waste < 40 ? 'text-green-600' : 'text-red-500'}`}>
                        {envData.waste}%
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-gray-500">湿度</span>
                      </div>
                      <p className={`text-xl font-bold ${envData.oxygen >= 50 ? 'text-green-600' : 'text-yellow-500'}`}>
                        {envData.oxygen}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-xs text-gray-500">🍂</span>
                        <span className="text-xs text-gray-500">有机物</span>
                      </div>
                      <p className={`text-xl font-bold ${envData.waste < 50 ? 'text-green-600' : 'text-yellow-500'}`}>
                        {envData.waste}%
                      </p>
                    </div>
                  </>
                )}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-500">稳定性</span>
                  </div>
                  <p className={`text-xl font-bold ${envData.stability >= 50 ? 'text-green-600' : 'text-yellow-500'}`}>
                    {envData.stability}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 光照调节 */}
          <Card className="flex-shrink-0">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-yellow-500" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">光照</span>
                    <span className="font-bold">{lightHours}h</span>
                  </div>
                  <Slider
                    value={[lightHours]}
                    onValueChange={(v) => setLightHours(v[0])}
                    min={0}
                    max={14}
                    step={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右列：元素选择 + AI对话 */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* 元素选择 - 缩小高度 */}
          <Card className="flex-shrink-0 max-h-[180px] overflow-hidden">
            <CardHeader className="py-1 px-3">
              <CardTitle className="text-sm">添加生物和材料</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="grid grid-cols-3 gap-1.5">
                {[...currentElements.animals, ...currentElements.plants, ...currentElements.materials].map(element => (
                  <div key={element.id} className="flex items-center justify-between p-1.5 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-1">
                      <span className={`text-lg ${element.size === 'small' ? 'scale-75' : ''}`}>{element.emoji}</span>
                      <span className="text-[10px] font-medium">{element.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button size="icon" variant="outline" className="h-5 w-5" onClick={() => handleElementChange(element.id, -1, element.emoji, element.size, element.noDisplay)} disabled={!elements[element.id]}>
                        <Minus className="w-2 h-2" />
                      </Button>
                      <span className="w-4 text-center text-xs font-bold">{elements[element.id] || 0}</span>
                      <Button size="icon" variant="outline" className="h-5 w-5" onClick={() => handleElementChange(element.id, 1, element.emoji, element.size, element.noDisplay)} disabled={(elements[element.id] || 0) >= element.max}>
                        <Plus className="w-2 h-2" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI对话 - 增大高度 */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="py-2 px-3 border-b flex-shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI助手 🌱
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
              {/* 消息列表 - 可滚动 */}
              <div className="flex-1 overflow-y-auto p-3">
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
                  {/* 滚动锚点 */}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              {/* 输入框 */}
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
