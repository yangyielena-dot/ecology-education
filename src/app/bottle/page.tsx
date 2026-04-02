'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceInput } from '@/components/ui/voice-input';
import { Slider } from '@/components/ui/slider';
import { 
  Loader2, Send, FlaskConical, Droplets, Wind,
  ArrowLeft, Sparkles, Sun, Plus, Minus, CheckCircle, Camera
} from 'lucide-react';
import { useLearningRecord } from '@/hooks/useLearningRecord';
import html2canvas from 'html2canvas';

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
  size: 'normal' | 'small' | 'large';
}

interface ElementType {
  id: string;
  name: string;
  emoji: string;
  max: number;
  hint: string;
  size?: 'normal' | 'small' | 'large';
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
    { id: 'pebble', name: '石子', emoji: '🪨', max: 10, hint: '排水装饰', size: 'large' },
    { id: 'deadwood', name: '枯木', emoji: '🪵', max: 3, hint: '昆虫栖息', size: 'large' },
  ],
};

// 计算环境指标 - 水生（加入光照影响）
function calculateWaterEnvironment(elements: Record<string, number>, lightHours: number) {
  const fishCount = elements['zebra-fish'] || 0;
  const snailCount = elements['apple-snail'] || 0;
  const waterweedCount = elements['waterweed'] || 0;
  const duckweedCount = elements['duckweed'] || 0;
  
  // 溶氧量计算 - 光照影响植物产氧
  let oxygen = 50;
  const lightBonus = Math.min(lightHours, 10) * 2; // 光照越多，植物产氧越多
  oxygen += waterweedCount * (4 + lightBonus / 10);
  oxygen += duckweedCount * (1 + lightBonus / 20);
  oxygen -= fishCount * 6;
  oxygen -= snailCount * 1;
  
  // 废物浓度
  let waste = 20;
  waste += fishCount * 8;
  waste += snailCount * 2;
  waste -= snailCount * 3;
  waste -= waterweedCount * 2;
  
  // 改进的稳定性计算
  // 溶氧量：只需要不低于40即可，高于60不扣分（氧气充足是好事）
  const oxygenPenalty = oxygen < 40 ? (40 - oxygen) * 1.5 : 0;
  // 废物：越低越好，高于30开始扣分
  const wastePenalty = waste > 30 ? (waste - 30) * 1.2 : 0;
  // 生物数量限制：动物不能太多
  const totalAnimals = fishCount + snailCount;
  const animalPenalty = totalAnimals > 8 ? (totalAnimals - 8) * 5 : 0;
  
  const stability = Math.max(0, Math.min(100, Math.round(100 - oxygenPenalty - wastePenalty - animalPenalty)));
  
  return {
    oxygen: Math.max(0, Math.min(100, Math.round(oxygen))),
    waste: Math.max(0, Math.min(100, Math.round(waste))),
    stability,
  };
}

// 计算环境指标 - 陆生（加入光照影响）
function calculateLandEnvironment(elements: Record<string, number>, lightHours: number) {
  const earthwormCount = elements['earthworm'] || 0;
  const antCount = elements['ant'] || 0;
  const pillbugCount = elements['pillbug'] || 0;
  const beetleCount = elements['beetle'] || 0;
  const mossCount = elements['moss'] || 0;
  
  // 湿度 - 光照会降低湿度
  let humidity = 50;
  humidity += mossCount * 3;
  humidity -= antCount * 1;
  humidity -= Math.max(0, lightHours - 8) * 2; // 光照过长会降低湿度
  
  // 有机物
  let organic = 30;
  organic += earthwormCount * 5;
  organic += pillbugCount * 3;
  organic -= mossCount * 2;
  
  // 改进的稳定性计算
  // 湿度：40-80之间最好，太低或太高都会扣分
  const humidityPenalty = humidity < 40 ? (40 - humidity) * 1.2 : (humidity > 80 ? (humidity - 80) * 1 : 0);
  // 有机物：20-60之间最好
  const organicPenalty = organic < 20 ? (20 - organic) * 0.8 : (organic > 60 ? (organic - 60) * 1.2 : 0);
  // 生物数量限制
  const totalAnimals = earthwormCount + antCount + pillbugCount + beetleCount;
  const animalPenalty = totalAnimals > 15 ? (totalAnimals - 15) * 3 : 0;
  
  const stability = Math.max(0, Math.min(100, Math.round(100 - humidityPenalty - organicPenalty - animalPenalty)));
  
  return {
    oxygen: Math.max(0, Math.min(100, Math.round(humidity))),
    waste: Math.max(0, Math.min(100, Math.round(organic))),
    stability,
  };
}

// 生成AI反馈消息 - 水生
function generateWaterFeedback(
  elementId: string,
  delta: number,
  elements: Record<string, number>,
  envData: { oxygen: number; waste: number; stability: number }
): string | null {
  if (delta <= 0) return null; // 只在添加时反馈
  
  const feedbacks: Record<string, () => string> = {
    'zebra-fish': () => {
      const count = elements['zebra-fish'] || 0;
      if (envData.oxygen < 40) {
        return `小鱼来了！🐟 看看左边的溶氧量指标——它的颜色是什么？这个数值说明了什么？`;
      }
      if (count >= 3) {
        return `鱼儿越来越多了！🐟🐟🐟 仔细看看溶氧量和废物浓度，你发现了什么规律？`;
      }
      return "小鱼来了！🐟 观察一下溶氧量的变化，小鱼需要什么才能呼吸呢？";
    },
    'apple-snail': () => "苹果螺入住啦！🐌 看看废物浓度的变化，你发现了什么？",
    'waterweed': () => {
      if (envData.oxygen < 50) {
        return "水草来了！🌿 观察一下溶氧量有什么变化？这个数值对你想要养的小动物重要吗？🤔";
      }
      return "水草添加好了！🌿 看看溶氧量指标，它和之前有什么不同？";
    },
    'duckweed': () => "浮萍漂浮在水面！🍀 它们会影响生态瓶里的什么呢？观察一下各项数据？",
    'sand': () => "底砂铺好了！观察一下你的生态瓶，还有什么可以添加的吗？",
    'stone': () => "石头放好了！🪨 它们在生态瓶里会起到什么作用呢？",
  };
  
  return feedbacks[elementId]?.() || null;
}

// 生成AI反馈消息 - 陆生
function generateLandFeedback(
  elementId: string,
  delta: number,
  elements: Record<string, number>,
  envData: { oxygen: number; waste: number; stability: number }
): string | null {
  if (delta <= 0) return null;
  
  const feedbacks: Record<string, () => string> = {
    'earthworm': () => "蚯蚓入住啦！🪱 它们会帮忙松土。观察一下有机物的变化？",
    'ant': () => "蚂蚁来了！🐜 它们很勤劳。看看各项指标的变化？",
    'pillbug': () => "鼠妇入住啦！🪲 它们喜欢潮湿的环境。观察一下湿度指标？",
    'beetle': () => "小甲虫来了！🪲 它们是小小捕食者。看看数据有什么变化？",
    'moss': () => "苔藓来了！🌱 观察一下湿度指标的变化，你发现了什么？",
    'soil': () => "土壤铺好了！这是小生物们的家。还要添加什么吗？",
    'pebble': () => "石子放好了！🪨 小昆虫们可以躲在下面休息。观察一下数据？",
    'deadwood': () => "枯木放好了！🪵 它是小昆虫们的遮蔽所。看看数据有什么变化？",
  };
  
  return feedbacks[elementId]?.() || null;
}

export default function BottlePage() {
  const router = useRouter();
  const [bottleType, setBottleType] = useState<'water' | 'land' | null>(null);
  const [elements, setElements] = useState<Record<string, number>>({});
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [lightHours, setLightHours] = useState(8);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const bottleRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<HTMLDivElement>(null);

  // 学习记录
  const { startSession, saveMessage, endSession, resumeSession, sessionId } = useLearningRecord({
    moduleType: 'bottle',
    moduleDetail: bottleType || undefined,
  });

  const currentElements = bottleType === 'water' ? WATER_ELEMENTS : LAND_ELEMENTS;
  const envData = bottleType === 'water' 
    ? calculateWaterEnvironment(elements, lightHours) 
    : calculateLandEnvironment(elements, lightHours);

  // 生成快照
  const handleCaptureSnapshot = async () => {
    if (!snapshotRef.current || !sessionId) return;
    
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(snapshotRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      
      const imageUrl = canvas.toDataURL('image/png');
      
      // 下载图片
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `生态瓶快照_${bottleType === 'water' ? '水生' : '陆生'}_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 上传到存储并保存记录
      const response = await fetch('/api/learning/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          image_url: imageUrl,
          prompt: `生态瓶快照 - ${bottleType === 'water' ? '水生' : '陆生'} - 溶氧量:${envData.oxygen}% 废物:${envData.waste}% 评分:${envData.stability}`,
          image_type: 'snapshot',
        }),
      });
      
      // 添加反馈消息
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '📸 快照已保存！你可以继续调整生态瓶，或点击"完成设计"结束学习。' 
      }]);
    } catch (error) {
      console.error('生成快照失败:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  // 检查并恢复未完成的学习
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [pendingSession, setPendingSession] = useState<any>(null);

  // 初始化时检查是否有未完成的会话
  useEffect(() => {
    if (bottleType) {
      const checkAndResumeSession = async () => {
        const studentId = localStorage.getItem('student_id');
        if (!studentId) {
          // 没有学生ID，创建新会话
          const typeName = bottleType === 'water' ? '水生' : '陆生';
          const initialMessage = `你好！我是生态瓶设计助手苗苗 🌱

这是一个空的${typeName}生态瓶，让我们一起来设计它吧！

你可以从右边选择生物和材料添加到生态瓶中。试试看！`;
          setMessages([{ role: 'assistant', content: initialMessage }]);
          setElements({});
          setPlacedItems([]);
          setLightHours(8);
          setIsCompleted(false);
          startSession();
          return;
        }

        try {
          // 检查是否有未完成的会话
          const response = await fetch(`/api/learning/session?student_id=${studentId}&module_type=bottle&module_detail=${bottleType}&status=active&limit=1`);
          const data = await response.json();
          
          if (data.success && data.sessions && data.sessions.length > 0) {
            // 有未完成的会话，询问用户是否继续
            const session = data.sessions[0];
            const hasMessages = session.conversation_messages && session.conversation_messages.length > 0;
            
            if (hasMessages) {
              setPendingSession(session);
              setShowResumeDialog(true);
              return;
            }
          }
          
          // 没有未完成的会话，创建新会话
          const typeName = bottleType === 'water' ? '水生' : '陆生';
          const initialMessage = `你好！我是生态瓶设计助手苗苗 🌱

这是一个空的${typeName}生态瓶，让我们一起来设计它吧！

你可以从右边选择生物和材料添加到生态瓶中。试试看！`;
          setMessages([{ role: 'assistant', content: initialMessage }]);
          setElements({});
          setPlacedItems([]);
          setLightHours(8);
          setIsCompleted(false);
          startSession();
        } catch (error) {
          console.error('检查会话失败:', error);
          // 出错时创建新会话
          const typeName = bottleType === 'water' ? '水生' : '陆生';
          const initialMessage = `你好！我是生态瓶设计助手苗苗 🌱

这是一个空的${typeName}生态瓶，让我们一起来设计它吧！

你可以从右边选择生物和材料添加到生态瓶中。试试看！`;
          setMessages([{ role: 'assistant', content: initialMessage }]);
          setElements({});
          setPlacedItems([]);
          setLightHours(8);
          setIsCompleted(false);
          startSession();
        }
      };
      
      checkAndResumeSession();
    }
  }, [bottleType, startSession]);

  // 恢复之前的会话
  const handleResumeSession = () => {
    if (!pendingSession) return;
    
    // 恢复会话ID
    resumeSession(pendingSession.id);
    
    // 恢复消息
    if (pendingSession.conversation_messages && pendingSession.conversation_messages.length > 0) {
      const restoredMessages = pendingSession.conversation_messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));
      setMessages(restoredMessages);
    }
    
    // 恢复元素状态（从最后一条消息的metadata中获取，如果没有则从调整记录获取）
    // 这里暂时设置为空，因为元素状态需要从调整记录中恢复
    setElements({});
    setPlacedItems([]);
    setLightHours(8);
    setIsCompleted(false);
    
    setShowResumeDialog(false);
    setPendingSession(null);
  };

  // 开始新的学习
  const handleStartNew = async () => {
    setShowResumeDialog(false);
    setPendingSession(null);
    
    const typeName = bottleType === 'water' ? '水生' : '陆生';
    const initialMessage = `你好！我是生态瓶设计助手苗苗 🌱

这是一个空的${typeName}生态瓶，让我们一起来设计它吧！

你可以从右边选择生物和材料添加到生态瓶中。试试看！`;
    setMessages([{ role: 'assistant', content: initialMessage }]);
    setElements({});
    setPlacedItems([]);
    setLightHours(8);
    setIsCompleted(false);
    startSession();
  };

  // 只在消息数量增加时滚动 ScrollArea 内部到底部
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // 获取 ScrollArea 的 viewport 元素
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
    prevMessagesLengthRef.current = messages.length;
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
          context: 'bottle',
          bottleType: bottleType,
          selectedElements: elements,
          envData: envData,
          lightHours: lightHours,
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
        // 保存AI回复
        saveMessage('assistant', assistantMessage);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，出问题了，请重试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleElementChange = (elementId: string, delta: number, emoji: string, size: 'normal' | 'small' | 'large' = 'normal', noDisplay: boolean = false) => {
    const currentCount = elements[elementId] || 0;
    const newCount = Math.max(0, currentCount + delta);
    
    // 获取元素名称
    const elementInfo = [...currentElements.animals, ...currentElements.plants, ...currentElements.materials]
      .find(e => e.id === elementId);
    const elementName = elementInfo?.name || elementId;
    
    // 更新元素数量
    setElements(prev => {
      const newElements = {
        ...prev,
        [elementId]: newCount
      };
      
      // 计算新的环境数据
      const newEnvData = bottleType === 'water' 
        ? calculateWaterEnvironment(newElements, lightHours)
        : calculateLandEnvironment(newElements, lightHours);
      
      // 保存调整记录
      if (sessionId) {
        fetch('/api/learning/adjustment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            adjustment_type: 'element',
            element_id: elementId,
            element_name: elementName,
            delta: delta,
            new_value: newCount,
            light_hours: lightHours,
            elements_snapshot: newElements,
            env_data: newEnvData,
          }),
        }).catch(err => console.error('保存调整记录失败:', err));
      }
      
      return newElements;
    });
    
    // 生成AI反馈
    const newElements = { ...elements, [elementId]: newCount };
    const newEnvData = bottleType === 'water' 
      ? calculateWaterEnvironment(newElements, lightHours)
      : calculateLandEnvironment(newElements, lightHours);
    
    const feedback = bottleType === 'water'
      ? generateWaterFeedback(elementId, delta, newElements, newEnvData)
      : generateLandFeedback(elementId, delta, newElements, newEnvData);
    
    if (feedback) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: feedback }]);
      }, 300);
    }
    
    // 如果是底砂等不需要显示的元素，不添加到生态瓶中
    if (noDisplay) return;
    
    // 添加时在生态瓶中放置
    if (delta > 0) {
      const bottle = bottleRef.current;
      if (bottle) {
        const rect = bottle.getBoundingClientRect();
        const itemSize = size === 'large' ? 40 : (size === 'small' ? 20 : 30);
        const newItem: PlacedItem = {
          id: `${elementId}-${Date.now()}`,
          elementId,
          emoji,
          x: Math.random() * (rect.width - 60) + 30,
          y: Math.random() * (rect.height - 120) + 60,
          size,
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

  // 处理光照调整
  const handleLightChange = (value: number[]) => {
    const newLightHours = value[0];
    const oldLightHours = lightHours;
    
    setLightHours(newLightHours);
    
    // 计算新的环境数据
    const newEnvData = bottleType === 'water' 
      ? calculateWaterEnvironment(elements, newLightHours)
      : calculateLandEnvironment(elements, newLightHours);
    
    // 保存光照调整记录
    if (sessionId && newLightHours !== oldLightHours) {
      fetch('/api/learning/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          adjustment_type: 'light',
          element_id: 'light_hours',
          element_name: '光照时间',
          delta: newLightHours - oldLightHours,
          new_value: newLightHours,
          light_hours: newLightHours,
          elements_snapshot: elements,
          env_data: newEnvData,
        }),
      }).catch(err => console.error('保存光照调整记录失败:', err));
    }
  };

  // 完成设计
  const handleComplete = async () => {
    if (isCompleted) {
      // 如果已经完成设计，点击按钮返回首页
      if (sessionId) {
        setIsCompleting(true);
        try {
          await fetch('/api/learning/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, score: finalScore }),
          });
          endSession();
          router.push('/');
        } catch (error) {
          console.error('完成学习失败:', error);
        } finally {
          setIsCompleting(false);
        }
      }
      return;
    }

    const score = envData.stability;
    setFinalScore(score);
    setIsCompleted(true);

    // 根据评分生成评价
    let evaluation = '';
    let summary = '';

    if (score >= 80) {
      evaluation = `🎉 太棒了！你的${bottleType === 'water' ? '水生' : '陆生'}生态瓶获得了 ${score} 分！
      
你的设计非常平衡，生态瓶里的生物应该能健康生活！`;

      summary = `📌 设计总结：

你为了让生态瓶稳定，考虑了生物的数量和光照，让它们达到了平衡点——这些都是影响稳定性的关键因素。

${bottleType === 'water' ? `🌊 水生生态瓶的关键：
• 小鱼需要氧气呼吸，水草通过光合作用产生氧气
• 光照帮助水草产氧，但太多也可能让水质变化
• 苹果螺帮助清理废物，保持水质清洁` : `🌿 陆生生态瓶的关键：
• 苔藓保持湿度，让小生物有舒适的环境
• 蚯蚓和鼠妇分解有机物，让土壤更健康
• 光照时间影响湿度，需要找到合适的平衡点`}

你已经掌握了设计生态瓶的秘诀！🏆`;
    } else if (score >= 50) {
      evaluation = `👍 不错！你的${bottleType === 'water' ? '水生' : '陆生'}生态瓶获得了 ${score} 分。

生态瓶基本稳定，但还有一些可以改进的地方。仔细观察一下各项指标，你觉得哪里可以调整呢？`;
    } else {
      evaluation = `💪 继续努力！你的${bottleType === 'water' ? '水生' : '陆生'}生态瓶获得了 ${score} 分。

仔细看看左边的指标数据，${bottleType === 'water' ? '溶氧量和废物浓度' : '湿度和有机物'}是否在合适的范围？想一想：
• ${bottleType === 'water' ? '小鱼需要什么才能呼吸？水草能帮什么忙？' : '小生物们喜欢什么样的环境？苔藓有什么作用？'}
• 光照时间会对环境产生什么影响？

试试调整一下，再看看数据的变化！`;
    }

    // 添加评价消息
    const fullMessage = evaluation + (score >= 80 ? '\n\n' + summary : '');
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: fullMessage
    }]);
    // 保存评价消息
    saveMessage('assistant', fullMessage);

    // 生成生态瓶效果图片
    if (sessionId) {
      try {
        // 构建图片提示词
        const elementsList: string[] = [];
        const allElements = [...currentElements.animals, ...currentElements.plants, ...currentElements.materials];
        for (const [id, count] of Object.entries(elements)) {
          if (count > 0) {
            const element = allElements.find(e => e.id === id);
            if (element && !element.noDisplay) {
              elementsList.push(`${element.name}${count > 1 ? count + '个' : ''}`);
            }
          }
        }
        
        const promptText = `${bottleType === 'water' ? '水生' : '陆生'}生态瓶，透明玻璃瓶，里面有：${elementsList.join('、')}。${bottleType === 'water' ? '清澈的水，水草漂浮，小鱼游动' : '土壤上长着苔藓，枯木和石子点缀'}。高清写实风格，明亮的光线。`;
        
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText }),
        });

        const data = await response.json();
        if (data.imageUrl) {
          // 保存生成的图片到学习记录
          await fetch('/api/learning/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              image_url: data.imageUrl,
              prompt: promptText,
              image_type: 'result',
            }),
          });
        }
      } catch (error) {
        console.error('生成生态瓶图片失败:', error);
      }
    }
  };

  // 获取元素大小对应的样式
  const getSizeClass = (size: 'normal' | 'small' | 'large') => {
    switch (size) {
      case 'large': return 'text-4xl';
      case 'small': return 'text-xl';
      default: return 'text-3xl';
    }
  };

  const getSizeOffset = (size: 'normal' | 'small' | 'large') => {
    switch (size) {
      case 'large': return 20;
      case 'small': return 10;
      default: return 15;
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
              {/* 水生生态瓶 */}
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

              {/* 陆生生态瓶 */}
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
        <Button 
          size="sm"
          onClick={handleComplete}
          disabled={isCompleting || !sessionId}
          className="gap-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
        >
          {isCompleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          完成学习
        </Button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex gap-3 p-3 min-h-0">
        {/* 左列：生态瓶展示 */}
        <div ref={snapshotRef} className="w-[45%] flex flex-col gap-3 min-h-0">
          {/* 生态瓶 */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 p-3 min-h-0">
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
                onMouseMove={(e) => draggingItem && handleDrag(e, draggingItem)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={(e) => draggingItem && handleDrag(e, draggingItem)}
                onTouchEnd={handleDragEnd}
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
                    className={`absolute cursor-move select-none transition-transform hover:scale-110 ${getSizeClass(item.size)}`}
                    style={{ left: item.x - getSizeOffset(item.size), top: item.y - getSizeOffset(item.size) }}
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
                {bottleType === 'water' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-gray-500">湿度</span>
                      </div>
                      <p className={`text-2xl font-bold ${envData.oxygen >= 50 ? 'text-green-600' : 'text-yellow-500'}`}>
                        {envData.oxygen}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-xs text-gray-500">🍂</span>
                        <span className="text-xs text-gray-500">有机物</span>
                      </div>
                      <p className={`text-2xl font-bold ${envData.waste < 50 ? 'text-green-600' : 'text-yellow-500'}`}>
                        {envData.waste}%
                      </p>
                    </div>
                  </>
                )}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-500">生态评分</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <p className={`text-2xl font-bold ${envData.stability >= 50 ? 'text-green-600' : 'text-yellow-500'}`}>
                      {envData.stability}
                    </p>
                    <span className="text-sm text-gray-500">分</span>
                    <span className="text-lg">
                      {envData.stability >= 80 ? '😊' : envData.stability >= 50 ? '😐' : '😟'}
                    </span>
                  </div>
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
                    onValueChange={handleLightChange}
                    min={0}
                    max={14}
                    step={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 完成按钮 */}
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleCaptureSnapshot}
              disabled={isCapturing || Object.values(elements).every(v => v === 0)}
              className="flex-1 gap-1"
            >
              {isCapturing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              生成快照
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={Object.values(elements).every(v => v === 0)}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
            >
              ✓ 完成设计
            </Button>
          </div>
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
                {currentElements.animals.map(element => (
                  <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl ${element.size === 'small' ? 'scale-75' : element.size === 'large' ? 'scale-125' : ''}`}>{element.emoji}</span>
                      <div>
                        <p className="text-xs font-medium">{element.name}</p>
                        <p className="text-[10px] text-gray-400">{element.hint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, -1, element.emoji, element.size, element.noDisplay)} disabled={!elements[element.id]}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, 1, element.emoji, element.size, element.noDisplay)} disabled={(elements[element.id] || 0) >= element.max}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* 植物 */}
                {currentElements.plants.map(element => (
                  <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{element.emoji}</span>
                      <div>
                        <p className="text-xs font-medium">{element.name}</p>
                        <p className="text-[10px] text-gray-400">{element.hint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, -1, element.emoji, element.size, element.noDisplay)} disabled={!elements[element.id]}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, 1, element.emoji, element.size, element.noDisplay)} disabled={(elements[element.id] || 0) >= element.max}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* 材料 */}
                {currentElements.materials.map(element => (
                  <div key={element.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl ${element.size === 'small' ? 'scale-75' : element.size === 'large' ? 'scale-125' : ''}`}>{element.emoji}</span>
                      <div>
                        <p className="text-xs font-medium">{element.name}</p>
                        <p className="text-[10px] text-gray-400">{element.hint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, -1, element.emoji, element.size, element.noDisplay)} disabled={!elements[element.id]}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{elements[element.id] || 0}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleElementChange(element.id, 1, element.emoji, element.size, element.noDisplay)} disabled={(elements[element.id] || 0) >= element.max}>
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
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 h-0">
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

      {/* 恢复会话对话框 */}
      {showResumeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[90%] max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">发现未完成的学习</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                你之前有一次未完成的{bottleType === 'water' ? '水生' : '陆生'}生态瓶设计学习。
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                是否继续上次的学习？
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleStartNew}
                >
                  开始新学习
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600"
                  onClick={handleResumeSession}
                >
                  继续学习
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
