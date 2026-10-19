# Orca JEV - AI 驱动的项目自动化决策引擎

<div align="center">

**Judge → Evaluator → Validator**

让 AI 自动评估开发任务的可行性、生成执行方案、验证计划合理性

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![DeepSeek](https://img.shields.io/badge/Model-DeepSeek%20v4.1-green)](https://deepseek.com/)

[English](README.md) | [中文文档](README_CN.md)

</div>

---

## 🎯 What is Orca JEV?

Orca JEV is a **three-layer AI decision engine** that helps you:

1. **Judge** - Evaluate task automation feasibility and risks
2. **Evaluator** - Generate multiple execution plans with time/cost estimates
3. **Validator** - Verify plan quality before execution

**Problem it solves:**
- ❌ Current AI coding tools are "all or nothing" - either fully automated (no control) or fully manual (low efficiency)
- ❌ No visibility into what AI will do, how long it takes, or how much it costs
- ❌ No risk assessment before execution

**Orca JEV gives you:**
- ✅ Smart decision-making: AI judges task complexity and chooses strategy
- ✅ Transparent planning: See 3 plan options (conservative/balanced/aggressive) with cost/time estimates
- ✅ Continuous validation: Pre/mid/post-execution checks
- ✅ Full observability: Every decision is traceable

---

## 🚀 Quick Start

### Installation

```bash
npm install -g orca-jev
```

### Run Demo

```bash
# 1. Clone repo
git clone https://github.com/YOUR_USERNAME/orca-jev-system.git
cd orca-jev-system

# 2. Install dependencies
npm install

# 3. Set API key
export DEEPSEEK_API_KEY="your-api-key"

# 4. Run demo
npm run demo
```

### Expected Output

```
╔════════════════════════════════════════════════╗
║     Orca JEV - Judge Layer Demo               ║
╚════════════════════════════════════════════════╝

============================================================
Test Case 1/3
============================================================
📝 Task: Fix typos in README.md
🏗️  Project Type: fullstack
🛠️  Tech Stack: Go, Vue3
============================================================

🤔 Judge is analyzing task...

⏱️  Time: 3471ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Judgment Result:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Automation Score:  95/100
  Risk Level:        LOW
  Strategy:          full_automation
  Confidence:        96%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💭 Reasoning:
  This task only involves fixing typos in README.md, does not touch 
  any Go/Vue3 source code, build configs, or runtime logic. Impact 
  is minimal and can be rolled back anytime. Task description is 
  clear and suitable for AI to directly locate and fix.

⚠️  Identified Risks:

  1. 🟢 [LOW] Technical
     Description: AI may misidentify proper nouns, code identifiers, 
                 or technical terms as typos and incorrectly modify them.
     Mitigation: Cross-reference project terminology and actual naming 
                in code before modification; generate diff for quick 
                human review before commit.

💾 Result saved: /tmp/judge-result-1.json
```

---

## 📊 Demo Results

The demo tests 3 tasks with increasing complexity:

| Task | Automation Score | Risk Level | Strategy | Latency |
|------|------------------|------------|----------|---------|
| Fix typos in README | 95/100 | LOW | full_automation | 3.5s |
| Implement login API (JWT + Redis) | 68/100 | HIGH | semi_automation | 8.4s |
| Refactor alert denoising engine (ML) | 32/100 | HIGH | human_first | 5.2s |

**Key Findings:**
- ✅ Scoring matches task complexity accurately
- ✅ Risk identification is detailed and actionable (security, performance, compatibility, testing)
- ✅ Strategy recommendations are reasonable
- ✅ Latency is acceptable (~5.7s average)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Orca CLI                              │
│  orca create-project / orca init / orca execute             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   JEV Decision Engine                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │  Judge   │──▶│Evaluator │──▶│Validator │                │
│  │Feasibility│  │Gen Plans  │  │Verify Plan│                │
│  └──────────┘   └──────────┘   └──────────┘                │
│  automation_score  3 candidate   success_rate               │
│  risk_level       plans with     risk checks                │
│                   time/cost                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                Multi-Model Routing                           │
├─────────────────────────────────────────────────────────────┤
│  Task Type → Model Selector                                 │
│  ├─ JEV decisions: deepseek-v4.1-flash ($0.01/1M)          │
│  ├─ Backend dev: deepseek-v4.1-flash                        │
│  └─ Frontend dev: claude-sonnet-5-5 (fallback: deepseek)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Use Cases

### Case 1: Simple Task (Skip JEV)

```bash
orca execute "Fix typos in README.md"

# Output:
🤖 Judge: Detected simple task (automation_score: 95), skip full JEV
🚀 Executing directly...
✅ Fixed 3 typos
💰 Cost: $0.002 | ⏱️  Time: 8s
```

### Case 2: Medium Task (Simplified JEV)

```bash
orca execute "Add login API with phone + SMS verification"

# Output:
🤔 Judge: Medium complexity (automation_score: 72, risk: medium)
📋 Evaluator: Generated 2 plans...
   Plan 1: Conservative (est. 2h, $0.80)
   Plan 2: Balanced (est. 1.5h, $0.60)
✅ Validator: Plan 2 feasible (success rate 85%)
🚀 Executing Plan 2...

[1/4] Design API interface... ✅
[2/4] Implement backend logic... ✅
[3/4] Write unit tests... ✅
[4/4] Update API docs... ✅

✅ Task completed
   Branch: feat/login-api-with-sms
   Commits: 3
   Tests: Passed (coverage 82%)
💰 Cost: $0.58 | ⏱️  Time: 1.6h
```

### Case 3: Complex Task (Full JEV)

```bash
orca execute "Refactor alert denoising engine with ML model"

# Output:
🤔 Judge: High complexity (automation_score: 55, risk: high)
   ⚠️  Detected 3 high risks:
   1. Model training requires historical data
   2. Refactoring may affect existing functionality
   3. High performance requirements

   Strategy: Semi Automation
   → I will generate code and tests, but these require manual review:
     - Model selection (LSTM vs Transformer)
     - Feature engineering strategy
     - Performance benchmark testing

Continue? [Y/n]
```

---

## 📈 Cost Comparison

| Scenario | Traditional AI (Claude Opus) | Orca + DeepSeek | Savings |
|----------|------------------------------|-----------------|---------|
| New project (8h) | $120 | $2.35 | **98%** |
| Module refactor (6h) | $90 | $2.95 | **97%** |
| Daily maintenance (10x/day) | $3 | $0.02 | **99%** |
| **Monthly Total** | **$6,390** | **$159** | **97.5%** |

*Assumes 30 work days/month, 1 new feature + 1 refactor + 10 maintenance tasks per day*

---

## 📂 Project Structure

```
orca-jev-system/
├── README.md                                    # This file
├── DEMO-README.md                              # Demo usage guide
├── demo-judge.ts                               # Judge layer demo
├── package.json                                # Dependencies
├── orca-user-guide.md                          # Full user guide
├── orca-jev-multi-model-orchestration-spec.md  # System specification
├── orca-jev-implementation-plan.md             # Implementation plan
└── jev-capability-verification-report.md       # Model verification report
```

---

## 🛠️ Tech Stack

### Verified Models

| Model | Use Case | Latency | Cost | Status |
|-------|----------|---------|------|--------|
| deepseek-v4.1-flash | JEV full stack + backend | 2.3s | $0.01/1M | ✅ Available |
| claude-opus-5-5 | JEV Judge (backup) | - | $15/$75 per 1M | ❌ Currently unavailable |
| claude-sonnet-5-5 | Frontend dev (backup) | - | $3/$15 per 1M | ❌ Currently unavailable |

### Recommended Architecture

**Solution A (Current):** DeepSeek Full Stack
- Judge / Evaluator / Validator: deepseek-v4.1-flash
- Backend dev: deepseek-v4.1-flash
- Frontend dev: deepseek-v4.1-flash
- Search/tooling: deepseek-v4.1-flash

Pros: Extremely low cost ($0.01/1M), stable latency (2-3s), fully verified

**Solution B (Future):** Hybrid
- Judge / Evaluator: claude-opus-5-5 (higher decision quality)
- Validator: deepseek-v4.1-flash (cost optimization)
- Backend/Frontend: dynamically select based on task complexity

Prerequisite: Claude models become available

---

## 🎯 Next Steps

### For Product Managers/Decision Makers

1. **Read user guide** → [orca-user-guide.md](orca-user-guide.md)
2. **Evaluate cost-benefit** → See "Cost Comparison" section
3. **Decide whether to implement**

### For Architects/Tech Leads

1. **Read system spec** → [orca-jev-multi-model-orchestration-spec.md](orca-jev-multi-model-orchestration-spec.md)
2. **Review implementation plan** → [orca-jev-implementation-plan.md](orca-jev-implementation-plan.md)
3. **Verify model availability** → [jev-capability-verification-report.md](jev-capability-verification-report.md)

### For Developers

1. **Read implementation plan** → [orca-jev-implementation-plan.md](orca-jev-implementation-plan.md)
2. **Set up dev environment** → Follow Phase 1 tasks
3. **Test-driven development** → Complete checkbox tasks one by one

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Contact

- **GitHub**: https://github.com/YOUR_USERNAME/orca-jev-system
- **Issues**: https://github.com/YOUR_USERNAME/orca-jev-system/issues

---

**Last Updated**: 2025-10-20

**Version**: v0.1.0

**Status**: Demo completed, MVP in progress
