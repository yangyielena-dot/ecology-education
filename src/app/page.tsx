'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Globe, FlaskConical, Leaf, TreePine, Search, User, Lock, Send, CheckCircle, FileText, Loader2 } from 'lucide-react';

// 模块名称映射
const MODULE_NAMES: Record<string, string> = {
  planet: '重建生态星球',
  bottle: '设计生态瓶',
  detective: '生态瓶小侦探',
};

export default function Home() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // 提交报告相关状态
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [learningStats, setLearningStats] = useState<{
    total_sessions: number;
    total_messages: number;
    total_images: number;
    completed_sessions: number;
  } | null>(null);

  // 页面加载时清空旧的ID缓存，要求学生重新输入
  useEffect(() => {
    // 清除旧的缓存数据
    localStorage.removeItem('student_id');
    localStorage.removeItem('student_name');
    // 弹出空白输入框
    setIsDialogOpen(true);
  }, []);

  // 保存学生ID
  const handleSaveStudentId = () => {
    if (studentId.trim()) {
      localStorage.setItem('student_id', studentId.trim());
      if (studentName.trim()) {
        localStorage.setItem('student_name', studentName.trim());
      }
      setIsDialogOpen(false);
      
      // 如果有待导航的页面，现在导航
      if (pendingNavigation) {
        router.push(pendingNavigation);
        setPendingNavigation(null);
      }
    }
  };

  // 进入模块前的检查
  const handleNavigate = (path: string) => {
    if (!studentId) {
      setPendingNavigation(path);
      setIsDialogOpen(true);
      return;
    }
    router.push(path);
  };

  // 获取学习统计
  const fetchLearningStats = async () => {
    if (!studentId) return;
    
    try {
      const response = await fetch(`/api/learning/export?student_id=${encodeURIComponent(studentId)}`);
      const data = await response.json();
      
      if (data.success) {
        setLearningStats({
          total_sessions: data.total_sessions || 0,
          total_messages: data.total_messages || 0,
          total_images: data.total_images || 0,
          completed_sessions: data.sessions?.filter((s: any) => s.session.status === 'completed').length || 0,
        });
      }
    } catch (error) {
      console.error('获取学习统计失败:', error);
    }
  };

  // 打开提交报告对话框
  const handleOpenSubmitDialog = async () => {
    await fetchLearningStats();
    setShowSubmitDialog(true);
  };

  // 提交学习报告
  const handleSubmitReport = async () => {
    if (!studentId) return;
    
    setIsSubmitting(true);
    try {
      // 这里只是标记提交成功，实际数据已经在学习过程中保存了
      // 可以添加一个提交时间戳到数据库，或者只是显示确认信息
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟提交过程
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowSubmitDialog(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      <div className="container mx-auto px-4 py-6">
        {/* Hero Section - 紧凑版 */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <Leaf className="w-16 h-16 text-green-500 animate-pulse" />
              <TreePine className="w-10 h-10 text-emerald-600 absolute -right-3 -bottom-1 animate-bounce" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            生态危机拯救计划
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            神秘的"生态王国"突然出现失衡：草地的生物消失了，森林的河流干涸了……
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            你是被召唤来的<span className="font-bold text-green-600">"生态守护者"</span>，
            需要借助<span className="font-bold text-blue-600">"生态AI助手"</span>的力量，恢复生态平衡！
          </p>

          {/* 学生ID区域 */}
          <div className="mt-3 flex items-center justify-center gap-4">
            {studentId ? (
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full border-2 border-green-200 dark:border-green-800">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {studentName || studentId}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    setStudentId('');
                    setStudentName('');
                    setIsDialogOpen(true);
                  }}
                >
                  切换
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-white/80 dark:bg-gray-800/80"
                onClick={() => setIsDialogOpen(true)}
              >
                <User className="w-4 h-4" />
                输入学生ID
              </Button>
            )}
          </div>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-6">
          {/* 重建生态星球 */}
          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-green-200 dark:border-green-800">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-green-700 dark:text-green-400">
                重建生态星球
              </CardTitle>
              <CardDescription>
                与AI助手对话，设计你的理想生态星球
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
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
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-5 text-base"
                onClick={() => handleNavigate('/planet')}
              >
                {studentId ? '开始设计生态星球' : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    请先输入学生ID
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 设计生态瓶 */}
          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FlaskConical className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-blue-700 dark:text-blue-400">
                设计生态瓶
              </CardTitle>
              <CardDescription>
                选择生物元素，创建微型生态系统
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
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
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold py-5 text-base"
                onClick={() => handleNavigate('/bottle')}
              >
                {studentId ? '开始设计生态瓶' : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    请先输入学生ID
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 生态瓶小侦探 */}
          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-purple-700 dark:text-purple-400">
                生态瓶小侦探
              </CardTitle>
              <CardDescription>
                诊断生态瓶疾病，成为生态医生
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
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
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-5 text-base"
                onClick={() => handleNavigate('/detective')}
              >
                {studentId ? '开始诊断病例' : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    请先输入学生ID
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 提交学习报告区域 - 紧凑版 */}
        {studentId && (
          <div className="text-center mb-4">
            <Button 
              variant="outline"
              className="gap-2 bg-white/80 dark:bg-gray-800/80 border-2 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
              onClick={handleOpenSubmitDialog}
            >
              <Send className="w-4 h-4 text-green-600" />
              <span className="text-sm">完成学习？点击提交报告</span>
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            🌱 让我们一起成为生态守护者，恢复生态王国的平衡！
          </p>
        </div>
      </div>

      {/* 学生ID输入对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              输入学生信息
            </DialogTitle>
            <DialogDescription>
              请输入你的学生ID和姓名（选填），用于保存学习记录
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                学生ID <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="例如：学号、姓名拼音等"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-gray-400">请记住你的ID，下次使用相同的ID可以看到历史记录</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                学生姓名 <span className="text-gray-400">(选填)</span>
              </label>
              <Input
                placeholder="你的姓名"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveStudentId} disabled={!studentId.trim()}>
              确认
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 提交学习报告对话框 */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          {submitSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                提交成功！
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                你的学习报告已成功提交，老师可以查看你的学习成果了。
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  提交学习报告
                </DialogTitle>
                <DialogDescription>
                  确认提交你的学习记录给老师查看
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    学生：{studentName || studentId}
                  </p>
                  
                  {learningStats ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{learningStats.total_sessions}</p>
                        <p className="text-xs text-gray-500">学习次数</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{learningStats.completed_sessions}</p>
                        <p className="text-xs text-gray-500">完成任务</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">{learningStats.total_messages}</p>
                        <p className="text-xs text-gray-500">对话消息</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600">{learningStats.total_images}</p>
                        <p className="text-xs text-gray-500">生成图片</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  提交后，老师可以在管理页面查看你的完整学习记录
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                  取消
                </Button>
                <Button 
                  onClick={handleSubmitReport} 
                  disabled={isSubmitting || !learningStats}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      确认提交
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
