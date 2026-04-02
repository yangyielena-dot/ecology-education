'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, User, FileText, Download, Loader2, Search, ArrowLeft } from 'lucide-react';

// 教师密码（实际生产环境应该使用后端验证）
const TEACHER_PASSWORD = 'ecology2024';

// 模块名称映射
const MODULE_NAMES: Record<string, string> = {
  planet: '重建生态星球',
  bottle: '设计生态瓶',
  detective: '生态瓶小侦探',
};

interface StudentRecord {
  student_id: string;
  student_name: string | null;
  total_sessions: number;
  total_messages: number;
  total_images: number;
  last_activity: string;
}

interface ReportData {
  success: boolean;
  student_id: string;
  student_name: string | null;
  total_sessions: number;
  total_messages: number;
  total_images: number;
  export_time: string;
  sessions: any[];
}

export default function TeacherPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // 验证密码
  const handleLogin = () => {
    if (password === TEACHER_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      loadStudents();
    } else {
      setPasswordError('密码错误，请重试');
    }
  };

  // 加载所有学生记录
  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/learning/students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('加载学生记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 查看学生详细报告
  const viewStudentReport = async (studentId: string) => {
    setSelectedStudent(studentId);
    setIsReportLoading(true);
    try {
      const response = await fetch(`/api/learning/export?student_id=${encodeURIComponent(studentId)}`);
      const data = await response.json();
      if (data.success) {
        setReportData(data);
      }
    } catch (error) {
      console.error('获取报告失败:', error);
    } finally {
      setIsReportLoading(false);
    }
  };

  // 导出学生记录
  const exportStudentRecord = async (studentId: string) => {
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
      }
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  // 导出所有学生记录
  const exportAllStudents = async () => {
    try {
      const response = await fetch('/api/learning/students/export');
      const data = await response.json();

      if (data.success) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `所有学生记录_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  // 过滤学生列表
  const filteredStudents = students.filter(student => 
    student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.student_name && student.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">教师管理入口</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                请输入教师密码
              </label>
              <Input
                type="password"
                placeholder="教师密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900"
              onClick={handleLogin}
            >
              进入管理页面
            </Button>
            <div className="text-center">
              <a href="/" className="text-sm text-blue-600 hover:underline">
                返回首页
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              教师管理面板
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadStudents}>
              刷新数据
            </Button>
            <Button onClick={exportAllStudents}>
              <Download className="w-4 h-4 mr-2" />
              导出所有记录
            </Button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索学生ID或姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{students.length}</p>
              <p className="text-sm text-gray-500">学生总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {students.reduce((sum, s) => sum + s.total_sessions, 0)}
              </p>
              <p className="text-sm text-gray-500">学习次数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {students.reduce((sum, s) => sum + s.total_messages, 0)}
              </p>
              <p className="text-sm text-gray-500">对话消息数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {students.reduce((sum, s) => sum + s.total_images, 0)}
              </p>
              <p className="text-sm text-gray-500">生成图片数</p>
            </CardContent>
          </Card>
        </div>

        {/* 学生列表 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  {searchQuery ? '未找到匹配的学生' : '暂无学生学习记录'}
                </CardContent>
              </Card>
            ) : (
              filteredStudents.map((student) => (
                <Card key={student.student_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                            {student.student_name || student.student_id}
                          </h3>
                          {student.student_name && (
                            <p className="text-sm text-gray-500">ID: {student.student_id}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            最后活动: {new Date(student.last_activity).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{student.total_sessions}</p>
                          <p className="text-xs text-gray-500">学习次数</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">{student.total_messages}</p>
                          <p className="text-xs text-gray-500">对话数</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-orange-600">{student.total_images}</p>
                          <p className="text-xs text-gray-500">图片数</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewStudentReport(student.student_id)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            查看详情
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => exportStudentRecord(student.student_id)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            导出
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* 学生详情报告弹窗 */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {isReportLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : reportData ? (
            <>
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
                            生成的图片 ({sessionData.images.length}张)
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
                            操作记录 ({sessionData.adjustments.length}次调整)
                          </p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {sessionData.adjustments.map((adj: any, adjIndex: number) => (
                              <div key={adjIndex} className="text-xs flex items-center gap-2 p-1.5 bg-white/50 dark:bg-gray-800/50 rounded">
                                <span className="text-gray-400 w-16 flex-shrink-0">
                                  {new Date(adj.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {adj.adjustment_type === 'element' ? (
                                  <span>
                                    {adj.delta > 0 ? '+' : '-'} {adj.element_name}
                                    {adj.delta > 0 ? ` +${adj.delta}` : ` ${adj.delta}`}
                                    {adj.new_value !== undefined && ` (当前: ${adj.new_value})`}
                                  </span>
                                ) : (
                                  <span>
                                    光照时间: {adj.light_hours}小时
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
                                  {msg.role === 'user' ? '学生' : 'AI助手'}
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
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                  关闭
                </Button>
                <Button onClick={() => exportStudentRecord(reportData.student_id)}>
                  <Download className="w-4 h-4 mr-2" />
                  下载JSON
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
