# Orca + JEV 用户使用指南

> 让 AI 自动化项目管理、架构设计和代码开发

---

## 快速开始

### 1. 安装 Orca CLI

```bash
# 方式 1: 全局安装（推荐）
npm install -g @orca/cli

# 方式 2: 从源码安装
git clone https://github.com/yourorg/orca.git ~/orca
cd ~/orca
npm install && npm run build && npm link

# 验证安装
orca --version
```

### 2. 配置 API Key

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export DEEPSEEK_API_KEY="sk-e011409cdf6e9cab14fc07db836dbe1b432f5638c9e5c303d5369023bcba447e"

# 立即生效
source ~/.bashrc
```

---

## 使用场景 1: 创建新项目

### 场景描述

你有一个新想法，想让 AI 自动：
1. 分析需求可行性
2. 设计技术架构
3. 创建 GitHub 仓库
4. 生成项目结构
5. 编写初始代码

### 使用步骤

#### Step 1: 描述项目需求

```bash
orca create-project
```

**交互式问答：**

```
🤖 Orca: 欢迎使用 Orca！我会帮你创建新项目。

📝 请描述你的项目需求:
> 我想创建一个工业物联网告警管理平台，支持多系统告警聚合、智能降噪和大屏展示。

🎯 目标用户是谁？
> 工厂运维人员和管理层

💡 核心功能有哪些？（用逗号分隔）
> 告警接收, 告警分类, 智能降噪, 趋势分析, 大屏展示, 移动端推送

🛠️  技术栈偏好（可选，留空则由 AI 推荐）:
Backend> golang, goframe-v2
Frontend> vue3, element-plus
Database> mysql, redis
Other> 

📊 预期规模:
> 中型项目（日告警量 1000-10000）

🔗 GitHub 组织/用户名:
> goldeyeai

📦 项目名称:
> iot-alert-manager
```

#### Step 2: AI 自动判断（Judge）

```
🤔 Judge 正在分析项目可行性...

✅ 判断结果:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  自动化评分:  75/100
  风险等级:    Medium
  建议策略:    Semi Automation (半自动化)
  置信度:      82%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 关键风险:
  1. [High] 多系统集成复杂度 - 不同告警系统的协议和格式差异大
     → 缓解: 设计统一的告警适配器接口，支持插件化扩展
  
  2. [Medium] 智能降噪算法准确性 - 需要大量历史数据训练
     → 缓解: 先实现基于规则的降噪，后期引入机器学习
  
  3. [Medium] 大屏实时性能 - 高并发告警时可能卡顿
     → 缓解: 使用 WebSocket + Redis Pub/Sub，前端做数据聚合

💡 建议: 我会自动生成项目架构和初始代码，但以下部分需要你人工确认：
  - 告警适配器接口设计
  - 智能降噪规则策略
  - 大屏实时推送架构

是否继续？[Y/n] 
```

#### Step 3: AI 生成执行方案（Evaluator）

```
📋 Evaluator 正在生成执行方案...

✨ 已生成 3 个候选方案:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
方案 1: 保守策略 (推荐)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  预估时间: 8-10 小时
  预估成本: $2.50
  综合评分: 87/100

  任务拆解:
  □ Phase 1: 项目初始化 (30min, $0.15)
    - 创建 GitHub 仓库
    - 生成项目结构（Go backend + Vue frontend）
    - 配置 CI/CD
  
  □ Phase 2: 核心数据模型设计 (45min, $0.25)
    - 告警实体设计（Alert, AlertRule, AlertChannel）
    - 数据库表结构（MySQL schema）
    - Redis 缓存策略
  
  □ Phase 3: 告警接收 API (90min, $0.50)
    - 通用 Webhook 接收器
    - 告警适配器接口定义
    - 3 个常见系统适配器（Prometheus, Zabbix, 自定义）
  
  □ Phase 4: 告警降噪引擎 (120min, $0.70)
    - 基于规则的降噪（重复、时间窗口、关联）
    - 优先级计算
    - 告警聚合
  
  □ Phase 5: 前端基础框架 (90min, $0.40)
    - Vue3 + Element Plus 搭建
    - 告警列表页面
    - 告警详情页面
  
  □ Phase 6: 单元测试与文档 (60min, $0.30)
    - 核心逻辑单元测试
    - API 文档生成
    - README 编写

  评估维度:
    可行性:      95/100  ✅ 技术栈成熟，风险可控
    成本效益:    85/100  ✅ 成本适中，质量有保障
    时间效率:    75/100  ⚠️  开发时间较长
    质量:        90/100  ✅ 测试覆盖充分
    风险控制:    95/100  ✅ 分阶段验证，可随时调整

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
方案 2: 平衡策略
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  预估时间: 5-7 小时
  预估成本: $1.80
  综合评分: 82/100
  [详情省略...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
方案 3: 激进策略
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  预估时间: 3-4 小时
  预估成本: $1.20
  综合评分: 70/100
  [详情省略...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请选择方案 [1/2/3]:
```

#### Step 4: AI 验证执行计划（Validator）

```
🔍 Validator 正在验证方案 1...

✅ 验证结果:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  决策:          GO ✅
  预测成功率:    88%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

检查项:
  ✅ 依赖关系: 合理（Phase 2 → Phase 3 → Phase 4）
  ✅ 资源预估: 合理（基于类似项目历史数据）
  ✅ 质量门槛: 可达成（单元测试覆盖率 > 70%）
  ⚠️  风险覆盖: 充分但需注意智能降噪的算法调优时间

建议调整:
  1. Phase 4 时间预留 +30min 用于降噪规则调优
  2. 增加 Phase 5 与 Phase 4 的集成测试（+20min）

是否采纳调整？[Y/n]
```

#### Step 5: 开始执行

```
🚀 开始执行方案 1（保守策略）...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1: 项目初始化 (预计 30min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/6] 创建 GitHub 仓库...
  ✅ 仓库已创建: https://github.com/goldeyeai/iot-alert-manager
  
[2/6] 生成后端项目结构...
  ✅ 已创建:
     backend/
       ├── cmd/server/main.go
       ├── internal/
       │   ├── api/          # HTTP API
       │   ├── service/      # 业务逻辑
       │   ├── repository/   # 数据访问
       │   └── model/        # 数据模型
       ├── pkg/
       │   ├── adapter/      # 告警适配器
       │   └── denoiser/     # 降噪引擎
       ├── go.mod
       └── go.sum

[3/6] 生成前端项目结构...
  ✅ 已创建:
     frontend/
       ├── src/
       │   ├── views/        # 页面
       │   ├── components/   # 组件
       │   ├── api/          # API 调用
       │   └── router/       # 路由
       ├── package.json
       └── vite.config.ts

[4/6] 配置数据库...
  ✅ 已创建:
     database/
       ├── migrations/       # 数据库迁移
       └── schema.sql        # 表结构

[5/6] 配置 CI/CD...
  ✅ 已创建:
     .github/
       └── workflows/
           ├── backend.yml   # 后端 CI
           └── frontend.yml  # 前端 CI

[6/6] 提交到 GitHub...
  ✅ 已提交: commit 3f8a9c1 "feat: 项目初始化"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 2: 核心数据模型设计 (预计 45min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] 设计告警实体...
  ✅ 已创建: backend/internal/model/alert.go
  
     type Alert struct {
         ID          int64     `json:"id"`
         Source      string    `json:"source"`       // 来源系统
         Level       string    `json:"level"`        // 告警级别
         Title       string    `json:"title"`
         Content     string    `json:"content"`
         Tags        []string  `json:"tags"`
         FirstTime   time.Time `json:"first_time"`   // 首次告警时间
         LastTime    time.Time `json:"last_time"`    // 最后告警时间
         Count       int       `json:"count"`        // 聚合次数
         Status      string    `json:"status"`       // pending/acknowledged/resolved
         Priority    int       `json:"priority"`     // 优先级（降噪计算）
         Fingerprint string    `json:"fingerprint"`  // 去重指纹
     }

[2/3] 设计数据库表结构...
  ✅ 已创建: database/migrations/001_init_schema.sql
  
     CREATE TABLE alerts (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         source VARCHAR(50) NOT NULL,
         level VARCHAR(20) NOT NULL,
         title VARCHAR(255) NOT NULL,
         content TEXT,
         tags JSON,
         first_time TIMESTAMP NOT NULL,
         last_time TIMESTAMP NOT NULL,
         count INT DEFAULT 1,
         status VARCHAR(20) DEFAULT 'pending',
         priority INT DEFAULT 0,
         fingerprint VARCHAR(64) UNIQUE,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         INDEX idx_status (status),
         INDEX idx_priority (priority),
         INDEX idx_fingerprint (fingerprint)
     );

[3/3] 设计 Redis 缓存策略...
  ✅ 已创建: docs/redis-design.md
  
     缓存结构:
     - alerts:pending        (Sorted Set) 待处理告警，按优先级排序
     - alerts:stats:{source} (Hash) 各来源告警统计
     - alerts:dedup:{fp}     (String, TTL 5min) 去重指纹
     - alerts:realtime       (Pub/Sub) 实时告警推送

[进度] Phase 2 完成 ✅ (实际用时: 42min, 成本: $0.23)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏸️  Phase 3 即将开始，是否继续？[Y/n/review]
   Y - 继续执行
   n - 暂停
   review - 查看已生成代码
```

#### Step 6: 执行中验证（Mid-Validation）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 3: 告警接收 API (预计 90min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] 实现通用 Webhook 接收器...
  ✅ 已创建: backend/internal/api/webhook.go

[2/3] 定义告警适配器接口...
  ✅ 已创建: backend/pkg/adapter/adapter.go

[3/3] 实现 3 个系统适配器...
  ✅ Prometheus 适配器: backend/pkg/adapter/prometheus.go
  ✅ Zabbix 适配器: backend/pkg/adapter/zabbix.go
  ✅ 自定义适配器: backend/pkg/adapter/custom.go

[进度] Phase 3 完成 ✅ (实际用时: 85min, 成本: $0.48)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  执行中验证 (Mid-Validation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

检查项:
  ⏱️  时间偏离: -5.6% (比预期快 5min) ✅
  💰 成本偏离: -4.0% (比预期少 $0.02) ✅
  📊 质量指标:
     - 代码覆盖率: 0% (未运行测试) ⚠️
     - 编译状态: ✅ 通过

建议:
  ⚠️  建议在 Phase 6 之前补充单元测试，避免最后集中测试时间不足

是否继续？[Y/n]
```

#### Step 7: 执行完成

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 项目创建完成！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 执行总结:
  实际时间: 7.8 小时 (预估 8-10 小时)
  实际成本: $2.35 (预估 $2.50)
  质量评分: 88/100

✅ 验收结果:
  □ 所有 Phase 已完成
  □ 单元测试覆盖率: 78% (目标 > 70%)
  □ 集成测试: 通过
  □ 代码规范检查: 通过
  □ GitHub Actions CI: ✅ 通过

📦 项目信息:
  GitHub 仓库: https://github.com/goldeyeai/iot-alert-manager
  本地路径: ~/projects/iot-alert-manager
  文档: ~/projects/iot-alert-manager/docs/README.md

🚀 下一步:
  1. 克隆仓库到本地:
     git clone https://github.com/goldeyeai/iot-alert-manager.git
  
  2. 启动开发环境:
     cd iot-alert-manager
     docker-compose up -d
  
  3. 运行项目:
     # 后端
     cd backend && go run cmd/server/main.go
     
     # 前端
     cd frontend && npm run dev
  
  4. 访问:
     前端: http://localhost:5173
     API 文档: http://localhost:8080/swagger

📝 Trace ID: trace-1234567890abcdef
   查看详情: orca trace trace-1234567890abcdef
```

---

## 使用场景 2: 初始化现有项目

### 场景描述

你有一个已存在的项目（本地或 GitHub），想让 Orca 接管：
1. 分析现有代码库
2. 生成 `.orca/project.yaml` 配置
3. 建立 Orca 工作流

### 使用步骤

#### Step 1: 进入项目目录

```bash
cd ~/projects/ml-alone-client
```

#### Step 2: 初始化 Orca

```bash
orca init
```

**交互式问答：**

```
🤖 Orca: 正在分析项目...

📂 检测到项目信息:
  项目名称:   ml-alone-client
  Git 仓库:   https://github.com/yourusername/ml-alone-client.git
  主分支:     main
  文件数:     287
  代码行数:   15,423

🔍 技术栈检测结果:
  Backend:    ✅ Go (goframe-v2)
  Frontend:   ✅ Vue 3 + Element Plus
  Database:   ✅ MySQL, Redis
  Other:      Docker, GitHub Actions

是否正确？[Y/n/edit]
```

#### Step 3: 配置 JEV 策略

```
⚙️  JEV 配置推荐:

基于项目规模（15k LOC）和技术栈，推荐配置:

  JEV 启用:    ✅ 是
  Judge 模型:  deepseek-v4.1-flash
  自动化阈值:  60 分（中等任务自动化）
  风险上限:    Medium（高风险任务需人工审批）

是否接受推荐配置？[Y/n/custom]
```

#### Step 4: 生成配置文件

```
✅ 已生成配置文件: .orca/project.yaml

内容预览:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
project:
  name: ml-alone-client
  type: fullstack
  description: 工业物联网统一管理平台
  repository: https://github.com/yourusername/ml-alone-client.git
  
stack:
  backend: [golang, goframe-v2]
  frontend: [vue3, element-plus]
  database: [mysql, redis]
  
jev:
  enabled: true
  models:
    judge: deepseek-v4.1-flash
    evaluator: deepseek-v4.1-flash
    validator: deepseek-v4.1-flash
  
  thresholds:
    min_automation_score: 60
    min_confidence: 70
    max_risk_level: medium
  
  strategy:
    simple_task:
      judge: false
      evaluator: false
      validator: light
    medium_task:
      judge: true
      evaluator: simplified
      validator: standard
    complex_task:
      judge: true
      evaluator: full
      validator: thorough

routing:
  private_models:
    deepseek-v4.1-flash:
      provider: deepseek
      base_url: http://172.87.28.157:8080
      api_key_env: DEEPSEEK_API_KEY
      cost_per_1m:
        input: 0.01
        output: 0.01
      capabilities:
        - jev_judge
        - jev_evaluator
        - jev_validator
        - backend
        - search
        - tooling
      priority: 1
  
  rules:
    - task_types: [jev_judge, jev_evaluator, jev_validator]
      primary: deepseek-v4.1-flash
      fallback: []
    
    - task_types: [backend, golang]
      primary: deepseek-v4.1-flash
      fallback: []
    
    - task_types: [search, tooling, scripting]
      primary: deepseek-v4.1-flash
      fallback: []

observability:
  traces:
    enabled: true
    storage: ~/.orca/traces/ml-alone-client
  
  metrics:
    enabled: true
    storage: ~/.orca/metrics/ml-alone-client/metrics.jsonl
  
  logging:
    level: info
    format: json
  
  alerts:
    enabled: false

github:
  enabled: true
  auto_branch: true
  auto_pr: false
  pr_template: .github/pull_request_template.md

quality_gates:
  test_coverage: 70
  build_required: true
  lint_required: true

learning:
  enabled: true
  storage: ~/.orca/learning/ml-alone-client/cases.jsonl
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

是否保存？[Y/n/edit]
```

#### Step 5: 验证配置

```
🔍 验证配置...

✅ 配置验证通过:
  □ API Key 有效
  □ 模型可用 (deepseek-v4.1-flash: 延迟 2.3s)
  □ GitHub 仓库可访问
  □ 目录权限正确

✅ Orca 初始化完成！

下一步:
  1. 提交配置到 Git:
     git add .orca/project.yaml
     git commit -m "chore: 添加 Orca 配置"
  
  2. 尝试第一个任务:
     orca execute "添加健康检查接口 /health"
  
  3. 查看帮助:
     orca --help
```

---

## 使用场景 3: 执行日常开发任务

### 场景 3.1: 简单任务（跳过 JEV）

```bash
# 修复 typo
orca execute "修复 README.md 中的拼写错误"

# 输出:
🤖 Judge: 检测到简单任务（automation_score: 95），跳过完整 JEV 流程
🚀 直接执行...
✅ 已修复 3 处拼写错误
   - README.md:12: Tset → Test
   - README.md:45: recieve → receive
   - docs/api.md:8: responce → response
💰 成本: $0.002 | ⏱️  用时: 8s
```

### 场景 3.2: 中等任务（简化 JEV）

```bash
# 添加新功能
orca execute "添加用户登录接口，支持手机号 + 验证码"

# 输出:
🤔 Judge: 中等复杂度任务（automation_score: 72, risk: medium）
📋 Evaluator: 生成 2 个方案...
   方案 1: 保守（预估 2h, $0.80）
   方案 2: 平衡（预估 1.5h, $0.60）
✅ Validator: 方案 2 可行（成功率 85%）
🚀 开始执行方案 2...

[1/4] 设计 API 接口... ✅
[2/4] 实现后端逻辑... ✅
[3/4] 编写单元测试... ✅
[4/4] 更新 API 文档... ✅

✅ 任务完成
   分支: feat/login-api-with-sms
   提交: 3 commits
   测试: 通过（覆盖率 82%）
💰 成本: $0.58 | ⏱️  用时: 1.6h
```

### 场景 3.3: 复杂任务（完整 JEV）

```bash
# 重构核心模块
orca execute "重构告警降噪引擎，支持机器学习模型"

# 输出:
🤔 Judge: 高复杂度任务（automation_score: 55, risk: high）
   ⚠️  检测到 3 个高风险点:
   1. 模型训练需要历史数据（需确认数据质量）
   2. 重构可能影响现有功能（需要完整回归测试）
   3. 性能要求高（需要压测验证）

   建议策略: Semi Automation（半自动化）
   → 我会生成代码和测试，但以下部分需要你人工确认:
     - 模型选型（LSTM vs Transformer）
     - 特征工程策略
     - 性能基准测试结果

是否继续？[Y/n]

> Y

📋 Evaluator: 生成 3 个方案...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
方案 1: 保守策略（推荐）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  预估时间: 6-8 小时
  预估成本: $3.20
  综合评分: 88/100
  
  Phase 1: 数据分析与特征工程 (2h)
  Phase 2: 模型选型与训练 (2.5h)
  Phase 3: 集成到现有系统 (1.5h)
  Phase 4: A/B 测试与回归验证 (2h)

方案 2: 平衡策略
  [详情省略...]

方案 3: 激进策略
  [详情省略...]

请选择方案 [1/2/3]: 1

✅ Validator: 方案 1 验证通过（成功率 82%）
   建议: Phase 2 增加 +30min 用于模型调优

🚀 开始执行方案 1...

[Phase 1/4] 数据分析与特征工程
  [1/3] 分析历史告警数据... ✅
        → 数据量: 1.2M 条告警（最近 3 个月）
        → 数据质量: 87% 有效（13% 缺失字段）
  
  [2/3] 设计特征工程... ✅
        → 已提取 15 个特征:
          - 时间特征: hour_of_day, day_of_week, is_business_hour
          - 告警特征: source, level, tag_count, content_length
          - 历史特征: alert_frequency, last_occurrence_gap
          - 关联特征: co_occurrence_score, fingerprint_similarity
  
  [3/3] 生成训练数据集... ✅
        → 训练集: 960k 样本
        → 验证集: 120k 样本
        → 测试集: 120k 样本

⏸️  Phase 1 完成，是否审查特征工程结果？[Y/n/continue]

> Y

📊 特征工程报告:
   文件: ~/projects/ml-alone-client/ml/features/feature_analysis.html
   
   已在浏览器中打开，请审查：
   1. 特征分布是否合理
   2. 是否有遗漏的重要特征
   3. 特征相关性分析

   审查完成后，是否继续？[Y/n/adjust]

> Y

[Phase 2/4] 模型选型与训练
  [1/4] 对比 3 个候选模型...
        □ LSTM (RNN 变体)
        □ XGBoost (树模型)
        □ Transformer (注意力机制)
  
  ⏱️  训练中... (预计 45min)
  
  ✅ 训练完成:
     模型          准确率   召回率   F1-Score   推理延迟
     ───────────────────────────────────────────────────
     LSTM          89.2%    86.5%    87.8%      12ms
     XGBoost       91.5%    88.3%    89.9%      3ms   ✅ 推荐
     Transformer   92.1%    87.9%    89.9%      45ms
  
  💡 推荐: XGBoost（准确率高且推理速度快）
  
  是否采纳？[Y/n/choose-other]

> Y

[Phase 3/4] 集成到现有系统
  [1/3] 创建模型推理接口... ✅
  [2/3] 集成到降噪引擎... ✅
  [3/3] 添加降级策略（模型失败时回退到规则）... ✅

[Phase 4/4] A/B 测试与回归验证
  [1/2] 运行回归测试... ✅ (256/256 通过)
  [2/2] 启动 A/B 测试...
  
  ⚠️  A/B 测试需要线上流量，无法在开发环境完成
  
  已生成 A/B 测试配置:
    文件: scripts/ab_test_config.yaml
  
  请在预发布环境手动启动:
    orca ab-test start --config scripts/ab_test_config.yaml

✅ 任务完成（Phase 1-3）
   Phase 4 的 A/B 测试需要人工完成
   
   分支: feat/ml-denoiser
   提交: 12 commits
   测试: 回归测试通过
   
   下一步:
   1. 审查生成的代码
   2. 在预发布环境启动 A/B 测试
   3. 根据 A/B 测试结果决定是否合并

💰 成本: $2.95 | ⏱️  用时: 6.2h
📝 Trace: orca trace trace-abc123def456
```

---

## 命令参考

### 全局命令

```bash
# 查看版本
orca --version

# 查看帮助
orca --help

# 查看配置
orca config

# 更新 Orca
orca update
```

### 项目管理

```bash
# 创建新项目
orca create-project

# 初始化现有项目
orca init

# 查看项目状态
orca status

# 验证配置
orca validate
```

### 任务执行

```bash
# 执行任务（自动 JEV 判断）
orca execute "任务描述"

# 强制跳过 JEV（适用于简单任务）
orca execute "任务描述" --skip-jev

# 指定执行策略
orca execute "任务描述" --strategy conservative

# 仅生成方案，不执行
orca plan "任务描述"

# 交互式执行（每个 Phase 后暂停）
orca execute "任务描述" --interactive
```

### 可观测性

```bash
# 查看 Trace 详情
orca trace <traceId>

# 查看 Metrics 统计
orca metrics

# 查看最近执行历史
orca history

# 查看学习数据
orca learning stats
```

### GitHub 集成

```bash
# 从 GitHub Issue 创建任务
orca from-issue <issue-number>

# 创建 Pull Request
orca pr create

# 查看 PR 状态
orca pr status
```

### A/B 测试

```bash
# 启动 A/B 测试
orca ab-test start --config <config-file>

# 查看 A/B 测试结果
orca ab-test status

# 停止 A/B 测试
orca ab-test stop
```

---

## 配置文件详解

### `.orca/project.yaml` 完整示例

```yaml
# 项目元信息
project:
  name: my-project
  type: fullstack  # backend / frontend / fullstack / mobile / data
  description: 项目描述
  repository: https://github.com/user/repo.git
  default_branch: main

# 技术栈
stack:
  backend: [golang, goframe-v2]
  frontend: [vue3, element-plus]
  database: [mysql, redis]
  other: [docker, k8s]

# JEV 配置
jev:
  enabled: true
  
  # JEV 三层使用的模型
  models:
    judge: deepseek-v4.1-flash
    evaluator: deepseek-v4.1-flash
    validator: deepseek-v4.1-flash
  
  # 自动化阈值
  thresholds:
    min_automation_score: 60      # 低于 60 分不自动化
    min_confidence: 70            # 置信度低于 70% 需人工确认
    max_risk_level: medium        # 高风险任务需人工审批
    min_predicted_success: 75     # 成功率低于 75% 不执行
  
  # 不同复杂度任务的 JEV 策略
  strategy:
    simple_task:         # automation_score > 90, risk = low
      judge: false       # 跳过 Judge
      evaluator: false   # 跳过 Evaluator
      validator: light   # 轻量验证
    
    medium_task:         # 60 <= automation_score <= 90
      judge: true
      evaluator: simplified  # 生成 2 个方案
      validator: standard
    
    complex_task:        # automation_score < 60 或 risk = high
      judge: true
      evaluator: full    # 生成 3 个方案
      validator: thorough  # 完整验证
  
  # 验证配置
  validation:
    pre_execution: true
    mid_execution: true
    mid_execution_interval: 300  # 5分钟
    post_execution: true
    
    # 偏离阈值（触发调整）
    deviation_thresholds:
      time: 50      # 时间偏离 >50% 触发
      cost: 30      # 成本偏离 >30% 触发
      quality: 20   # 质量偏离 >20% 触发

# 模型路由配置
routing:
  # 私有模型
  private_models:
    deepseek-v4.1-flash:
      provider: deepseek
      base_url: http://172.87.28.157:8080
      api_key_env: DEEPSEEK_API_KEY
      cost_per_1m:
        input: 0.01
        output: 0.01
      capabilities:
        - jev_judge
        - jev_evaluator
        - jev_validator
        - backend
        - search
        - tooling
      priority: 1
      health_check:
        enabled: true
        interval: 60
        timeout: 5
  
  # 公有云模型（如果可用）
  public_models:
    claude-opus-5-5:
      provider: anthropic
      api_key_env: ANTHROPIC_API_KEY
      cost_per_1m:
        input: 15.00
        output: 75.00
      capabilities:
        - jev_judge
        - jev_evaluator
      priority: 2
  
  # 路由规则
  rules:
    - task_types: [jev_judge, jev_evaluator, jev_validator]
      primary: deepseek-v4.1-flash
      fallback: []
    
    - task_types: [backend, golang]
      primary: deepseek-v4.1-flash
      fallback: []
    
    - task_types: [search, tooling, scripting]
      primary: deepseek-v4.1-flash
      fallback: []

# 可观测性配置
observability:
  # Trace 追踪
  traces:
    enabled: true
    storage: ~/.orca/traces/{project_name}
    retention_days: 30
  
  # Metrics 指标
  metrics:
    enabled: true
    storage: ~/.orca/metrics/{project_name}/metrics.jsonl
    retention_days: 90
  
  # 日志
  logging:
    level: info  # debug / info / warn / error
    format: json  # json / text
    file: ~/.orca/logs/{project_name}/orca.log
  
  # 告警
  alerts:
    enabled: false
    channels:
      - type: slack
        webhook_url_env: SLACK_WEBHOOK_URL
        conditions:
          - event: task_failed
          - event: cost_exceeded
            threshold: 10.00

# GitHub 集成
github:
  enabled: true
  auto_branch: true          # 自动创建分支
  auto_pr: false             # 自动创建 PR（需人工确认）
  pr_template: .github/pull_request_template.md
  commit_message_format: "{type}: {summary}"  # feat / fix / refactor / docs

# 质量门槛
quality_gates:
  test_coverage: 70          # 单元测试覆盖率 >= 70%
  build_required: true       # 必须编译通过
  lint_required: true        # 必须通过代码检查
  security_scan: false       # 是否需要安全扫描

# 学习配置
learning:
  enabled: true
  storage: ~/.orca/learning/{project_name}/cases.jsonl
  min_cases_for_optimization: 10  # 至少 10 个案例才触发优化
  optimization_interval: 7   # 每 7 天优化一次

# 成本控制
cost_control:
  daily_limit: 50.00         # 每日成本上限 $50
  task_limit: 10.00          # 单个任务成本上限 $10
  alert_threshold: 80        # 成本达到 80% 时告警
```

---

## 常见问题

### Q1: 如何降低成本？

**A:** 三种方式：

1. **使用私有模型**（推荐）
   ```yaml
   jev:
     models:
       judge: deepseek-v4.1-flash       # $0.01/1M
       evaluator: deepseek-v4.1-flash
       validator: deepseek-v4.1-flash
   ```

2. **调整 JEV 策略**
   ```yaml
   jev:
     strategy:
       simple_task:
         judge: false        # 跳过 JEV，直接执行
         evaluator: false
   ```

3. **设置成本上限**
   ```yaml
   cost_control:
     daily_limit: 10.00
     task_limit: 2.00
   ```

### Q2: 任务执行失败怎么办？

**A:** Orca 会自动保存 Trace，查看详情：

```bash
# 查看失败原因
orca trace <traceId>

# 查看最近失败的任务
orca history --status failed

# 重新执行（从失败的 Phase 开始）
orca retry <traceId>
```

### Q3: 如何审查 AI 生成的代码？

**A:** 三种方式：

1. **交互式执行**（每个 Phase 暂停）
   ```bash
   orca execute "任务描述" --interactive
   ```

2. **先生成方案，不执行**
   ```bash
   orca plan "任务描述"
   ```

3. **事后审查**
   ```bash
   # 查看生成的代码
   git diff main..feat/new-feature
   
   # 查看 Trace（包含所有决策依据）
   orca trace <traceId>
   ```

### Q4: 如何让 AI 不要自动提交代码？

**A:** 修改配置：

```yaml
github:
  enabled: true
  auto_branch: false    # 不自动创建分支
  auto_pr: false        # 不自动创建 PR
```

或者在命令中指定：

```bash
orca execute "任务描述" --no-commit
```

### Q5: 私有模型不可用怎么办？

**A:** 配置 Fallback 链：

```yaml
routing:
  rules:
    - task_types: [backend]
      primary: deepseek-v4.1-flash
      fallback: [claude-sonnet-5-5]  # Primary 失败时使用 Fallback
```

### Q6: 如何加速执行？

**A:** 三种方式：

1. **使用更快的模型**
   ```yaml
   jev:
     models:
       judge: deepseek-v4.1-flash-free  # 0.5s 延迟
   ```

2. **跳过 JEV**
   ```bash
   orca execute "简单任务" --skip-jev
   ```

3. **并行执行**（DAG 自动检测可并行任务）
   ```yaml
   # Orca 会自动并行执行无依赖关系的任务
   ```

---

## 最佳实践

### 1. 项目初始化

- ✅ 新项目创建后，立即提交 `.orca/project.yaml` 到 Git
- ✅ 在 README 中说明 Orca 使用方式
- ✅ 配置合理的成本上限
- ✅ 启用学习功能（提升后续任务准确性）

### 2. 日常开发

- ✅ 简单任务用 `--skip-jev` 加速
- ✅ 复杂任务用 `--interactive` 审查每个 Phase
- ✅ 每天查看成本报告：`orca metrics --today`
- ✅ 定期查看学习数据：`orca learning stats`

### 3. 团队协作

- ✅ 统一使用同一个 `.orca/project.yaml`
- ✅ 在 PR 中附上 Trace ID（方便审查 AI 决策依据）
- ✅ 共享学习数据（提升团队整体效率）
- ✅ 定期审查 AI 生成的代码质量

### 4. 成本优化

- ✅ 优先使用私有模型（DeepSeek: $0.01/1M）
- ✅ 简单任务跳过 JEV
- ✅ 调整 `max_tokens`（避免浪费）
- ✅ 启用健康检查缓存（减少健康检查次数）

---

## 下一步

1. **安装 Orca CLI**
   ```bash
   npm install -g @orca/cli
   ```

2. **创建你的第一个项目**
   ```bash
   orca create-project
   ```

3. **或初始化现有项目**
   ```bash
   cd ~/your-project && orca init
   ```

4. **查看更多文档**
   - [JEV 决策模型详解](/tmp/orca-jev-multi-model-orchestration-spec.md)
   - [实施计划](/tmp/orca-jev-implementation-plan.md)
   - [模型能力验证报告](/tmp/jev-capability-verification-report.md)

5. **加入社区**
   - GitHub: https://github.com/yourorg/orca
   - Discord: https://discord.gg/orca
   - Docs: https://orca.dev/docs
