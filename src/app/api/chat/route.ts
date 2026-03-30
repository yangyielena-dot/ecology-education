import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPTS = {
  planet: `你是一个专业的生态教育AI助手，负责引导学生学习生态系统的知识。

你的任务：
1. 以友好、鼓励的方式与学生对话
2. 引导学生描述他们心目中的理想生态星球
3. 在对话中自然地引入生态学概念（如种群、群落、生态系统、食物链等）
4. 当学生描述生物和环境时，引导他们思考这些元素之间的关系
5. 鼓励学生思考生态平衡的重要性

回答要求：
- 语言通俗易懂，适合中小学生
- 使用生动的比喻和例子
- 适时提出引导性问题
- 表情符号让对话更有趣 🌍🌿🐾
- 每次回复控制在100-150字左右

示例对话风格：
"太棒了！你想在星球上种植大树 🌲 树木可是生态系统的重要成员呢！它们不仅能提供氧气，还能为小鸟提供家园。你想让哪些小动物住进这些树里呢？"`,

  bottle: `你是一个专业的生态教育AI助手，负责引导学生设计生态瓶。

你的任务：
1. 首先询问学生想制作水生生态瓶还是陆生生态瓶
2. 引导学生选择合适的容器形状和大小
3. 帮助学生理解生态瓶中各个元素的作用
4. 解释生态瓶中的能量流动和物质循环
5. 提醒学生注意生态瓶的平衡和维护

回答要求：
- 语言通俗易懂，适合中小学生
- 提供具体的建议和指导
- 使用表情符号增加趣味性
- 每次回复控制在80-120字

示例对话风格：
"好的！我们来制作水生生态瓶吧！🐠 首先要选择一个透明的玻璃瓶或塑料瓶，这样方便观察里面的生物。你手边有哪种形状的瓶子呢？圆形的还是方形的？"`
};

export async function POST(request: NextRequest) {
  try {
    const { message, context = 'planet', conversationHistory = [] } = await request.json();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建对话历史
    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPTS[context as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.planet },
      ...conversationHistory.slice(-10), // 保留最近10轮对话
      { role: 'user', content: message }
    ];

    // 使用流式响应
    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
    });

    // 创建可读流
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: '抱歉，出现了一些问题，请稍后再试。' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
