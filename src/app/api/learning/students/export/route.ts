import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 导出所有学生的学习记录（教师管理用）
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 查询所有学生的学习会话
    const { data: sessions, error: sessionsError } = await client
      .from('learning_sessions')
      .select('*')
      .order('started_at', { ascending: true });

    if (sessionsError) {
      console.error('查询会话失败:', sessionsError);
      return NextResponse.json(
        { error: '查询学习记录失败' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        export_time: new Date().toISOString(),
        total_students: 0,
        total_sessions: 0,
        students: [],
      });
    }

    // 获取所有会话的消息
    const sessionIds = sessions.map(s => s.id);
    const { data: messages } = await client
      .from('conversation_messages')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    // 获取所有会话生成的图片
    const { data: images } = await client
      .from('generated_images')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    // 获取所有会话的数据调整记录
    const { data: adjustments } = await client
      .from('bottle_adjustments')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    // 将消息按会话分组
    const messagesBySession: Record<string, NonNullable<typeof messages>[number][]> = {};
    messages?.forEach(msg => {
      if (!msg) return;
      if (!messagesBySession[msg.session_id]) {
        messagesBySession[msg.session_id] = [];
      }
      messagesBySession[msg.session_id].push(msg);
    });

    // 将图片按会话分组
    const imagesBySession: Record<string, NonNullable<typeof images>[number][]> = {};
    images?.forEach(img => {
      if (!img) return;
      if (!imagesBySession[img.session_id]) {
        imagesBySession[img.session_id] = [];
      }
      imagesBySession[img.session_id].push(img);
    });

    // 将调整记录按会话分组
    const adjustmentsBySession: Record<string, NonNullable<typeof adjustments>[number][]> = {};
    adjustments?.forEach(adj => {
      if (!adj) return;
      if (!adjustmentsBySession[adj.session_id]) {
        adjustmentsBySession[adj.session_id] = [];
      }
      adjustmentsBySession[adj.session_id].push(adj);
    });

    // 按学生分组
    const studentsMap = new Map<string, {
      student_id: string;
      student_name: string | null;
      sessions: any[];
      total_sessions: number;
      total_messages: number;
      total_images: number;
    }>();

    sessions.forEach(session => {
      const studentId = session.student_id;
      
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          student_id: studentId,
          student_name: session.student_name,
          sessions: [],
          total_sessions: 0,
          total_messages: 0,
          total_images: 0,
        });
      }

      const studentData = studentsMap.get(studentId)!;
      studentData.total_sessions++;

      const sessionMessages = messagesBySession[session.id] || [];
      const sessionImages = imagesBySession[session.id] || [];
      const sessionAdjustments = adjustmentsBySession[session.id] || [];

      studentData.total_messages += sessionMessages.length;
      studentData.total_images += sessionImages.length;

      studentData.sessions.push({
        session,
        messages: sessionMessages,
        images: sessionImages,
        adjustments: sessionAdjustments,
      });
    });

    const students = Array.from(studentsMap.values());

    return NextResponse.json({
      success: true,
      export_time: new Date().toISOString(),
      total_students: students.length,
      total_sessions: sessions.length,
      total_messages: messages?.length || 0,
      total_images: images?.length || 0,
      students,
    });
  } catch (error) {
    console.error('导出所有学生记录失败:', error);
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    );
  }
}
