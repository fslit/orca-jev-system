# Orca + JEV 多模型编排与决策系统设计

## 状态

**Draft** — 待评审

## 日期

- 首版：2026-01-XX
- 最后更新：2026-01-XX

## 背景

当前 AI 项目开发面临三大痛点：

1. **单一模型决策容易出错**：直接执行用户需求，缺少可行性判断和风险评估，导致自动化失败或产生不符合预期的代码。
2. **成本居高不下**：全程使用 Claude Opus 5.5，单次任务成本 $3-75/M tokens，而大量场景（搜索、工具调用、前端开发）可用更便宜的模型。
3. **缺少可观测性**：任务执行过程黑盒，无法追踪模型选择、执行进度、成本分布，难以优化和排查问题。

本设计引入 **JEV (Judge-Evaluator-Validator) 决策模型**和 **Orca 可观测性平台**，构建一个智能、可靠、可优化的多模型编排系统。

---

## 目标

### 主要目标

1. **智能决策**：通过 JEV 三层决策（判断-评估-验证），在执行前评估可行性、风险和最优方案。
2. **成本优化**：
   - 私有部署模型（DeepSeek 4.1, Gemini 3.8 Flash High）成本 $0.01-0.02/M tokens
   - 根据任务类型智能路由，降低 60-95% 成本
3. **全链路可观测**：
   - Trace：完整决策链和执行链追踪
   - Metrics：成本、时间、成功率统计
   - Logging：结构化日志
   - Alerting：异常和偏离告警
4. **自我学习**：记录每次决策和执行结果，持续优化路由策略和时间/成本预估准确性。
5. **人机协同**：根据风险等级和置信度动态决定人工介入点。

### 非目标

- 不替代现有 Claude Code CLI，而是增强其多模型编排能力
- 不要求所有任务都经过完整 JEV 流程（简单任务直接执行）
- 不建立独立的代码执行沙箱（继续使用 Pi CLI 的执行环境）
- 不改变现有 GitHub Webhook 或 MQTT 集成契约

---

## 系统架构

### 整体分层

```
┌─────────────────────────────────────────────────────────┐
│  用户界面层                                              │
│  • Pi CLI（统一入口）                                    │
│  • Orca Dashboard（Web 可视化）                          │
│  • GitHub Issue/PR 集成                                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  JEV 决策层（决策大脑）                                  │
│  ┌──────────┐   ┌───────────┐   ┌───────────┐         │
│  │  Judge   │ → │ Evaluator │ → │ Validator │         │
│  │ 判断可行性 │   │ 方案对比  │   │  验证计划  │         │
│  └──────────┘   └───────────┘   └───────────┘         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Orca 编排引擎（执行协调者）                             │
│  • 模型路由（Model Router）                              │
│  • 任务编排（Task Orchestrator - DAG）                   │
│  • 健康检查与故障转移                                     │
│  • 成本追踪与预算控制                                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  模型池（多模型资源）                                     │
│  ┌─────────────────┐     ┌──────────────────┐          │
│  │  私有部署        │     │  公有云           │          │
│  │  • DeepSeek 4.1 │     │  • Claude Opus    │          │
│  │  • Gemini Flash │     │  • GPT-6.1-sol    │          │
│  └─────────────────┘     └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Orca 可观测性平台                                       │
│  • Traces（traceId + spans）                            │
│  • Metrics（JSONL 存储）                                │
│  • Logs（结构化日志）                                    │
│  • Alerts（Slack/Email 通知）                           │
└─────────────────────────────────────────────────────────┘
```

---

## JEV 决策模型

### 1. Judge（判断层）

**职责**：深度理解任务意图，评估可行性和风险。

**输入**：
- 用户目标（user_goal）
- 项目上下文（代码库健康度、技术栈、历史成功率）

**输出**：
```typescript
interface JudgmentResult {
  automation_score: number;      // 0-100，可自动化性评分
  risk_level: 'low' | 'medium' | 'high';
  strategy: 'full_automation' | 'semi_automation' | 'guidance_only' | 'not_recommended';
  reasoning: string;
  risks: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation: string;
  }>;
  confidence: number;            // 0-100，判断置信度
}
```

**决策阈值**：
- `automation_score < 60` → 拒绝自动化
- `confidence < 70` → 需要人工确认
- `risk_level === 'high'` → 升级到人工审查

**模型选择**：Claude Opus 5.5（需要最强推理能力）

---

### 2. Evaluator（评估层）

**职责**：生成多个候选方案，多维度评分，选择最优方案。

**输入**：
- Judge 判断结果
- 项目约束（预算、时间、质量要求）
- 可用模型池

**输出**：
```typescript
interface PlanEvaluation {
  best_plan: ExecutionPlan;
  alternatives: ExecutionPlan[];
  reasoning: string;
}

interface ExecutionPlan {
  plan_id: string;
  name: string;
  strategy: '保守' | '平衡' | '激进' | '创新';
  tasks: Array<{
    task_id: string;
    name: string;
    model: string;              // 选定的模型
    estimated_time: string;
    estimated_cost: number;
  }>;
  total_time: string;
  total_cost: number;
  quality_gates: string[];
  evaluation: {
    feasibility: number;        // 0-100
    cost_effectiveness: number;
    time_efficiency: number;
    quality: number;
    risk_control: number;
    weighted_score: number;     // 综合评分
  };
}
```

**方案生成策略**：
- 保守方案：质量优先，成本较高，速度较慢
- 平衡方案：三者平衡
- 激进方案：速度优先，成本较低，质量保底
- 创新方案：采用新技术/新模式

**模型选择**：Claude Opus 5.5（需要多方案对比能力）

---

### 3. Validator（验证层）

**职责**：验证计划合理性，预测成功率，持续监控执行偏离。

**三阶段验证**：

#### 3.1 执行前验证（Pre-execution）

```typescript
interface PreValidation {
  is_valid: boolean;
  confidence: number;            // 0-100
  predicted_success_rate: number; // 0-100
  
  validation_results: {
    dependencies: { valid: boolean; issues: string[] };
    resources: { valid: boolean; issues: string[] };
    quality_gates: { valid: boolean; issues: string[] };
    risks: { adequate: boolean; gaps: string[] };
  };
  
  risk_factors: Array<{
    factor: string;
    probability: number;         // 0-100
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
  
  go_no_go: 'go' | 'go_with_changes' | 'no_go';
}
```

#### 3.2 执行中验证（During-execution）

每隔 5 分钟（可配置）检查：
- 实际耗时 vs 预估耗时
- 实际成本 vs 预估成本
- 质量指标下降

**偏离阈值**：
- 时间偏离 > 50% → 触发警告
- 成本偏离 > 30% → 触发警告
- 质量下降 > 20% → 触发警告

**调整策略**：
- 轻微偏离：记录日志，继续执行
- 中度偏离：调整后续任务资源分配
- 严重偏离：暂停执行，升级到人工决策

#### 3.3 执行后验证（Post-execution）

```typescript
interface PostValidation {
  final_judgment: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS';
  
  acceptance_check: {
    goals_met: boolean;
    quality_sufficient: boolean;
    no_regressions: boolean;
  };
  
  gaps: string[];                // 未达成的验收标准
  recommendations: string[];     // 改进建议
}
```

**模型选择**：Claude Sonnet 5.5（可用稍弱模型降低成本）

---

## 模型池配置

### 私有部署模型

```yaml
private_models:
  deepseek-4.1:
    provider: deepseek
    base_url: http://172.87.28.157:8080
    api_key: sk-e011409cdf6e9cab14fc07db836dbe1b432f5638c9e5c303d5369023bcba447e
    cost_per_1m:
      input: 0.01
      output: 0.01
    capabilities:
      - search
      - tooling
      - scripting
      - data_analysis
    priority: 1              # 优先级，1 最高
    health_check:
      enabled: true
      interval: 60s
      cache_ttl: 60s
    
  gemini-3.8-flash-high:
    provider: gemini
    base_url: http://172.87.28.157:8080
    api_key: sk-726343572536455ca9728b8cb737897cfefd7fde2631b872f62a3e9e02d5004b
    cost_per_1m:
      input: 0.02
      output: 0.02
    capabilities:
      - frontend
      - ui
      - rapid_prototyping
      - react
      - vue
    priority: 1
    health_check:
      enabled: true
      interval: 60s
      cache_ttl: 60s
```

### 公有云模型

```yaml
public_models:
  claude-opus-5-5:
    provider: anthropic
    cost_per_1m:
      input: 15.00
      output: 75.00
    capabilities:
      - pm
      - architecture
      - complex_reasoning
      - jev_judge
      - jev_evaluator
    priority: 2              # 作为 fallback
    
  claude-sonnet-5-5:
    provider: anthropic
    cost_per_1m:
      input: 3.00
      output: 15.00
    capabilities:
      - backend
      - validation
      - code_review
      - jev_validator
    priority: 2
    
  gpt-6.1-sol:
    provider: openai
    cost_per_1m:
      input: 5.00
      output: 15.00
    capabilities:
      - backend
      - api
      - database
      - golang
      - python
    priority: 2
```

---

## 路由决策树

### 任务类型 → 模型映射

```yaml
routing_rules:
  # 高优先级：私有部署模型
  - task_types: [search, file_search, code_search]
    primary: deepseek-4.1
    fallback: [claude-sonnet-5-5]
    
  - task_types: [frontend, react, vue, ui_component]
    primary: gemini-3.8-flash-high
    fallback: [claude-sonnet-5-5]
    
  - task_types: [scripting, shell, automation]
    primary: deepseek-4.1
    fallback: [claude-sonnet-5-5]
    
  # 中等优先级：特定场景用公有云
  - task_types: [backend, api, golang, python]
    primary: gpt-6.1-sol
    fallback: [claude-sonnet-5-5, deepseek-4.1]
    
  # JEV 专用路由
  - task_types: [jev_judge, jev_evaluator]
    primary: claude-opus-5-5
    fallback: []              # JEV 不降级
    
  - task_types: [jev_validator]
    primary: claude-sonnet-5-5
    fallback: [claude-opus-5-5]
    
  # 默认路由
  - task_types: [default]
    primary: claude-sonnet-5-5
    fallback: [claude-opus-5-5]
```

### 故障转移策略

```yaml
failover:
  # 健康检查失败后的行为
  on_health_check_failure:
    - mark_unavailable: true
    - retry_after: 300s       # 5 分钟后重试
    - use_fallback: true
    
  # 请求失败后的行为
  on_request_failure:
    - max_retries: 2
    - retry_delay: 5s
    - exponential_backoff: true
    - fallback_on_final_failure: true
    
  # 成本超限后的行为
  on_cost_exceeded:
    - action: switch_to_cheaper_model
    - notify: true
```

---

## Orca 可观测性

### Trace 结构

```typescript
interface OrcaTrace {
  traceId: string;              // trace-1234567890
  goal: string;                 // 用户目标
  project: string;              // 项目名称
  startTime: string;            // ISO 8601
  endTime?: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  
  jev_decisions: {
    judgment?: JudgmentResult;
    plan_evaluation?: PlanEvaluation;
    pre_validation?: PreValidation;
    mid_validations?: MidValidation[];
    post_validation?: PostValidation;
  };
  
  spans: OrcaSpan[];
  metrics: TraceMetrics;
}

interface OrcaSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  type: 'jev_judge' | 'jev_evaluator' | 'jev_validator' | 'task' | 'model_call';
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'failed';
  
  model?: string;               // 使用的模型
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  
  metadata: Record<string, any>;
}

interface TraceMetrics {
  total_time: number;           // 秒
  total_cost: number;           // 美元
  total_tokens: {
    input: number;
    output: number;
  };
  
  model_breakdown: Array<{
    model: string;
    calls: number;
    tokens: { input: number; output: number };
    cost: number;
    avg_latency: number;
  }>;
  
  success_rate: number;         // 0-100
}
```

### Metrics 存储（JSONL）

```jsonl
{"timestamp":"2026-01-15T10:30:00Z","metric":"model.call","model":"deepseek-4.1","task_type":"search","duration_ms":1234,"input_tokens":500,"output_tokens":300,"cost":0.008,"status":"success"}
{"timestamp":"2026-01-15T10:30:05Z","metric":"model.call","model":"claude-opus-5-5","task_type":"jev_judge","duration_ms":3456,"input_tokens":2000,"output_tokens":800,"cost":0.210,"status":"success"}
{"timestamp":"2026-01-15T10:35:00Z","metric":"trace.complete","traceId":"trace-123","total_cost":0.45,"total_time":300,"success":true}
```

### Dashboard 核心视图

#### 1. 实时执行视图

```
┌─────────────────────────────────────────────────────────┐
│ 🔴 Trace trace-123 - Running (3m 25s)                   │
├─────────────────────────────────────────────────────────┤
│ Goal: 实现用户认证功能                                   │
│ Project: ml-alone-client                                │
│ Budget: $0.45 / $2.00                                   │
├─────────────────────────────────────────────────────────┤
│ ✅ JEV Judge                    5.2s  $0.21  Opus       │
│ ✅ JEV Evaluator                8.7s  $0.31  Opus       │
│ ✅ JEV Pre-Validator            3.1s  $0.09  Sonnet     │
│ 🔵 Task 1: 设计数据库 schema    12s   $0.03  GPT-6.1    │
│ ⏳ Task 2: 实现 API 路由        ...   ...   ...         │
│    Task 3: 编写测试             ...   ...   ...         │
│    Task 4: 前端集成             ...   ...   ...         │
└─────────────────────────────────────────────────────────┘
```

#### 2. 成本对比视图

```
本次任务成本对比：

使用 Orca 多模型编排: $0.45
  • Judge (Opus):       $0.21
  • Evaluator (Opus):   $0.31
  • Validator (Sonnet): $0.09
  • Task 1 (GPT):       $0.03
  • Task 2 (DeepSeek):  $0.01
  • Task 3 (Gemini):    $0.02
  
如果全用 Opus: $3.20 (节省 86%)
如果全用 Sonnet: $1.50 (节省 70%)
```

#### 3. JEV 决策面板

（见前文）

---

## 项目配置文件

### `.orca/project.yaml`

```yaml
project:
  name: ml-alone-client
  type: fullstack
  description: 工业物联网统一管理平台
  
stack:
  frontend:
    - react-native
    - typescript
  backend:
    - golang
    - goframe-v2
  database:
    - mysql
    - redis
  infrastructure:
    - docker
    - kubernetes

# JEV 配置
jev:
  enabled: true
  
  models:
    judge: claude-opus-5-5
    evaluator: claude-opus-5-5
    validator: claude-sonnet-5-5
  
  thresholds:
    min_automation_score: 60
    min_confidence: 70
    max_risk_level: medium
    min_predicted_success: 75
  
  validation:
    pre_execution: true
    during_execution: true
    post_execution: true
    continuous_check_interval: 300
    
    deviation_thresholds:
      time: 50
      cost: 30
      quality: 20
  
  # 分级策略（成本优化）
  strategy:
    simple_task:              # automation_score > 90, risk = low
      judge: false
      evaluator: false
      validator: light
    
    medium_task:              # automation_score 70-90
      judge: true
      evaluator: simplified   # 生成 2 个方案
      validator: standard
    
    complex_task:             # automation_score < 70 或 risk = high
      judge: true
      evaluator: full         # 生成 4-5 个方案
      validator: thorough
  
  cost_control:
    max_jev_cost_per_task: 0.50
    skip_jev_if_task_cost_below: 0.10
  
  # 人工介入点
  human_in_loop:
    require_approval_when:
      - condition: risk_level
        value: high
      - condition: automation_score
        operator: '<'
        value: 70
      - condition: predicted_success
        operator: '<'
        value: 80
      - condition: total_cost
        operator: '>'
        value: 5.0
    
    escalation:
      enabled: true
      contact: team@example.com
      slack_channel: '#orca-alerts'

# 模型路由配置
routing:
  private_models:
    deepseek-4.1:
      provider: deepseek
      base_url: http://172.87.28.157:8080
      api_key_env: DEEPSEEK_API_KEY
      cost_per_1m: { input: 0.01, output: 0.01 }
      capabilities: [search, tooling, scripting, data_analysis]
      priority: 1
      health_check:
        enabled: true
        interval: 60s
        cache_ttl: 60s
    
    gemini-3.8-flash-high:
      provider: gemini
      base_url: http://172.87.28.157:8080
      api_key_env: GEMINI_API_KEY
      cost_per_1m: { input: 0.02, output: 0.02 }
      capabilities: [frontend, ui, rapid_prototyping, react, vue]
      priority: 1
      health_check:
        enabled: true
        interval: 60s
        cache_ttl: 60s
  
  public_models:
    claude-opus-5-5:
      provider: anthropic
      cost_per_1m: { input: 15.00, output: 75.00 }
      capabilities: [pm, architecture, complex_reasoning, jev_judge, jev_evaluator]
      priority: 2
    
    claude-sonnet-5-5:
      provider: anthropic
      cost_per_1m: { input: 3.00, output: 15.00 }
      capabilities: [backend, validation, code_review, jev_validator]
      priority: 2
    
    gpt-6.1-sol:
      provider: openai
      cost_per_1m: { input: 5.00, output: 15.00 }
      capabilities: [backend, api, database, golang, python]
      priority: 2
  
  rules:
    - task_types: [search, file_search, code_search]
      primary: deepseek-4.1
      fallback: [claude-sonnet-5-5]
    
    - task_types: [frontend, react, vue, ui_component]
      primary: gemini-3.8-flash-high
      fallback: [claude-sonnet-5-5]
    
    - task_types: [scripting, shell, automation]
      primary: deepseek-4.1
      fallback: [claude-sonnet-5-5]
    
    - task_types: [backend, api, golang, python]
      primary: gpt-6.1-sol
      fallback: [claude-sonnet-5-5, deepseek-4.1]
    
    - task_types: [jev_judge, jev_evaluator]
      primary: claude-opus-5-5
      fallback: []
    
    - task_types: [jev_validator]
      primary: claude-sonnet-5-5
      fallback: [claude-opus-5-5]
    
    - task_types: [default]
      primary: claude-sonnet-5-5
      fallback: [claude-opus-5-5]
  
  failover:
    on_health_check_failure:
      mark_unavailable: true
      retry_after: 300s
      use_fallback: true
    
    on_request_failure:
      max_retries: 2
      retry_delay: 5s
      exponential_backoff: true
      fallback_on_final_failure: true
    
    on_cost_exceeded:
      action: switch_to_cheaper_model
      notify: true

# 可观测性配置
observability:
  traces:
    enabled: true
    storage: ~/.orca/traces/${project_name}/
    retention_days: 30
  
  metrics:
    enabled: true
    storage: ~/.orca/metrics/${project_name}/metrics.jsonl
    retention_days: 90
  
  logging:
    level: info
    format: json
    output: ~/.orca/logs/${project_name}/orca.log
  
  alerts:
    enabled: true
    channels:
      - type: slack
        webhook_url_env: ORCA_SLACK_WEBHOOK
        channels: ['#orca-alerts']
      - type: email
        recipients: ['team@example.com']
    
    rules:
      - name: high_cost
        condition: trace.total_cost > 5.0
        severity: warning
        message: "任务成本超过 $5"
      
      - name: execution_failed
        condition: trace.status == 'failed'
        severity: error
        message: "任务执行失败"
      
      - name: severe_deviation
        condition: |
          execution.time_deviation > 100 OR
          execution.cost_deviation > 50
        severity: warning
        message: "执行严重偏离预期"

# GitHub 集成
github:
  enabled: true
  webhook:
    enabled: true
    port: 3456
    secret_env: ORCA_GITHUB_WEBHOOK_SECRET
  
  auto_response:
    issue_opened: true
    issue_commented: true
    pr_opened: true
  
  approval_commands:
    - /orca approve
    - /orca run
  
  quality_gates:
    required_checks:
      - tests_pass
      - build_success
      - no_lint_errors
    
    auto_merge:
      enabled: false

# 学习与优化
learning:
  enabled: true
  storage: ~/.orca/learning/${project_name}/
  
  metrics:
    - automation_score_accuracy
    - time_estimation_accuracy
    - cost_estimation_accuracy
    - success_rate_prediction
  
  optimization:
    enabled: true
    min_cases_for_optimization: 10
    run_interval: daily
```

---

## 执行流程示例

### 完整流程（复杂任务）

```
用户输入: "实现用户认证功能，包括登录、注册、密码重置"

1. Judge 判断
   ↓
   automation_score: 75
   risk_level: medium
   strategy: semi_automation (关键节点需人工审查)
   confidence: 88%
   
2. Evaluator 生成方案
   ↓
   方案 A (平衡): JWT + Redis session, $0.45, 2h
   方案 B (保守): OAuth2 + 完整审计, $0.80, 3h
   方案 C (激进): 简化 JWT only, $0.25, 1.5h
   
   → 选择方案 A (综合评分 87/100)

3. Validator 验证计划
   ↓
   • 依赖关系: ✅ 合理
   • 资源预估: ⚠️ 时间可能不足，建议+30% buffer
   • 质量门槛: ✅ 可达成
   • 风险覆盖: ✅ 充分
   
   predicted_success_rate: 88%
   go_no_go: go_with_changes
   
   调整: Task 3 时间从 20m → 26m

4. 执行
   ↓
   Task 1: 设计数据库 schema (GPT-6.1-sol, 15m, $0.03)
   Task 2: 实现 API 路由 (GPT-6.1-sol, 35m, $0.07)
   Task 3: 编写测试 (DeepSeek-4.1, 26m, $0.01)
   Task 4: 前端集成 (Gemini Flash, 30m, $0.02)
   
   执行中验证 (每 5 分钟):
   - 18m: 进度正常
   - 38m: ⚠️ Task 2 超时 8%, 调整 Task 4 buffer
   - 68m: 进度正常

5. 结果验证
   ↓
   • 验收标准: ✅ 全部达成
   • 测试通过: ✅ 47/47 tests passed
   • 无回归: ✅ 现有功能未受影响
   
   final_judgment: PASS

6. 学习反馈
   ↓
   • 记录: GPT-6.1-sol 在 backend API 任务上表现优秀
   • 更新: backend API 任务时间预估模型 (+5% buffer)
   • 提取: 成功模式 "JWT + Redis session for auth"
```

### 简化流程（简单任务）

```
用户输入: "修复 typo in README.md"

1. 快速评估
   ↓
   automation_score: 95 (> 90, 触发简化流程)
   risk_level: low
   
   跳过 JEV，直接执行

2. 执行
   ↓
   Task: 搜索文件 + 修复 (DeepSeek-4.1, 2m, $0.005)

3. 轻量验证
   ↓
   • 文件修改: ✅ 仅 README.md
   • 语法检查: ✅ 通过
   
   final_judgment: PASS
```

---

## 成本对比

### 场景 1: 实现用户认证功能

| 模式 | 总成本 | 总时间 | 备注 |
|-----|--------|--------|------|
| **Orca + JEV** | **$0.58** | 106m | Judge $0.21 + Eval $0.31 + Valid $0.09 + Tasks $0.13 |
| 全用 Opus | $3.20 | 95m | 速度稍快，但成本高 5.5 倍 |
| 全用 Sonnet | $1.50 | 100m | 成本高 2.6 倍 |
| **节省** | **82%** | | 相比 Opus |

### 场景 2: 简单任务（修复 bug）

| 模式 | 总成本 | 总时间 | 备注 |
|-----|--------|--------|------|
| **Orca（跳过 JEV）** | **$0.005** | 2m | DeepSeek 直接执行 |
| 全用 Opus | $0.180 | 2m | 成本高 36 倍 |
| 全用 Sonnet | $0.036 | 2m | 成本高 7.2 倍 |
| **节省** | **97%** | | 相比 Opus |

### 场景 3: 前端组件开发

| 模式 | 总成本 | 总时间 | 备注 |
|-----|--------|--------|------|
| **Orca + JEV** | **$0.73** | 85m | Judge + Eval + Gemini Flash |
| 全用 Opus | $2.80 | 80m | 速度稍快 |
| 全用 Sonnet | $1.20 | 82m | |
| **节省** | **74%** | | 相比 Opus |

---

## 对比现有方案

### vs 单一 Claude Code

| 维度 | Claude Code (单一 Opus) | Orca + JEV |
|-----|-------------------------|-----------|
| 决策质量 | 依赖单一模型 | JEV 三层交叉验证 |
| 成本 | 高 ($3-75/M tokens) | 低 (平均节省 60-95%) |
| 可观测性 | 黑盒 | Trace/Metrics/Logs/Alerts 全覆盖 |
| 故障恢复 | 手动重试 | 自动健康检查 + 故障转移 |
| 学习能力 | 无 | 持续优化路由和预估 |
| 人机协同 | 固定 | 根据风险动态调整 |

### vs Pi CLI 多模型切换

| 维度 | Pi CLI (手动切换) | Orca + JEV |
|-----|------------------|-----------|
| 模型选择 | 手动指定 | 智能路由 |
| 方案评估 | 无 | Evaluator 对比多方案 |
| 执行监控 | 无 | 实时偏离检测 |
| 成本追踪 | 无 | 完整成本分解 |
| 失败处理 | 手动重试 | 自动 fallback 链 |

---

## 质量属性

### 可靠性

- **健康检查**：60s 间隔检查私有模型可用性，60s 缓存 TTL
- **故障转移**：Primary → Fallback 链，最多 2 次重试
- **幂等性**：重复请求产生相同结果
- **优雅降级**：JEV 失败时可退化为直接执行

### 性能

- **并行执行**：DAG 拓扑排序支持任务并行
- **缓存**：健康检查结果缓存，判断结果缓存（相似任务）
- **响应时间**：私有模型 < 2s，公有云模型 < 5s

### 安全性

- **API Key 隔离**：通过环境变量注入，不写入配置文件
- **审计日志**：所有决策和执行留痕
- **权限控制**：人工介入点强制审查高风险操作

### 可扩展性

- **新模型接入**：只需在配置文件添加模型定义和路由规则
- **自定义 Agent**：支持自定义 Judge/Evaluator/Validator 实现
- **插件机制**：支持自定义路由策略、验证规则、告警规则

---

## 依赖

### 基础依赖

- Node.js ≥ 18
- TypeScript ≥ 5.0
- Pi CLI（统一执行环境）

### 外部服务

- 私有模型：DeepSeek 4.1, Gemini 3.8 Flash High (http://172.87.28.157:8080)
- 公有云模型：Claude Opus/Sonnet 5.5, GPT-6.1-sol
- GitHub API（可选，用于 Issue/PR 集成）
- Slack API（可选，用于告警通知）

### 存储

- JSONL 文件：Metrics, Logs
- JSON 文件：Traces, Learning 数据
- Git 仓库：项目配置 (`.orca/project.yaml`)

---

## 限制与约束

### 当前限制

1. **JEV 成本**：完整 JEV 流程增加 3 次 Opus 调用（~$0.60），通过分级策略降低影响。
2. **私有模型依赖**：依赖 `172.87.28.157:8080` 可用性，需要网络连通性。
3. **实时性**：执行中验证间隔 5 分钟，不是实时监控。
4. **学习数据量**：至少 10 个案例才开始优化，冷启动时依赖预设规则。

### 已知权衡

- **成本 vs 质量**：JEV 增加 $0.50-0.60 成本，换取更高决策质量和预测准确性。
- **复杂度 vs 收益**：简单任务（< $0.10）跳过 JEV，避免过度设计。
- **实时性 vs 开销**：执行中验证间隔 5 分钟，平衡监控粒度和 API 调用成本。

---

## 未来演进

### Phase 1: 核心能力（Q1 2026）

- [ ] JEV 基础实现（Judge, Evaluator, Validator）
- [ ] 模型路由引擎
- [ ] Trace/Metrics 基础可观测性
- [ ] Pi CLI 集成

### Phase 2: 增强能力（Q2 2026）

- [ ] Orca Dashboard（Web 可视化）
- [ ] GitHub Webhook 集成
- [ ] 学习与优化引擎
- [ ] Slack/Email 告警

### Phase 3: 高级能力（Q3 2026）

- [ ] 多项目管理
- [ ] 自定义 Agent 开发框架
- [ ] A/B 测试框架（对比不同路由策略）
- [ ] 成本预算控制与配额管理

### Phase 4: 企业能力（Q4 2026）

- [ ] 团队协作（多用户、角色权限）
- [ ] SaaS 化部署
- [ ] 企业级 SLA 保障
- [ ] 审计与合规能力

---

## 参考资料

- Claude Code 官方文档: https://docs.anthropic.com/claude/code
- Pi CLI 文档: （内部）
- Orca 可观测性最佳实践: （待补充）
- JEV 模型论文: （待补充）
