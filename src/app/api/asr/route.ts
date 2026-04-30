import { NextRequest, NextResponse } from 'next/server';

// 动态导入 SDK 以避免构建时问题
async function getASRClient() {
  const { ASRClient, Config, HeaderUtils } = await import('coze-coding-dev-sdk');
  return { ASRClient, Config, HeaderUtils };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioData, audioUrl } = body;

    if (!audioData && !audioUrl) {
      return NextResponse.json(
        { error: '请提供音频数据或音频URL' },
        { status: 400 }
      );
    }

    const { ASRClient, Config, HeaderUtils } = await getASRClient();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const asrClient = new ASRClient(config, customHeaders);

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
