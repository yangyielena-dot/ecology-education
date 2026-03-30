'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, AlertTriangle, Droplets, Skull, Fish, Leaf } from 'lucide-react';

const CASES = [
  {
    id: 'floating-head',
    name: '浮头病',
    icon: Fish,
    severity: 'warning',
    color: 'from-yellow-400 to-orange-500',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    description: '鱼频繁浮头，水草茂盛但发黄',
    symptoms: [
      '鱼儿频繁浮到水面呼吸',
      '水草生长茂盛但叶片发黄',
      '下午时段症状加重',
    ],
    hint: '提示：注意观察溶氧量的日变化规律',
  },
  {
    id: 'green-water',
    name: '绿水病',
    severity: 'danger',
    icon: Droplets,
    color: 'from-green-400 to-emerald-600',
    borderColor: 'border-green-300 dark:border-green-700',
    description: '水变绿，鱼少动，螺死亡',
    symptoms: [
      '水质变成浑浊的绿色',
      '鱼儿活动减少，精神萎靡',
      '螺类大量死亡',
    ],
    hint: '提示：绿色水体暗示某种生物大量繁殖',
  },
  {
    id: 'dead-silence',
    name: '死寂病',
    severity: 'critical',
    icon: Skull,
    color: 'from-gray-400 to-gray-600',
    borderColor: 'border-gray-300 dark:border-gray-700',
    description: '所有生物死亡，水清澈但无生命',
    symptoms: [
      '所有鱼类死亡',
      '水草枯萎腐烂',
      '水质异常清澈',
    ],
    hint: '提示：清澈的水不一定健康，思考发生了什么',
  },
];

export default function DetectivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              生态瓶小侦探
            </h1>
          </div>
          <div className="w-20" />
        </div>

        {/* Introduction */}
        <Card className="mb-8 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-purple-800 dark:text-purple-300">
                  欢迎来到生态诊断中心 🔍
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  这里是生态瓶诊断中心。作为生态医生，你需要观察病例数据、分析异常原因、
                  开出正确的治疗处方。AI侦探助手会协助你完成诊断过程。
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    ⚠️ 轻度病例
                  </Badge>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    🔶 中度病例
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-300">
                    🔴 重度病例
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {CASES.map((caseItem) => {
            const IconComponent = caseItem.icon;
            return (
              <Card
                key={caseItem.id}
                className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 ${caseItem.borderColor}`}
              >
                <CardHeader className="text-center pb-3">
                  <div className={`mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br ${caseItem.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CardTitle className="text-xl font-bold">
                      {caseItem.name}
                    </CardTitle>
                    {caseItem.severity === 'critical' && (
                      <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                    )}
                  </div>
                  <CardDescription className="text-sm font-medium">
                    {caseItem.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      症状表现
                    </h4>
                    <ul className="space-y-1">
                      {caseItem.symptoms.map((symptom, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                          <span className="text-purple-400 mt-0.5">•</span>
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs text-purple-600 dark:text-purple-400 italic">
                      💡 {caseItem.hint}
                    </p>
                  </div>

                  <Link href={`/detective/case/${caseItem.id}`}>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold">
                      <Search className="w-4 h-4 mr-2" />
                      开始诊断
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tips Section */}
        <Card className="bg-white/50 dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-500" />
              诊断小贴士
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>🔬 <strong>观察数据</strong>：仔细查看各项环境指标的变化趋势</p>
            <p>🤔 <strong>分析原因</strong>：根据症状和数据，推理可能的原因</p>
            <p>💊 <strong>开出处方</strong>：调整参数，模拟治疗效果</p>
            <p>📈 <strong>验证结果</strong>：观察一周后的变化，验证你的诊断</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
