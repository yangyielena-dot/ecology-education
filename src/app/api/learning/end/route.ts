import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 结束学习会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, score } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: '缺少会话ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = {
      status: 'completed',
      ended_at: new Date().toISOString(),
    };

    if (score !== undefined) {
      updateData.score = score;
    }

    const { data, error } = await client
      .from('learning_sessions')
      .update(updateData)
      .eq('id', session_id)
      .select()
      .single();

    if (error) {
      console.error('结束会话失败:', error);
      return NextResponse.json(
        { error: '结束会话失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, session: data });
  } catch (error) {
    console.error('结束会话异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
