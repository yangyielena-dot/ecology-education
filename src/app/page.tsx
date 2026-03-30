'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, FlaskConical, Leaf, TreePine, Search, Stethoscope } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Leaf className="w-20 h-20 text-green-500 animate-pulse" />
              <TreePine className="w-12 h-12 text-emerald-600 absolute -right-4 -bottom-2 animate-bounce" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            生态危机拯救计划
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            神秘的"生态王国"突然出现失衡：草地的生物消失了，森林的河流干涸了……
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            你是被召唤来的<span className="font-bold text-green-600">"生态守护者"</span>，
            需要借助<span className="font-bold text-blue-600">"生态AI助手"</span>的力量，
            恢复生态平衡！
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* 重建生态星球 */}
          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-green-200 dark:border-green-800">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
                重建生态星球
              </CardTitle>
              <CardDescription className="text-base">
                与AI助手对话，设计你的理想生态星球
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✦</span>
                  <span>描述你心中的生态星球</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✦</span>
                  <span>AI引导学习种群和生态系统概念</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✦</span>
                  <span>AI生成你设计的生态星球图片</span>
                </li>
              </ul>
              <Link href="/planet">
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 text-lg">
                  开始设计生态星球
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 设计生态瓶 */}
          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                设计生态瓶
              </CardTitle>
              <CardDescription className="text-base">
                选择生物元素，创建微型生态系统
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✦</span>
                  <span>选择水生或陆生生态瓶</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✦</span>
                  <span>添加动物、植物、水、木头等元素</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✦</span>
                  <span>实时监控环境数据（含氧量、湿度等）</span>
                </li>
              </ul>
              <Link href="/bottle">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold py-6 text-lg">
                  开始设计生态瓶
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 生态瓶小侦探 */}
          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                生态瓶小侦探
              </CardTitle>
              <CardDescription className="text-base">
                诊断生态瓶疾病，成为生态医生
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✦</span>
                  <span>观察异常现象，分析数据曲线</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✦</span>
                  <span>AI侦探助手引导诊断过程</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✦</span>
                  <span>开处方治疗，观察恢复效果</span>
                </li>
              </ul>
              <Link href="/detective">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-6 text-lg">
                  开始诊断病例
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            🌱 让我们一起成为生态守护者，恢复生态王国的平衡！
          </p>
        </div>
      </div>
    </div>
  );
}
