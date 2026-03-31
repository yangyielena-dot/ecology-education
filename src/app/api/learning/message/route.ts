import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 保存对话消息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, role, content, metadata } = body;

    if (!session_id || !role || !content) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('conversation_messages')
      .insert({
        session_id,
        role,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .select()
      .single();

    if (error) {
      console.error('保存消息失败:', error);
      return NextResponse.json(
        { error: '保存消息失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: data });
  } catch (error) {
    console.error('保存消息异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
