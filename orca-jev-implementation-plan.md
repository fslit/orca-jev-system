# Orca + JEV 多模型编排系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建基于 JEV 决策模型和 Orca 可观测性平台的多模型智能编排系统，实现成本优化、智能决策和全链路可观测。

**Architecture:** JEV 三层决策（Judge 判断 → Evaluator 评估 → Validator 验证）+ 模型路由引擎 + DAG 任务编排 + Trace/Metrics 可观测性 + 学习优化引擎。

**Tech Stack:** Node.js/TypeScript, Pi CLI, JSONL (Metrics), JSON (Traces), Anthropic API, OpenAI API, 私有模型 API。

**Spec:** `/tmp/orca-jev-multi-model-orchestration-spec.md`

## Global Constraints

- 保持与 Pi CLI 完全兼容，不改变其现有命令和行为。
- 私有模型 API (http://172.87.28.157:8080) 必须经过健康检查才能使用。
- JEV 完整流程仅用于复杂任务（`automation_score < 90` 或 `risk_level >= medium`），简单任务直接执行。
- 所有成本计算精确到 $0.001，所有时间记录使用 ISO 8601 格式。
- Trace/Metrics 数据不包含敏感信息（API Key, 用户密码等）。
- 健康检查缓存 TTL 60s，避免频繁请求。
- 执行中验证间隔 ≥ 60s，避免过度监控开销。
- 学习数据至少 10 个案例才触发优化。

## Review Focus

- **成本追踪准确性**：每个模型调用必须记录 input_tokens, output_tokens, cost。
- **故障转移可靠性**：Primary 失败后必须尝试 Fallback 链，所有重试都要留痕。
- **JEV 决策一致性**：相同输入应产生高度一致的判断结果（除非学习数据更新）。
- **执行偏离检测**：时间/成本偏离超过阈值必须触发警告或调整。
- **数据持久化**：Trace/Metrics 必须写入磁盘，进程崩溃后可恢复。
- **API Key 安全**：所有 API Key 通过环境变量注入，日志中不出现明文。

---

## Phase 1: 基础设施（Foundation）

### Task 1.1: 项目初始化与类型定义

**Repository:** `~/orca`

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `README.md`
- Create: `src/types/index.ts` (核心类型定义)
- Create: `src/types/jev.ts` (JEV 类型定义)
- Create: `src/types/trace.ts` (Trace 类型定义)
- Create: `src/types/config.ts` (配置类型定义)
- Test: `src/types/__tests__/types.test.ts`

**Interfaces:**
- Consumes: TypeScript 类型系统
- Produces: 完整的类型定义，支持 IDE 自动补全和类型检查

- [ ] **Step 1: 初始化 Node.js 项目**
  ```bash
  mkdir -p ~/orca && cd ~/orca
  npm init -y
  npm install typescript @types/node tsx
  npm install --save-dev vitest @vitest/ui
  npx tsc --init
  ```

- [ ] **Step 2: 编写核心类型定义** (`src/types/index.ts`)
  - `ModelConfig`: 模型配置（provider, baseUrl, apiKey, cost, capabilities）
  - `RoutingRule`: 路由规则（task_types, primary, fallback）
  - `HealthCheckResult`: 健康检查结果（available, latency, lastCheck）
  - `TaskContext`: 任务上下文（goal, project, constraints）

- [ ] **Step 3: 编写 JEV 类型定义** (`src/types/jev.ts`)
  - `JudgmentResult`: Judge 输出
  - `PlanEvaluation`: Evaluator 输出
  - `PreValidation`, `MidValidation`, `PostValidation`: Validator 输出
  - `ExecutionPlan`: 执行计划（tasks, DAG, 资源预估）

- [ ] **Step 4: 编写 Trace 类型定义** (`src/types/trace.ts`)
  - `OrcaTrace`: 完整 Trace 结构
  - `OrcaSpan`: Span 结构（spanId, parentSpanId, startTime, endTime, status）
  - `TraceMetrics`: Trace 汇总指标

- [ ] **Step 5: 编写配置类型定义** (`src/types/config.ts`)
  - `ProjectConfig`: 项目配置（从 `.orca/project.yaml` 加载）
  - `JEVConfig`: JEV 配置（models, thresholds, validation）
  - `RoutingConfig`: 路由配置（private_models, public_models, rules）
  - `ObservabilityConfig`: 可观测性配置（traces, metrics, logging, alerts）

- [ ] **Step 6: 添加类型测试**
  - 测试类型兼容性和必填字段
  - 测试枚举值边界
  - 测试嵌套类型结构

- [ ] **Step 7: 提交类型定义**
  ```bash
  git add src/types/
  git commit -m "feat(types): 添加核心类型定义"
  ```

---

### Task 1.2: 配置加载与验证

**Repository:** `~/orca`

**Files:**
- Create: `src/config/loader.ts` (配置加载器)
- Create: `src/config/validator.ts` (配置验证器)
- Create: `src/config/defaults.ts` (默认配置)
- Test: `src/config/__tests__/loader.test.ts`
- Test: `src/config/__tests__/validator.test.ts`

**Interfaces:**
- Consumes: `.orca/project.yaml` (YAML 文件)
- Produces: 已验证的 `ProjectConfig` 对象

- [ ] **Step 1: 安装 YAML 依赖**
  ```bash
  npm install js-yaml
  npm install --save-dev @types/js-yaml
  ```

- [ ] **Step 2: 添加失败测试** - 配置加载
  - 测试 YAML 文件不存在时抛出错误
  - 测试无效 YAML 格式时抛出错误
  - 测试必填字段缺失时抛出错误

- [ ] **Step 3: 实现配置加载器** (`src/config/loader.ts`)
  ```typescript
  export async function loadProjectConfig(
    projectPath: string
  ): Promise<ProjectConfig> {
    // 1. 查找 .orca/project.yaml
    // 2. 解析 YAML
    // 3. 填充默认值
    // 4. 验证配置
    // 5. 返回 ProjectConfig
  }
  ```

- [ ] **Step 4: 添加失败测试** - 配置验证
  - 测试无效的模型名称（不在模型池中）
  - 测试无效的阈值（< 0 或 > 100）
  - 测试循环依赖的 fallback 链

- [ ] **Step 5: 实现配置验证器** (`src/config/validator.ts`)
  ```typescript
  export function validateProjectConfig(
    config: Partial<ProjectConfig>
  ): ValidationResult {
    // 1. 验证项目元信息
    // 2. 验证 JEV 配置（models, thresholds）
    // 3. 验证路由配置（models 存在性，fallback 无环）
    // 4. 验证可观测性配置
    // 5. 返回 ValidationResult
  }
  ```

- [ ] **Step 6: 实现默认配置** (`src/config/defaults.ts`)
  - JEV 默认阈值（min_automation_score: 60, ...）
  - 默认路由规则
  - 默认可观测性配置

- [ ] **Step 7: 运行测试**
  ```bash
  npm test -- src/config/
  ```

- [ ] **Step 8: 提交配置模块**
  ```bash
  git add src/config/
  git commit -m "feat(config): 实现配置加载与验证"
  ```

---

### Task 1.3: 健康检查与模型适配器

**Repository:** `~/orca`

**Files:**
- Create: `src/models/health-checker.ts` (健康检查器)
- Create: `src/models/adapters/base.ts` (基础适配器接口)
- Create: `src/models/adapters/anthropic.ts` (Anthropic 适配器)
- Create: `src/models/adapters/openai.ts` (OpenAI 适配器)
- Create: `src/models/adapters/generic.ts` (通用私有模型适配器)
- Create: `src/models/model-pool.ts` (模型池管理器)
- Test: `src/models/__tests__/health-checker.test.ts`
- Test: `src/models/__tests__/model-pool.test.ts`

**Interfaces:**
- Consumes: `ModelConfig`, API endpoints
- Produces: `HealthCheckResult`, 统一的模型调用接口

- [ ] **Step 1: 安装 API 依赖**
  ```bash
  npm install @anthropic-ai/sdk openai axios
  ```

- [ ] **Step 2: 添加失败测试** - 健康检查
  - 测试模型不可达时返回 `available: false`
  - 测试健康检查缓存生效（60s TTL）
  - 测试并发健康检查只执行一次

- [ ] **Step 3: 实现健康检查器** (`src/models/health-checker.ts`)
  ```typescript
  export class HealthChecker {
    private cache: Map<string, HealthCheckResult>;
    
    async check(model: ModelConfig): Promise<HealthCheckResult> {
      // 1. 检查缓存（TTL 60s）
      // 2. 发送简单请求（如 "ping" 或 list models）
      // 3. 记录延迟和状态
      // 4. 更新缓存
      // 5. 返回结果
    }
  }
  ```

- [ ] **Step 4: 定义基础适配器接口** (`src/models/adapters/base.ts`)
  ```typescript
  export interface ModelAdapter {
    call(prompt: string, options?: CallOptions): Promise<ModelResponse>;
    streamCall(prompt: string, options?: CallOptions): AsyncIterable<ModelChunk>;
  }
  
  export interface ModelResponse {
    content: string;
    usage: { input_tokens: number; output_tokens: number };
    model: string;
  }
  ```

- [ ] **Step 5: 实现 Anthropic 适配器** (`src/models/adapters/anthropic.ts`)
  - 包装 `@anthropic-ai/sdk`
  - 统一错误处理
  - 记录 token usage

- [ ] **Step 6: 实现 OpenAI 适配器** (`src/models/adapters/openai.ts`)
  - 包装 `openai` SDK
  - 统一响应格式

- [ ] **Step 7: 实现通用私有模型适配器** (`src/models/adapters/generic.ts`)
  - 使用 `axios` 发送 OpenAI-compatible API 请求
  - 支持 DeepSeek, Gemini 私有部署

- [ ] **Step 8: 添加失败测试** - 模型池
  - 测试从配置初始化模型池
  - 测试 `getModel()` 返回正确的适配器
  - 测试健康检查集成

- [ ] **Step 9: 实现模型池管理器** (`src/models/model-pool.ts`)
  ```typescript
  export class ModelPool {
    private models: Map<string, { config: ModelConfig; adapter: ModelAdapter }>;
    private healthChecker: HealthChecker;
    
    async initialize(config: RoutingConfig): Promise<void> {
      // 1. 从配置加载所有模型
      // 2. 创建对应的适配器
      // 3. 执行初始健康检查
    }
    
    async getModel(name: string): Promise<ModelAdapter | null> {
      // 1. 检查健康状态
      // 2. 返回适配器或 null
    }
  }
  ```

- [ ] **Step 10: 运行测试**
  ```bash
  npm test -- src/models/
  ```

- [ ] **Step 11: 提交模型模块**
  ```bash
  git add src/models/
  git commit -m "feat(models): 实现健康检查与模型适配器"
  ```

---

## Phase 2: JEV 决策引擎

### Task 2.1: Judge 判断层

**Repository:** `~/orca`

**Files:**
- Create: `src/jev/judge.ts` (Judge 实现)
- Create: `src/jev/prompts/judge.ts` (Judge Prompt 模板)
- Test: `src/jev/__tests__/judge.test.ts`

**Interfaces:**
- Consumes: `TaskContext`, `ModelAdapter` (Opus)
- Produces: `JudgmentResult`

- [ ] **Step 1: 添加失败测试** - Judge
  - 测试简单任务返回高 `automation_score`
  - 测试高风险任务返回 `risk_level: 'high'`
  - 测试低置信度任务返回 `strategy: 'not_recommended'`

- [ ] **Step 2: 编写 Judge Prompt 模板** (`src/jev/prompts/judge.ts`)
  ```typescript
  export function buildJudgePrompt(context: TaskContext): string {
    return `
作为资深项目经理，判断以下任务是否适合自动化：

任务目标: ${context.goal}

项目上下文:
- 项目类型: ${context.project.type}
- 技术栈: ${JSON.stringify(context.project.stack)}
- 代码库健康度: ${context.codebase_health || '未知'}

请判断：
1. 可自动化性 (0-100 分)
2. 风险评估 (low/medium/high)
3. 建议策略
4. 关键风险点

输出 JSON 格式。
    `;
  }
  ```

- [ ] **Step 3: 实现 Judge** (`src/jev/judge.ts`)
  ```typescript
  export class Judge {
    constructor(
      private modelPool: ModelPool,
      private config: JEVConfig
    ) {}
    
    async shouldAutomate(
      context: TaskContext
    ): Promise<JudgmentResult> {
      // 1. 构建 Prompt
      // 2. 调用 Opus 模型
      // 3. 解析 JSON 响应
      // 4. 验证输出格式
      // 5. 返回 JudgmentResult
    }
  }
  ```

- [ ] **Step 4: 添加 JSON Schema 验证**
  ```bash
  npm install ajv
  ```
  - 定义 `JudgmentResult` 的 JSON Schema
  - 在 Judge 中验证模型输出

- [ ] **Step 5: 运行测试**
  ```bash
  npm test -- src/jev/__tests__/judge.test.ts
  ```

- [ ] **Step 6: 提交 Judge**
  ```bash
  git add src/jev/judge.ts src/jev/prompts/judge.ts
  git commit -m "feat(jev): 实现 Judge 判断层"
  ```

---

### Task 2.2: Evaluator 评估层

**Repository:** `~/orca`

**Files:**
- Create: `src/jev/evaluator.ts` (Evaluator 实现)
- Create: `src/jev/prompts/evaluator.ts` (Evaluator Prompt 模板)
- Test: `src/jev/__tests__/evaluator.test.ts`

**Interfaces:**
- Consumes: `JudgmentResult`, `TaskContext`, `ModelPool`
- Produces: `PlanEvaluation` (best_plan + alternatives)

- [ ] **Step 1: 添加失败测试** - Evaluator
  - 测试生成 3-5 个候选方案
  - 测试方案包含完整的 tasks, cost, time
  - 测试选择综合评分最高的方案

- [ ] **Step 2: 编写 Evaluator Prompt 模板** (`src/jev/prompts/evaluator.ts`)
  - `generateCandidatePlansPrompt()`: 生成候选方案
  - `evaluatePlanPrompt()`: 评估单个方案

- [ ] **Step 3: 实现 Evaluator** (`src/jev/evaluator.ts`)
  ```typescript
  export class Evaluator {
    async evaluatePlans(
      goal: string,
      judgment: JudgmentResult,
      context: TaskContext
    ): Promise<PlanEvaluation> {
      // 1. 生成 3-5 个候选方案
      const candidates = await this.generateCandidatePlans(goal, judgment);
      
      // 2. 并行评估每个方案
      const evaluations = await Promise.all(
        candidates.map(plan => this.evaluatePlan(plan, context))
      );
      
      // 3. 选择最优方案
      const bestPlan = this.selectBestPlan(evaluations, context.constraints);
      
      return {
        best_plan: bestPlan,
        alternatives: evaluations.filter(e => e.plan_id !== bestPlan.plan_id),
        reasoning: bestPlan.selection_reasoning
      };
    }
  }
  ```

- [ ] **Step 4: 实现方案选择逻辑** (`selectBestPlan`)
  - 根据约束条件计算加权分数
  - 权重: feasibility 25%, cost 20%, time 20%, quality 25%, risk 10%
  - 返回得分最高的方案

- [ ] **Step 5: 运行测试**
  ```bash
  npm test -- src/jev/__tests__/evaluator.test.ts
  ```

- [ ] **Step 6: 提交 Evaluator**
  ```bash
  git add src/jev/evaluator.ts src/jev/prompts/evaluator.ts
  git commit -m "feat(jev): 实现 Evaluator 评估层"
  ```

---

### Task 2.3: Validator 验证层

**Repository:** `~/orca`

**Files:**
- Create: `src/jev/validator.ts` (Validator 实现)
- Create: `src/jev/prompts/validator.ts` (Validator Prompt 模板)
- Test: `src/jev/__tests__/validator.test.ts`

**Interfaces:**
- Consumes: `ExecutionPlan`, `TaskContext`, `ExecutionProgress` (执行中)
- Produces: `PreValidation`, `MidValidation`, `PostValidation`

- [ ] **Step 1: 添加失败测试** - Validator
  - 测试依赖关系验证（DAG 无环）
  - 测试资源预估合理性验证
  - 测试执行中偏离检测（时间 > 50%, 成本 > 30%）
  - 测试结果验证（验收标准检查）

- [ ] **Step 2: 编写 Validator Prompt 模板** (`src/jev/prompts/validator.ts`)
  - `preValidationPrompt()`: 执行前验证
  - `midValidationPrompt()`: 执行中验证
  - `postValidationPrompt()`: 执行后验证

- [ ] **Step 3: 实现执行前验证** (`validatePlan`)
  ```typescript
  async validatePlan(
    plan: ExecutionPlan,
    context: TaskContext
  ): Promise<PreValidation> {
    // 1. 验证依赖关系（DAG 合法性）
    // 2. 验证资源预估（与历史数据对比）
    // 3. 验证质量门槛（可达成性）
    // 4. 验证风险覆盖（是否充分）
    // 5. 预测成功率
    // 6. 返回 go/go_with_changes/no_go
  }
  ```

- [ ] **Step 4: 实现执行中验证** (`validateDuringExecution`)
  ```typescript
  async validateDuringExecution(
    execution: ExecutionProgress,
    plan: ExecutionPlan
  ): Promise<MidValidation> {
    // 1. 计算时间偏离率
    // 2. 计算成本偏离率
    // 3. 检查质量指标
    // 4. 预测最终完成时间和成本
    // 5. 建议调整策略（如果偏离严重）
  }
  ```

- [ ] **Step 5: 实现执行后验证** (`validateResults`)
  ```typescript
  async validateResults(
    execution: ExecutionResult,
    plan: ExecutionPlan
  ): Promise<PostValidation> {
    // 1. 检查验收标准是否达成
    // 2. 检查测试是否通过
    // 3. 检查是否有回归
    // 4. 识别遗漏的测试
    // 5. 返回 PASS/FAIL/CONDITIONAL_PASS
  }
  ```

- [ ] **Step 6: 运行测试**
  ```bash
  npm test -- src/jev/__tests__/validator.test.ts
  ```

- [ ] **Step 7: 提交 Validator**
  ```bash
  git add src/jev/validator.ts src/jev/prompts/validator.ts
  git commit -m "feat(jev): 实现 Validator 验证层"
  ```

---

## Phase 3: 模型路由与编排引擎

### Task 3.1: 模型路由器

**Repository:** `~/orca`

**Files:**
- Create: `src/routing/router.ts` (路由器)
- Create: `src/routing/task-classifier.ts` (任务分类器)
- Test: `src/routing/__tests__/router.test.ts`

**Interfaces:**
- Consumes: `task_type`, `RoutingConfig`, `ModelPool`
- Produces: 选定的 `ModelAdapter` + fallback 链

- [ ] **Step 1: 添加失败测试** - 路由器
  - 测试 `search` 任务路由到 `deepseek-4.1`
  - 测试 `frontend` 任务路由到 `gemini-3.8-flash-high`
  - 测试 Primary 不可用时使用 Fallback
  - 测试所有 Fallback 都失败时抛出错误

- [ ] **Step 2: 实现任务分类器** (`src/routing/task-classifier.ts`)
  ```typescript
  export function classifyTask(goal: string): string[] {
    // 基于关键词匹配返回可能的 task_types
    // 例如: "实现 React 组件" → ['frontend', 'react', 'ui_component']
    // 例如: "修复 bug" → ['backend', 'debugging']
  }
  ```

- [ ] **Step 3: 实现路由器** (`src/routing/router.ts`)
  ```typescript
  export class Router {
    async route(
      taskType: string,
      modelPool: ModelPool,
      config: RoutingConfig
    ): Promise<{ primary: ModelAdapter; fallback: ModelAdapter[] }> {
      // 1. 查找匹配的路由规则
      // 2. 检查 Primary 模型健康状态
      // 3. 构建 Fallback 链
      // 4. 返回可用的模型
    }
  }
  ```

- [ ] **Step 4: 添加健康检查集成**
  - Primary 不可用时自动跳到 Fallback
  - 记录故障转移事件

- [ ] **Step 5: 运行测试**
  ```bash
  npm test -- src/routing/
  ```

- [ ] **Step 6: 提交路由器**
  ```bash
  git add src/routing/
  git commit -m "feat(routing): 实现模型路由器"
  ```

---

### Task 3.2: DAG 任务编排器

**Repository:** `~/orca`

**Files:**
- Create: `src/orchestration/dag.ts` (DAG 构建与拓扑排序)
- Create: `src/orchestration/executor.ts` (任务执行器)
- Test: `src/orchestration/__tests__/dag.test.ts`
- Test: `src/orchestration/__tests__/executor.test.ts`

**Interfaces:**
- Consumes: `ExecutionPlan` (tasks + dependencies)
- Produces: 执行结果 + Spans

- [ ] **Step 1: 添加失败测试** - DAG
  - 测试拓扑排序（无依赖任务并行）
  - 测试检测循环依赖
  - 测试多层依赖关系

- [ ] **Step 2: 实现 DAG 构建** (`src/orchestration/dag.ts`)
  ```typescript
  export class DAG {
    private nodes: Map<string, Task>;
    private edges: Map<string, string[]>; // taskId -> dependencies
    
    addTask(task: Task, dependencies: string[] = []): void {
      // 添加节点和边
    }
    
    topologicalSort(): Task[][] {
      // 返回分层的任务列表（同一层可并行执行）
    }
    
    detectCycle(): boolean {
      // DFS 检测环
    }
  }
  ```

- [ ] **Step 3: 添加失败测试** - 执行器
  - 测试任务并行执行
  - 测试任务失败后停止
  - 测试部分任务失败（failfast vs continue）

- [ ] **Step 4: 实现任务执行器** (`src/orchestration/executor.ts`)
  ```typescript
  export class Executor {
    async execute(
      plan: ExecutionPlan,
      options: ExecutionOptions
    ): Promise<ExecutionResult> {
      // 1. 构建 DAG
      // 2. 拓扑排序
      // 3. 逐层并行执行
      // 4. 记录 Spans
      // 5. 处理失败（failfast or continue）
      // 6. 返回结果
    }
  }
  ```

- [ ] **Step 5: 集成路由器**
  - 每个 Task 根据 `task_type` 路由到对应模型
  - 记录模型调用的 token usage 和 cost

- [ ] **Step 6: 运行测试**
  ```bash
  npm test -- src/orchestration/
  ```

- [ ] **Step 7: 提交编排器**
  ```bash
  git add src/orchestration/
  git commit -m "feat(orchestration): 实现 DAG 任务编排器"
  ```

---

## Phase 4: 可观测性

### Task 4.1: Trace 追踪

**Repository:** `~/orca`

**Files:**
- Create: `src/observability/trace.ts` (Trace 管理器)
- Create: `src/observability/span.ts` (Span 管理器)
- Test: `src/observability/__tests__/trace.test.ts`

**Interfaces:**
- Consumes: 执行事件（JEV 决策、任务开始/结束、模型调用）
- Produces: JSON 格式的 Trace 文件（`~/.orca/traces/<project>/<traceId>.json`）

- [ ] **Step 1: 添加失败测试** - Trace
  - 测试创建 Trace 和 Span
  - 测试嵌套 Span（parentSpanId）
  - 测试 Trace 持久化到磁盘

- [ ] **Step 2: 实现 Trace 管理器** (`src/observability/trace.ts`)
  ```typescript
  export class TraceManager {
    private traces: Map<string, OrcaTrace>;
    
    startTrace(goal: string, project: string): string {
      // 1. 生成 traceId
      // 2. 创建 OrcaTrace 对象
      // 3. 返回 traceId
    }
    
    endTrace(traceId: string, status: 'success' | 'failed'): void {
      // 1. 设置 endTime
      // 2. 计算 metrics
      // 3. 持久化到磁盘
    }
    
    addSpan(traceId: string, span: OrcaSpan): void {
      // 添加 Span 到 Trace
    }
  }
  ```

- [ ] **Step 3: 实现 Span 管理器** (`src/observability/span.ts`)
  ```typescript
  export class SpanBuilder {
    private span: Partial<OrcaSpan>;
    
    constructor(name: string, type: SpanType) {
      this.span = {
        spanId: generateSpanId(),
        name,
        type,
        startTime: new Date().toISOString(),
        status: 'running'
      };
    }
    
    setParent(parentSpanId: string): this {
      this.span.parentSpanId = parentSpanId;
      return this;
    }
    
    setModel(model: string): this {
      this.span.model = model;
      return this;
    }
    
    end(status: 'success' | 'failed', usage?: TokenUsage): OrcaSpan {
      this.span.endTime = new Date().toISOString();
      this.span.status = status;
      if (usage) {
        this.span.input_tokens = usage.input_tokens;
        this.span.output_tokens = usage.output_tokens;
        this.span.cost = calculateCost(usage, this.span.model);
      }
      return this.span as OrcaSpan;
    }
  }
  ```

- [ ] **Step 4: 集成到 JEV 和 Executor**
  - Judge/Evaluator/Validator 调用时创建 Span
  - 每个 Task 执行时创建 Span
  - 每个模型调用时创建 Span

- [ ] **Step 5: 运行测试**
  ```bash
  npm test -- src/observability/__tests__/trace.test.ts
  ```

- [ ] **Step 6: 提交 Trace**
  ```bash
  git add src/observability/trace.ts src/observability/span.ts
  git commit -m "feat(observability): 实现 Trace 追踪"
  ```

---

### Task 4.2: Metrics 收集

**Repository:** `~/orca`

**Files:**
- Create: `src/observability/metrics.ts` (Metrics 收集器)
- Test: `src/observability/__tests__/metrics.test.ts`

**Interfaces:**
- Consumes: 执行事件
- Produces: JSONL 格式的 Metrics 文件（`~/.orca/metrics/<project>/metrics.jsonl`）

- [ ] **Step 1: 添加失败测试** - Metrics
  - 测试记录模型调用指标
  - 测试记录 Trace 完成指标
  - 测试 JSONL 追加写入

- [ ] **Step 2: 实现 Metrics 收集器** (`src/observability/metrics.ts`)
  ```typescript
  export class MetricsCollector {
    private metricsFile: string;
    
    async recordModelCall(metric: ModelCallMetric): Promise<void> {
      // 1. 构造 JSON 行
      // 2. 追加到 metrics.jsonl
    }
    
    async recordTraceComplete(metric: TraceCompleteMetric): Promise<void> {
      // 同上
    }
  }
  ```

- [ ] **Step 3: 定义 Metric 类型**
  ```typescript
  interface ModelCallMetric {
    timestamp: string;
    metric: 'model.call';
    model: string;
    task_type: string;
    duration_ms: number;
    input_tokens: number;
    output_tokens: number;
    cost: number;
    status: 'success' | 'failed';
  }
  
  interface TraceCompleteMetric {
    timestamp: string;
    metric: 'trace.complete';
    traceId: string;
    total_cost: number;
    total_time: number;
    success: boolean;
  }
  ```

- [ ] **Step 4: 集成到 Executor**
  - 每次模型调用后记录 `model.call`
  - Trace 结束后记录 `trace.complete`

- [ ] **Step 5: 运行测试**
  ```bash
  npm test -- src/observability/__tests__/metrics.test.ts
  ```

- [ ] **Step 6: 提交 Metrics**
  ```bash
  git add src/observability/metrics.ts
  git commit -m "feat(observability): 实现 Metrics 收集"
  ```

---

## Phase 5: 集成与 CLI

### Task 5.1: Orca 引擎主流程

**Repository:** `~/orca`

**Files:**
- Create: `src/engine/orca.ts` (Orca 主引擎)
- Test: `src/engine/__tests__/orca.test.ts`

**Interfaces:**
- Consumes: `userGoal`, `ProjectConfig`
- Produces: `ExecutionResult` + Trace

- [ ] **Step 1: 添加失败测试** - Orca 引擎
  - 测试完整 JEV 流程（Judge → Evaluator → Validator → Execute）
  - 测试简单任务跳过 JEV
  - 测试执行中验证触发调整
  - 测试学习反馈记录

- [ ] **Step 2: 实现 Orca 引擎** (`src/engine/orca.ts`)
  ```typescript
  export class OrcaEngine {
    async execute(
      userGoal: string,
      options: ExecutionOptions = {}
    ): Promise<ExecutionResult> {
      const trace = this.traceManager.startTrace(userGoal, this.config.project.name);
      
      try {
        // Phase 1: Judge
        const judgment = await this.judge.shouldAutomate(context);
        trace.jev_decisions.judgment = judgment;
        
        if (judgment.confidence < 60 || judgment.strategy === 'not_recommended') {
          return { status: 'rejected', reason: judgment.reasoning };
        }
        
        // Phase 2: Evaluator
        const planEvaluation = await this.evaluator.evaluatePlans(userGoal, judgment, context);
        trace.jev_decisions.plan_evaluation = planEvaluation;
        
        // Phase 3: Validator (Pre)
        const validation = await this.validator.validatePlan(planEvaluation.best_plan, context);
        trace.jev_decisions.pre_validation = validation;
        
        if (validation.go_no_go === 'no_go') {
          return { status: 'validation_failed', validation };
        }
        
        // Phase 4: Execute
        const execution = await this.executor.execute(planEvaluation.best_plan, {
          onProgress: async (progress) => {
            // 执行中验证
            const midValidation = await this.validator.validateDuringExecution(progress, plan);
            if (midValidation.deviation > 50) {
              await this.adjustStrategy(midValidation.recommendations);
            }
          }
        });
        
        // Phase 5: Validator (Post)
        const resultValidation = await this.validator.validateResults(execution, plan);
        trace.jev_decisions.post_validation = resultValidation;
        
        // Phase 6: Learning
        await this.learn({ goal: userGoal, judgment, execution, validation: resultValidation });
        
        this.traceManager.endTrace(trace.traceId, 'success');
        
        return { status: 'success', trace, validation: resultValidation };
        
      } catch (error) {
        this.traceManager.endTrace(trace.traceId, 'failed');
        throw error;
      }
    }
  }
  ```

- [ ] **Step 3: 实现简化流程（简单任务）**
  ```typescript
  // 如果 automation_score > 90 且 risk_level === 'low'
  // 跳过 JEV，直接执行
  if (shouldSkipJEV(context)) {
    return await this.executor.executeDirect(userGoal);
  }
  ```

- [ ] **Step 4: 运行测试**
  ```bash
  npm test -- src/engine/__tests__/orca.test.ts
  ```

- [ ] **Step 5: 提交 Orca 引擎**
  ```bash
  git add src/engine/
  git commit -m "feat(engine): 实现 Orca 主引擎"
  ```

---

### Task 5.2: CLI 入口

**Repository:** `~/orca`

**Files:**
- Create: `src/cli/index.ts` (CLI 主入口)
- Create: `src/cli/commands/execute.ts` (execute 命令)
- Create: `src/cli/commands/trace.ts` (trace 命令)
- Create: `src/cli/commands/metrics.ts` (metrics 命令)
- Create: `bin/orca` (可执行文件)

**Interfaces:**
- Consumes: 命令行参数
- Produces: 命令执行结果

- [ ] **Step 1: 安装 CLI 依赖**
  ```bash
  npm install commander chalk ora
  ```

- [ ] **Step 2: 实现 CLI 框架** (`src/cli/index.ts`)
  ```typescript
  import { Command } from 'commander';
  
  const program = new Command();
  
  program
    .name('orca')
    .description('Orca + JEV 多模型编排系统')
    .version('0.1.0');
  
  program
    .command('execute <goal>')
    .description('执行任务')
    .option('--project <path>', '项目路径', process.cwd())
    .option('--force', '跳过 JEV，强制执行')
    .action(executeCommand);
  
  program
    .command('trace <traceId>')
    .description('查看 Trace 详情')
    .option('--format <format>', '输出格式', 'tree')
    .action(traceCommand);
  
  program
    .command('metrics')
    .description('查看 Metrics 统计')
    .option('--project <name>', '项目名称')
    .option('--days <n>', '最近 N 天', '7')
    .action(metricsCommand);
  
  program.parse();
  ```

- [ ] **Step 3: 实现 execute 命令** (`src/cli/commands/execute.ts`)
  ```typescript
  export async function executeCommand(
    goal: string,
    options: { project: string; force?: boolean }
  ): Promise<void> {
    const spinner = ora('Loading project config...').start();
    
    const config = await loadProjectConfig(options.project);
    const engine = new OrcaEngine(config);
    
    spinner.text = 'Executing...';
    
    const result = await engine.execute(goal, {
      skipJEV: options.force
    });
    
    spinner.succeed('Done!');
    
    console.log(chalk.green('\n✅ Task completed'));
    console.log(`Trace: ${result.trace.traceId}`);
    console.log(`Cost: $${result.trace.metrics.total_cost.toFixed(3)}`);
    console.log(`Time: ${result.trace.metrics.total_time}s`);
  }
  ```

- [ ] **Step 4: 实现 trace 命令** (`src/cli/commands/trace.ts`)
  - 读取 Trace JSON 文件
  - 格式化输出（tree 或 json）

- [ ] **Step 5: 实现 metrics 命令** (`src/cli/commands/metrics.ts`)
  - 读取 Metrics JSONL 文件
  - 聚合统计（总成本、总调用次数、模型分布）

- [ ] **Step 6: 创建可执行文件** (`bin/orca`)
  ```bash
  #!/usr/bin/env node
  require('../dist/cli/index.js');
  ```

- [ ] **Step 7: 更新 package.json**
  ```json
  {
    "bin": {
      "orca": "./bin/orca"
    },
    "scripts": {
      "build": "tsc",
      "dev": "tsx watch src/cli/index.ts"
    }
  }
  ```

- [ ] **Step 8: 本地链接**
  ```bash
  npm run build
  npm link
  ```

- [ ] **Step 9: 测试 CLI**
  ```bash
  orca execute "修复 README typo" --project ~/my-project
  orca trace trace-1234567890
  orca metrics --project ml-alone-client --days 7
  ```

- [ ] **Step 10: 提交 CLI**
  ```bash
  git add src/cli/ bin/orca package.json
  git commit -m "feat(cli): 实现 Orca CLI 入口"
  ```

---

## Phase 6: 学习与优化

### Task 6.1: 学习引擎

**Repository:** `~/orca`

**Files:**
- Create: `src/learning/learner.ts` (学习引擎)
- Create: `src/learning/case-store.ts` (案例存储)
- Test: `src/learning/__tests__/learner.test.ts`

**Interfaces:**
- Consumes: 执行结果（goal, judgment, plan, execution, validation）
- Produces: 学习数据（`~/.orca/learning/<project>/cases.jsonl`）

- [ ] **Step 1: 添加失败测试** - 学习引擎
  - 测试案例存储（JSONL 追加）
  - 测试时间预估优化（基于历史数据）
  - 测试成本预估优化
  - 测试模型性能统计更新

- [ ] **Step 2: 实现案例存储** (`src/learning/case-store.ts`)
  ```typescript
  export class CaseStore {
    async store(executionCase: ExecutionCase): Promise<void> {
      // 1. 构造 Case 对象
      // 2. 追加到 cases.jsonl
    }
    
    async load(project: string, limit: number = 100): Promise<ExecutionCase[]> {
      // 读取最近 N 个案例
    }
  }
  ```

- [ ] **Step 3: 实现学习引擎** (`src/learning/learner.ts`)
  ```typescript
  export class Learner {
    async learn(executionData: ExecutionData): Promise<void> {
      // 1. 存储案例
      await this.caseStore.store(executionData);
      
      // 2. 更新模型性能统计
      await this.updateModelStats(executionData);
      
      // 3. 优化时间/成本预估
      await this.optimizeEstimation(executionData);
      
      // 4. 提取成功模式
      if (executionData.validation.final_judgment === 'PASS') {
        await this.extractSuccessPattern(executionData);
      }
    }
    
    private async updateModelStats(data: ExecutionData): Promise<void> {
      // 记录每个模型在不同 task_type 上的表现
      // 更新 avg_latency, success_rate, cost_per_task
    }
    
    private async optimizeEstimation(data: ExecutionData): Promise<void> {
      // 对比预估 vs 实际
      // 调整预估公式的系数
    }
  }
  ```

- [ ] **Step 4: 集成到 Orca 引擎**
  - 在 Trace 结束后调用 `learner.learn()`

- [ ] **Step 5: 运行测试**
  ```bash
  npm test -- src/learning/
  ```

- [ ] **Step 6: 提交学习引擎**
  ```bash
  git add src/learning/
  git commit -m "feat(learning): 实现学习与优化引擎"
  ```

---

## Phase 7: 端到端验收

### Task 7.1: 私有模型连通性测试

**Environment:** 本地 → `http://172.87.28.157:8080`

- [ ] **Step 1: 测试 DeepSeek 4.1 连通性**
  ```bash
  curl -X POST http://172.87.28.157:8080/v1/chat/completions \
    -H "Authorization: Bearer sk-e011409cdf6e9cab14fc07db836dbe1b432f5638c9e5c303d5369023bcba447e" \
    -H "Content-Type: application/json" \
    -d '{
      "model": "deepseek-4.1",
      "messages": [{"role": "user", "content": "ping"}]
    }'
  ```

- [ ] **Step 2: 测试 Gemini 3.8 Flash High 连通性**
  ```bash
  curl -X POST http://172.87.28.157:8080/v1/chat/completions \
    -H "Authorization: Bearer sk-726343572536455ca9728b8cb737897cfefd7fde2631b872f62a3e9e02d5004b" \
    -H "Content-Type: application/json" \
    -d '{
      "model": "gemini-3.8-flash-high",
      "messages": [{"role": "user", "content": "ping"}]
    }'
  ```

- [ ] **Step 3: 记录延迟和可用性**
  - DeepSeek 延迟: ___ ms
  - Gemini 延迟: ___ ms
  - 健康检查是否通过: ___

---

### Task 7.2: 场景 1 - 简单任务（跳过 JEV）

**Goal:** 修复 README.md 中的 typo

**预期:**
- `automation_score > 90`
- 跳过 JEV
- 使用 DeepSeek 4.1 执行
- 成本 < $0.01
- 时间 < 5s

- [ ] **Step 1: 创建测试项目**
  ```bash
  mkdir -p ~/orca-test-simple && cd ~/orca-test-simple
  echo "# Tset Project" > README.md  # 故意 typo
  git init
  ```

- [ ] **Step 2: 创建 .orca/project.yaml**
  ```yaml
  project:
    name: orca-test-simple
    type: documentation
  
  jev:
    enabled: true
  
  routing:
    private_models:
      deepseek-4.1:
        provider: deepseek
        base_url: http://172.87.28.157:8080
        api_key_env: DEEPSEEK_API_KEY
        cost_per_1m: { input: 0.01, output: 0.01 }
        capabilities: [search, scripting]
        priority: 1
  ```

- [ ] **Step 3: 执行任务**
  ```bash
  export DEEPSEEK_API_KEY="sk-e011409cdf6e9cab14fc07db836dbe1b432f5638c9e5c303d5369023bcba447e"
  orca execute "修复 README.md 中的 typo: Tset → Test" --project ~/orca-test-simple
  ```

- [ ] **Step 4: 验证结果**
  - README.md 已修复: `# Test Project`
  - 打印的成本: < $0.01
  - 打印的时间: < 5s
  - Trace 文件存在: `~/.orca/traces/orca-test-simple/trace-*.json`

- [ ] **Step 5: 检查 Trace**
  ```bash
  orca trace <traceId>
  ```
  - 确认跳过了 JEV
  - 只有一个 Task Span（修复 typo）
  - 使用的模型: `deepseek-4.1`

- [ ] **Step 6: 记录证据**
  - 执行日志截图
  - Trace JSON 文件
  - Metrics JSONL 片段

---

### Task 7.3: 场景 2 - 复杂任务（完整 JEV 流程）

**Goal:** 实现用户认证功能（JWT + Redis session）

**预期:**
- `automation_score < 90` → 触发完整 JEV
- Judge 判断可自动化，`risk_level: medium`
- Evaluator 生成 3-5 个方案
- Validator 验证通过（可能有调整建议）
- 使用多个模型：Opus (JEV), GPT-6.1-sol (backend), DeepSeek (tests)
- 成本 $0.50-1.00
- 时间 5-10 分钟

- [ ] **Step 1: 创建测试项目**
  ```bash
  mkdir -p ~/orca-test-complex && cd ~/orca-test-complex
  git init
  # 创建基础的 backend 项目结构
  ```

- [ ] **Step 2: 创建 .orca/project.yaml**
  ```yaml
  project:
    name: orca-test-complex
    type: fullstack
    
  stack:
    backend: [golang, goframe-v2]
    database: [mysql, redis]
  
  jev:
    enabled: true
    models:
      judge: claude-opus-5-5
      evaluator: claude-opus-5-5
      validator: claude-sonnet-5-5
  
  routing:
    private_models:
      deepseek-4.1:
        # 同上
    
    public_models:
      claude-opus-5-5:
        provider: anthropic
        cost_per_1m: { input: 15.00, output: 75.00 }
        capabilities: [jev_judge, jev_evaluator]
      
      claude-sonnet-5-5:
        provider: anthropic
        cost_per_1m: { input: 3.00, output: 15.00 }
        capabilities: [jev_validator]
      
      gpt-6.1-sol:
        provider: openai
        cost_per_1m: { input: 5.00, output: 15.00 }
        capabilities: [backend, golang]
    
    rules:
      - task_types: [backend, golang]
        primary: gpt-6.1-sol
      - task_types: [testing]
        primary: deepseek-4.1
  ```

- [ ] **Step 3: 执行任务**
  ```bash
  export ANTHROPIC_API_KEY="<your-key>"
  export OPENAI_API_KEY="<your-key>"
  export DEEPSEEK_API_KEY="sk-e011..."
  
  orca execute "实现用户认证功能：JWT token + Redis session，包括登录、注册、密码重置" \
    --project ~/orca-test-complex
  ```

- [ ] **Step 4: 观察 JEV 决策**
  - 控制台应该打印 JEV 各阶段的决策
  - Judge: `automation_score`, `risk_level`, `strategy`
  - Evaluator: 方案数量和选中的方案
  - Validator: `go_no_go`, `predicted_success_rate`

- [ ] **Step 5: 验证结果**
  - 生成的代码文件存在
  - 测试通过（如果有）
  - 总成本在预期范围内
  - Trace 完整记录了所有阶段

- [ ] **Step 6: 检查 Trace**
  ```bash
  orca trace <traceId> --format json | jq '.jev_decisions'
  ```
  - 确认包含 `judgment`, `plan_evaluation`, `pre_validation`, `post_validation`
  - 确认 Spans 包含 JEV 和 Task 两类

- [ ] **Step 7: 检查 Metrics**
  ```bash
  orca metrics --project orca-test-complex
  ```
  - 总调用次数: JEV (3 次) + Tasks (N 次)
  - 模型分布: Opus, Sonnet, GPT, DeepSeek
  - 成本分解

- [ ] **Step 8: 记录证据**
  - 完整执行日志
  - JEV 决策 JSON
  - 生成的代码文件
  - Trace + Metrics 数据

---

### Task 7.4: 场景 3 - 故障转移测试

**Goal:** 测试 Primary 模型不可用时自动使用 Fallback

**预期:**
- Primary (DeepSeek) 不可用
- 自动切换到 Fallback (Sonnet)
- 记录故障转移事件

- [ ] **Step 1: 模拟 DeepSeek 不可用**
  - 修改配置文件，将 DeepSeek baseUrl 改为无效地址
  - 或在防火墙中临时阻止 `172.87.28.157:8080`

- [ ] **Step 2: 执行任务**
  ```bash
  orca execute "搜索项目中的 TODO 注释" --project ~/orca-test-simple
  ```

- [ ] **Step 3: 验证 Fallback**
  - 控制台应该打印 "Primary model unavailable, using fallback"
  - 任务成功完成
  - 使用的模型: `claude-sonnet-5-5` (Fallback)

- [ ] **Step 4: 检查 Trace**
  - Span 中应该有 `failover: true` 标记
  - 记录了 Primary 失败原因

- [ ] **Step 5: 恢复 DeepSeek**
  - 修复配置或防火墙
  - 再次执行相同任务
  - 验证恢复使用 Primary

- [ ] **Step 6: 记录证据**
  - 故障转移日志
  - Trace 中的 failover 标记
  - Primary 恢复后的正常日志

---

## Final Verification Checklist

### 功能验收

- [ ] JEV 三层决策（Judge, Evaluator, Validator）正常工作
- [ ] 模型路由正确（基于 task_type）
- [ ] 健康检查正常（60s 缓存）
- [ ] 故障转移正常（Primary → Fallback）
- [ ] DAG 任务编排正常（并行执行）
- [ ] Trace 完整记录（traceId, spans, jev_decisions）
- [ ] Metrics 正确收集（JSONL 追加）
- [ ] 学习引擎记录案例
- [ ] CLI 命令正常（execute, trace, metrics）

### 性能验收

- [ ] 简单任务 < 5s
- [ ] 健康检查延迟 < 2s
- [ ] 私有模型响应 < 3s
- [ ] 公有云模型响应 < 5s

### 成本验收

- [ ] 简单任务成本 < $0.01
- [ ] 完整 JEV 流程成本 < $1.00
- [ ] 成本追踪准确（与实际 API 调用一致）

### 质量验收

- [ ] 所有单元测试通过 (`npm test`)
- [ ] TypeScript 编译无错误 (`npm run build`)
- [ ] 端到端场景测试通过（3 个场景）

### 文档验收

- [ ] README.md 完整（安装、配置、使用）
- [ ] Spec 文档完整（架构、类型、流程）
- [ ] Plan 文档完整（任务拆解、验收标准）
- [ ] 验收记录完整（证据、结论、遗留问题）

---

## 未验证 / 遗留

1. **GitHub Webhook 集成**：未实现，放在 Phase 2
2. **Orca Dashboard**：未实现，放在 Phase 2
3. **多项目管理**：未实现，放在 Phase 3
4. **学习优化效果**：需要至少 10 个案例才能验证，冷启动时无法验证

---

## 依赖清单

### Node.js 包

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.40.0",
    "openai": "^4.70.0",
    "axios": "^1.7.0",
    "js-yaml": "^4.1.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "ajv": "^8.12.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/js-yaml": "^4.0.9",
    "tsx": "^4.19.0",
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0"
  }
}
```

### 环境变量

```bash
# 私有模型
export DEEPSEEK_API_KEY="sk-e011409cdf6e9cab14fc07db836dbe1b432f5638c9e5c303d5369023bcba447e"
export GEMINI_API_KEY="sk-726343572536455ca9728b8cb737897cfefd7fde2631b872f62a3e9e02d5004b"

# 公有云模型
export ANTHROPIC_API_KEY="<your-anthropic-key>"
export OPENAI_API_KEY="<your-openai-key>"

# 告警（可选）
export ORCA_SLACK_WEBHOOK="<your-slack-webhook>"
```

---

## 参考

- Spec: `/tmp/orca-jev-multi-model-orchestration-spec.md`
- Superpowers 规范示例: `docs/superpowers/plans/2026-10-19-device-orientation-background-binding-plan.md`
