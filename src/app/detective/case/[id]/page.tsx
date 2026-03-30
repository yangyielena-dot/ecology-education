'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceInput } from '@/components/ui/voice-input';
import { Slider } from '@/components/ui/slider';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, Send, Loader2, Fish, Droplets, Skull, 
  Thermometer, Sun, Activity, Beaker, Stethoscope 
} from 'lucide-react';

// 病例数据配置
const CASE_DATA: Record<string, {
  name: string;
  icon: any;
  description: string;
  initialMessage: string;
  data: any[];
  parameters: {
    fishCount: number;
    plantDensity: number;
    lightHours: number;
    feedingAmount: number;
  };
}> = {
  'floating-head': {
    name: '浮头病',
    icon: Fish,
    description: '鱼频繁浮头，水草茂盛但发黄',
    initialMessage: `你选择了"浮头病"病例。现在你是生态医生 👨‍⚕️

让我带你了解一下病情：
- 症状：鱼儿频繁浮到水面呼吸，特别是在下午
- 观察：水草生长茂盛但叶片发黄
- 数据：溶氧量在下午最低（2.8mg/L），早上能恢复到5.0mg/L

第一步：观察数据。溶氧量在下午最低，只有2.8mg/L，早上能恢复到5.0。

你怀疑是什么原因导致的呢？🤔`,
    data: [
      { time: '6:00', oxygen: 5.0, waste: 12, light: 10, temp: 22 },
      { time: '9:00', oxygen: 6.2, waste: 12, light: 40, temp: 24 },
      { time: '12:00', oxygen: 5.8, waste: 13, light: 85, temp: 26 },
      { time: '15:00', oxygen: 2.8, waste: 14, light: 70, temp: 27 },
      { time: '18:00', oxygen: 3.5, waste: 15, light: 35, temp: 25 },
      { time: '21:00', oxygen: 4.2, waste: 15, light: 5, temp: 23 },
    ],
    parameters: {
      fishCount: 3,
      plantDensity: 80,
      lightHours: 8,
      feedingAmount: 5,
    },
  },
  'green-water': {
    name: '绿水病',
    icon: Droplets,
    description: '水变绿，鱼少动，螺死亡',
    initialMessage: `你选择了"绿水病"病例。现在你是生态医生 👨‍⚕️

让我带你了解一下病情：
- 症状：水质变成浑浊的绿色，鱼儿活动减少，螺类大量死亡
- 观察：水体透明度极低，能见度不足5cm
- 数据：废物浓度异常升高（25mg/L），溶氧量波动剧烈

第一步：观察数据。水体呈现绿色通常意味着什么生物大量繁殖？

你觉得是什么原因导致的呢？🤔`,
    data: [
      { time: '6:00', oxygen: 4.5, waste: 20, light: 10, temp: 22 },
      { time: '9:00', oxygen: 7.8, waste: 22, light: 40, temp: 24 },
      { time: '12:00', oxygen: 9.5, waste: 25, light: 85, temp: 26 },
      { time: '15:00', oxygen: 8.2, waste: 28, light: 70, temp: 27 },
      { time: '18:00', oxygen: 5.5, waste: 30, light: 35, temp: 25 },
      { time: '21:00', oxygen: 3.8, waste: 32, light: 5, temp: 23 },
    ],
    parameters: {
      fishCount: 5,
      plantDensity: 40,
      lightHours: 12,
      feedingAmount: 8,
    },
  },
  'dead-silence': {
    name: '死寂病',
    icon: Skull,
    description: '所有生物死亡，水清澈但无生命',
    initialMessage: `你选择了"死寂病"病例。这是最严重的病例！现在你是生态医生 👨‍⚕️

让我带你了解一下病情：
- 症状：所有鱼类死亡，水草枯萎腐烂，水质异常清澈
- 观察：水体清澈透明，但毫无生机
- 数据：废物浓度极高（45mg/L），溶氧量极低（1.5mg/L）

第一步：观察数据。水质清澈但生物全部死亡，这说明了什么问题？

你能推断出发生了什么吗？🤔`,
    data: [
      { time: '6:00', oxygen: 2.0, waste: 40, light: 10, temp: 22 },
      { time: '9:00', oxygen: 1.8, waste: 42, light: 40, temp: 24 },
      { time: '12:00', oxygen: 1.5, waste: 45, light: 85, temp: 26 },
      { time: '15:00', oxygen: 1.2, waste: 48, light: 70, temp: 27 },
      { time: '18:00', oxygen: 1.0, waste: 50, light: 35, temp: 25 },
      { time: '21:00', oxygen: 0.8, waste: 52, light: 5, temp: 23 },
    ],
    parameters: {
      fishCount: 8,
      plantDensity: 20,
      lightHours: 6,
      feedingAmount: 12,
    },
  },
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  const [treatmentParams, setTreatmentParams] = useState(caseData?.parameters || {
    fishCount: 3,
    plantDensity: 50,
    lightHours: 8,
    feedingAmount: 5,
  });
  const [treatmentResult, setTreatmentResult] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (caseData) {
      setMessages([{ role: 'assistant', content: caseData.initialMessage }]);
      setTreatmentParams(caseData.parameters);
    }
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <p className="text-lg mb-4">病例未找到</p>
            <Link href="/detective">
              <Button>返回病例列表</Button>
            </Link>
          </CardContent>
        </Card>
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'detective',
          caseId: caseId,
          caseName: caseData.name,
          conversationHistory: messages,
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

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + text);
  };

  const handleTreatment = async () => {
    setTreatmentResult('正在模拟治疗过程...');
    
    // 模拟治疗效果
    setTimeout(() => {
      const results = [
        { case: 'floating-head', success: treatmentParams.plantDensity < 60 && treatmentParams.lightHours >= 10 },
        { case: 'green-water', success: treatmentParams.lightHours < 10 && treatmentParams.feedingAmount < 6 },
        { case: 'dead-silence', success: treatmentParams.fishCount <= 4 && treatmentParams.plantDensity > 40 },
      ];
      
      const result = results.find(r => r.case === caseId);
      if (result?.success) {
        setTreatmentResult(`✅ 治疗成功！经过一周的调整：

📊 溶氧量恢复到 5.5-7.0mg/L 的健康水平
🐟 鱼儿恢复正常活动，不再浮头
🌿 水草恢复生机，开始产生氧气
💧 水质变得清澈透明

你的诊断和治疗方案非常正确！继续努力成为一名优秀的生态医生！🎉`);
      } else {
        setTreatmentResult(`⚠️ 治疗效果不佳，病情没有明显改善。

让我给你一些提示：
${caseId === 'floating-head' ? '浮头病的主要原因可能是光照时间不足导致水草光合作用不够...' : ''}
${caseId === 'green-water' ? '绿水病的主要原因是光照过强和投喂过多导致藻类大量繁殖...' : ''}
${caseId === 'dead-silence' ? '死寂病的主要原因是生物密度过大，超过了生态瓶的承载能力...' : ''}

重新调整参数再试一次吧！💪`);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/detective">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回病例列表
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <IconComponent className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {caseData.name} - 诊断中
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowTreatment(!showTreatment)}
            className="gap-2"
          >
            <Stethoscope className="w-4 h-4" />
            {showTreatment ? '返回诊断' : '开处方'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Data Visualization */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                环境数据曲线
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={caseData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="oxygen" stroke="#3b82f6" name="溶氧量(mg/L)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-gray-500 mt-1">溶氧量变化趋势</p>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={caseData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="waste" stroke="#ef4444" name="废物浓度(mg/L)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-gray-500 mt-1">废物浓度变化趋势</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-medium">光照强度</span>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    {caseData.data[2].light}%
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium">最高温度</span>
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    {Math.max(...caseData.data.map(d => d.temp))}°C
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Middle: AI Chat */}
          <Card className="lg:col-span-1 h-[700px] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Beaker className="w-5 h-5 text-purple-500" />
                AI侦探助手
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
                        className={`max-w-[85%] rounded-lg p-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
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
                    placeholder="描述你的观察和推断..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                  />
                  <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Treatment Panel */}
          <Card className="lg:col-span-1 h-[700px] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-green-500" />
                治疗处方
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
              {!showTreatment ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 flex items-center justify-center">
                    <Stethoscope className="w-10 h-10 text-purple-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    先与AI助手对话分析病因
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    确定病因后，点击"开处方"按钮调整参数
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>🐟 鱼的数量</span>
                        <span className="font-bold">{treatmentParams.fishCount} 条</span>
                      </div>
                      <Slider
                        value={[treatmentParams.fishCount]}
                        onValueChange={(value) => setTreatmentParams({...treatmentParams, fishCount: value[0]})}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>🌿 水草密度</span>
                        <span className="font-bold">{treatmentParams.plantDensity}%</span>
                      </div>
                      <Slider
                        value={[treatmentParams.plantDensity]}
                        onValueChange={(value) => setTreatmentParams({...treatmentParams, plantDensity: value[0]})}
                        min={10}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>☀️ 光照时间</span>
                        <span className="font-bold">{treatmentParams.lightHours} 小时/天</span>
                      </div>
                      <Slider
                        value={[treatmentParams.lightHours]}
                        onValueChange={(value) => setTreatmentParams({...treatmentParams, lightHours: value[0]})}
                        min={4}
                        max={14}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>🍞 投喂量</span>
                        <span className="font-bold">{treatmentParams.feedingAmount} 粒/天</span>
                      </div>
                      <Slider
                        value={[treatmentParams.feedingAmount]}
                        onValueChange={(value) => setTreatmentParams({...treatmentParams, feedingAmount: value[0]})}
                        min={2}
                        max={15}
                        step={1}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleTreatment}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    size="lg"
                  >
                    <Beaker className="w-4 h-4 mr-2" />
                    开始治疗
                  </Button>

                  {treatmentResult && (
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{treatmentResult}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
