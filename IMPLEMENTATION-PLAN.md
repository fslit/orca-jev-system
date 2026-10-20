# Orca JEV 系统完整实施计划

**目标**: 从当前 Demo 到生产可用的完整 JEV 决策系统

**当前状态**: ✅ Judge 层 Demo 完成 + 模型对比测试完成

---

## 📊 当前进度总览

```
Phase 0: Demo & 验证          ████████████████████ 100% ✅
Phase 1: Evaluator 层         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 2: Validator 层         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 3: 完整 JEV 流程        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: 模型路由引擎         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: CLI 工具             ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: 可观测性             ░░░░░░░░░░░░░░░░░░░░   0%
Phase 7: 生产优化             ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## Phase 0: Demo & 验证 ✅ 已完成

### 已完成项
- [x] Judge 层 Demo (`demo-judge.ts`)
- [x] DeepSeek 模型验证
- [x] OpenRouter 模型对比测试
- [x] 模型对比报告
- [x] GitHub 仓库创建
- [x] 文档同步到 Obsidian

### 交付物
- `demo-judge.ts` - Judge 层工作示例
- `demo-compare.ts` - 模型对比脚本
- `model-comparison-report.md` - 详细对比分析
- 3 个测试用例的 Judge 输出 JSON

---

## Phase 1: Evaluator 层实现

**时间**: 1-2 天  
**目标**: 根据 Judge 结果生成 3 种执行方案

### Task 1.1: Evaluator 核心逻辑

#### 输入
```json
{
  "automation_score": 82,
  "risk_level": "medium",
  "strategy": "semi_automation",
  "reasoning": "登录接口模式成熟...",
  "risks": [...],
  "confidence": 85
}
```

#### 输出
```json
{
  "plans": [
    {
      "plan_id": "conservative",
      "name": "保守方案",
      "strategy": "human_first",
      "tasks": [
        {
          "task_id": "1",
          "name": "设计 JWT 密钥管理方案",
          "type": "manual",
          "owner": "human",
          "estimated_time_minutes": 30,
          "dependencies": []
        },
        {
          "task_id": "2",
          "name": "生成用户登录接口代码框架",
          "type": "automated",
          "owner": "ai",
          "estimated_time_minutes": 5,
          "dependencies": ["1"]
        }
      ],
      "total_time_minutes": 120,
      "total_cost_usd": 0.003,
      "automation_ratio": 0.4,
      "risk_score": 15,
      "confidence": 92
    },
    {
      "plan_id": "balanced",
      "name": "平衡方案",
      "strategy": "semi_automation",
      "tasks": [...],
      "total_time_minutes": 60,
      "total_cost_usd": 0.008,
      "automation_ratio": 0.7,
      "risk_score": 35,
      "confidence": 85
    },
    {
      "plan_id": "aggressive",
      "name": "激进方案",
      "strategy": "full_automation",
      "tasks": [...],
      "total_time_minutes": 15,
      "total_cost_usd": 0.015,
      "automation_ratio": 0.95,
      "risk_score": 65,
      "confidence": 68
    }
  ],
  "recommended": "balanced",
  "reasoning": "平衡方案在时间、成本、风险之间取得最优权衡..."
}
```

#### 实现步骤

**Step 1: 创建类型定义**
```typescript
// src/types/evaluator.ts
interface Task {
  task_id: string;
  name: string;
  type: 'manual' | 'automated' | 'review';
  owner: 'human' | 'ai';
  estimated_time_minutes: number;
  estimated_cost_usd?: number;
  dependencies: string[];
  description?: string;
}

interface ExecutionPlan {
  plan_id: 'conservative' | 'balanced' | 'aggressive';
  name: string;
  strategy: 'human_first' | 'semi_automation' | 'full_automation';
  tasks: Task[];
  total_time_minutes: number;
  total_cost_usd: number;
  automation_ratio: number;  // 0-1
  risk_score: number;        // 0-100
  confidence: number;        // 0-100
}

interface EvaluatorResult {
  plans: ExecutionPlan[];
  recommended: 'conservative' | 'balanced' | 'aggressive';
  reasoning: string;
  metadata: {
    judge_input: JudgeResult;
    generated_at: string;
    model_used: string;
  };
}
```

**Step 2: 实现 Evaluator 引擎**
```typescript
// src/evaluator/evaluator.ts
async function evaluateTask(
  judgeResult: JudgeResult,
  taskDescription: string,
  apiKey: string
): Promise<EvaluatorResult> {
  const prompt = buildEvaluatorPrompt(judgeResult, taskDescription);
  const response = await callDeepSeek(prompt, apiKey);
  return parseEvaluatorResponse(response);
}

function buildEvaluatorPrompt(
  judgeResult: JudgeResult,
  taskDescription: string
): string {
  return `你是 Orca 项目自动化系统的 Evaluator（评估器）。

根据 Judge 的评估结果，生成 3 种执行方案：

**任务描述**: ${taskDescription}

**Judge 评估结果**:
- automation_score: ${judgeResult.automation_score}
- risk_level: ${judgeResult.risk_level}
- strategy: ${judgeResult.strategy}
- risks: ${JSON.stringify(judgeResult.risks, null, 2)}

**要求**:
1. 生成 3 种方案（conservative 保守、balanced 平衡、aggressive 激进）
2. 每个方案包含任务分解（tasks 数组）
3. 每个任务标注类型（manual/automated/review）和责任人（human/ai）
4. 计算总时间、总成本、自动化比例、风险分数
5. 推荐最优方案并说明理由

**输出 JSON 格式**，参考以下结构：
{
  "plans": [
    {
      "plan_id": "conservative",
      "name": "保守方案",
      "strategy": "human_first",
      "tasks": [
        {
          "task_id": "1",
          "name": "任务名称",
          "type": "manual|automated|review",
          "owner": "human|ai",
          "estimated_time_minutes": 30,
          "estimated_cost_usd": 0.001,
          "dependencies": [],
          "description": "任务详细描述"
        }
      ],
      "total_time_minutes": 120,
      "total_cost_usd": 0.003,
      "automation_ratio": 0.4,
      "risk_score": 15,
      "confidence": 92
    },
    // ... balanced, aggressive
  ],
  "recommended": "balanced",
  "reasoning": "推荐理由"
}

只返回 JSON，不要其他内容。`;
}
```

**Step 3: 实现 demo-evaluator.ts**
```typescript
// demo-evaluator.ts
#!/usr/bin/env tsx

import * as fs from 'fs';
import { evaluateTask } from './src/evaluator/evaluator';
import type { JudgeResult } from './src/types/judge';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || 'http://172.87.28.157:8080';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 缺少 DEEPSEEK_API_KEY 环境变量');
  process.exit(1);
}

const testCases = [
  {
    description: '实现用户登录接口，支持 JWT + Redis 会话管理。项目类型：backend，技术栈：Go, goframe-v2, MySQL, Redis',
    judgeResultFile: '/tmp/judge-result-2.json',
  },
];

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  Orca JEV - Evaluator 层测试                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  for (const testCase of testCases) {
    console.log(`📝 任务: ${testCase.description}\n`);
    
    // 读取 Judge 结果
    const judgeResult: JudgeResult = JSON.parse(
      fs.readFileSync(testCase.judgeResultFile, 'utf-8')
    );
    
    console.log('📊 Judge 评估:');
    console.log(`   automation_score: ${judgeResult.automation_score}/100`);
    console.log(`   risk_level: ${judgeResult.risk_level}`);
    console.log(`   strategy: ${judgeResult.strategy}\n`);
    
    // 调用 Evaluator
    console.log('🔄 生成执行方案...\n');
    const startTime = Date.now();
    
    const result = await evaluateTask(
      judgeResult,
      testCase.description,
      DEEPSEEK_API_KEY
    );
    
    const latency = Date.now() - startTime;
    
    // 显示结果
    console.log('✅ 生成完成\n');
    console.log('═'.repeat(70));
    console.log('📋 执行方案汇总\n');
    
    result.plans.forEach((plan, idx) => {
      console.log(`${idx + 1}. ${plan.name} (${plan.plan_id})`);
      console.log(`   策略: ${plan.strategy}`);
      console.log(`   任务数: ${plan.tasks.length} 个`);
      console.log(`   总时间: ${plan.total_time_minutes} 分钟`);
      console.log(`   总成本: $${plan.total_cost_usd.toFixed(4)}`);
      console.log(`   自动化率: ${(plan.automation_ratio * 100).toFixed(0)}%`);
      console.log(`   风险分数: ${plan.risk_score}/100`);
      console.log(`   置信度: ${plan.confidence}%\n`);
    });
    
    console.log(`💡 推荐方案: ${result.recommended}`);
    console.log(`   理由: ${result.reasoning}\n`);
    
    console.log('═'.repeat(70));
    console.log(`⏱️  延迟: ${latency}ms`);
    console.log(`📊 模型: ${result.metadata.model_used}\n`);
    
    // 保存结果
    const outputFile = '/tmp/evaluator-result.json';
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`💾 结果已保存: ${outputFile}\n`);
    
    // 分别保存 3 个方案
    result.plans.forEach(plan => {
      const planFile = `/tmp/plan-${plan.plan_id}.json`;
      fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
      console.log(`💾 ${plan.name}已保存: ${planFile}`);
    });
  }
  
  console.log('\n✅ Evaluator 测试完成');
}

main().catch(console.error);
```

**Step 4: 更新 package.json**
```json
{
  "scripts": {
    "demo": "tsx demo-judge.ts",
    "demo:compare": "tsx demo-compare.ts",
    "demo:evaluator": "tsx demo-evaluator.ts"
  }
}
```

**Step 5: 测试验证**
```bash
export DEEPSEEK_API_KEY=sk-xxx
npm run demo:evaluator
```

**验收标准**:
- ✅ 生成 3 个方案（conservative, balanced, aggressive）
- ✅ 每个方案包含 3-8 个任务
- ✅ 任务分解合理（登录接口 → 密钥配置 + 接口实现 + 测试）
- ✅ 时间/成本估算符合常识
- ✅ 推荐方案与 Judge 的 strategy 对齐

---

## Phase 2: Validator 层实现

**时间**: 1-2 天  
**目标**: 验证 Evaluator 方案的可行性

### Task 2.1: Validator 核心逻辑

#### 输入
```json
{
  "plan_id": "balanced",
  "tasks": [...],
  "total_time_minutes": 60,
  "total_cost_usd": 0.008
}
```

#### 输出
```json
{
  "plan_id": "balanced",
  "validation_result": "approved" | "rejected" | "needs_modification",
  "feasibility_score": 85,
  "blocking_issues": [],
  "warnings": [
    {
      "severity": "medium",
      "category": "resource",
      "message": "Redis 连接未配置，需手动添加环境变量"
    }
  ],
  "optimizations": [
    {
      "type": "merge_tasks",
      "target_tasks": ["3", "4"],
      "reason": "两个任务可以合并为一次代码提交",
      "time_saved_minutes": 5
    }
  ],
  "adjusted_plan": {
    // 优化后的方案
  },
  "final_metrics": {
    "total_time_minutes": 55,  // 优化后
    "total_cost_usd": 0.007,
    "risk_score": 32
  }
}
```

#### 实现步骤

**Step 1: 创建类型定义**
```typescript
// src/types/validator.ts
interface ValidationIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'resource' | 'dependency' | 'security' | 'technical' | 'process';
  message: string;
  affected_tasks: string[];
  mitigation?: string;
}

interface Optimization {
  type: 'merge_tasks' | 'parallel_execution' | 'tool_selection' | 'cost_reduction';
  target_tasks: string[];
  reason: string;
  time_saved_minutes?: number;
  cost_saved_usd?: number;
}

interface ValidatorResult {
  plan_id: string;
  validation_result: 'approved' | 'rejected' | 'needs_modification';
  feasibility_score: number;  // 0-100
  blocking_issues: ValidationIssue[];
  warnings: ValidationIssue[];
  optimizations: Optimization[];
  adjusted_plan?: ExecutionPlan;
  final_metrics: {
    total_time_minutes: number;
    total_cost_usd: number;
    risk_score: number;
    automation_ratio: number;
  };
  reasoning: string;
}
```

**Step 2: 实现 Validator 引擎**
```typescript
// src/validator/validator.ts
async function validatePlan(
  plan: ExecutionPlan,
  context: {
    project_type: string;
    tech_stack: string[];
    available_resources: string[];
  },
  apiKey: string
): Promise<ValidatorResult> {
  const prompt = buildValidatorPrompt(plan, context);
  const response = await callDeepSeek(prompt, apiKey);
  return parseValidatorResponse(response);
}

function buildValidatorPrompt(
  plan: ExecutionPlan,
  context: any
): string {
  return `你是 Orca 项目自动化系统的 Validator（验证器）。

验证执行方案的可行性，识别阻塞问题和优化机会。

**执行方案**: ${plan.name}
${JSON.stringify(plan, null, 2)}

**项目上下文**:
- 项目类型: ${context.project_type}
- 技术栈: ${context.tech_stack.join(', ')}
- 可用资源: ${context.available_resources.join(', ')}

**验证要点**:
1. 技术可行性（技术栈是否支持）
2. 资源依赖（数据库、Redis、外部服务）
3. 任务依赖关系（是否有循环依赖）
4. 时间估算合理性
5. 成本估算准确性
6. 安全风险（密钥管理、权限配置）

**输出 JSON 格式**:
{
  "plan_id": "${plan.plan_id}",
  "validation_result": "approved|rejected|needs_modification",
  "feasibility_score": 85,
  "blocking_issues": [
    {
      "severity": "critical",
      "category": "resource",
      "message": "MySQL 数据库未初始化",
      "affected_tasks": ["2", "3"],
      "mitigation": "先执行数据库迁移脚本"
    }
  ],
  "warnings": [...],
  "optimizations": [
    {
      "type": "merge_tasks",
      "target_tasks": ["3", "4"],
      "reason": "可合并",
      "time_saved_minutes": 5
    }
  ],
  "adjusted_plan": {
    // 优化后的方案（如果有优化）
  },
  "final_metrics": {
    "total_time_minutes": 55,
    "total_cost_usd": 0.007,
    "risk_score": 32,
    "automation_ratio": 0.7
  },
  "reasoning": "方案可行，但需要先配置 Redis..."
}

只返回 JSON。`;
}
```

**Step 3: 实现 demo-validator.ts**
```typescript
// demo-validator.ts
#!/usr/bin/env tsx

import * as fs from 'fs';
import { validatePlan } from './src/validator/validator';

const testCases = [
  {
    planFile: '/tmp/plan-balanced.json',
    context: {
      project_type: 'backend',
      tech_stack: ['Go', 'goframe-v2', 'MySQL', 'Redis'],
      available_resources: ['MySQL', 'Redis', 'Docker'],
    },
  },
];

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  Orca JEV - Validator 层测试                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  for (const testCase of testCases) {
    const plan = JSON.parse(fs.readFileSync(testCase.planFile, 'utf-8'));
    
    console.log(`📝 验证方案: ${plan.name}\n`);
    console.log(`📊 方案概况:`);
    console.log(`   任务数: ${plan.tasks.length}`);
    console.log(`   总时间: ${plan.total_time_minutes} 分钟`);
    console.log(`   总成本: $${plan.total_cost_usd.toFixed(4)}\n`);
    
    console.log('🔄 执行验证...\n');
    const startTime = Date.now();
    
    const result = await validatePlan(plan, testCase.context, process.env.DEEPSEEK_API_KEY!);
    
    const latency = Date.now() - startTime;
    
    // 显示结果
    const statusEmoji = {
      approved: '✅',
      rejected: '❌',
      needs_modification: '⚠️',
    };
    
    console.log(`${statusEmoji[result.validation_result]} 验证结果: ${result.validation_result.toUpperCase()}\n`);
    console.log(`📊 可行性评分: ${result.feasibility_score}/100\n`);
    
    if (result.blocking_issues.length > 0) {
      console.log('🚫 阻塞问题:\n');
      result.blocking_issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        console.log(`      影响任务: ${issue.affected_tasks.join(', ')}`);
        if (issue.mitigation) {
          console.log(`      缓解措施: ${issue.mitigation}`);
        }
        console.log();
      });
    }
    
    if (result.warnings.length > 0) {
      console.log('⚠️  警告:\n');
      result.warnings.forEach((warning, idx) => {
        console.log(`   ${idx + 1}. [${warning.severity.toUpperCase()}] ${warning.message}`);
      });
      console.log();
    }
    
    if (result.optimizations.length > 0) {
      console.log('💡 优化建议:\n');
      result.optimizations.forEach((opt, idx) => {
        console.log(`   ${idx + 1}. ${opt.type}: ${opt.reason}`);
        if (opt.time_saved_minutes) {
          console.log(`      节省时间: ${opt.time_saved_minutes} 分钟`);
        }
        if (opt.cost_saved_usd) {
          console.log(`      节省成本: $${opt.cost_saved_usd.toFixed(4)}`);
        }
      });
      console.log();
    }
    
    console.log('📊 最终指标:');
    console.log(`   总时间: ${result.final_metrics.total_time_minutes} 分钟`);
    console.log(`   总成本: $${result.final_metrics.total_cost_usd.toFixed(4)}`);
    console.log(`   风险分数: ${result.final_metrics.risk_score}/100`);
    console.log(`   自动化率: ${(result.final_metrics.automation_ratio * 100).toFixed(0)}%\n`);
    
    console.log(`💭 验证说明: ${result.reasoning}\n`);
    
    console.log('═'.repeat(70));
    console.log(`⏱️  延迟: ${latency}ms\n`);
    
    // 保存结果
    const outputFile = `/tmp/validation-result-${plan.plan_id}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`💾 结果已保存: ${outputFile}\n`);
  }
  
  console.log('✅ Validator 测试完成');
}

main().catch(console.error);
```

**Step 4: 更新 package.json**
```json
{
  "scripts": {
    "demo:validator": "tsx demo-validator.ts"
  }
}
```

**验收标准**:
- ✅ 识别阻塞问题（资源缺失、依赖错误）
- ✅ 提供优化建议（任务合并、并行执行）
- ✅ 调整后的指标合理
- ✅ 验证结果与方案质量匹配

---

## Phase 3: 完整 JEV 流程串联

**时间**: 1 天  
**目标**: 端到端执行 Judge → Evaluator → Validator

### Task 3.1: 完整流程实现

**Step 1: 实现 demo-full-jev.ts**
```typescript
// demo-full-jev.ts
#!/usr/bin/env tsx

import * as fs from 'fs';
import { judgeTask } from './src/judge/judge';
import { evaluateTask } from './src/evaluator/evaluator';
import { validatePlan } from './src/validator/validator';

const testCases = [
  {
    description: '实现用户登录接口，支持 JWT + Redis 会话管理',
    context: {
      project_type: 'backend',
      tech_stack: ['Go', 'goframe-v2', 'MySQL', 'Redis'],
      available_resources: ['MySQL', 'Redis', 'Docker'],
    },
  },
];

async function runFullJEV(taskDescription: string, context: any) {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  Orca JEV - 完整流程测试                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📝 任务: ${taskDescription}\n`);
  console.log('═'.repeat(70));
  
  // Phase 1: Judge
  console.log('\n🔍 Phase 1: Judge 层评估\n');
  const judgeStart = Date.now();
  const judgeResult = await judgeTask(taskDescription, context);
  const judgeLatency = Date.now() - judgeStart;
  
  console.log(`✅ Judge 完成 (${judgeLatency}ms)`);
  console.log(`   automation_score: ${judgeResult.automation_score}/100`);
  console.log(`   risk_level: ${judgeResult.risk_level}`);
  console.log(`   strategy: ${judgeResult.strategy}`);
  console.log(`   confidence: ${judgeResult.confidence}%\n`);
  
  // Phase 2: Evaluator
  console.log('═'.repeat(70));
  console.log('\n📋 Phase 2: Evaluator 层生成方案\n');
  const evalStart = Date.now();
  const evalResult = await evaluateTask(judgeResult, taskDescription, process.env.DEEPSEEK_API_KEY!);
  const evalLatency = Date.now() - evalStart;
  
  console.log(`✅ Evaluator 完成 (${evalLatency}ms)`);
  console.log(`   生成方案数: ${evalResult.plans.length}`);
  console.log(`   推荐方案: ${evalResult.recommended}\n`);
  
  evalResult.plans.forEach((plan, idx) => {
    console.log(`   ${idx + 1}. ${plan.name}`);
    console.log(`      时间: ${plan.total_time_minutes}min | 成本: $${plan.total_cost_usd.toFixed(4)} | 风险: ${plan.risk_score}/100`);
  });
  console.log();
  
  // Phase 3: Validator
  console.log('═'.repeat(70));
  console.log('\n✅ Phase 3: Validator 层验证\n');
  
  const recommendedPlan = evalResult.plans.find(p => p.plan_id === evalResult.recommended)!;
  const valStart = Date.now();
  const valResult = await validatePlan(recommendedPlan, context, process.env.DEEPSEEK_API_KEY!);
  const valLatency = Date.now() - valStart;
  
  const statusEmoji = {
    approved: '✅',
    rejected: '❌',
    needs_modification: '⚠️',
  };
  
  console.log(`${statusEmoji[valResult.validation_result]} Validator 完成 (${valLatency}ms)`);
  console.log(`   验证结果: ${valResult.validation_result}`);
  console.log(`   可行性: ${valResult.feasibility_score}/100`);
  console.log(`   阻塞问题: ${valResult.blocking_issues.length} 个`);
  console.log(`   优化建议: ${valResult.optimizations.length} 个\n`);
  
  // Final Summary
  console.log('═'.repeat(70));
  console.log('\n📊 完整流程汇总\n');
  
  const totalLatency = judgeLatency + evalLatency + valLatency;
  const totalCost = valResult.final_metrics.total_cost_usd;
  
  console.log(`⏱️  总延迟: ${totalLatency}ms`);
  console.log(`   Judge:     ${judgeLatency}ms`);
  console.log(`   Evaluator: ${evalLatency}ms`);
  console.log(`   Validator: ${valLatency}ms\n`);
  
  console.log(`💰 预估成本: $${totalCost.toFixed(4)}`);
  console.log(`⏰ 预估时间: ${valResult.final_metrics.total_time_minutes} 分钟`);
  console.log(`🎯 自动化率: ${(valResult.final_metrics.automation_ratio * 100).toFixed(0)}%`);
  console.log(`⚠️  风险分数: ${valResult.final_metrics.risk_score}/100\n`);
  
  if (valResult.validation_result === 'approved') {
    console.log('✅ 方案已批准，可以执行！\n');
  } else if (valResult.validation_result === 'needs_modification') {
    console.log('⚠️  方案需要修改，请查看优化建议\n');
  } else {
    console.log('❌ 方案被拒绝，请查看阻塞问题\n');
  }
  
  // 保存完整结果
  const fullResult = {
    task: taskDescription,
    context,
    judge: judgeResult,
    evaluator: evalResult,
    validator: valResult,
    summary: {
      total_latency_ms: totalLatency,
      estimated_cost_usd: totalCost,
      estimated_time_minutes: valResult.final_metrics.total_time_minutes,
      automation_ratio: valResult.final_metrics.automation_ratio,
      risk_score: valResult.final_metrics.risk_score,
      final_status: valResult.validation_result,
    },
  };
  
  const outputFile = '/tmp/full-jev-result.json';
  fs.writeFileSync(outputFile, JSON.stringify(fullResult, null, 2));
  console.log(`💾 完整结果已保存: ${outputFile}\n`);
  
  return fullResult;
}

async function main() {
  for (const testCase of testCases) {
    await runFullJEV(testCase.description, testCase.context);
  }
  
  console.log('✅ 完整 JEV 流程测试完成');
}

main().catch(console.error);
```

**Step 2: 更新 package.json**
```json
{
  "scripts": {
    "demo:full": "tsx demo-full-jev.ts"
  }
}
```

**验收标准**:
- ✅ 三层顺序执行无错误
- ✅ 总延迟 < 30 秒
- ✅ 最终方案包含完整的任务分解
- ✅ 输出 JSON 包含所有中间结果

---

## Phase 4: 模型路由引擎

**时间**: 2-3 天  
**目标**: 根据任务类型自动选择最优模型

### Task 4.1: 模型健康检查

```typescript
// src/routing/health-checker.ts
interface HealthCheckResult {
  model_id: string;
  available: boolean;
  latency_ms?: number;
  error?: string;
  last_check: string;
}

async function checkModelHealth(
  modelConfig: ModelConfig
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${modelConfig.baseUrl}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
      },
      signal: AbortSignal.timeout(5000),  // 5s 超时
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const latency = Date.now() - startTime;
    
    return {
      model_id: modelConfig.id,
      available: true,
      latency_ms: latency,
      last_check: new Date().toISOString(),
    };
  } catch (error) {
    return {
      model_id: modelConfig.id,
      available: false,
      error: error instanceof Error ? error.message : String(error),
      last_check: new Date().toISOString(),
    };
  }
}

// 健康检查缓存（TTL 60s）
const healthCache = new Map<string, { result: HealthCheckResult; expiresAt: number }>();

async function getModelHealthCached(
  modelConfig: ModelConfig
): Promise<HealthCheckResult> {
  const cached = healthCache.get(modelConfig.id);
  const now = Date.now();
  
  if (cached && cached.expiresAt > now) {
    return cached.result;
  }
  
  const result = await checkModelHealth(modelConfig);
  healthCache.set(modelConfig.id, {
    result,
    expiresAt: now + 60000,  // 60s TTL
  });
  
  return result;
}
```

### Task 4.2: 模型路由器

```typescript
// src/routing/model-router.ts
interface RoutingRule {
  task_types: string[];
  primary: string;      // 模型 ID
  fallback: string[];   // 降级链
  constraints?: {
    max_cost_per_call?: number;
    max_latency_ms?: number;
  };
}

interface RoutingConfig {
  models: Record<string, ModelConfig>;
  rules: RoutingRule[];
}

class ModelRouter {
  constructor(private config: RoutingConfig) {}
  
  async selectModel(
    taskType: string,
    options?: {
      maxCost?: number;
      maxLatency?: number;
    }
  ): Promise<ModelConfig> {
    // 查找匹配的路由规则
    const rule = this.config.rules.find(r =>
      r.task_types.includes(taskType)
    );
    
    if (!rule) {
      throw new Error(`No routing rule for task type: ${taskType}`);
    }
    
    // 优先使用 primary
    const primaryModel = this.config.models[rule.primary];
    const primaryHealth = await getModelHealthCached(primaryModel);
    
    if (primaryHealth.available) {
      return primaryModel;
    }
    
    // Primary 不可用，尝试 fallback
    for (const fallbackId of rule.fallback) {
      const fallbackModel = this.config.models[fallbackId];
      const fallbackHealth = await getModelHealthCached(fallbackModel);
      
      if (fallbackHealth.available) {
        console.warn(`⚠️  Primary model ${rule.primary} unavailable, using fallback ${fallbackId}`);
        return fallbackModel;
      }
    }
    
    throw new Error(`All models unavailable for task type: ${taskType}`);
  }
}
```

### Task 4.3: 配置文件

```yaml
# config/routing.yaml
models:
  deepseek-flash:
    id: deepseek-flash
    provider: deepseek
    model: deepseek-v4.1-flash
    baseUrl: http://172.87.28.157:8080
    apiKey: ${DEEPSEEK_API_KEY}
    cost_per_1m_tokens:
      input: 0.01
      output: 0.01
    capabilities:
      - reasoning
      - code_generation
    
  openrouter-jev:
    id: openrouter-jev
    provider: openrouter
    model: typesafe/jev-router
    baseUrl: https://openrouter.ai/api
    apiKey: ${OPENROUTER_API_KEY}
    cost_per_1m_tokens:
      input: 0.1
      output: 0.3
    capabilities:
      - reasoning
      - decision_making
    
  claude-sonnet:
    id: claude-sonnet
    provider: anthropic
    model: claude-sonnet-4-20250514
    baseUrl: https://api.anthropic.com
    apiKey: ${ANTHROPIC_API_KEY}
    cost_per_1m_tokens:
      input: 3.0
      output: 15.0
    capabilities:
      - reasoning
      - code_generation
      - analysis

rules:
  - task_types:
      - simple_coding
      - documentation
      - refactoring
    primary: deepseek-flash
    fallback:
      - openrouter-jev
      - claude-sonnet
    constraints:
      max_cost_per_call: 0.01
  
  - task_types:
      - architecture
      - decision_making
      - risk_assessment
    primary: openrouter-jev
    fallback:
      - claude-sonnet
      - deepseek-flash
    constraints:
      max_latency_ms: 10000
  
  - task_types:
      - complex_reasoning
      - system_design
      - code_review
    primary: claude-sonnet
    fallback:
      - openrouter-jev
      - deepseek-flash
```

**验收标准**:
- ✅ 健康检查缓存生效（60s 内不重复请求）
- ✅ Primary 失败自动降级到 Fallback
- ✅ 降级事件记录到日志
- ✅ 支持根据任务类型选择模型

---

## Phase 5: CLI 工具封装

**时间**: 2-3 天  
**目标**: 提供命令行工具

### Task 5.1: CLI 命令实现

```typescript
// src/cli/index.ts
import { Command } from 'commander';
import { judgeTask } from '../judge/judge';
import { evaluateTask } from '../evaluator/evaluator';
import { validatePlan } from '../validator/validator';
import { runFullJEV } from '../orchestrator/orchestrator';

const program = new Command();

program
  .name('orca')
  .description('Orca JEV - 智能项目自动化决策系统')
  .version('0.1.0');

// orca judge <task>
program
  .command('judge')
  .description('评估任务的自动化可行性')
  .argument('<task>', '任务描述')
  .option('--json', '输出 JSON 格式')
  .action(async (task, options) => {
    const result = await judgeTask(task, {});
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n📊 Judge 评估结果:\n`);
      console.log(`   automation_score: ${result.automation_score}/100`);
      console.log(`   risk_level: ${result.risk_level}`);
      console.log(`   strategy: ${result.strategy}`);
      console.log(`   confidence: ${result.confidence}%\n`);
      
      console.log(`⚠️  识别风险:\n`);
      result.risks.forEach((risk, idx) => {
        console.log(`   ${idx + 1}. [${risk.severity.toUpperCase()}] ${risk.category}`);
        console.log(`      ${risk.description}`);
      });
    }
  });

// orca eval <task>
program
  .command('eval')
  .description('生成执行方案')
  .argument('<task>', '任务描述')
  .option('--plan <type>', '指定方案类型 (conservative/balanced/aggressive)')
  .option('--json', '输出 JSON 格式')
  .action(async (task, options) => {
    const judgeResult = await judgeTask(task, {});
    const evalResult = await evaluateTask(judgeResult, task, process.env.DEEPSEEK_API_KEY!);
    
    if (options.json) {
      console.log(JSON.stringify(evalResult, null, 2));
    } else {
      console.log(`\n📋 生成执行方案:\n`);
      
      const targetPlan = options.plan
        ? evalResult.plans.find(p => p.plan_id === options.plan)
        : evalResult.plans.find(p => p.plan_id === evalResult.recommended);
      
      if (!targetPlan) {
        console.error(`❌ 未找到方案: ${options.plan}`);
        process.exit(1);
      }
      
      console.log(`方案: ${targetPlan.name}`);
      console.log(`任务数: ${targetPlan.tasks.length}`);
      console.log(`总时间: ${targetPlan.total_time_minutes} 分钟`);
      console.log(`总成本: $${targetPlan.total_cost_usd.toFixed(4)}`);
      console.log(`自动化率: ${(targetPlan.automation_ratio * 100).toFixed(0)}%\n`);
      
      console.log(`任务列表:\n`);
      targetPlan.tasks.forEach((task, idx) => {
        const icon = task.type === 'automated' ? '🤖' : task.type === 'manual' ? '👤' : '👁️';
        console.log(`   ${idx + 1}. ${icon} ${task.name}`);
        console.log(`      时间: ${task.estimated_time_minutes}min | 责任人: ${task.owner}`);
      });
    }
  });

// orca run <task>
program
  .command('run')
  .description('执行完整 JEV 流程')
  .argument('<task>', '任务描述')
  .option('--auto', '自动批准并执行')
  .option('--json', '输出 JSON 格式')
  .action(async (task, options) => {
    const result = await runFullJEV(task, {});
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      // 显示汇总
      console.log(`\n✅ JEV 流程完成\n`);
      console.log(`预估时间: ${result.summary.estimated_time_minutes} 分钟`);
      console.log(`预估成本: $${result.summary.estimated_cost_usd.toFixed(4)}`);
      console.log(`自动化率: ${(result.summary.automation_ratio * 100).toFixed(0)}%`);
      console.log(`风险分数: ${result.summary.risk_score}/100`);
      console.log(`验证状态: ${result.summary.final_status}\n`);
      
      if (result.summary.final_status === 'approved' && options.auto) {
        console.log(`🚀 开始执行...\n`);
        // TODO: 实际执行逻辑
      }
    }
  });

// orca models
program
  .command('models')
  .description('查看模型状态')
  .option('--health', '执行健康检查')
  .action(async (options) => {
    // TODO: 实现模型列表和健康检查
  });

// orca cost
program
  .command('cost')
  .description('查看成本统计')
  .option('--from <date>', '起始日期')
  .option('--to <date>', '结束日期')
  .action(async (options) => {
    // TODO: 实现成本统计
  });

program.parse();
```

### Task 5.2: 打包为可执行文件

```json
// package.json
{
  "name": "orca-jev",
  "version": "0.1.0",
  "bin": {
    "orca": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/cli/index.js",
    "dev": "tsx src/cli/index.ts"
  }
}
```

**安装使用**:
```bash
# 开发模式
npm run dev -- judge "实现登录接口"

# 生产模式
npm run build
npm link
orca judge "实现登录接口"
```

**验收标准**:
- ✅ 所有命令可执行
- ✅ 支持 --help 显示帮助
- ✅ 支持 --json 输出机器可读格式
- ✅ 错误处理完善（API Key 缺失、网络错误）

---

## Phase 6: 可观测性

**时间**: 2-3 天  
**目标**: 成本追踪、日志记录、指标统计

### Task 6.1: 成本追踪

```typescript
// src/observability/cost-tracker.ts
interface CostRecord {
  timestamp: string;
  model_id: string;
  task_type: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
}

class CostTracker {
  private records: CostRecord[] = [];
  private logFile = '~/.orca/cost.jsonl';
  
  record(record: CostRecord) {
    this.records.push(record);
    
    // 追加到文件
    fs.appendFileSync(
      this.logFile,
      JSON.stringify(record) + '\n'
    );
  }
  
  getStats(from?: Date, to?: Date) {
    const filtered = this.records.filter(r => {
      const ts = new Date(r.timestamp);
      return (!from || ts >= from) && (!to || ts <= to);
    });
    
    return {
      total_cost: filtered.reduce((sum, r) => sum + r.cost_usd, 0),
      total_calls: filtered.length,
      by_model: this.groupBy(filtered, 'model_id'),
      by_task_type: this.groupBy(filtered, 'task_type'),
    };
  }
  
  private groupBy(records: CostRecord[], key: keyof CostRecord) {
    const groups: Record<string, { count: number; cost: number }> = {};
    
    records.forEach(r => {
      const value = String(r[key]);
      if (!groups[value]) {
        groups[value] = { count: 0, cost: 0 };
      }
      groups[value].count++;
      groups[value].cost += r.cost_usd;
    });
    
    return groups;
  }
}
```

### Task 6.2: Trace 记录

```typescript
// src/observability/tracer.ts
interface Span {
  span_id: string;
  parent_span_id?: string;
  name: string;
  start_time: string;
  end_time?: string;
  status: 'running' | 'success' | 'error';
  attributes: Record<string, any>;
  events: Array<{ timestamp: string; message: string }>;
}

class Tracer {
  private spans: Map<string, Span> = new Map();
  private traceFile = '~/.orca/traces.jsonl';
  
  startSpan(name: string, parentSpanId?: string): string {
    const spanId = this.generateId();
    
    const span: Span = {
      span_id: spanId,
      parent_span_id: parentSpanId,
      name,
      start_time: new Date().toISOString(),
      status: 'running',
      attributes: {},
      events: [],
    };
    
    this.spans.set(spanId, span);
    return spanId;
  }
  
  endSpan(spanId: string, status: 'success' | 'error') {
    const span = this.spans.get(spanId);
    if (!span) return;
    
    span.end_time = new Date().toISOString();
    span.status = status;
    
    // 写入文件
    fs.appendFileSync(
      this.traceFile,
      JSON.stringify(span) + '\n'
    );
  }
  
  addEvent(spanId: string, message: string) {
    const span = this.spans.get(spanId);
    if (!span) return;
    
    span.events.push({
      timestamp: new Date().toISOString(),
      message,
    });
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
```

**验收标准**:
- ✅ 每次模型调用记录 tokens 和成本
- ✅ 成本统计按日期/模型/任务类型聚合
- ✅ Trace 记录完整的执行链路
- ✅ 数据持久化到 `~/.orca/` 目录

---

## Phase 7: 生产优化

**时间**: 3-5 天  
**目标**: 性能优化、错误处理、文档完善

### Task 7.1: 性能优化

- **并行执行**: Judge 的多个风险评估可以并行
- **缓存**: 相同任务的 Judge 结果缓存 5 分钟
- **批量调用**: 多个简单任务合并为一次 API 调用
- **流式输出**: 长任务支持流式返回进度

### Task 7.2: 错误处理

- **重试机制**: API 失败自动重试 3 次，指数退避
- **降级策略**: 所有模型失败时返回人工决策建议
- **超时控制**: 单次 API 调用超时 30s
- **错误上报**: 严重错误发送通知（邮件/Slack）

### Task 7.3: 文档完善

- **API 文档**: 每个函数的 JSDoc 注释
- **用户指南**: 完整的使用教程和最佳实践
- **架构文档**: 系统设计文档和数据流图
- **故障排查**: 常见问题和解决方案

### Task 7.4: 测试覆盖

- **单元测试**: 每个模块 80% 覆盖率
- **集成测试**: 完整 JEV 流程端到端测试
- **压力测试**: 并发 10 个任务不出错
- **回归测试**: 每次提交自动运行测试套件

**验收标准**:
- ✅ 所有测试通过
- ✅ 文档完整且最新
- ✅ 错误率 < 1%
- ✅ P95 延迟 < 20s

---

## 📅 时间线总览

```
Week 1:
  Day 1-2: Phase 1 - Evaluator 层实现
  Day 3-4: Phase 2 - Validator 层实现
  Day 5-6: Phase 3 - 完整 JEV 流程串联
  Day 7: 测试与文档

Week 2:
  Day 8-10: Phase 4 - 模型路由引擎
  Day 11-13: Phase 5 - CLI 工具封装
  Day 14: 集成测试

Week 3:
  Day 15-17: Phase 6 - 可观测性
  Day 18-21: Phase 7 - 生产优化
```

---

## 🎯 里程碑

- **M1 (Day 7)**: ✅ 完整 JEV 流程可运行
- **M2 (Day 14)**: ✅ CLI 工具可安装使用
- **M3 (Day 21)**: ✅ 生产环境可部署

---

## 📦 交付物清单

### 代码
- [ ] `src/judge/` - Judge 层实现
- [ ] `src/evaluator/` - Evaluator 层实现
- [ ] `src/validator/` - Validator 层实现
- [ ] `src/routing/` - 模型路由引擎
- [ ] `src/cli/` - 命令行工具
- [ ] `src/observability/` - 可观测性
- [ ] `src/types/` - 类型定义
- [ ] `tests/` - 测试套件

### 文档
- [ ] `README.md` - 项目说明
- [ ] `docs/api.md` - API 文档
- [ ] `docs/user-guide.md` - 用户指南
- [ ] `docs/architecture.md` - 架构文档
- [ ] `docs/troubleshooting.md` - 故障排查

### Demo
- [ ] `demo-judge.ts` ✅
- [ ] `demo-compare.ts` ✅
- [ ] `demo-evaluator.ts`
- [ ] `demo-validator.ts`
- [ ] `demo-full-jev.ts`

### 配置
- [ ] `config/routing.yaml` - 路由配置
- [ ] `config/models.yaml` - 模型配置
- [ ] `.env.example` ✅

---

## ✅ 验收标准

### 功能完整性
- ✅ 完整 JEV 三层流程可执行
- ✅ 支持 3+ 种模型路由
- ✅ 健康检查和自动降级
- ✅ 成本追踪和统计
- ✅ CLI 工具可用

### 性能指标
- ✅ 端到端延迟 < 30s
- ✅ 健康检查缓存命中率 > 90%
- ✅ API 失败率 < 1%

### 代码质量
- ✅ TypeScript 无类型错误
- ✅ 测试覆盖率 > 80%
- ✅ 文档完整

---

**下一步**: 开始实现 Phase 1 - Evaluator 层

要我现在开始写 Evaluator 层的代码吗？
