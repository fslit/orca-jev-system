#!/usr/bin/env tsx
/**
 * Orca JEV - OpenRouter Jev Router 测试
 *
 * 对比 DeepSeek 直连 vs OpenRouter Jev Router
 *
 * 使用方法:
 *   export OPENROUTER_API_KEY=sk-or-v1-xxx
 *   export DEEPSEEK_API_KEY=sk-xxx
 *   npm run demo:compare
 */

interface JudgeResult {
  automation_score: number;
  risk_level: 'low' | 'medium' | 'high';
  strategy: 'full_automation' | 'semi_automation' | 'human_first';
  reasoning: string;
  risks: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }>;
  confidence: number;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || 'http://172.87.28.157:8080';

if (!OPENROUTER_API_KEY || !DEEPSEEK_API_KEY) {
  console.error('❌ 缺少 API 密钥，请设置环境变量:');
  console.error('   export OPENROUTER_API_KEY=sk-or-v1-xxx');
  console.error('   export DEEPSEEK_API_KEY=sk-xxx');
  process.exit(1);
}

async function callOpenRouter(task: string): Promise<any> {
  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://github.com/fslit/orca-jev-system',
    },
    body: JSON.stringify({
      model: 'typesafe/jev-router',
      messages: [
        {
          role: 'system',
          content: `你是 Orca 项目自动化系统的 Judge（判断器）。

评估开发任务的自动化可行性和风险。

输出 JSON 格式，包含以下字段：
- automation_score: 0-100 的自动化评分
- risk_level: 风险等级（low / medium / high）
- strategy: 执行策略（full_automation / semi_automation / human_first）
- reasoning: 判断依据（2-3 句话）
- risks: 风险列表（数组，每项包含 category, severity, description, mitigation）
- confidence: 判断置信度 0-100

只返回 JSON，不要其他内容。`,
        },
        {
          role: 'user',
          content: task,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  const latency = Date.now() - startTime;

  return {
    latency,
    rawResponse: data,
    model: data.model,
    reasoning_visible: !!data.choices?.[0]?.message?.reasoning,
  };
}

async function callDeepSeek(task: string): Promise<any> {
  const startTime = Date.now();

  const response = await fetch(`${DEEPSEEK_API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4.1-flash',
      messages: [
        {
          role: 'system',
          content: `你是 Orca 项目自动化系统的 Judge（判断器）。

评估开发任务的自动化可行性和风险。

输出 JSON 格式，包含以下字段：
- automation_score: 0-100 的自动化评分
- risk_level: 风险等级（low / medium / high）
- strategy: 执行策略（full_automation / semi_automation / human_first）
- reasoning: 判断依据（2-3 句话）
- risks: 风险列表（数组，每项包含 category, severity, description, mitigation）
- confidence: 判断置信度 0-100

只返回 JSON，不要其他内容。`,
        },
        {
          role: 'user',
          content: task,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  const latency = Date.now() - startTime;

  return {
    latency,
    rawResponse: data,
    model: 'deepseek-v4.1-flash',
    reasoning_visible: false,
  };
}

function parseResult(response: any): JudgeResult {
  const content = response.rawResponse.choices?.[0]?.message?.content || '';

  let jsonText = content.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
  }

  return JSON.parse(jsonText);
}

function displayComparison(
  task: string,
  openRouterResult: any,
  deepSeekResult: any,
  orParsed: JudgeResult,
  dsParsed: JudgeResult
) {
  console.log('\n' + '='.repeat(70));
  console.log('📝 任务:', task);
  console.log('='.repeat(70));

  console.log('\n📊 对比结果:\n');

  console.log('┌─────────────────────────┬─────────────────────┬─────────────────────┐');
  console.log('│ 指标                    │ OpenRouter Jev      │ DeepSeek 直连       │');
  console.log('├─────────────────────────┼─────────────────────┼─────────────────────┤');
  console.log(`│ 实际模型                │ ${openRouterResult.model.padEnd(19)} │ deepseek-v4.1-flash │`);
  console.log(`│ 延迟                    │ ${(openRouterResult.latency + 'ms').padEnd(19)} │ ${(deepSeekResult.latency + 'ms').padEnd(19)} │`);
  console.log(`│ automation_score        │ ${(orParsed.automation_score + '/100').padEnd(19)} │ ${(dsParsed.automation_score + '/100').padEnd(19)} │`);
  console.log(`│ risk_level              │ ${orParsed.risk_level.padEnd(19)} │ ${dsParsed.risk_level.padEnd(19)} │`);
  console.log(`│ strategy                │ ${orParsed.strategy.padEnd(19)} │ ${dsParsed.strategy.padEnd(19)} │`);
  console.log(`│ confidence              │ ${(orParsed.confidence + '%').padEnd(19)} │ ${(dsParsed.confidence + '%').padEnd(19)} │`);
  console.log(`│ 风险数量                │ ${(orParsed.risks.length + ' 个').padEnd(19)} │ ${(dsParsed.risks.length + ' 个').padEnd(19)} │`);
  console.log(`│ 推理过程可见            │ ${(openRouterResult.reasoning_visible ? '✅ 是' : '❌ 否').padEnd(19)} │ ${(deepSeekResult.reasoning_visible ? '✅ 是' : '❌ 否').padEnd(19)} │`);
  console.log('└─────────────────────────┴─────────────────────┴─────────────────────┘');

  // 显示推理过程（如果有）
  if (openRouterResult.reasoning_visible) {
    const reasoning = openRouterResult.rawResponse.choices[0].message.reasoning;
    console.log('\n🧠 OpenRouter 推理过程（前 500 字符）:');
    console.log('━'.repeat(70));
    console.log(reasoning.substring(0, 500) + (reasoning.length > 500 ? '...' : ''));
    console.log('━'.repeat(70));
  }

  // 显示成本
  const orUsage = openRouterResult.rawResponse.usage;
  if (orUsage?.cost) {
    console.log(`\n💰 OpenRouter 成本: $${orUsage.cost.toFixed(6)}`);
    console.log(`   提示词 tokens: ${orUsage.prompt_tokens}`);
    console.log(`   完成 tokens: ${orUsage.completion_tokens}`);
    console.log(`   推理 tokens: ${orUsage.completion_tokens_details?.reasoning_tokens || 0}`);
  }

  // 显示风险对比
  console.log('\n⚠️  风险识别对比:\n');
  console.log('OpenRouter Jev:');
  orParsed.risks.forEach((risk, i) => {
    const emoji = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢';
    console.log(`  ${i + 1}. ${emoji} [${risk.severity.toUpperCase()}] ${risk.category}`);
  });

  console.log('\nDeepSeek 直连:');
  dsParsed.risks.forEach((risk, i) => {
    const emoji = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢';
    console.log(`  ${i + 1}. ${emoji} [${risk.severity.toUpperCase()}] ${risk.category}`);
  });
}

const testTasks = [
  '评估任务：修复 README.md 中的拼写错误。项目类型：fullstack，技术栈：Go, Vue3',
  '评估任务：实现用户登录接口，支持 JWT + Redis 会话管理。项目类型：backend，技术栈：Go, goframe-v2, MySQL, Redis',
  '评估任务：重构告警降噪引擎，支持机器学习模型（XGBoost）。项目类型：fullstack，技术栈：Go, Python, MySQL, Redis',
];

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  OpenRouter Jev Router vs DeepSeek 直连对比测试                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  for (let i = 0; i < testTasks.length; i++) {
    const task = testTasks[i];

    console.log(`\n\n${'█'.repeat(70)}`);
    console.log(`测试用例 ${i + 1}/${testTasks.length}`);
    console.log('█'.repeat(70));

    try {
      console.log('\n🔄 调用 OpenRouter Jev Router...');
      const orResult = await callOpenRouter(task);

      console.log('🔄 调用 DeepSeek 直连...');
      const dsResult = await callDeepSeek(task);

      const orParsed = parseResult(orResult);
      const dsParsed = parseResult(dsResult);

      displayComparison(task, orResult, dsResult, orParsed, dsParsed);

      // 保存结果
      const fs = await import('fs');
      fs.writeFileSync(
        `/tmp/comparison-${i + 1}-openrouter.json`,
        JSON.stringify({ result: orParsed, meta: orResult.rawResponse.usage }, null, 2)
      );
      fs.writeFileSync(
        `/tmp/comparison-${i + 1}-deepseek.json`,
        JSON.stringify({ result: dsParsed }, null, 2)
      );

      console.log(`\n💾 结果已保存:`);
      console.log(`   /tmp/comparison-${i + 1}-openrouter.json`);
      console.log(`   /tmp/comparison-${i + 1}-deepseek.json`);

      if (i < testTasks.length - 1) {
        console.log('\n⏳ 等待 2 秒后继续...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`\n❌ 测试失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('✅ 所有测试完成');
  console.log('='.repeat(70));

  console.log('\n📋 总结:');
  console.log('  1. OpenRouter Jev Router 可用，自动路由到最优模型');
  console.log('  2. 提供推理过程可见性（reasoning tokens）');
  console.log('  3. 延迟和质量对比见上方表格');
  console.log('  4. 选择建议见生成的验证报告\n');
}

main().catch(console.error);
