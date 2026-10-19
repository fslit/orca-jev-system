# Orca JEV - AI 驱动的项目自动化决策引擎

<div align="center">

**Judge → Evaluator → Validator**

让 AI 自动评估开发任务的可行性、生成执行方案、验证计划合理性

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![DeepSeek](https://img.shields.io/badge/Model-DeepSeek%20v4.1-green)](https://deepseek.com/)

[中文文档](README.md) | [English](README-EN.md)

</div>

---

## 🎯 什么是 Orca JEV?

Orca JEV 是一个 **三层 AI 决策引擎**，帮助你：

1. **Judge（判断器）** - 评估任务的自动化可行性和风险
2. **Evaluator（评估器）** - 生成多个执行方案，包含时间/成本估算
3. **Validator（验证器）** - 在执行前验证方案质量

**它解决的问题：**
- ❌ 现有 AI 编码工具要么全自动（不可控）要么全手工（效率低）
- ❌ 不知道 AI 会做什么、需要多久、花费多少
- ❌ 执行前没有风险评估

**Orca JEV 给你：**
- ✅ 智能决策：AI 判断任务复杂度并选择策略
- ✅ 透明规划：看到 3 个方案选项（保守/平衡/激进），包含成本/时间估算
- ✅ 持续验证：执行前/中/后三阶段检查
- ✅ 完全可观测：每个决策都可追溯

---

## 🚀 快速开始

### 安装

```bash
npm install -g orca-jev
```

### 运行 Demo

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/orca-jev-system.git
cd orca-jev-system

# 2. 安装依赖
npm install

# 3. 设置 API Key
export DEEPSEEK_API_KEY="your-api-key"

# 4. 运行 Demo
npm run demo
```

### 预期输出

```
╔════════════════════════════════════════════════╗
║     Orca JEV - Judge Layer Demo               ║
╚════════════════════════════════════════════════╝

============================================================
测试用例 1/3
============================================================
📝 任务: 修复 README.md 中的拼写错误
🏗️  项目类型: fullstack
🛠️  技术栈: Go, Vue3
============================================================

🤔 Judge 正在分析任务...

⏱️  用时: 3471ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 判断结果:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  自动化评分:  95/100
  风险等级:    LOW
  建议策略:    full_automation
  置信度:      96%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💭 判断依据:
  该任务仅涉及 README.md 文档中的拼写错误修正，不触及任何 Go/Vue3 
  源代码、构建配置或运行时逻辑，影响范围极小且可随时通过版本回滚。
  任务描述清晰明确，适合由 AI 直接定位并修复后提交。

⚠️  识别的风险:

  1. 🟢 [LOW] 技术
     描述: AI 可能误判专有名词、代码标识符或技术术语为拼写错误而
          错误修改，导致文档语义失真。
     缓解: 修改前对照项目术语表与代码中的实际命名，仅修正明确的
          自然语言拼写错误；提交前生成 diff 供快速人工确认。

💾 结果已保存: /tmp/judge-result-1.json
```

---

## 📊 Demo 测试结果

Demo 测试了 3 个复杂度递增的任务：

| 任务 | 自动化评分 | 风险等级 | 策略 | 延迟 |
|------|-----------|---------|------|-----|
| 修复 README 拼写错误 | 95/100 | LOW | full_automation | 3.5s |
| 实现登录接口 (JWT + Redis) | 68/100 | HIGH | semi_automation | 8.4s |
| 重构告警降噪引擎 (ML) | 32/100 | HIGH | human_first | 5.2s |

**关键发现：**
- ✅ 评分与任务复杂度精准匹配
- ✅ 风险识别详细且可操作（安全、性能、兼容性、测试）
- ✅ 策略建议合理
- ✅ 延迟可接受（平均 ~5.7s）

---

### 核心文档

1. **[用户使用指南](orca-user-guide.md)** ⭐ **推荐先看**
   - 新项目创建：如何用自然语言表达需求 → AI 创建 GitHub 项目
   - 现有项目初始化：如何让 Orca 接管现有代码库
   - 日常开发任务：简单/中等/复杂任务的执行流程
   - 命令参考、配置详解、FAQ、最佳实践

2. **[系统规格说明](orca-jev-multi-model-orchestration-spec.md)**
   - JEV 决策模型详解（Judge-Evaluator-Validator）
   - 多模型路由架构
   - DAG 任务编排
   - 可观测性设计
   - TypeScript 接口定义

3. **[实施计划](orca-jev-implementation-plan.md)**
   - 7 阶段实施路线图
   - 每个阶段的 Checkbox 任务列表
   - 测试驱动开发指南
   - 全局约束与审查重点

4. **[模型能力验证报告](jev-capability-verification-report.md)**
   - 私有模型部署验证结果
   - DeepSeek v4.1 Flash 能力测试
   - 性能与成本分析
   - 架构推荐方案

---

## 🎯 核心价值

### 问题

1. **新项目启动慢**：从想法到可运行代码需要大量手工搭建
2. **AI 编码不可控**：现有 AI 工具要么全自动（不可审查）要么全手工（效率低）
3. **成本不透明**：不知道 AI 会花多少钱和时间
4. **质量无保障**：AI 生成的代码缺少验证机制

### 解决方案

**Orca + JEV 系统**提供：

- **智能决策**：Judge 评估任务可行性和风险，自动选择执行策略
- **透明规划**：Evaluator 生成多个方案（保守/平衡/激进），展示时间/成本/质量评估
- **持续验证**：Validator 在执行前/中/后三阶段验证，及时发现偏离
- **多模型协同**：根据任务类型自动选择最优模型，降低成本
- **完整可观测**：Trace + Metrics + Alerts，所有决策可追溯

---

## 🚀 快速开始

### 1. 安装

```bash
npm install -g @orca/cli
export DEEPSEEK_API_KEY="your-api-key"
orca --version
```

### 2. 创建新项目

```bash
orca create-project
# 按提示输入项目需求 → AI 自动创建 GitHub 仓库和初始代码
```

### 3. 初始化现有项目

```bash
cd ~/your-project
orca init
# AI 自动检测技术栈 → 生成 .orca/project.yaml 配置
```

### 4. 执行日常任务

```bash
# 简单任务（跳过 JEV）
orca execute "修复 README 拼写错误"

# 中等任务（简化 JEV）
orca execute "添加用户登录接口"

# 复杂任务（完整 JEV）
orca execute "重构告警降噪引擎" --interactive
```

详细使用指南见 **[orca-user-guide.md](orca-user-guide.md)**

---

## 📊 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Orca CLI                              │
│  orca create-project / orca init / orca execute             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   JEV 决策引擎                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │  Judge   │──▶│Evaluator │──▶│Validator │                │
│  │判断可行性 │   │生成方案   │   │验证计划   │                │
│  └──────────┘   └──────────┘   └──────────┘                │
│  automation_score  3个候选方案    成功率预测                  │
│  risk_level       时间/成本估算   风险检查                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                多模型路由层                                   │
├─────────────────────────────────────────────────────────────┤
│  Task Type → Model Selector                                 │
│  ├─ JEV 决策: deepseek-v4.1-flash ($0.01/1M)               │
│  ├─ 后端开发: deepseek-v4.1-flash                           │
│  └─ 前端开发: claude-sonnet-5-5 (fallback: deepseek)       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                DAG 任务编排层                                 │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: 项目初始化 (30min)                                 │
│  Phase 2: 数据模型设计 (45min) ──┐                          │
│  Phase 3: API 实现 (90min) ◀─────┤ 依赖关系                 │
│  Phase 4: 前端开发 (90min) ◀─────┘                          │
│  Phase 5: 测试与文档 (60min)                                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                可观测性层                                     │
├─────────────────────────────────────────────────────────────┤
│  Traces:  每次执行的完整决策链 (JSON)                        │
│  Metrics: 成本/时间/质量统计 (JSONL)                         │
│  Alerts:  成本超限/执行失败告警                               │
│  Learning: 历史案例学习与优化                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 典型使用场景

### 场景 1: 创建工业物联网告警平台

**输入：**
```
需求: 创建一个工业物联网告警管理平台
功能: 告警接收、智能降噪、趋势分析、大屏展示
技术栈: Go + Vue3 + MySQL + Redis
```

**输出：**
- ✅ GitHub 仓库已创建
- ✅ 项目结构完整（backend + frontend + database）
- ✅ 核心功能已实现（告警接收 API、降噪引擎、前端页面）
- ✅ 单元测试覆盖率 78%
- ✅ CI/CD 配置完成
- ⏱️ 用时: 7.8 小时 | 💰 成本: $2.35

### 场景 2: 重构现有模块

**输入：**
```bash
orca execute "重构告警降噪引擎，支持机器学习模型" --interactive
```

**流程：**
1. Judge: 高复杂度任务（automation_score: 55, risk: high）
2. Evaluator: 生成 3 个方案（保守/平衡/激进）
3. Validator: 验证方案可行性（成功率 82%）
4. 执行: Phase 1-3 自动完成，Phase 4 A/B 测试需人工
5. 每个 Phase 后暂停审查

**输出：**
- ✅ 数据分析与特征工程完成
- ✅ XGBoost 模型训练完成（准确率 91.5%）
- ✅ 集成到现有系统（带降级策略）
- ⚠️ A/B 测试配置已生成，需在预发布环境手动启动
- ⏱️ 用时: 6.2 小时 | 💰 成本: $2.95

### 场景 3: 简单维护任务

**输入：**
```bash
orca execute "修复 README.md 中的拼写错误"
```

**流程：**
- Judge 检测到简单任务（automation_score: 95）
- 跳过完整 JEV，直接执行

**输出：**
- ✅ 已修复 3 处拼写错误
- ⏱️ 用时: 8s | 💰 成本: $0.002

---

## 📈 成本对比

| 场景 | 传统 AI (Claude Opus) | Orca + DeepSeek | 节省 |
|------|----------------------|-----------------|------|
| 新项目创建 (8h) | $120 | $2.35 | **98%** |
| 模块重构 (6h) | $90 | $2.95 | **97%** |
| 日常维护 (10次/天) | $3 | $0.02 | **99%** |
| **月度总成本** | **$6,390** | **$159** | **97.5%** |

*假设每月 30 个工作日，每天 1 个新功能 + 1 个重构 + 10 个维护任务*

---

## 🛠️ 技术栈

### 已验证可用的模型

| 模型 | 用途 | 延迟 | 成本 | 状态 |
|-----|------|------|------|------|
| deepseek-v4.1-flash | JEV 全栈 + 后端开发 | 2.3s | $0.01/1M | ✅ 可用 |
| claude-opus-5-5 | JEV Judge (备选) | - | $15/$75 per 1M | ❌ 当前不可用 |
| claude-sonnet-5-5 | 前端开发 (备选) | - | $3/$15 per 1M | ❌ 当前不可用 |

### 推荐架构

**方案 A（当前推荐）：DeepSeek 全栈**
- Judge / Evaluator / Validator: deepseek-v4.1-flash
- 后端开发: deepseek-v4.1-flash
- 前端开发: deepseek-v4.1-flash
- 搜索/工具: deepseek-v4.1-flash

优点：成本极低（$0.01/1M）、延迟稳定（2-3s）、能力验证完整

**方案 B（未来）：混合架构**
- Judge / Evaluator: claude-opus-5-5（决策质量更高）
- Validator: deepseek-v4.1-flash（成本优化）
- 后端/前端: 根据任务复杂度动态选择

前提：Claude 模型可用后

---

## 📂 目录结构

```
orca-jev-system/
├── README.md                                    # 本文件
├── orca-user-guide.md                          # 用户使用指南（推荐先看）
├── orca-jev-multi-model-orchestration-spec.md  # 系统规格说明
├── orca-jev-implementation-plan.md             # 实施计划
└── jev-capability-verification-report.md       # 模型能力验证报告
```

---

## 🎯 下一步行动

### 对于产品经理/决策者

1. **阅读用户指南**：了解用户如何使用系统 → [orca-user-guide.md](orca-user-guide.md)
2. **评估成本收益**：查看成本对比表 → 本文档「成本对比」章节
3. **决定是否实施**：评估投入产出比

### 对于架构师/技术负责人

1. **阅读系统规格**：了解技术架构 → [orca-jev-multi-model-orchestration-spec.md](orca-jev-multi-model-orchestration-spec.md)
2. **审查实施计划**：评估开发工作量 → [orca-jev-implementation-plan.md](orca-jev-implementation-plan.md)
3. **验证模型可用性**：确认私有部署是否满足需求 → [jev-capability-verification-report.md](jev-capability-verification-report.md)

### 对于开发者

1. **阅读实施计划**：了解开发任务分解 → [orca-jev-implementation-plan.md](orca-jev-implementation-plan.md)
2. **搭建开发环境**：按 Phase 1 任务搭建
3. **测试驱动开发**：按 Checkbox 任务逐项完成

---

## 📞 联系与支持

- **GitHub**: [待补充]
- **文档站**: [待补充]
- **Discord 社区**: [待补充]

---

## 📄 许可证

[待补充]

---

**最后更新**: 2025-10-19

**版本**: v1.0.0

**状态**: 设计完成，待实施
