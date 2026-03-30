'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Thermometer, Sun, Activity, Beaker, Stethoscope, Sparkles, Image as ImageIcon
} from 'lucide-react';

// 病例图片配置
const CASE_IMAGES: Record<string, { sick: string; healthy: string }> = {
  'floating-head': {
    sick: 'https://coze-coding-project.tos.coze.site/coze_storage_7622857839190507562/image/generate_image_dedb1fc6-ead7-4ecd-b5f6-bcd921ea0a8f.jpeg?sign=1806393482-eb517beb30-0-5a999f29ca87699f57f36b488d0aad4663ef92fb7ad4e63f5d3ee3f5ff182f36',
    healthy: '',
  },
  'green-water': {
    sick: 'https://coze-coding-project.tos.coze.site/coze_storage_7622857839190507562/image/generate_image_02b4bfdf-8f33-44ca-bcae-9c82380d75d1.jpeg?sign=1806393477-8d308ee7f4-0-2-c81bb1ddffbb9148128e728d8a82740bf8c82d11379cb8a19c0d86f8c8f864e',
    healthy: '',
  },
  'dead-silence': {
    sick: 'https://coze-coding-project.tos.coze.site/coze_storage_7622857839190507562/image/generate_image_80d96f1c-a0d2-448d-9d8e-fc8c1ce89c4a.jpeg?sign=1806393475-f1fc48168a-0-e0a9c081156b2dfa531244d9a6f96556891a3813c128e63405750e9c50a2c2b2',
    healthy: '',
  },
};

// 病例数据配置
const CASE_DATA: Record<string, {
  name: string;
  icon: any;
  description: string;
  story: string;
  initialMessage: string;
  data: any[];
  parameters: {
    fishCount: number;
    plantDensity: number;
    lightHours: number;
    feedingAmount: number;
  };
  treatmentHints: string[];
}> = {
  'floating-head': {
    name: '浮头病',
    icon: Fish,
    description: '小鱼总是游到水面上呼吸',
    story: '小明养的3条小鱼最近总是游到水面上呼吸，特别是下午更严重。水草长得很多，但是叶子发黄了。你能帮帮他吗？',
    initialMessage: `你好！我是你的侦探助手 🔍

让我给你讲讲这个病例的故事：
"小明养了3条可爱的小鱼，可是最近它们总是游到水面上呼吸，嘴巴一张一合的，像是缺氧一样。特别是下午，情况更严重！水草虽然长得很多，但叶子都发黄了..."

我们来看看数据 📊：
- 溶氧量：下午最低只有 2.8mg/L（健康值应该大于 5mg/L）
- 早上溶氧量有 5.0mg/L，还算正常

**小问题**：为什么下午溶氧量最低呢？你觉得可能是什么原因？🤔`,
    data: [
      { time: '早上6点', oxygen: 5.0, waste: 12, light: 10, temp: 22 },
      { time: '上午9点', oxygen: 6.2, waste: 12, light: 40, temp: 24 },
      { time: '中午12点', oxygen: 5.8, waste: 13, light: 85, temp: 26 },
      { time: '下午3点', oxygen: 2.8, waste: 14, light: 70, temp: 27 },
      { time: '傍晚6点', oxygen: 3.5, waste: 15, light: 35, temp: 25 },
      { time: '晚上9点', oxygen: 4.2, waste: 15, light: 5, temp: 23 },
    ],
    parameters: {
      fishCount: 3,
      plantDensity: 80,
      lightHours: 8,
      feedingAmount: 5,
    },
    treatmentHints: [
      '💡 提示：水草太多，晚上会消耗很多氧气',
      '💡 提示：光照时间短，水草光合作用不够',
      '💡 提示：试试减少水草，或者增加光照时间',
    ],
  },
  'green-water': {
    name: '绿水病',
    icon: Droplets,
    description: '水变绿了，小鱼不爱动',
    story: '小红的生态瓶本来很清澈，但最近水变成绿色的了，看不清里面的鱼。小鱼也不爱动了，螺蛳还死了好几只。她很着急，你能帮帮她吗？',
    initialMessage: `你好！我是你的侦探助手 🔍

让我给你讲讲这个病例的故事：
"小红的生态瓶本来很清澈漂亮，可是最近水变成绿色的了，浑浊得看不清里面！小鱼都不爱动了，无精打采的。更糟糕的是，螺蛳还死了好几只..."

我们来看看数据 📊：
- 水质：浑浊，能见度不到5厘米
- 废物浓度：高达 25mg/L（正常应该小于 15mg/L）
- 溶氧量：波动很大，中午很高（9.5mg/L），晚上很低（3.8mg/L）

**小问题**：水变绿了，你觉得是什么东西让水变绿的？🤔`,
    data: [
      { time: '早上6点', oxygen: 4.5, waste: 20, light: 10, temp: 22 },
      { time: '上午9点', oxygen: 7.8, waste: 22, light: 40, temp: 24 },
      { time: '中午12点', oxygen: 9.5, waste: 25, light: 85, temp: 26 },
      { time: '下午3点', oxygen: 8.2, waste: 28, light: 70, temp: 27 },
      { time: '傍晚6点', oxygen: 5.5, waste: 30, light: 35, temp: 25 },
      { time: '晚上9点', oxygen: 3.8, waste: 32, light: 5, temp: 23 },
    ],
    parameters: {
      fishCount: 5,
      plantDensity: 40,
      lightHours: 12,
      feedingAmount: 8,
    },
    treatmentHints: [
      '💡 提示：绿色说明水里有很多很多藻类',
      '💡 提示：藻类喜欢阳光和鱼食残渣',
      '💡 提示：试试减少光照时间，少喂一点食物',
    ],
  },
  'dead-silence': {
    name: '死寂病',
    icon: Skull,
    description: '所有生物都死亡了',
    story: '小刚的生态瓶原本有很多小鱼和水草，但放暑假回来后发现，所有的小鱼都死了，水草也枯萎了。水质很清澈，但一点生机都没有。这是怎么回事呢？',
    initialMessage: `你好！我是你的侦探助手 🔍

让我给你讲讲这个病例的故事：
"小刚的生态瓶里原本有8条小鱼和水草，放暑假前还好好的。可是放假回来后，发现所有的小鱼都死了，水草也枯萎腐烂了...水质反而变得很清澈，但一点生机都没有..."

我们来看看数据 📊：
- 废物浓度：极高，达到 45mg/L（正常应该小于 15mg/L）
- 溶氧量：极低，只有 0.8-2.0mg/L（鱼需要大于 5mg/L）
- 水质：清澈但"死气沉沉"

**小问题**：水质清澈但是所有生物都死了，你觉得可能是什么原因呢？🤔`,
    data: [
      { time: '早上6点', oxygen: 2.0, waste: 40, light: 10, temp: 22 },
      { time: '上午9点', oxygen: 1.8, waste: 42, light: 40, temp: 24 },
      { time: '中午12点', oxygen: 1.5, waste: 45, light: 85, temp: 26 },
      { time: '下午3点', oxygen: 1.2, waste: 48, light: 70, temp: 27 },
      { time: '傍晚6点', oxygen: 1.0, waste: 50, light: 35, temp: 25 },
      { time: '晚上9点', oxygen: 0.8, waste: 52, light: 5, temp: 23 },
    ],
    parameters: {
      fishCount: 8,
      plantDensity: 20,
      lightHours: 6,
      feedingAmount: 12,
    },
    treatmentHints: [
      '💡 提示：生物太多，超过了瓶子的承载能力',
      '💡 提示：投喂太多食物，产生了大量废物',
      '💡 提示：水草太少，无法提供足够氧气',
    ],
  },
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CasePage() {
  const params = useParams();
  const caseId = params.id as string;
  const caseData = CASE_DATA[caseId];
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);
  const [showTreatment, setShowTreatment] = useState(false);
  const [treatmentParams, setTreatmentParams] = useState(caseData?.parameters || {
    fishCount: 3,
    plantDensity: 50,
    lightHours: 8,
    feedingAmount: 5,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [treatmentImage, setTreatmentImage] = useState<string | null>(null);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
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
        
        // 检查是否已经诊断出病因
        if (assistantMessage.includes('诊断正确') || assistantMessage.includes('你已经找到了病因')) {
          setDiagnosisComplete(true);
        }
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

  const handleStartTreatment = () => {
    setShowTreatment(true);
    setTreatmentResult(null);
    setTreatmentImage(null);
  };

  const handleTreatment = async () => {
    setIsGenerating(true);
    setTreatmentResult('⏳ 正在生成治疗后的生态瓶图片...');
    
    try {
      // 调用图片生成API
      const imageResponse = await fetch('/api/generate-bottle-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseId,
          params: treatmentParams,
          isTreated: true,
        }),
      });
      
      const imageResult = await imageResponse.json();
      
      if (imageResult.success) {
        setTreatmentImage(imageResult.imageUrl);
      }
      
      // 判断治疗效果
      const results = [
        { case: 'floating-head', success: treatmentParams.plantDensity < 60 && treatmentParams.lightHours >= 10 },
        { case: 'green-water', success: treatmentParams.lightHours < 10 && treatmentParams.feedingAmount < 6 },
        { case: 'dead-silence', success: treatmentParams.fishCount <= 4 && treatmentParams.plantDensity > 40 },
      ];
      
      const result = results.find(r => r.case === caseId);
      if (result?.success) {
        setTreatmentResult(`🎉 太棒了！治疗成功！

经过一周的调整，生态瓶恢复健康了！
📊 溶氧量恢复到 5.5-7.0mg/L
🐟 小鱼们恢复活力，不再浮头
🌿 水草变绿了，开始正常产生氧气

你真是一个优秀的生态医生！💪`);
      } else {
        setTreatmentResult(`😅 还需要再调整一下

你的方向是对的，但是参数还需要优化。

${caseData.treatmentHints.join('\n')}

再试试看，调整一下参数吧！你可以点击"重新调整"按钮。`);
      }
    } catch (error) {
      console.error('Treatment error:', error);
      setTreatmentResult('❌ 生成图片时出错，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/detective">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <IconComponent className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold text-purple-700 dark:text-purple-400">
              {caseData.name}
            </h1>
          </div>
          <div className="w-20" />
        </div>

        {/* Story Card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200">
          <CardContent className="pt-4">
            <p className="text-gray-700 dark:text-gray-300">📖 {caseData.story}</p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Data + Image + Treatment */}
          <div className="space-y-6">
            {/* Data Visualization */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  环境数据 📊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={caseData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={10} />
                      <YAxis fontSize={10} domain={[0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="oxygen" stroke="#3b82f6" name="溶氧量" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-center text-gray-500 mt-1">溶氧量变化（健康值应大于5）</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <Sun className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                    <p className="text-xs">光照</p>
                    <p className="font-bold text-blue-600 text-sm">强</p>
                  </div>
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                    <Thermometer className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                    <p className="text-xs">温度</p>
                    <p className="font-bold text-orange-600 text-sm">27°C</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <Beaker className="w-4 h-4 mx-auto text-red-500 mb-1" />
                    <p className="text-xs">废物</p>
                    <p className="font-bold text-red-600 text-sm">高</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ecological Bottle Image */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-green-500" />
                  生态瓶现状 🏥
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={treatmentImage || CASE_IMAGES[caseId]?.sick}
                    alt="生态瓶"
                    className="w-full h-48 object-cover"
                  />
                  {!treatmentImage && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      ⚠️ 生病中
                    </div>
                  )}
                  {treatmentImage && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      ✅ 治疗中
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Treatment Panel */}
            <Card className={!showTreatment ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-green-500" />
                  治疗处方 💊
                </CardTitle>
                <CardDescription>
                  {!showTreatment ? '和AI助手讨论完病因后，点击按钮开始治疗' : '调整下面的参数，然后点击"开始治疗"'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showTreatment ? (
                  <Button
                    onClick={handleStartTreatment}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    我知道病因了，开始治疗！
                  </Button>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>🐟 鱼的数量</span>
                          <span className="font-bold text-purple-600">{treatmentParams.fishCount} 条</span>
                        </div>
                        <Slider
                          value={[treatmentParams.fishCount]}
                          onValueChange={(value) => setTreatmentParams({...treatmentParams, fishCount: value[0]})}
                          min={1}
                          max={8}
                          step={1}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>🌿 水草密度</span>
                          <span className="font-bold text-purple-600">{treatmentParams.plantDensity}%</span>
                        </div>
                        <Slider
                          value={[treatmentParams.plantDensity]}
                          onValueChange={(value) => setTreatmentParams({...treatmentParams, plantDensity: value[0]})}
                          min={20}
                          max={100}
                          step={10}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>☀️ 光照时间</span>
                          <span className="font-bold text-purple-600">{treatmentParams.lightHours} 小时</span>
                        </div>
                        <Slider
                          value={[treatmentParams.lightHours]}
                          onValueChange={(value) => setTreatmentParams({...treatmentParams, lightHours: value[0]})}
                          min={4}
                          max={12}
                          step={1}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>🍞 每天投喂</span>
                          <span className="font-bold text-purple-600">{treatmentParams.feedingAmount} 粒</span>
                        </div>
                        <Slider
                          value={[treatmentParams.feedingAmount]}
                          onValueChange={(value) => setTreatmentParams({...treatmentParams, feedingAmount: value[0]})}
                          min={2}
                          max={10}
                          step={1}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleTreatment}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          开始治疗！
                        </>
                      )}
                    </Button>

                    {treatmentResult && (
                      <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                        treatmentResult.includes('成功') 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' 
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200'
                      }`}>
                        {treatmentResult}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: AI Chat */}
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Beaker className="w-5 h-5 text-purple-500" />
                AI侦探助手 🤖
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
                    placeholder="说说你的想法..."
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
        </div>
      </div>
    </div>
  );
}
