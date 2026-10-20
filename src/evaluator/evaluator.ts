// Evaluator 层实现 - 并发生成 3 个方案

import type { JudgeResult } from '../types/judge';
import type { EvaluatorResult, ExecutionPlan } from '../types/evaluator';
import type { ModelConfig } from '../judge/judge';

export async function evaluateTask(
  judgeResult: JudgeResult,
  taskDescription: string,
  modelConfig: ModelConfig
): Promise<EvaluatorResult> {
  const startTime = Date.now();

  // 并发生成 3 个方案
  const [conservative, balanced, aggressive] = await Promise.all([
    generatePlan('conservative', judgeResult, taskDescription, modelConfig),
    generatePlan('balanced', judgeResult, taskDescription, modelConfig),
    generatePlan('aggressive', judgeResult, taskDescription, modelConfig),
  ]);

  const latency = Date.now() - startTime;

  // 选择推荐方案（基于 Judge 的 strategy）
  const recommended = selectRecommendedPlan(judgeResult.strategy);

  return {
    plans: [conservative, balanced, aggressive],
    recommended,
    reasoning: buildRecommendationReasoning(judgeResult, [conservative, balanced, aggressive]),
    metadata: {
      judge_input: judgeResult,
      generated_at: new Date().toISOString(),
      model_used: modelConfig.model,
      latency_ms: latency,
    },
  };
}

async function generatePlan(
  planType: 'conservative' | 'balanced' | 'aggressive',
  judgeResult: JudgeResult,
  taskDescription: string,
  modelConfig: ModelConfig
): Promise<ExecutionPlan> {
  const prompt = buildPlanPrompt(planType, judgeResult, taskDescription);

  const response = await callModel(prompt, modelConfig);
  const plan = parsePlanResponse(response, planType);

  return plan;
}

function buildPlanPrompt(
  planType: 'conservative' | 'balanced' | 'aggressive',
  judgeResult: JudgeResult,
  taskDescription: string
): string {
  const planConfig = {
    conservative: {
      name: '保守方案',
      strategy: 'human_first',
      automation_ratio: 0.3,
      risk_tolerance: 'low',
      description: '人工主导，AI 提供辅助',
    },
    balanced: {
      name: '平衡方案',
      strategy: 'semi_automation',
      automation_ratio: 0.6,
      risk_tolerance: 'medium',
      description: '人机协作，关键环节人工决策',
    },
    aggressive: {
      name: '激进方案',
      strategy: 'full_automation',
      automation_ratio: 0.9,
      risk_tolerance: 'high',
      description: 'AI 全自动执行，人工事后审核',
    },
  };

  const config = planConfig[planType];

  return `你是 Orca 项目自动化系统的 Evaluator（评估器）。

根据 Judge 的评估结果，生成 **${config.name}** 执行方案。

**任务描述**: ${taskDescription}

**Judge 评估结果**:
- automation_score: ${judgeResult.automation_score}/100
- risk_level: ${judgeResult.risk_level}
- strategy: ${judgeResult.strategy}
- reasoning: ${judgeResult.reasoning}

**方案要求**:
- 方案类型: ${config.name} (${planType})
- 执行策略: ${config.strategy}
- 目标自动化率: ${(config.automation_ratio * 100).toFixed(0)}%
- 风险容忍度: ${config.risk_tolerance}
- 方案特点: ${config.description}

**任务分解要求**:
1. 将任务分解为 3-8 个子任务
2. 每个任务标注:
   - task_id: 唯一标识符
   - name: 任务名称
   - type: manual（人工）/ automated（自动）/ review（审核）
   - owner: human（人工）/ ai（AI）
   - estimated_time_minutes: 预估时间（分钟）
   - estimated_cost_usd: 预估成本（美元，AI 任务需要）
   - dependencies: 依赖的任务 ID 列表
   - description: 任务详细描述
   - parallel_group: 可并行执行的任务组编号（可选）

3. 计算总时间、总成本、自动化比例、风险分数
4. 识别可并行执行的任务（无依赖关系的任务可以并行）

**并行执行规则**:
- parallel_group: 相同组号的任务可以并行执行
- 无依赖关系的任务应尽量并行，减少总时间
- 有依赖关系的任务必须串行

**输出 JSON 格式**:
{
  "plan_id": "${planType}",
  "name": "${config.name}",
  "strategy": "${config.strategy}",
  "tasks": [
    {
      "task_id": "1",
      "name": "任务名称",
      "type": "manual",
      "owner": "human",
      "estimated_time_minutes": 30,
      "estimated_cost_usd": 0,
      "dependencies": [],
      "description": "任务详细描述",
      "parallel_group": 1
    }
  ],
  "total_time_minutes": 120,
  "total_cost_usd": 0.003,
  "automation_ratio": ${config.automation_ratio},
  "risk_score": 25,
  "confidence": 88,
  "parallel_execution": {
    "groups": 3,
    "max_parallelism": 4
  }
}

**注意**:
- total_time_minutes: 考虑并行执行后的实际时间（不是所有任务时间相加）
- automation_ratio: 实际自动化任务时间占比
- risk_score: 基于 Judge 的 risk_level 和方案类型计算
- parallel_execution.groups: 并行任务组数量
- parallel_execution.max_parallelism: 最大并行任务数

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
          content: '你是一个专业的项目规划专家，擅长任务分解和并行优化。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parsePlanResponse(
  content: string,
  planType: 'conservative' | 'balanced' | 'aggressive'
): ExecutionPlan {
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      plan_id: planType,
      name: parsed.name,
      strategy: parsed.strategy,
      tasks: parsed.tasks,
      total_time_minutes: parsed.total_time_minutes,
      total_cost_usd: parsed.total_cost_usd,
      automation_ratio: parsed.automation_ratio,
      risk_score: parsed.risk_score,
      confidence: parsed.confidence,
      parallel_execution: parsed.parallel_execution,
    };
  } catch (error) {
    throw new Error(`Failed to parse plan response: ${error instanceof Error ? error.message : String(error)}\nContent: ${cleaned}`);
  }
}

function selectRecommendedPlan(
  judgeStrategy: 'full_automation' | 'semi_automation' | 'human_first'
): 'conservative' | 'balanced' | 'aggressive' {
  const mapping = {
    human_first: 'conservative',
    semi_automation: 'balanced',
    full_automation: 'aggressive',
  } as const;

  return mapping[judgeStrategy];
}

function buildRecommendationReasoning(
  judgeResult: JudgeResult,
  plans: ExecutionPlan[]
): string {
  const recommended = selectRecommendedPlan(judgeResult.strategy);
  const plan = plans.find(p => p.plan_id === recommended)!;

  return `基于 Judge 的评估（automation_score=${judgeResult.automation_score}，risk_level=${judgeResult.risk_level}），推荐使用 ${plan.name}。该方案在时间（${plan.total_time_minutes}分钟）、成本（$${plan.total_cost_usd.toFixed(4)}）、风险（${plan.risk_score}/100）之间取得最优平衡，自动化率为 ${(plan.automation_ratio * 100).toFixed(0)}%。`;
}
