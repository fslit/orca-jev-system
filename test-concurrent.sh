#!/bin/bash
# 并发 JEV 流程测试脚本

# 检查环境变量
if [ -z "$DEEPSEEK_API_KEY" ]; then
  echo "❌ 请先设置 DEEPSEEK_API_KEY 环境变量"
  echo "   export DEEPSEEK_API_KEY=sk-xxx"
  exit 1
fi

echo "🚀 启动 Orca JEV 完整并发流程测试..."
echo ""
echo "并发策略:"
echo "  - Phase 1: Judge 单次调用"
echo "  - Phase 2: Evaluator 并发生成 3 个方案"
echo "  - Phase 3: Validator 并发验证 5 个维度"
echo ""

npm run demo:full
