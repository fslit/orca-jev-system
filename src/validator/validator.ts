// Validator 层实现 - 并发验证多个维度

import type { ExecutionPlan } from '../types/evaluator';
import type { ValidatorResult, ValidationContext, ValidationIssue, Optimization } from '../types/validator';
import type { ModelConfig } from '../judge/judge';

export async function validatePlan(
  plan: ExecutionPlan,
  context: ValidationContext,
  modelConfig: ModelConfig
): Promise<ValidatorResult> {
  const startTime = Date.now();

  // 并发验证 5 个维度
  const [
    technicalIssues,
    resourceIssues,
    dependencyIssues,
    securityIssues,
    optimizationSuggestions,
  ] = await Promise.all([
    validateTechnicalFeasibility(plan, context, modelConfig),
    validateResourceAvailability(plan, context, modelConfig),
    validateDependencies(plan, modelConfig),
    validateSecurityRisks(plan, modelConfig),
    findOptimizations(plan, modelConfig),
  ]);

  const latency = Date.now() - startTime;

  // 合并所有问题
  const allIssues = [
    ...technicalIssues,
    ...resourceIssues,
    ...dependencyIssues,
    ...securityIssues,
  ];

  // 分类为阻塞问题和警告
  const blockingIssues = allIssues.filter(issue => issue.severity === 'critical' || issue.severity === 'high');
  const warnings = allIssues.filter(issue => issue.severity === 'medium' || issue.severity === 'low');

  // 决定验证结果
  const validationResult = determineValidationResult(blockingIssues, warnings, optimizationSuggestions);

  // 应用优化（如果需要）
  const adjustedPlan = applyOptimizations(plan, optimizationSuggestions);

  // 计算最终指标
  const finalMetrics = calculateFinalMetrics(adjustedPlan || plan, optimizationSuggestions);

  // 计算可行性分数
  const feasibilityScore = calculateFeasibilityScore(blockingIssues, warnings, plan);

  return {
    plan_id: plan.plan_id,
    validation_result: validationResult,
    feasibility_score,
    blocking_issues: blockingIssues,
    warnings,
    optimizations: optimizationSuggestions,
    adjusted_plan: adjustedPlan,
    final_metrics: finalMetrics,
    reasoning: buildValidationReasoning(validationResult, blockingIssues, warnings, optimizationSuggestions),
    metadata: {
      latency_ms: latency,
      model_used: modelConfig.model,
      timestamp: new Date().toISOString(),
    },
  };
}

async function validateTechnicalFeasibility(
  plan: ExecutionPlan,
  context: ValidationContext,
  modelConfig: ModelConfig
): Promise<ValidationIssue[]> {
  const prompt = `验证以下执行方案的技术可行性：

**项目上下文**:
- 项目类型: ${context.project_type}
- 技术栈: ${context.tech_stack.join(', ')}

**执行方案**:
${JSON.stringify(plan.tasks, null, 2)}

**验证要点**:
1. 技术栈是否支持所有任务
2. 任务之间的技术兼容性
3. 自动化工具的可用性

**输出 JSON 格式**:
{
  "issues": [
    {
      "severity": "high",
      "category": "technical",
      "message": "技术栈不支持 XXX",
      "affected_tasks": ["1", "2"],
      "mitigation": "建议切换到 YYY"
    }
  ]
}

只返回 JSON，如果没有问题返回空数组。`;

  const response = await callModel(prompt, modelConfig);
  return parseIssuesResponse(response);
}

async function validateResourceAvailability(
  plan: ExecutionPlan,
  context: ValidationContext,
  modelConfig: ModelConfig
): Promise<ValidationIssue[]> {
  const prompt = `验证以下执行方案的资源可用性：

**可用资源**: ${context.available_resources.join(', ')}

**执行方案**:
${JSON.stringify(plan.tasks, null, 2)}

**验证要点**:
1. 数据库、缓存等基础设施是否就绪
2. 外部服务依赖是否可用
3. 环境配置是否完整

**输出 JSON 格式**:
{
  "issues": [
    {
      "severity": "critical",
      "category": "resource",
      "message": "MySQL 数据库未配置",
      "affected_tasks": ["2", "3"],
      "mitigation": "先执行数据库初始化脚本"
    }
  ]
}

只返回 JSON，如果没有问题返回空数组。`;

  const response = await callModel(prompt, modelConfig);
  return parseIssuesResponse(response);
}

async function validateDependencies(
  plan: ExecutionPlan,
  modelConfig: ModelConfig
): Promise<ValidationIssue[]> {
  const prompt = `验证以下执行方案的任务依赖关系：

**执行方案**:
${JSON.stringify(plan.tasks, null, 2)}

**验证要点**:
1. 是否存在循环依赖
2. 依赖的任务 ID 是否存在
3. 并行任务组是否冲突

**输出 JSON 格式**:
{
  "issues": [
    {
      "severity": "critical",
      "category": "dependency",
      "message": "检测到循环依赖: 1 -> 2 -> 1",
      "affected_tasks": ["1", "2"],
      "mitigation": "调整任务顺序"
    }
  ]
}

只返回 JSON，如果没有问题返回空数组。`;

  const response = await callModel(prompt, modelConfig);
  return parseIssuesResponse(response);
}

async function validateSecurityRisks(
  plan: ExecutionPlan,
  modelConfig: ModelConfig
): Promise<ValidationIssue[]> {
  const prompt = `验证以下执行方案的安全风险：

**执行方案**:
${JSON.stringify(plan.tasks, null, 2)}

**验证要点**:
1. 敏感信息处理（密钥、密码）
2. 权限和访问控制
3. 数据安全和隐私

**输出 JSON 格式**:
{
  "issues": [
    {
      "severity": "high",
      "category": "security",
      "message": "JWT 密钥硬编码风险",
      "affected_tasks": ["2"],
      "mitigation": "使用环境变量存储密钥"
    }
  ]
}

只返回 JSON，如果没有问题返回空数组。`;

  const response = await callModel(prompt, modelConfig);
  return parseIssuesResponse(response);
}

async function findOptimizations(
  plan: ExecutionPlan,
  modelConfig: ModelConfig
): Promise<Optimization[]> {
  const prompt = `为以下执行方案提供优化建议：

**执行方案**:
${JSON.stringify(plan, null, 2)}

**优化方向**:
1. merge_tasks: 合并可以一起完成的任务
2. parallel_execution: 识别可以并行的任务
3. tool_selection: 推荐更高效的工具
4. cost_reduction: 降低成本的方法

**输出 JSON 格式**:
{
  "optimizations": [
    {
      "type": "merge_tasks",
      "target_tasks": ["3", "4"],
      "reason": "两个任务都是编写测试用例，可以合并",
      "time_saved_minutes": 5,
      "cost_saved_usd": 0.001
    },
    {
      "type": "parallel_execution",
      "target_tasks": ["5", "6"],
      "reason": "这两个任务无依赖关系，可以并行执行",
      "time_saved_minutes": 15
    }
  ]
}

只返回 JSON，如果没有优化建议返回空数组。`;

  const response = await callModel(prompt, modelConfig);
  return parseOptimizationsResponse(response);
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
          content: '你是一个专业的项目验证专家，擅长识别问题和优化机会。',
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

function parseIssuesResponse(content: string): ValidationIssue[] {
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed.issues || [];
  } catch (error) {
    console.warn('Failed to parse issues response, returning empty array:', error);
    return [];
  }
}

function parseOptimizationsResponse(content: string): Optimization[] {
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed.optimizations || [];
  } catch (error) {
    console.warn('Failed to parse optimizations response, returning empty array:', error);
    return [];
  }
}

function determineValidationResult(
  blockingIssues: ValidationIssue[],
  warnings: ValidationIssue[],
  optimizations: Optimization[]
): 'approved' | 'rejected' | 'needs_modification' {
  if (blockingIssues.length > 0) {
    return 'rejected';
  }

  if (warnings.length > 2 || optimizations.length > 0) {
    return 'needs_modification';
  }

  return 'approved';
}

function applyOptimizations(
  plan: ExecutionPlan,
  optimizations: Optimization[]
): ExecutionPlan | undefined {
  if (optimizations.length === 0) {
    return undefined;
  }

  // 简化实现：返回原计划的拷贝
  // 实际应用优化建议需要更复杂的逻辑
  return { ...plan };
}

function calculateFinalMetrics(
  plan: ExecutionPlan,
  optimizations: Optimization[]
): {
  total_time_minutes: number;
  total_cost_usd: number;
  risk_score: number;
  automation_ratio: number;
} {
  const timeSaved = optimizations
    .filter(opt => opt.time_saved_minutes)
    .reduce((sum, opt) => sum + (opt.time_saved_minutes || 0), 0);

  const costSaved = optimizations
    .filter(opt => opt.cost_saved_usd)
    .reduce((sum, opt) => sum + (opt.cost_saved_usd || 0), 0);

  return {
    total_time_minutes: Math.max(plan.total_time_minutes - timeSaved, 1),
    total_cost_usd: Math.max(plan.total_cost_usd - costSaved, 0),
    risk_score: plan.risk_score,
    automation_ratio: plan.automation_ratio,
  };
}

function calculateFeasibilityScore(
  blockingIssues: ValidationIssue[],
  warnings: ValidationIssue[],
  plan: ExecutionPlan
): number {
  let score = 100;

  // 阻塞问题扣分
  score -= blockingIssues.length * 25;

  // 警告扣分
  score -= warnings.filter(w => w.severity === 'medium').length * 10;
  score -= warnings.filter(w => w.severity === 'low').length * 5;

  // 基于方案置信度调整
  score = score * (plan.confidence / 100);

  return Math.max(0, Math.min(100, score));
}

function buildValidationReasoning(
  result: 'approved' | 'rejected' | 'needs_modification',
  blockingIssues: ValidationIssue[],
  warnings: ValidationIssue[],
  optimizations: Optimization[]
): string {
  if (result === 'approved') {
    return `方案可行，所有验证通过。${warnings.length > 0 ? `发现 ${warnings.length} 个低优先级警告，建议关注。` : ''}`;
  }

  if (result === 'rejected') {
    return `方案存在 ${blockingIssues.length} 个阻塞问题，必须解决后才能执行。主要问题：${blockingIssues.slice(0, 2).map(i => i.message).join('；')}。`;
  }

  return `方案基本可行，但建议进行优化。${warnings.length > 0 ? `发现 ${warnings.length} 个警告。` : ''}${optimizations.length > 0 ? `有 ${optimizations.length} 个优化建议可以提升效率。` : ''}`;
}
