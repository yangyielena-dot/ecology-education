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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Globe, FlaskConical, Leaf, TreePine, Search, Download, User, FileText, Loader2, Lock } from 'lucide-react';

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
  const [isExporting, setIsExporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // 页面加载时始终弹出输入框，让用户输入ID
  useEffect(() => {
    // 清除旧的缓存数据，确保每次都需要重新输入ID
    localStorage.removeItem('student_id');
    localStorage.removeItem('student_name');
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

  // 导出学习记录（JSON格式）
  const handleExportJSON = async () => {
    if (!studentId) {
      alert('请先输入学生ID');
      setIsDialogOpen(true);
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`/api/learning/export?student_id=${encodeURIComponent(studentId)}`);
      const data = await response.json();

      if (data.success) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `学习记录_${studentId}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(data.error || '导出失败');
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 查看学习报告
  const handleViewReport = async () => {
    if (!studentId) {
      alert('请先输入学生ID');
      setIsDialogOpen(true);
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`/api/learning/export?student_id=${encodeURIComponent(studentId)}`);
      const data = await response.json();

      if (data.success) {
        setReportData(data);
        setShowReport(true);
      } else {
        alert(data.error || '获取报告失败');
      }
    } catch (error) {
      console.error('获取报告失败:', error);
      alert('获取报告失败，请重试');
    } finally {
      setIsExporting(false);
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                      修改
                    </Button>
                  </DialogTrigger>
                  <StudentIdDialog
                    studentId={studentId}
                    studentName={studentName}
                    setStudentId={setStudentId}
                    setStudentName={setStudentName}
                    onSave={handleSaveStudentId}
                    onClose={() => setIsDialogOpen(false)}
                  />
                </Dialog>
              </div>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-white/80 dark:bg-gray-800/80">
                    <User className="w-4 h-4" />
                    输入学生ID
                  </Button>
                </DialogTrigger>
                <StudentIdDialog
                  studentId={studentId}
                  studentName={studentName}
                  setStudentId={setStudentId}
                  setStudentName={setStudentName}
                  onSave={handleSaveStudentId}
                  onClose={() => setIsDialogOpen(false)}
                />
              </Dialog>
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

        {/* 完成学习区域 */}
        <div className="text-center mb-6">
          <div className="inline-flex flex-col items-center gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">完成学习后，可以查看和导出你的学习记录</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleViewReport}
                disabled={isExporting || !studentId}
              >
                <FileText className="w-4 h-4" />
                查看学习报告
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={handleExportJSON}
                disabled={isExporting || !studentId}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                导出学习记录
              </Button>
            </div>
            {!studentId && (
              <p className="text-xs text-orange-500">请先输入学生ID</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            🌱 让我们一起成为生态守护者，恢复生态王国的平衡！
          </p>
        </div>
      </div>

      {/* 学习报告弹窗 */}
      {showReport && reportData && (
        <Dialog open={showReport} onOpenChange={setShowReport}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                学习报告 - {reportData.student_name || reportData.student_id}
              </DialogTitle>
              <DialogDescription>
                导出时间：{new Date(reportData.export_time).toLocaleString('zh-CN')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* 统计概览 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{reportData.total_sessions}</p>
                  <p className="text-sm text-gray-500">学习次数</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{reportData.total_messages}</p>
                  <p className="text-sm text-gray-500">对话消息数</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {reportData.sessions?.filter((s: any) => s.session.status === 'completed').length || 0}
                  </p>
                  <p className="text-sm text-gray-500">完成任务数</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{reportData.total_images || 0}</p>
                  <p className="text-sm text-gray-500">生成图片数</p>
                </div>
              </div>

              {/* 详细记录 */}
              {reportData.sessions?.map((sessionData: any) => (
                <Card key={sessionData.session.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {MODULE_NAMES[sessionData.session.module_type] || sessionData.session.module_type}
                        {sessionData.session.module_detail && ` - ${sessionData.session.module_detail === 'water' ? '水生' : sessionData.session.module_detail === 'land' ? '陆生' : sessionData.session.module_detail}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {sessionData.session.score !== null && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            评分: {sessionData.session.score}
                          </span>
                        )}
                        <span>{sessionData.session.status === 'completed' ? '已完成' : '进行中'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      开始：{new Date(sessionData.session.started_at).toLocaleString('zh-CN')}
                      {sessionData.session.ended_at && (
                        <> | 结束：{new Date(sessionData.session.ended_at).toLocaleString('zh-CN')}</>
                      )}
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* 生成的图片 */}
                    {sessionData.images && sessionData.images.length > 0 && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-b">
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">
                          🎨 生成的图片 ({sessionData.images.length}张)
                        </p>
                        <div className="flex gap-2 overflow-x-auto">
                          {sessionData.images.map((img: any, imgIndex: number) => (
                            <a
                              key={imgIndex}
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 group relative"
                            >
                              <img
                                src={img.url}
                                alt={`生成的图片 ${imgIndex + 1}`}
                                className="w-32 h-24 object-cover rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-colors"
                              />
                              {img.image_type === 'result' && (
                                <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                                  最终效果
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 数据调整记录 */}
                    {sessionData.adjustments && sessionData.adjustments.length > 0 && (
                      <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 border-b">
                        <p className="text-sm font-medium text-cyan-700 dark:text-cyan-400 mb-2">
                          ⚙️ 操作记录 ({sessionData.adjustments.length}次调整)
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {sessionData.adjustments.map((adj: any, adjIndex: number) => (
                            <div key={adjIndex} className="text-xs flex items-center gap-2 p-1.5 bg-white/50 dark:bg-gray-800/50 rounded">
                              <span className="text-gray-400 w-16 flex-shrink-0">
                                {new Date(adj.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {adj.adjustment_type === 'element' ? (
                                <span>
                                  {adj.delta > 0 ? '➕' : '➖'} {adj.element_name}
                                  {adj.delta > 0 ? ` +${adj.delta}` : ` ${adj.delta}`}
                                  {adj.new_value !== undefined && ` (当前: ${adj.new_value})`}
                                </span>
                              ) : (
                                <span>
                                  ☀️ 光照时间: {adj.light_hours}小时
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {sessionData.messages.length > 0 ? (
                      <div className="divide-y max-h-60 overflow-y-auto">
                        {sessionData.messages.map((msg: any, msgIndex: number) => (
                          <div
                            key={msgIndex}
                            className={`p-3 text-sm ${
                              msg.role === 'user'
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'bg-gray-50 dark:bg-gray-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium ${
                                msg.role === 'user' ? 'text-blue-600' : 'text-green-600'
                              }`}>
                                {msg.role === 'user' ? '👤 学生' : '🤖 AI助手'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(msg.timestamp).toLocaleString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="p-4 text-gray-400 text-center text-sm">暂无对话记录</p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {reportData.sessions?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>暂无学习记录</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowReport(false)}>
                关闭
              </Button>
              <Button onClick={handleExportJSON} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                下载JSON
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// 学生ID输入对话框组件
function StudentIdDialog({
  studentId,
  studentName,
  setStudentId,
  setStudentName,
  onSave,
  onClose,
}: {
  studentId: string;
  studentName: string;
  setStudentId: (id: string) => void;
  setStudentName: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
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
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button onClick={onSave} disabled={!studentId.trim()}>
          确认
        </Button>
      </div>
    </DialogContent>
  );
}
