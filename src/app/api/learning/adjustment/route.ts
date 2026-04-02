import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 保存生态瓶数据调整记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      adjustment_type,
      element_id,
      element_name,
      delta,
      new_value,
      light_hours,
      elements_snapshot,
      env_data,
    } = body;

    if (!session_id || !adjustment_type) {
      return NextResponse.json(
        { error: '请提供会话ID和调整类型' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { error } = await client
      .from('bottle_adjustments')
      .insert({
        session_id,
        adjustment_type,
        element_id,
        element_name,
        delta,
        new_value,
        light_hours,
        elements_snapshot: elements_snapshot ? JSON.stringify(elements_snapshot) : null,
        env_data: env_data ? JSON.stringify(env_data) : null,
      });

    if (error) {
      console.error('保存调整记录失败:', error);
      return NextResponse.json(
        { error: '保存调整记录失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '调整记录已保存',
    });
  } catch (error) {
    console.error('保存调整记录异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
