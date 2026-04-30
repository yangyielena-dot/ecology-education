import { NextRequest } from 'next/server';

// 动态导入 SDK
async function getImageClient() {
  const { ImageGenerationClient, Config, HeaderUtils } = await import('coze-coding-dev-sdk');
  return { ImageGenerationClient, Config, HeaderUtils };
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '2K' } = await request.json();
    const { ImageGenerationClient, Config, HeaderUtils } = await getImageClient();
    
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    const enhancedPrompt = `${prompt} 严格按照描述生成，不添加任何未提及的生物或元素。`;

    const response = await client.generate({
      prompt: enhancedPrompt,
      size: size,
      watermark: false,
    });

    const helper = client.getResponseHelper(response);

    if (helper.success && helper.imageUrls.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        imageUrl: helper.imageUrls[0],
        message: '图片生成成功！',
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: helper.errorMessages.join(', ') || '图片生成失败',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '图片生成过程中出现错误',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
