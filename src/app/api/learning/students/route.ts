import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取所有学生列表（教师管理用）
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 查询所有学生的学习会话
    const { data: sessions, error: sessionsError } = await client
      .from('learning_sessions')
      .select('id, student_id, student_name, started_at, ended_at');

    if (sessionsError) {
      console.error('查询会话失败:', sessionsError);
      return NextResponse.json(
        { error: '查询学生记录失败' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        students: [],
      });
    }

    // 按学生ID分组统计
    const studentMap = new Map<string, {
      student_id: string;
      student_name: string | null;
      total_sessions: number;
      total_messages: number;
      total_images: number;
      last_activity: string;
    }>();

    // 获取每个学生的会话ID列表
    const studentSessionIds = new Map<string, string[]>();
    sessions.forEach(session => {
      const id = session.student_id;
      if (!studentSessionIds.has(id)) {
        studentSessionIds.set(id, []);
      }
      studentSessionIds.get(id)!.push(session.id);
      
      if (!studentMap.has(id)) {
        studentMap.set(id, {
          student_id: id,
          student_name: session.student_name,
          total_sessions: 0,
          total_messages: 0,
          total_images: 0,
          last_activity: session.started_at,
        });
      }
      
      // 更新会话数
      studentMap.get(id)!.total_sessions++;
      
      // 更新最后活动时间
      if (session.started_at > studentMap.get(id)!.last_activity) {
        studentMap.get(id)!.last_activity = session.started_at;
      }
    });

    // 批量查询所有消息数
    const allSessionIds = sessions.map(s => s.id);
    const { data: messages } = await client
      .from('conversation_messages')
      .select('session_id')
      .in('session_id', allSessionIds);

    // 统计每个学生的消息数
    messages?.forEach(msg => {
      const studentId = sessions.find(s => s.id === msg.session_id)?.student_id;
      if (studentId && studentMap.has(studentId)) {
        studentMap.get(studentId)!.total_messages++;
      }
    });

    // 批量查询所有图片数
    const { data: images } = await client
      .from('generated_images')
      .select('session_id')
      .in('session_id', allSessionIds);

    // 统计每个学生的图片数
    images?.forEach(img => {
      const studentId = sessions.find(s => s.id === img.session_id)?.student_id;
      if (studentId && studentMap.has(studentId)) {
        studentMap.get(studentId)!.total_images++;
      }
    });

    // 转换为数组并按最后活动时间排序
    const students = Array.from(studentMap.values())
      .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    return NextResponse.json(
      { error: '获取学生列表失败' },
      { status: 500 }
    );
  }
}
