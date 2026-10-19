# Orca JEV Demo

快速验证 JEV Judge 层的可行性。

## 快速运行

```bash
# 1. 安装依赖
npm install

# 2. 设置 API Key
export DEEPSEEK_API_KEY="sk-e011409cdf6e9cab14fc07db836dbe1b432f5638c9e5c303d5369023bcba447e"

# 3. 运行 Demo
npm run demo
```

## 预期输出

Demo 会测试 3 个任务：

### 测试 1: 简单任务（修复拼写错误）
**预期结果：**
- automation_score: 95+
- risk_level: low
- strategy: full_automation

### 测试 2: 中等任务（实现登录接口）
**预期结果：**
- automation_score: 65-85
- risk_level: medium
- strategy: semi_automation
- risks: 包含安全、性能相关风险

### 测试 3: 复杂任务（重构 + 机器学习）
**预期结果：**
- automation_score: 50-65
- risk_level: high
- strategy: semi_automation 或 human_first
- risks: 包含算法、性能、数据质量风险

## 成功标准

**Judge 层可行 ✅** 如果：
1. 所有测试完成，无 API 错误
2. automation_score 与任务复杂度匹配
3. risks 列表合理且有价值
4. 延迟 < 5s，成本 < $0.01

**需要调整 ⚠️** 如果：
1. automation_score 评分不准确
2. risks 太泛泛或缺失关键风险
3. reasoning 不清晰

**不可行 ❌** 如果：
1. API 调用失败
2. 返回的 JSON 格式错误
3. 延迟 > 10s

## 下一步

### 如果 Demo 成功 ✅
继续实现：
1. **Evaluator 层**: 生成 3 个执行方案
2. **Validator 层**: 验证方案可行性
3. **CLI 包装**: 提供命令行工具
4. **GitHub 集成**: 创建仓库和项目结构

### 如果需要调整 ⚠️
1. 调整 System Prompt
2. 增加示例（few-shot learning）
3. 调整 temperature 参数

## 文件说明

- `demo-judge.ts` - Judge 层 Demo 代码
- `package.json` - 依赖配置
- `/tmp/judge-result-*.json` - 输出的判断结果（运行后生成）

## 技术细节

- **运行时**: tsx (TypeScript Execute)
- **模型**: deepseek-v4.1-flash @ http://172.87.28.157:8080
- **延迟**: ~2-3 秒/次
- **成本**: $0.01/1M tokens (~$0.002/次)
