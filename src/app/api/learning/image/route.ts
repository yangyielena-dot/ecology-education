import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 保存AI生成的图片
export async function POST(request: NextRequest) {
  try {
    const { session_id, image_url, prompt } = await request.json();

    if (!session_id || !image_url) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('generated_images')
      .insert({
        session_id,
        image_url,
        prompt: prompt || null,
      })
      .select()
      .single();

    if (error) {
      console.error('保存图片失败:', error);
      return NextResponse.json(
        { error: '保存图片失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: data,
    });
  } catch (error) {
    console.error('保存图片异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
