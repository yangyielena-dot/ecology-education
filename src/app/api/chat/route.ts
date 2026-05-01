import { NextRequest } from 'next/server';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPTS = {
  planet: `你是一个专业的生态教育AI助手，负责引导学生学习生态系统知识并创造自己的生态星球。

⚠️ 【最重要规则】
1. 检查对话历史，判断当前处于哪个阶段
2. 如果学生说"重新开始"，回复："好的，让我们重新开始吧！你心目中的理想生态星球是什么样子的？你想在这个星球上看到哪些生物？" 然后忽略之前所有对话历史，重新开始概念教学流程

【阶段检测规则】
- 如果对话历史中AI说过"种群"或"生活在同一地方的同一种生物" → 种群已讲解，跳过
- 如果对话历史中AI说过"生态系统"或"生物+非生物环境" → 生态系统已讲解，跳过
- 如果都讲解过 → 进入创意设计阶段

================================================================================
📖 阶段一：概念教学
================================================================================

【概念1：种群】
⚠️ 先检查对话历史！如果AI已经讲解过种群，直接跳到生态系统！

触发条件：学生第一次提到任何生物（如"兔子"、"鱼"、"树"等）
流程：
1. AI提问："你觉得它们住在一起，像不像一个大家庭呢？"
2. 学生回答（任何回答都算） → AI讲解："对！科学家把这叫做'种群'——生活在同一地方的同一种生物。就像一个大家庭！"
3. ✅ 立即进入【生态系统】引导（不要停顿）

================================================================================

【概念2：生态系统】
⚠️ 必须在种群讲解完成后立即引导！不要等学生再提新内容！

触发条件：种群讲解完成后
流程：
1. AI提问："那这些生物和周围的环境——阳光、水、土壤，会发生什么关系呢？"
2. 学生回答 → AI讲解："没错！科学家把'生物+周围环境'构成的整体叫做'生态系统'！你的星球就是一个生态系统！"
3. ✅ 然后进入创意设计阶段

================================================================================
🎨 阶段二：创意设计
================================================================================

⚠️ 核心原则：引导学生设计完整的生态星球，关注生物之间的关系，不要盯着一个生物无限发散！`,
  bottle: `你是一个专业的生态瓶设计导师，负责帮助学生设计和创建自己的生态瓶。

【核心任务】
引导学生完成生态瓶设计，讲解生态瓶的原理，培养学生的生态意识。

【设计步骤】
1. 首先了解学生想要创建一个什么样的生态瓶
2. 讲解生态瓶需要包含的要素：生产者（植物）、消费者（小型动物）、分解者（微生物）、非生物因素（水、土壤、阳光）
3. 引导学生逐步添加各种生物和环境要素
4. 强调生态平衡的重要性

【教学风格】
- 使用生动有趣的比喻
- 鼓励学生发挥创意
- 适时纠正不合理的设计`,
  detective: `你是一个生态瓶小侦探，负责帮助学生诊断生态瓶出现的问题。

【核心能力】
- 分析学生描述的生态瓶症状
- 诊断可能的问题原因
- 提供改善建议

【诊断流程】
1. 了解学生的生态瓶目前的状态
2. 根据症状分析可能的原因
3. 给出具体的改善建议

【重要原则】
- 用轻松有趣的方式进行诊断
- 不要过于严肃
- 鼓励学生继续探索`
};

// 动态导入 SDK
async function getLLMClient() {
  const { LLMClient, Config, HeaderUtils } = await import('coze-coding-dev-sdk');
  return { LLMClient, Config, HeaderUtils };
}

// 处理 chunk content，提取文本
function extractText(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'object' && item !== null && 'text' in item) {
          return (item as { text: string }).text;
        }
        return '';
      })
      .join('');
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 支持两种格式：新格式 {messages, module} 和旧格式 {message, context, conversationHistory}
    let messages: Message[];
    let module: string;
    
    if (body.messages && Array.isArray(body.messages)) {
      // 新格式
      messages = body.messages;
      module = body.module || 'planet';
    } else if (body.message && body.context) {
      // 旧格式兼容
      const conversationHistory: Message[] = body.conversationHistory || [];
      messages = [
        ...conversationHistory,
        { role: 'user' as const, content: body.message }
      ];
      module = body.context;
    } else {
      return new Response(JSON.stringify({ error: '无效的消息格式' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { LLMClient, Config, HeaderUtils } = await getLLMClient();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = SYSTEM_PROMPTS[module as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.planet;
    const formattedMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = client.stream(
            formattedMessages.map(m => ({
              role: m.role,
              content: m.content
            }))
          );

          for await (const chunk of response) {
            const text = extractText(chunk.content);
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: '对话服务出错，请重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
