import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取学生的完整学习记录（用于导出）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');

    if (!student_id) {
      return NextResponse.json(
        { error: '请提供学生ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 查询该学生的所有会话
    const { data: sessions, error: sessionsError } = await client
      .from('learning_sessions')
      .select('*')
      .eq('student_id', student_id)
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
        student_id,
        sessions: [],
        total_sessions: 0,
        total_messages: 0,
        total_images: 0,
      });
    }

    // 获取所有会话的消息
    const sessionIds = sessions.map(s => s.id);
    const { data: messages, error: messagesError } = await client
      .from('conversation_messages')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('查询消息失败:', messagesError);
      return NextResponse.json(
        { error: '查询消息记录失败' },
        { status: 500 }
      );
    }

    // 获取所有会话生成的图片
    const { data: images, error: imagesError } = await client
      .from('generated_images')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    if (imagesError) {
      console.error('查询图片失败:', imagesError);
      // 图片查询失败不影响整体导出，继续处理
    }

    // 将消息按会话分组
    const messagesBySession: Record<string, typeof messages> = {};
    messages?.forEach(msg => {
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
      const sessionImages = imagesBySession[img.session_id];
      if (sessionImages) {
        sessionImages.push(img);
      }
    });

    // 组装完整的学习记录
    const fullRecords = sessions.map(session => ({
      session: {
        id: session.id,
        module_type: session.module_type,
        module_detail: session.module_detail,
        status: session.status,
        score: session.score,
        started_at: session.started_at,
        ended_at: session.ended_at,
      },
      messages: (messagesBySession[session.id] || []).map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
      })),
      images: (imagesBySession[session.id] || []).map(img => ({
        url: img.image_url,
        prompt: img.prompt,
        timestamp: img.created_at,
      })),
    }));

    return NextResponse.json({
      success: true,
      student_id,
      student_name: sessions[0]?.student_name,
      export_time: new Date().toISOString(),
      total_sessions: sessions.length,
      total_messages: messages?.length || 0,
      total_images: images?.length || 0,
      sessions: fullRecords,
    });
  } catch (error) {
    console.error('导出学习记录异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
