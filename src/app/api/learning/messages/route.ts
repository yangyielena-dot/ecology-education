import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取会话的历史消息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: '缺少session_id参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('conversation_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('查询消息失败:', error);
      return NextResponse.json(
        { error: '查询失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messages: data });
  } catch (error) {
    console.error('查询消息异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
