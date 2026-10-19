# Orca JEV System - README

**Orca JEV 决策引擎** - 基于 JEV（Judge-Evaluator-Validator）三层模型的项目自动化决策系统

---

## 🎯 核心能力

- 📊 **Judge 层**: 评估任务自动化可行性（0-100 分），识别风险，推荐执行策略
- 🔀 **Evaluator 层**: 生成 3 种执行方案（保守/平衡/激进）
- ✅ **Validator 层**: 验证方案可行性，返回可执行计划

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥

```bash
cp .env.example .env
# 编辑 .env 填入真实密钥
```

### 3. 运行 Demo

**Judge 层单独测试**:
```bash
npm run demo
```

**OpenRouter vs DeepSeek 对比测试**:
```bash
export OPENROUTER_API_KEY=sk-or-v1-xxx
export DEEPSEEK_API_KEY=sk-xxx
npm run demo:compare
```

---

## 📊 测试结果

### Judge 层 - DeepSeek v4.1 Flash

| 用例 | automation_score | risk_level | strategy | 延迟 |
|------|-----------------|-----------|----------|------|
| 修复拼写错误 | 95/100 | low | full_automation | 2.9s |
| 实现登录接口 | 82/100 | medium | semi_automation | 9.1s |
| ML 告警引擎 | 58/100 | high | semi_automation | 7.0s |

**成本**: ~$0.00002/次（$0.01/1M tokens）

---

## 🔬 模型对比

详见 [model-comparison-report.md](./model-comparison-report.md)

**核心发现**:
- OpenRouter `typesafe/jev-router` 实际路由到 **智谱 GLM 5.3 Flash**
- GLM 5.3 在中等任务更乐观（88分 vs 82分），复杂任务更保守（45分 vs 58分）
- DeepSeek 成本低 12x，风险识别更详细
- **推荐默认使用 DeepSeek 直连**

---

## 📁 文件结构

```
orca-jev-system/
├── demo-judge.ts                    # Judge 层 Demo（DeepSeek）
├── demo-compare.ts                  # OpenRouter vs DeepSeek 对比
├── model-comparison-report.md       # 模型对比报告
├── jev-capability-verification-report.md  # DeepSeek 验证报告
├── jev-latest-verification-report.md      # jev-latest 验证报告
├── orca-jev-multi-model-orchestration-spec.md  # 系统规范
├── orca-jev-implementation-plan.md  # 实现计划
├── orca-user-guide.md               # 用户指南
├── README.md                        # 本文件
├── README-EN.md                     # 英文文档
├── DEMO-README.md                   # Demo 使用说明
└── package.json
```

---

## 🛠️ 技术栈

- **运行时**: Node.js + TypeScript (tsx)
- **默认模型**: DeepSeek v4.1 Flash（私有部署）
- **可选模型**: OpenRouter typesafe/jev-router（→ GLM 5.3）
- **API**: OpenAI-compatible /v1/chat/completions

---

## 📖 文档

- [模型对比报告](./model-comparison-report.md) - OpenRouter vs DeepSeek 详细对比
- [DeepSeek 验证报告](./jev-capability-verification-report.md) - Judge 层可行性验证
- [系统规范](./orca-jev-multi-model-orchestration-spec.md) - 完整架构设计
- [实现计划](./orca-jev-implementation-plan.md) - 7 阶段实施路线图
- [用户指南](./orca-user-guide.md) - 场景化使用说明

---

## 🎯 下一步

- [ ] 实现 Evaluator 层（生成 3 种执行方案）
- [ ] 实现 Validator 层（验证方案可行性）
- [ ] 封装为 CLI 工具（`orca judge <task>`, `orca eval <task>`）
- [ ] 集成 GitHub/GitLab API（自动创建 PR）
- [ ] 支持更多模型（Claude、GPT-4、Qwen）

---

## 📄 License

MIT

---

## 🤝 Contributing

欢迎贡献代码、报告问题、提出建议！

GitHub: https://github.com/fslit/orca-jev-system
