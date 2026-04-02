'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceInput } from '@/components/ui/voice-input';
import { Slider } from '@/components/ui/slider';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, Send, Loader2, Fish, Droplets, Skull, 
  Thermometer, Sun, Activity, Beaker, Stethoscope, Sparkles, Image as ImageIcon,
  TrendingUp, TrendingDown, Minus, CheckCircle
} from 'lucide-react';
import { useLearningRecord } from '@/hooks/useLearningRecord';

// 病例图片配置
const CASE_IMAGES: Record<string, { sick: string }> = {
  'floating-head': {
    sick: 'https://coze-coding-project.tos.coze.site/coze_storage_7622857839190507562/image/generate_image_dedb1fc6-ead7-4ecd-b5f6-bcd921ea0a8f.jpeg?sign=1806393482-eb517beb30-0-5a999f29ca87699f57f36b488d0aad4663ef92fb7ad4e63f5d3ee3f5ff182f36',
  },
  'green-water': {
    sick: 'https://coze-coding-project.tos.coze.site/coze_storage_7622857839190507562/image/generate_image_02b4bfdf-8f33-44ca-bcae-9c82380d75d1.jpeg?sign=1806393477-8d308ee7f4-0-2-c81bb1ddffbb9148128e728d8a82740bf8c82d11379cb8a19c0d86f8c8f864e',
  },
  'dead-silence': {
    sick: 'https://coze-coding-project.tos.coze.site/coze_storage_7622857839190507562/image/generate_image_80d96f1c-a0d2-448d-9d8e-fc8c1ce89c4a.jpeg?sign=1806393475-f1fc48168a-0-e0a9c081156b2dfa531244d9a6f96556891a3813c128e63405750e9c50a2c2b2',
  },
};

// 计算预测数据的函数
function calculatePredictedData(params: { fishCount: number; plantDensity: number; lightHours: number; feedingAmount: number }) {
  // 溶氧量计算：光照时间增加产氧，水草密度适中最好，鱼多消耗多
  const oxygenProduction = params.lightHours * 0.6 + (params.plantDensity > 30 && params.plantDensity < 70 ? 2 : params.plantDensity >= 70 ? 1 : 0.5);
  const oxygenConsumption = params.fishCount * 0.5 + (params.plantDensity > 70 ? 1.5 : 0.5);
  const oxygenLevel = Math.max(1, Math.min(10, oxygenProduction - oxygenConsumption + 5));
  
  // 废物浓度：投喂多产生多，鱼多产生多
  const wasteLevel = params.feedingAmount * 2 + params.fishCount * 1.5 - (params.plantDensity > 40 ? 5 : 0);
  
  // 水质清澈度：藻类多则浑浊
  const algaeGrowth = params.lightHours > 10 && params.feedingAmount > 5 ? '高' : params.lightHours > 8 && params.feedingAmount > 3 ? '中' : '低';
  
  return {
    oxygen: Math.round(oxygenLevel * 10) / 10,
    waste: Math.max(5, Math.round(wasteLevel)),
    algae: algaeGrowth,
  };
}

// 病例数据配置
const CASE_DATA: Record<string, {
  name: string;
  icon: any;
  description: string;
  story: string;
  initialMessage: string;
  data: any[];
  currentData: { oxygen: number; waste: number; algae: string };
  parameters: { fishCount: number; plantDensity: number; lightHours: number; feedingAmount: number; };
  treatmentHints: string[];
}> = {
  'floating-head': {
    name: '浮头病',
    icon: Fish,
    description: '小鱼总是游到水面上呼吸',
    story: '小明养的3条小鱼最近总是游到水面上呼吸，特别是下午更严重。水草长得很多，但叶子发黄了。你能帮帮他吗？',
    initialMessage: `你好！我是侦探助手波波 🔍

"小明养了3条小鱼，最近总是游到水面上呼吸，特别是下午更严重！水草很多但叶子发黄..."

📊 数据：下午溶氧量最低只有 2.8mg/L（健康值应大于5）

🤔 小问题：为什么下午溶氧量最低呢？`,
    data: [
      { time: '6点', oxygen: 5.0 },
      { time: '9点', oxygen: 6.2 },
      { time: '12点', oxygen: 5.8 },
      { time: '15点', oxygen: 2.8 },
      { time: '18点', oxygen: 3.5 },
      { time: '21点', oxygen: 4.2 },
    ],
    currentData: { oxygen: 2.8, waste: 14, algae: '低' },
    parameters: { fishCount: 3, plantDensity: 80, lightHours: 8, feedingAmount: 5 },
    treatmentHints: ['💡 水草太多，晚上消耗氧气', '💡 光照时间短，产氧不够', '💡 试试减少水草或增加光照'],
  },
  'green-water': {
    name: '绿水病',
    icon: Droplets,
    description: '水变绿了，小鱼不爱动',
    story: '小红的生态瓶本来很清澈，但最近水变成绿色的了，看不清里面的鱼。小鱼也不爱动了，螺蛳还死了好几只。',
    initialMessage: `你好！我是侦探助手波波 🔍

"小红的生态瓶水变成绿色了，浑浊得看不清！小鱼不爱动，螺蛳还死了..."

📊 数据：废物浓度高达25mg/L，溶氧量波动剧烈

🤔 小问题：水变绿了，是什么让水变绿的？`,
    data: [
      { time: '6点', oxygen: 4.5 },
      { time: '9点', oxygen: 7.8 },
      { time: '12点', oxygen: 9.5 },
      { time: '15点', oxygen: 8.2 },
      { time: '18点', oxygen: 5.5 },
      { time: '21点', oxygen: 3.8 },
    ],
    currentData: { oxygen: 5.5, waste: 28, algae: '高' },
    parameters: { fishCount: 5, plantDensity: 40, lightHours: 12, feedingAmount: 8 },
    treatmentHints: ['💡 绿色说明藻类大量繁殖', '💡 藻类喜欢阳光和鱼食残渣', '💡 试试减少光照和投喂'],
  },
  'dead-silence': {
    name: '死寂病',
    icon: Skull,
    description: '所有生物都死亡了',
    story: '小刚的生态瓶原本有很多小鱼和水草，但放暑假回来后发现，所有的小鱼都死了，水草也枯萎了。水质很清澈，但一点生机都没有。',
    initialMessage: `你好！我是侦探助手波波 🔍

"小刚的生态瓶里原本有8条小鱼，回来后发现全都死了，水草也枯萎了...水很清澈但没有生命..."

📊 数据：废物浓度45mg/L，溶氧量只有0.8-2.0mg/L

🤔 小问题：水质清澈但生物都死了，为什么？`,
    data: [
      { time: '6点', oxygen: 2.0 },
      { time: '9点', oxygen: 1.8 },
      { time: '12点', oxygen: 1.5 },
      { time: '15点', oxygen: 1.2 },
      { time: '18点', oxygen: 1.0 },
      { time: '21点', oxygen: 0.8 },
    ],
    currentData: { oxygen: 1.2, waste: 48, algae: '低' },
    parameters: { fishCount: 8, plantDensity: 20, lightHours: 6, feedingAmount: 12 },
    treatmentHints: ['💡 生物太多，超过承载能力', '💡 投喂太多产生大量废物', '💡 水草太少无法提供氧气'],
  },
};

interface Message { role: 'user' | 'assistant'; content: string; }

// 数据指标组件
function DataIndicator({ label, value, unit, healthy, predicted, prevValue }: {
  label: string;
  value: number | string;
  unit?: string;
  healthy: boolean;
  predicted?: boolean;
  prevValue?: number;
}) {
  const trend = prevValue !== undefined && typeof value === 'number' 
    ? value > prevValue ? 'up' : value < prevValue ? 'down' : 'same'
    : null;
  
  return (
    <div className={`p-2 rounded-lg ${predicted ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200' : 'bg-white dark:bg-gray-800 border'} ${!healthy ? 'border-red-300' : 'border-green-300'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500">{predicted ? '📈 预测' : '📊 当前'}</span>
        {trend && (
          <span className="text-[10px]">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
            {trend === 'same' && <Minus className="w-3 h-3 text-gray-400" />}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold ${healthy ? 'text-green-600' : 'text-red-500'}`}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-gray-500">{unit}</span>}
      </div>
      <p className="text-[10px] text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const caseData = CASE_DATA[caseId];
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTreatment, setShowTreatment] = useState(false);
  const [treatmentParams, setTreatmentParams] = useState(caseData?.parameters || { fishCount: 3, plantDensity: 50, lightHours: 8, feedingAmount: 5 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [treatmentImage, setTreatmentImage] = useState<string | null>(null);
  const [treatmentResult, setTreatmentResult] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // 学习记录
  const { resumeOrCreateSession, saveMessage, endSession, sessionId } = useLearningRecord({
    moduleType: 'detective',
    moduleDetail: caseId,
  });

  // 计算预测数据
  const predictedData = useMemo(() => calculatePredictedData(treatmentParams), [treatmentParams]);

  // 完成学习
  const handleComplete = async () => {
    if (!sessionId || isCompleting) return;
    
    setIsCompleting(true);
    try {
      const response = await fetch('/api/learning/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      
      const data = await response.json();
      if (data.success) {
        endSession();
        router.push('/');
      }
    } catch (error) {
      console.error('完成学习失败:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // 初始化消息和学习会话
  useEffect(() => {
    if (caseData) {
      setMessages([{ role: 'assistant', content: caseData.initialMessage }]);
      setTreatmentParams(caseData.parameters);
      // 恢复或创建学习会话
      resumeOrCreateSession();
    }
  }, [caseId, caseData, resumeOrCreateSession]);

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

  if (!caseData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
        <Card className="p-8"><CardContent className="text-center">
          <p className="text-lg mb-4">病例未找到</p>
          <Link href="/detective"><Button>返回病例列表</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  const IconComponent = caseData.icon;

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
        body: JSON.stringify({ message: userMessage, context: 'detective', caseId, caseName: caseData.name, conversationHistory: messages }),
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

  const handleTreatment = async () => {
    setIsGenerating(true);
    setTreatmentResult('⏳ 生成图片中...');
    try {
      const imageResponse = await fetch('/api/generate-bottle-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, params: treatmentParams, isTreated: true }),
      });
      const imageResult = await imageResponse.json();
      if (imageResult.success) setTreatmentImage(imageResult.imageUrl);
      
      const results = [
        { case: 'floating-head', success: treatmentParams.plantDensity < 60 && treatmentParams.lightHours >= 10 },
        { case: 'green-water', success: treatmentParams.lightHours < 10 && treatmentParams.feedingAmount < 6 },
        { case: 'dead-silence', success: treatmentParams.fishCount <= 4 && treatmentParams.plantDensity > 40 },
      ];
      const result = results.find(r => r.case === caseId);
      setTreatmentResult(result?.success 
        ? `🎉 治疗成功！溶氧量恢复到 ${predictedData.oxygen}mg/L，小鱼们恢复活力了！你真棒！💪` 
        : `😅 还需调整\n预测溶氧量：${predictedData.oxygen}mg/L（健康值应>5）\n\n${caseData.treatmentHints.join('\n')}`);
    } catch (error) {
      setTreatmentResult('❌ 出错了，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-50 flex flex-col">
      {/* Header - 紧凑 */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white/50 dark:bg-gray-900/50 flex-shrink-0">
        <Link href="/detective">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />返回
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5 text-purple-600" />
          <span className="font-bold text-purple-700">{caseData.name}</span>
          <span className="text-sm text-gray-500">- {caseData.description}</span>
        </div>
        <Button 
          size="sm"
          onClick={handleComplete}
          disabled={isCompleting || !sessionId}
          className="gap-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
        >
          {isCompleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          完成学习
        </Button>
      </div>

      {/* 故事条 - 紧凑 */}
      <div className="px-4 py-2 bg-purple-100/50 dark:bg-purple-900/20 flex-shrink-0">
        <p className="text-sm text-gray-700 dark:text-gray-300">📖 {caseData.story}</p>
      </div>

      {/* 主内容区 - 三列布局，填满剩余空间 */}
      <div className="flex-1 flex gap-3 p-3 min-h-0">
        {/* 左列：图片 + 数据 */}
        <div className="w-1/3 flex flex-col gap-3 min-h-0">
          {/* 生态瓶图片 */}
          <Card className="flex-shrink-0">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-green-500" />生态瓶 🏥
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img src={treatmentImage || CASE_IMAGES[caseId]?.sick} alt="生态瓶" className="w-full h-40 object-contain" />
                <div className={`absolute top-1 left-1 px-2 py-0.5 rounded text-[10px] font-bold ${treatmentImage ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                  {treatmentImage ? '✅ 治疗中' : '⚠️ 生病中'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 数据图表 */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="py-2 px-3 flex-shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />数据 📊
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-2 pt-0">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={caseData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={9} />
                    <YAxis fontSize={9} domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="oxygen" stroke="#3b82f6" name="溶氧量" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-center text-gray-500 mt-1">溶氧量变化（健康值&gt;5）</p>
              <div className="grid grid-cols-3 gap-1 mt-2">
                <div className="p-1 bg-blue-50 rounded text-center">
                  <Sun className="w-3 h-3 mx-auto text-yellow-500" />
                  <p className="text-[10px]">光照强</p>
                </div>
                <div className="p-1 bg-orange-50 rounded text-center">
                  <Thermometer className="w-3 h-3 mx-auto text-orange-500" />
                  <p className="text-[10px]">27°C</p>
                </div>
                <div className="p-1 bg-red-50 rounded text-center">
                  <Beaker className="w-3 h-3 mx-auto text-red-500" />
                  <p className="text-[10px]">废物高</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中列：AI对话 */}
        <Card className="w-1/3 flex flex-col min-h-0">
          <CardHeader className="py-2 px-3 border-b flex-shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Beaker className="w-4 h-4 text-purple-500" />AI助手 🤖
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 h-0">
              <div className="space-y-2">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-lg p-2 text-xs ${msg.role === 'user' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-2"><Loader2 className="w-3 h-3 animate-spin text-purple-600" /></div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-2 border-t flex-shrink-0">
              <div className="flex gap-1">
                <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="说说想法..." disabled={isLoading} className="flex-1 h-8 text-xs" />
                <VoiceInput onTranscript={(text) => setInput(prev => prev + text)} disabled={isLoading} />
                <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon" className="h-8 w-8 bg-purple-500"><Send className="w-3 h-3" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右列：治疗面板 */}
        <Card className={`w-1/3 flex flex-col min-h-0 ${!showTreatment ? 'opacity-60' : ''}`}>
          <CardHeader className="py-2 px-3 border-b flex-shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-green-500" />治疗处方 💊
            </CardTitle>
            <CardDescription className="text-xs">
              {!showTreatment ? '和AI讨论病因后开始治疗' : '调整参数，看预测数据变化'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-3 min-h-0 overflow-y-auto">
            {!showTreatment ? (
              <div className="flex-1 flex items-center justify-center">
                <Button onClick={() => setShowTreatment(true)} className="bg-gradient-to-r from-green-500 to-emerald-600" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />我知道病因了，开始治疗！
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 当前数据 vs 预测数据 */}
                <div className="grid grid-cols-2 gap-2">
                  <DataIndicator 
                    label="溶氧量" 
                    value={caseData.currentData.oxygen} 
                    unit="mg/L"
                    healthy={caseData.currentData.oxygen >= 5}
                  />
                  <DataIndicator 
                    label="溶氧量" 
                    value={predictedData.oxygen} 
                    unit="mg/L"
                    healthy={predictedData.oxygen >= 5}
                    predicted
                    prevValue={caseData.currentData.oxygen}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <DataIndicator 
                    label="废物浓度" 
                    value={caseData.currentData.waste} 
                    unit="mg/L"
                    healthy={caseData.currentData.waste < 15}
                  />
                  <DataIndicator 
                    label="废物浓度" 
                    value={predictedData.waste} 
                    unit="mg/L"
                    healthy={predictedData.waste < 15}
                    predicted
                    prevValue={caseData.currentData.waste}
                  />
                </div>

                {/* 提示信息 */}
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-[10px] text-blue-600">
                    💡 健康标准：溶氧量 &gt; 5mg/L，废物浓度 &lt; 15mg/L
                  </p>
                </div>

                {/* 参数调整 */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold text-gray-500">调整参数：</p>
                  {[
                    { label: '🐟 鱼的数量', value: treatmentParams.fishCount, key: 'fishCount', min: 1, max: 8, step: 1, unit: '条', hint: '多耗氧' },
                    { label: '🌿 水草密度', value: treatmentParams.plantDensity, key: 'plantDensity', min: 20, max: 100, step: 10, unit: '%', hint: '产氧+耗氧' },
                    { label: '☀️ 光照时间', value: treatmentParams.lightHours, key: 'lightHours', min: 4, max: 12, step: 1, unit: '小时', hint: '产氧' },
                    { label: '🍞 每天投喂', value: treatmentParams.feedingAmount, key: 'feedingAmount', min: 2, max: 10, step: 1, unit: '粒', hint: '产生废物' },
                  ].map((param) => (
                    <div key={param.key} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span>{param.label}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400">{param.hint}</span>
                          <span className="font-bold text-purple-600">{param.value}{param.unit}</span>
                        </div>
                      </div>
                      <Slider
                        value={[param.value]}
                        onValueChange={(value) => setTreatmentParams({ ...treatmentParams, [param.key]: value[0] })}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        className="h-4"
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={handleTreatment} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-500 to-pink-600" size="lg">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</> : <><Sparkles className="w-4 h-4 mr-2" />开始治疗！</>}
                </Button>

                {treatmentResult && (
                  <div className={`p-2 rounded-lg text-xs whitespace-pre-wrap ${treatmentResult.includes('成功') ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    {treatmentResult}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
