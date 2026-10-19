# Orca JEV 模型对比报告

**测试时间**: 2024-10-20  
**对比维度**: OpenRouter Jev Router vs DeepSeek v4.1 Flash 直连

---

## 🔍 重要发现

**OpenRouter 的 `typesafe/jev-router` 实际路由到 `z-ai/glm-5.3-flash`（智谱 GLM 5.3），不是 DeepSeek！**

---

## 📊 核心对比

| 维度 | OpenRouter (GLM 5.3) | DeepSeek v4.1 Flash | 胜者 |
|------|---------------------|-------------------|------|
| **实际模型** | z-ai/glm-5.3-flash | deepseek-v4.1-flash | - |
| **平均延迟** | 4.3 秒 | 6.3 秒 | ✅ **OpenRouter** |
| **推理可见性** | ✅ reasoning tokens | ❌ 无 | ✅ **OpenRouter** |
| **平均成本** | $0.000224/次 | ~$0.00002/次 | ✅ **DeepSeek (11x 便宜)** |
| **简单任务评分** | 95/100 | 95/100 | 🤝 相当 |
| **中等任务评分** | **88**/100 | 82/100 | ✅ **OpenRouter (更乐观)** |
| **复杂任务评分** | **45**/100 | 58/100 | ✅ **DeepSeek (更乐观)** |
| **风险识别详细度** | 2-5 项 | 2-7 项 | ✅ **DeepSeek** |

---

## 🧪 测试用例详解

### 用例 1：修复 README 拼写错误（简单）

| 指标 | OpenRouter GLM | DeepSeek | 差异 |
|------|---------------|---------|------|
| automation_score | 95 | 95 | 0 |
| risk_level | low | low | - |
| strategy | full_automation | full_automation | - |
| 延迟 | 4.2s | 2.9s | **+1.3s** |
| 风险数 | 2 | 2 | 0 |

**结论**: 简单任务两者相当，OpenRouter 延迟稍高。

---

### 用例 2：实现登录接口（中等）⚠️ 最大差异

| 指标 | OpenRouter GLM | DeepSeek | 差异 |
|------|---------------|---------|------|
| automation_score | **88** | **82** | **+6** 🔔 |
| risk_level | **medium** | **medium** | - |
| strategy | **full_automation** | **semi_automation** | **不同** 🔔 |
| 延迟 | 4.2s | 9.1s | **-4.9s** ✅ |
| 风险数 | 4 | 5 | -1 |

**关键差异**:
- OpenRouter 给出 88分 + **full_automation**（更乐观）
- DeepSeek 给出 82分 + **semi_automation**（更谨慎）
- OpenRouter **延迟反而更快**（4.2s vs 9.1s）

**风险识别对比**:

**OpenRouter GLM** (4 项):
1. 🔴 HIGH - security
2. 🟡 MEDIUM - integration
3. 🟡 MEDIUM - session
4. 🟢 LOW - testing

**DeepSeek** (5 项):
1. 🔴 HIGH - security
2. 🟡 MEDIUM - correctness
3. 🟡 MEDIUM - integration
4. 🟡 MEDIUM - testing
5. 🟢 LOW - scope

→ **DeepSeek 多识别了 `correctness` 和 `scope` 风险**

---

### 用例 3：ML 告警降噪引擎（复杂）🔥 策略完全相反

| 指标 | OpenRouter GLM | DeepSeek | 差异 |
|------|---------------|---------|------|
| automation_score | **45** | **58** | **-13** 🔔 |
| risk_level | high | high | - |
| strategy | **human_first** | **semi_automation** | **完全不同** 🔔 |
| 延迟 | 4.6s | 7.0s | -2.4s |
| 风险数 | 5 | **7** | **-2** |

**关键差异**:
- **OpenRouter 极度保守** - 45分 + **human_first**（人工优先）
- **DeepSeek 相对乐观** - 58分 + **semi_automation**（半自动）
- DeepSeek 识别 7 个风险（含 4 个 HIGH），OpenRouter 识别 5 个

**DeepSeek 的详细风险** (7 项):
1. 🔴 HIGH - architecture_integration
2. 🔴 HIGH - model_lifecycle
3. 🔴 HIGH - data_quality_and_feature_consistency
4. 🔴 HIGH - latency_and_availability
5. 🟡 MEDIUM - regression_and_effect_evaluation
6. 🟡 MEDIUM - data_security_and_compliance
7. 🟡 MEDIUM - rollback_and_operations

**OpenRouter GLM 的风险** (5 项，中文):
1. 🔴 HIGH - 业务风险
2. 🔴 HIGH - 技术风险
3. 🟡 MEDIUM - 数据风险
4. 🟡 MEDIUM - 工程风险
5. 🟡 MEDIUM - 运维风险

→ **DeepSeek 的风险分类更细粒度、技术化**

---

## 🧠 推理过程可见性

### OpenRouter Jev Router (GLM 5.3)

✅ **提供 `reasoning` 字段**

**示例**（用例 2，仅 5 reasoning tokens）:
```
Produce JSON only.
```

**示例**（用例 1，16 reasoning tokens）:
```
Simple task: fix typos in README.md. High automation, low risk.
```

**观察**: reasoning tokens 数量很少（5-16），内容简短。

### DeepSeek 直连

❌ **无推理过程**

---

## 💰 成本分析

| 用例 | OpenRouter 成本 | DeepSeek 估算成本* | 差异 |
|------|----------------|-------------------|------|
| 用例 1 | $0.000151 | ~$0.000017 | **8.9x** |
| 用例 2 | $0.000239 | ~$0.000020 | **12.0x** |
| 用例 3 | $0.000282 | ~$0.000017 | **16.6x** |
| **平均** | **$0.000224** | **~$0.000018** | **12.4x** |

\* *DeepSeek 按 $0.01/1M tokens 估算*

**结论**: DeepSeek 成本是 OpenRouter 的 **1/12**。

---

## ⚖️ 模型行为差异总结

| 任务复杂度 | OpenRouter GLM 5.3 | DeepSeek v4.1 Flash |
|-----------|-------------------|-------------------|
| **简单任务** | 95分，full_automation | 95分，full_automation |
| **中等任务** | **88分，full_automation** ⬆️ | 82分，semi_automation |
| **复杂任务** | **45分，human_first** ⬇️ | 58分，semi_automation |

**核心发现**:
1. ✅ **简单任务**: 两者相当
2. 🔔 **中等任务**: OpenRouter **更乐观**（88 vs 82，full vs semi）
3. 🔔 **复杂任务**: OpenRouter **更保守**（45 vs 58，human_first vs semi）

→ **GLM 5.3 的判断策略与 DeepSeek 不同，呈现"两端极化"特征**

---

## 🎯 选择建议

### 场景 1：需要推理过程可见性（审计、调试）

✅ **选 OpenRouter**
- 提供 reasoning（虽然内容简短）
- 成本增加 12x，但可解释性提升
- 适合：合规审计、策略调优

### 场景 2：高频调用、成本敏感

✅ **选 DeepSeek 直连**
- 成本低 12x
- 中等任务延迟可能更高（9.1s vs 4.2s），需优化
- 适合：生产环境高频决策

### 场景 3：风险识别要求高

✅ **选 DeepSeek 直连**
- 风险识别更细粒度（7 项 vs 5 项）
- 技术化分类（architecture_integration、data_quality）
- 更详细的缓解措施

### 场景 4：需要模型自动路由

✅ **选 OpenRouter**
- 路由到 GLM 5.3（可能未来路由到更优模型）
- 延迟优势（平均 4.3s vs 6.3s）

### 场景 5：偏好保守策略（安全优先）

🤔 **看任务类型**:
- **中等任务**: 选 DeepSeek（更保守，82分 + semi_automation）
- **复杂任务**: 选 OpenRouter（极度保守，45分 + human_first）

---

## 🏆 最终推荐

### 默认方案：**DeepSeek 直连**

**理由**:
1. ✅ 成本低 12x（$0.000018 vs $0.000224）
2. ✅ 风险识别更详细（7 项 vs 5 项）
3. ✅ 评分更稳定（简单 95，中等 82，复杂 58 - 呈线性下降）
4. ⚠️ 中等任务延迟较高（9.1s vs 4.2s）- 可优化
5. ❌ 无推理过程（可接受）

### 可选方案：**OpenRouter 作为审计模式**

```typescript
const config = {
  provider: process.env.ORCA_JUDGE_PROVIDER || 'deepseek',
  auditMode: process.env.ORCA_AUDIT === 'true',  // 启用 reasoning
};

if (config.auditMode) {
  // 使用 OpenRouter GLM，获取 reasoning
} else {
  // 使用 DeepSeek，高性能低成本
}
```

### 不推荐：**混合策略（根据任务复杂度切换）**

❌ **原因**: GLM 和 DeepSeek 的评分标准不一致
- GLM 中等任务给 88 分，复杂任务给 45 分
- DeepSeek 中等任务给 82 分，复杂任务给 58 分
- 切换模型会导致评分体系混乱

---

## 📝 附录

### 测试环境
- OpenRouter API: https://openrouter.ai/api/v1/chat/completions
- 模型: typesafe/jev-router → 实际路由到 z-ai/glm-5.3-flash
- DeepSeek API: http://172.87.28.157:8080/v1/chat/completions
- 模型: deepseek-v4.1-flash

### 原始测试数据
- `/tmp/comparison-1-openrouter.json` / `-deepseek.json`
- `/tmp/comparison-2-openrouter.json` / `-deepseek.json`
- `/tmp/comparison-3-openrouter.json` / `-deepseek.json`

### 完整脚本
- `demo-compare.ts` - 对比测试脚本
- 运行: `npm run demo:compare`
