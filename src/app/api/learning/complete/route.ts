import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 完成学习会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, score } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: '请提供会话ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 更新会话状态为完成
    const updateData: Record<string, unknown> = {
      status: 'completed',
      ended_at: new Date().toISOString(),
    };

    if (score !== undefined && score !== null) {
      updateData.score = score;
    }

    const { error } = await client
      .from('learning_sessions')
      .update(updateData)
      .eq('id', session_id);

    if (error) {
      console.error('完成会话失败:', error);
      return NextResponse.json(
        { error: '完成学习失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '学习会话已完成',
    });
  } catch (error) {
    console.error('完成学习异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
