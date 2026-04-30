import { NextRequest } from 'next/server';

// 动态导入 SDK
async function getImageClient() {
  const { ImageGenerationClient, Config, HeaderUtils } = await import('coze-coding-dev-sdk');
  return { ImageGenerationClient, Config, HeaderUtils };
}

export async function POST(request: NextRequest) {
  try {
    const { caseId, params, isTreated } = await request.json();
    const { ImageGenerationClient, Config, HeaderUtils } = await getImageClient();
    
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    let prompt = '';
    
    if (isTreated) {
      prompt = `A cartoon illustration of a healthy ecological bottle (terrarium): a glass bottle with clear water, ${params.fishCount} happy small fish swimming actively, ${params.plantDensity > 50 ? 'lush green' : 'moderate'} aquatic plants, clean environment, bright and cheerful colors, educational style for children, simple and cute art style`;
    } else {
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
      return new Response(JSON.stringify({ 
        success: true, 
        imageUrl: helper.imageUrls[0] 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: helper.errorMessages.join(', ') || '图片生成失败' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Generate image error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '图片生成失败，请稍后再试' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
