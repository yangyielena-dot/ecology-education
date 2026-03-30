import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { caseId, params, isTreated } = await request.json();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    // 根据病例和参数生成描述
    let prompt = '';
    
    if (isTreated) {
      // 治疗后的健康生态瓶
      prompt = `A cartoon illustration of a healthy ecological bottle (terrarium): a glass bottle with clear water, ${params.fishCount} happy small fish swimming actively, ${params.plantDensity > 50 ? 'lush green' : 'moderate'} aquatic plants, clean environment, bright and cheerful colors, educational style for children, simple and cute art style`;
    } else {
      // 根据病例生成对应的状态
      const casePrompts: Record<string, string> = {
        'floating-head': 'A cartoon illustration of an ecological bottle (terrarium) showing sick condition: fish swimming near the water surface gasping for air (floating head disease), aquatic plants turning yellowish, water looks slightly murky, educational style for children, simple and cute art style',
        'green-water': 'A cartoon illustration of an ecological bottle (terrarium) showing sick condition: murky green water from algae bloom, fish looking lethargic, educational style for children, simple and cute art style',
        'dead-silence': 'A cartoon illustration of an ecological bottle (terrarium) showing sick condition: crystal clear water but no living fish, wilted dead plants at the bottom, sad empty atmosphere, educational style for children, simple and cute art style',
      };
      prompt = casePrompts[caseId] || casePrompts['floating-head'];
    }

    const response = await client.generate({
      prompt,
      size: '2K'
    });

    const helper = client.getResponseHelper(response);

    if (helper.success && helper.imageUrls.length > 0) {
      return NextResponse.json({ 
        success: true, 
        imageUrl: helper.imageUrls[0] 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: helper.errorMessages.join(', ') || '图片生成失败' 
    }, { status: 500 });
  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '图片生成失败，请稍后再试' 
    }, { status: 500 });
  }
}
