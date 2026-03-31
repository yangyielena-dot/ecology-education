import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '2K' } = await request.json();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    // 生成图片，添加负面提示避免额外元素
    const enhancedPrompt = `${prompt} 严格按照描述生成，不添加任何未提及的生物或元素。`;

    // 生成图片
    const response = await client.generate({
      prompt: enhancedPrompt,
      size: size,
      watermark: false,
    });

    const helper = client.getResponseHelper(response);

    if (helper.success && helper.imageUrls.length > 0) {
      return NextResponse.json({
        success: true,
        imageUrl: helper.imageUrls[0],
        message: '图片生成成功！',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: helper.errorMessages.join(', ') || '图片生成失败',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '图片生成过程中出现错误',
      },
      { status: 500 }
    );
  }
}
