import { NextRequest, NextResponse } from 'next/server';
import { ASRClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioData, audioUrl } = body;

    // 需要提供音频数据或URL
    if (!audioData && !audioUrl) {
      return NextResponse.json(
        { error: '请提供音频数据或音频URL' },
        { status: 400 }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 初始化 ASR 客户端
    const config = new Config();
    const asrClient = new ASRClient(config, customHeaders);

    // 调用语音识别
    const result = await asrClient.recognize({
      uid: 'user-' + Date.now(),
      url: audioUrl,
      base64Data: audioData,
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      duration: result.duration,
    });
  } catch (error) {
    console.error('ASR error:', error);
    return NextResponse.json(
      { error: '语音识别失败，请重试' },
      { status: 500 }
    );
  }
}
