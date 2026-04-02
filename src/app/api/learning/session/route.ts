import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 创建学习会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, student_name, module_type, module_detail } = body;

    if (!student_id || !module_type) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('learning_sessions')
      .insert({
        student_id,
        student_name,
        module_type,
        module_detail,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('创建会话失败:', error);
      return NextResponse.json(
        { error: '创建会话失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, session: data });
  } catch (error) {
    console.error('创建会话异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 查询学习记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const module_type = searchParams.get('module_type');
    const module_detail = searchParams.get('module_detail');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const client = getSupabaseClient();
    
    let query = client
      .from('learning_sessions')
      .select('*, conversation_messages(*)')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (student_id) {
      query = query.eq('student_id', student_id);
    }
    if (module_type) {
      query = query.eq('module_type', module_type);
    }
    if (module_detail) {
      query = query.eq('module_detail', module_detail);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('查询学习记录失败:', error);
      return NextResponse.json(
        { error: '查询失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sessions: data });
  } catch (error) {
    console.error('查询学习记录异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
