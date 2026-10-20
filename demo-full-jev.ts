#!/usr/bin/env tsx
/**
 * Orca JEV - 完整并发流程测试
 *
 * 并发策略：
 * 1. Evaluator: 并发生成 3 个方案（conservative, balanced, aggressive）
 * 2. Validator: 并发验证 5 个维度（技术/资源/依赖/安全/优化）
 *
 * 使用：
 *   export DEEPSEEK_API_KEY=sk-xxx
 *   npm run demo:full
 */

import * as fs from 'fs';
import { judgeTask } from './src/judge/judge';
import { evaluateTask } from './src/evaluator/evaluator';
import { validatePlan } from './src/validator/validator';
import type { ModelConfig } from './src/judge/judge';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || 'http://172.87.28.157:8080';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ 缺少 DEEPSEEK_API_KEY 环境变量');
  console.error('   export DEEPSEEK_API_KEY=sk-xxx');
  process.exit(1);
}

const modelConfig: ModelConfig = {
  baseUrl: DEEPSEEK_API_BASE,
  apiKey: DEEPSEEK_API_KEY,
  model: 'deepseek-v4.1-flash',
};

const testCases = [
  {
    description: '实现用户登录接口，支持 JWT + Redis 会话管理。项目类型：backend，技术栈：Go, goframe-v2, MySQL, Redis',
    context: {
      project_type: 'backend',
      tech_stack: ['Go', 'goframe-v2', 'MySQL', 'Redis'],
      available_resources: ['MySQL', 'Redis', 'Docker'],
    },
  },
  {
    description: '为现有的电商系统添加优惠券功能，包括创建、发放、使用、过期处理。技术栈：Java, Spring Boot, MySQL, Redis',
    context: {
      project_type: 'backend',
      tech_stack: ['Java', 'Spring Boot', 'MySQL', 'Redis'],
      available_resources: ['MySQL', 'Redis', 'Docker', 'Kafka'],
    },
  },
];

async function runFullJEV(taskDescription: string, context: any) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  Orca JEV - 完整并发流程测试                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  console.log(`📝 任务: ${taskDescription}\n`);
  console.log('═'.repeat(70));

  const overallStart = Date.now();

  // Phase 1: Judge
  console.log('\n🔍 Phase 1: Judge 层评估\n');
  const judgeStart = Date.now();
  const judgeResult = await judgeTask(taskDescription, context, modelConfig);
  const judgeLatency = Date.now() - judgeStart;

  console.log(`✅ Judge 完成 (${judgeLatency}ms)`);
  console.log(`   automation_score: ${judgeResult.automation_score}/100`);
  console.log(`   risk_level: ${judgeResult.risk_level}`);
  console.log(`   strategy: ${judgeResult.strategy}`);
  console.log(`   confidence: ${judgeResult.confidence}%`);
  console.log(`   risks: ${judgeResult.risks.length} 个\n`);

  // Phase 2: Evaluator（并发生成 3 个方案）
  console.log('═'.repeat(70));
  console.log('\n📋 Phase 2: Evaluator 层并发生成方案\n');
  console.log('🔄 并发生成 3 个方案: conservative | balanced | aggressive\n');

  const evalStart = Date.now();
  const evalResult = await evaluateTask(judgeResult, taskDescription, modelConfig);
  const evalLatency = Date.now() - evalStart;

  console.log(`✅ Evaluator 完成 (${evalLatency}ms)`);
  console.log(`   生成方案数: ${evalResult.plans.length}`);
  console.log(`   推荐方案: ${evalResult.recommended}\n`);

  evalResult.plans.forEach((plan, idx) => {
    const parallelInfo = plan.parallel_execution
      ? ` | 并行组: ${plan.parallel_execution.groups}`
      : '';
    console.log(`   ${idx + 1}. ${plan.name}`);
    console.log(`      任务数: ${plan.tasks.length} | 时间: ${plan.total_time_minutes}min | 成本: $${plan.total_cost_usd.toFixed(4)}`);
    console.log(`      自动化率: ${(plan.automation_ratio * 100).toFixed(0)}% | 风险: ${plan.risk_score}/100${parallelInfo}`);
  });
  console.log();

  // Phase 3: Validator（并发验证 5 个维度）
  console.log('═'.repeat(70));
  console.log('\n✅ Phase 3: Validator 层并发验证\n');
  console.log('🔄 并发验证 5 个维度: 技术 | 资源 | 依赖 | 安全 | 优化\n');

  const recommendedPlan = evalResult.plans.find(p => p.plan_id === evalResult.recommended)!;
  const valStart = Date.now();
  const valResult = await validatePlan(recommendedPlan, context, modelConfig);
  const valLatency = Date.now() - valStart;

  const statusEmoji = {
    approved: '✅',
    rejected: '❌',
    needs_modification: '⚠️',
  };

  console.log(`${statusEmoji[valResult.validation_result]} Validator 完成 (${valLatency}ms)`);
  console.log(`   验证结果: ${valResult.validation_result}`);
  console.log(`   可行性评分: ${valResult.feasibility_score}/100`);
  console.log(`   阻塞问题: ${valResult.blocking_issues.length} 个`);
  console.log(`   警告: ${valResult.warnings.length} 个`);
  console.log(`   优化建议: ${valResult.optimizations.length} 个\n`);

  if (valResult.blocking_issues.length > 0) {
    console.log('🚫 阻塞问题:\n');
    valResult.blocking_issues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      console.log(`      影响任务: ${issue.affected_tasks.join(', ')}`);
      if (issue.mitigation) {
        console.log(`      缓解措施: ${issue.mitigation}`);
      }
      console.log();
    });
  }

  if (valResult.warnings.length > 0) {
    console.log('⚠️  警告:\n');
    valResult.warnings.slice(0, 3).forEach((warning, idx) => {
      console.log(`   ${idx + 1}. [${warning.severity.toUpperCase()}] ${warning.message}`);
    });
    if (valResult.warnings.length > 3) {
      console.log(`   ... 还有 ${valResult.warnings.length - 3} 个警告\n`);
    } else {
      console.log();
    }
  }

  if (valResult.optimizations.length > 0) {
    console.log('💡 优化建议:\n');
    valResult.optimizations.forEach((opt, idx) => {
      console.log(`   ${idx + 1}. [${opt.type.toUpperCase()}] ${opt.reason}`);
      if (opt.time_saved_minutes) {
        console.log(`      节省时间: ${opt.time_saved_minutes} 分钟`);
      }
      if (opt.cost_saved_usd) {
        console.log(`      节省成本: $${opt.cost_saved_usd.toFixed(4)}`);
      }
    });
    console.log();
  }

  // Final Summary
  console.log('═'.repeat(70));
  console.log('\n📊 完整流程汇总\n');

  const overallLatency = Date.now() - overallStart;
  const sequentialLatency = judgeLatency + evalLatency + valLatency;
  const concurrencyGain = ((sequentialLatency - overallLatency) / sequentialLatency * 100).toFixed(1);

  console.log('⏱️  延迟分析:');
  console.log(`   Judge:            ${judgeLatency}ms`);
  console.log(`   Evaluator (并发):  ${evalLatency}ms`);
  console.log(`   Validator (并发):  ${valLatency}ms`);
  console.log(`   总延迟:           ${overallLatency}ms`);
  console.log(`   并发优化:         节省 ${concurrencyGain}% 时间\n`);

  console.log('💰 成本与效率:');
  console.log(`   预估成本:   $${valResult.final_metrics.total_cost_usd.toFixed(4)}`);
  console.log(`   预估时间:   ${valResult.final_metrics.total_time_minutes} 分钟`);
  console.log(`   自动化率:   ${(valResult.final_metrics.automation_ratio * 100).toFixed(0)}%`);
  console.log(`   风险分数:   ${valResult.final_metrics.risk_score}/100\n`);

  if (valResult.validation_result === 'approved') {
    console.log('✅ 方案已批准，可以执行！\n');
  } else if (valResult.validation_result === 'needs_modification') {
    console.log('⚠️  方案需要优化，建议查看优化建议后执行\n');
  } else {
    console.log('❌ 方案被拒绝，必须解决阻塞问题后重新评估\n');
  }

  // 保存完整结果
  const fullResult = {
    task: taskDescription,
    context,
    judge: judgeResult,
    evaluator: evalResult,
    validator: valResult,
    summary: {
      overall_latency_ms: overallLatency,
      judge_latency_ms: judgeLatency,
      evaluator_latency_ms: evalLatency,
      validator_latency_ms: valLatency,
      concurrency_optimization: `${concurrencyGain}%`,
      estimated_cost_usd: valResult.final_metrics.total_cost_usd,
      estimated_time_minutes: valResult.final_metrics.total_time_minutes,
      automation_ratio: valResult.final_metrics.automation_ratio,
      risk_score: valResult.final_metrics.risk_score,
      final_status: valResult.validation_result,
    },
  };

  const outputFile = '/tmp/full-jev-result.json';
  fs.writeFileSync(outputFile, JSON.stringify(fullResult, null, 2));
  console.log(`💾 完整结果已保存: ${outputFile}\n`);

  return fullResult;
}

async function main() {
  console.log('🚀 开始并发流程测试\n');
  console.log(`并发策略:`);
  console.log(`  - Evaluator: 并发生成 3 个方案 (conservative, balanced, aggressive)`);
  console.log(`  - Validator: 并发验证 5 个维度 (技术/资源/依赖/安全/优化)`);
  console.log();

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`测试用例 ${i + 1}/${testCases.length}`);
    console.log('='.repeat(70));

    await runFullJEV(testCase.description, testCase.context);

    if (i < testCases.length - 1) {
      console.log('\n⏸️  等待 2 秒后继续...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n✅ 所有测试完成');
}

main().catch(console.error);
