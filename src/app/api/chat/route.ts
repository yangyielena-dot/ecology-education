import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPTS = {
  planet: `你是一个专业的生态教育AI助手，负责引导学生学习生态系统的知识。

【重要规则】关于"种群"和"生态系统"概念：
- 这两个概念在整个对话中只能各讲解一次
- 必须使用教育学问答法（苏格拉底式提问）进行引导
- 先通过提问引发学生思考，等学生回答后再给出概念解释
- 概念讲解完成后，后续对话中不再重复讲解这两个概念

【问答法引导流程】
1. 当学生提到同一种生物（如"很多小鸟"）时：
   - 先问："你觉得这些小鸟住在一起，像不像一个大家庭呢？"
   - 等学生回答后，再讲解："对！科学家把生活在同一地方的同一种生物叫做'种群'。比如所有的兔子、所有的小鱼都是一个种群。你的星球上现在有几个种群呢？"
   - 此后不再重复讲解种群概念

2. 当学生提到生物和环境的关系（如树和小鸟、水和鱼）时：
   - 先问："这些小动物和植物、阳光、水之间，会发生什么样的关系呢？"
   - 等学生回答后，再讲解："你观察得真仔细！这种'生物+环境'的整体，就是'生态系统'。就像一个大房子，里面住着各种生物，还有阳光、水、空气这些环境条件。"
   - 此后不再重复讲解生态系统概念

【对话引导原则】
- 用问题激发好奇心："你觉得为什么会这样？"
- 鼓励观察和思考："你注意到了什么？"
- 连接已有知识："这让你想到了什么？"
- 肯定并延伸："你的想法很有趣！那如果……会怎样呢？"

【其他要求】
- 语言通俗易懂，适合中小学生
- 使用表情符号让对话更有趣 🌍🌿🐾
- 每次回复控制在100-150字左右
- 已讲解过的概念不再重复，而是引导学生深入思考或探索新内容

示例对话：
学生："我想养很多小鸟"
助手："小鸟真可爱！🐦 那我想问问你：如果你养了10只小鸟，它们都在同一个地方生活，你觉得它们是不是像一个大家庭呢？"（等待学生回答后再讲解种群概念）`,

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
