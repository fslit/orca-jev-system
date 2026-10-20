# Orca JEV - 智能项目自动化决策系统

**Orca JEV** 是一个基于大模型的项目自动化决策引擎，采用 **Judge → Evaluator → Validator** 三层架构，通过并发优化实现高效的任务评估和方案生成。

## ✨ 核心特性

- 🎯 **三层决策**: Judge 评估 → Evaluator 生成方案 → Validator 验证可行性
- ⚡ **并发优化**: Evaluator 并发生成 3 个方案，Validator 并发验证 5 个维度，**节省 62% 时间**
- 💰 **成本优化**: 优先使用 DeepSeek v4.1 Flash ($0.01/1M tokens)，成本仅为 Claude 的 1/12
- 🔄 **多模型支持**: DeepSeek、OpenRouter JEV、Claude（可扩展）
- 📊 **智能方案**: 自动生成保守/平衡/激进 3 种方案，自动识别并行优化机会

## 🚀 快速开始

### 安装依赖

```bash
cd orca-jev-system
npm install
```

### 设置环境变量

```bash
export DEEPSEEK_API_KEY=sk-xxx
export DEEPSEEK_API_BASE=http://172.87.28.157:8080  # 可选
```

### 运行完整流程

```bash
npm run demo:full

# 或使用测试脚本
./test-concurrent.sh
```

## 📋 并发架构

```
┌─────────────┐
│   Judge     │  评估任务自动化可行性（单次调用）
└──────┬──────┘
       │
       v
┌─────────────────────────────────────┐
│     Evaluator（并发 3 方案）          │
│  ┌────────────┬────────────┬────────┐│
│  │Conservative│  Balanced  │Aggressive││
│  └────────────┴────────────┴────────┘│
│       节省 67% 时间                   │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────────────┐
│        Validator（并发 5 维度）              │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐│
│  │Technical│Resource │Dependency│Security │Optimization││
│  └─────────┴─────────┴─────────┴─────────┴─────────┘│
│              节省 80% 时间                    │
└─────────────────────────────────────────────┘
```

**性能对比**:
- **串行实现**: 39s (Judge 6s + Evaluator 18s + Validator 15s)
- **并发实现**: 15s (Judge 6s + Evaluator 6s + Validator 3s)
- **并发收益**: **↓ 62%**

## 📖 使用示例

### 1. Judge 层 - 评估任务

```bash
npm run demo
```

**输入**: 任务描述 + 项目上下文
**输出**: automation_score、risk_level、strategy、risks

### 2. 模型对比

```bash
npm run demo:compare
```

对比 DeepSeek vs OpenRouter JEV Router 的评估结果

### 3. 完整 JEV 流程

```bash
npm run demo:full
```

端到端执行 Judge → Evaluator → Validator，输出完整的执行方案和验证结果

## 📊 测试结果

### 测试用例 1: 用户登录接口

```
📝 任务: 实现用户登录接口，支持 JWT + Redis 会话管理

✅ Judge 完成 (6234ms)
   automation_score: 82/100
   risk_level: medium
   strategy: semi_automation

✅ Evaluator 完成 (6521ms) - 并发生成 3 方案
   推荐方案: balanced
   时间: 60min | 成本: $0.0080 | 自动化率: 60%

✅ Validator 完成 (3128ms) - 并发验证 5 维度
   验证结果: needs_modification
   可行性评分: 78/100
   优化建议: 3 个

📊 总延迟: 15883ms（并发优化节省 54.3% 时间）
```

## 🏗️ 项目结构

```
orca-jev-system/
├── src/
│   ├── types/              # TypeScript 类型定义
│   ├── judge/              # Judge 层实现
│   ├── evaluator/          # Evaluator 并发实现
│   └── validator/          # Validator 并发实现
├── demo-judge.ts           # Judge 单独测试
├── demo-compare.ts         # 模型对比测试
├── demo-full-jev.ts        # 完整并发流程 ⭐
├── test-concurrent.sh      # 测试脚本
├── CONCURRENT-IMPLEMENTATION.md  # 并发实现文档 ⭐
├── IMPLEMENTATION-PLAN.md  # 完整实施计划
└── README.md               # 项目说明（本文档）
```

## 📚 文档

- **[CONCURRENT-IMPLEMENTATION.md](./CONCURRENT-IMPLEMENTATION.md)** - 并发实现详解（⭐ 推荐阅读）
- **[IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)** - 7 阶段完整实施计划
- **[model-comparison-report.md](./model-comparison-report.md)** - 模型对比分析

## 🗺️ 实施路线图

- [x] **Phase 0**: Demo & 验证 ✅
- [x] **Phase 1**: Evaluator 并发实现 ✅
- [x] **Phase 2**: Validator 并发实现 ✅
- [x] **Phase 3**: 完整 JEV 流程串联 ✅
- [ ] **Phase 4**: 模型路由引擎
- [ ] **Phase 5**: CLI 工具封装
- [ ] **Phase 6**: 可观测性
- [ ] **Phase 7**: 生产优化

详见 [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)

## 💡 技术亮点

### 1. 并发优化

使用 `Promise.all()` 实现关键环节的并发：

```typescript
// Evaluator: 并发生成 3 个方案
const [conservative, balanced, aggressive] = await Promise.all([
  generatePlan('conservative', ...),
  generatePlan('balanced', ...),
  generatePlan('aggressive', ...),
]);

// Validator: 并发验证 5 个维度
const [technical, resource, dependency, security, optimization] = await Promise.all([
  validateTechnical(...),
  validateResource(...),
  validateDependency(...),
  validateSecurity(...),
  findOptimizations(...),
]);
```

### 2. 智能方案生成

根据 Judge 评估结果，自动生成 3 种执行方案：

| 方案 | 自动化率 | 风险容忍度 | 适用场景 |
|------|---------|-----------|---------|
| Conservative | 30% | low | 关键系统、高风险任务 |
| Balanced | 60% | medium | 常规开发任务（推荐）|
| Aggressive | 90% | high | 成熟模式、低风险任务 |

### 3. 多维度验证

Validator 并发验证 5 个维度，全面保障方案可行性：

- **Technical**: 技术栈支持、工具可用性
- **Resource**: 数据库、缓存、外部服务
- **Dependency**: 循环依赖、任务顺序
- **Security**: 密钥管理、权限控制
- **Optimization**: 任务合并、并行机会

## 🔧 环境要求

- **Node.js**: >= 18.0.0
- **TypeScript**: >= 5.0.0
- **DeepSeek API**: 私有部署或云端服务

## 📝 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 PR！

**重点改进方向**:
1. 性能优化（缓存、批量调用）
2. 错误处理（重试、降级）
3. 可观测性（Trace、成本追踪）
4. 模型路由（健康检查、负载均衡）

---

**项目状态**: 核心并发功能已实现，待生产优化  
**最后更新**: 2024-10-20  
**版本**: v0.3.0
