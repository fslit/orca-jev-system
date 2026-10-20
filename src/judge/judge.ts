// Judge 层实现 - 提取自 demo-judge.ts

import type { JudgeResult, JudgeContext } from '../types/judge';

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export async function judgeTask(
  taskDescription: string,
  context: JudgeContext,
  modelConfig: ModelConfig
): Promise<JudgeResult> {
  const prompt = buildJudgePrompt(taskDescription, context);
  const startTime = Date.now();

  const response = await callModel(prompt, modelConfig);
  const latency = Date.now() - startTime;

  const result = parseJudgeResponse(response);

  return {
    ...result,
    metadata: {
      model_used: modelConfig.model,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    },
  };
}

function buildJudgePrompt(description: string, context: JudgeContext): string {
  return `你是 Orca 项目自动化系统的 Judge（评估器）。评估以下开发任务的自动化可行性。

**任务描述**: ${description}

**项目上下文**:
${context.project_type ? `- 项目类型: ${context.project_type}` : ''}
${context.tech_stack ? `- 技术栈: ${context.tech_stack.join(', ')}` : ''}
${context.available_resources ? `- 可用资源: ${context.available_resources.join(', ')}` : ''}

**评估维度**:
1. **automation_score** (0-100): 任务的自动化可行性分数
   - 90-100: 完全可自动化，风险极低
   - 70-89: 高度可自动化，需少量人工审核
   - 50-69: 半自动化，需要人机协作
   - 30-49: 低自动化，主要需人工处理
   - 0-29: 不建议自动化

2. **risk_level** (low/medium/high): 自动化执行的风险等级

3. **strategy** (full_automation/semi_automation/human_first): 推荐策略
   - full_automation: AI 全自动执行，人工事后审核
   - semi_automation: AI 辅助执行，关键环节人工决策
   - human_first: 人工主导，AI 提供建议

4. **reasoning**: 评估理由（2-3 句话）

5. **risks**: 识别的风险列表
   - category: 风险类别
   - severity: 严重程度 (low/medium/high)
   - description: 风险描述
   - mitigation: 缓解措施

6. **confidence** (0-100): 评估的置信度

**输出 JSON 格式**:
{
  "automation_score": 85,
  "risk_level": "low",
  "strategy": "full_automation",
  "reasoning": "...",
  "risks": [
    {
      "category": "security",
      "severity": "medium",
      "description": "...",
      "mitigation": "..."
    }
  ],
  "confidence": 90
}

只返回 JSON，不要其他内容。`;
}

async function callModel(prompt: string, config: ModelConfig): Promise<any> {
  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的软件开发评估专家。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJudgeResponse(content: string): Omit<JudgeResult, 'metadata'> {
  // 移除可能的 markdown 代码块标记
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      automation_score: parsed.automation_score,
      risk_level: parsed.risk_level,
      strategy: parsed.strategy,
      reasoning: parsed.reasoning,
      risks: parsed.risks || [],
      confidence: parsed.confidence,
    };
  } catch (error) {
    throw new Error(`Failed to parse Judge response: ${error instanceof Error ? error.message : String(error)}\nContent: ${cleaned}`);
  }
}
