#!/usr/bin/env tsx
/**
 * Orca JEV - Judge Layer Demo
 *
 * 功能：评估开发任务的自动化可行性和风险
 *
 * 使用：
 *   npm install -g tsx
 *   export DEEPSEEK_API_KEY="your-key"
 *   tsx demo-judge.ts
 */

interface JudgeResult {
  automation_score: number;      // 0-100
  risk_level: 'low' | 'medium' | 'high';
  strategy: 'full_automation' | 'semi_automation' | 'human_first';
  reasoning: string;
  risks: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }>;
  confidence: number;            // 0-100
}

interface TaskInput {
  description: string;
  context?: {
    project_type?: string;
    tech_stack?: string[];
    existing_code?: boolean;
  };
}

async function callDeepSeek(prompt: string): Promise<any> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set');
  }

  const response = await fetch('http://172.87.28.157:8080/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4.1-flash',
      messages: [
        {
          role: 'system',
          content: `你是 Orca 项目自动化系统的 Judge（判断器）。

你的任务是评估开发任务的自动化可行性和风险。

输出 JSON 格式，包含以下字段：
- automation_score: 0-100 的自动化评分（越高越适合自动化）
  - 90-100: 简单任务，可以完全自动化
  - 60-89: 中等复杂度，可以半自动化
  - 0-59: 复杂或高风险，需要人工主导

- risk_level: 风险等级（low / medium / high）
  - low: 影响范围小，易回滚
  - medium: 需要测试验证，有一定影响
  - high: 影响核心功能，需要人工审查

- strategy: 执行策略
  - full_automation: 完全自动化执行
  - semi_automation: AI 生成方案 + 人工审查
  - human_first: AI 辅助 + 人工主导

- reasoning: 判断依据（2-3 句话）

- risks: 风险列表（数组，每项包含）
  - category: 风险类别（技术/安全/性能/兼容性等）
  - severity: 严重程度（low / medium / high）
  - description: 风险描述
  - mitigation: 缓解措施

- confidence: 判断置信度 0-100（基于任务描述的清晰度和你的判断把握）

只返回 JSON，不要其他内容。`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function judge(task: TaskInput): Promise<JudgeResult> {
  const prompt = `
任务描述：${task.description}

${task.context ? `
项目上下文：
- 项目类型：${task.context.project_type || '未知'}
- 技术栈：${task.context.tech_stack?.join(', ') || '未知'}
- 现有代码库：${task.context.existing_code ? '是' : '否'}
` : ''}

请评估这个任务的自动化可行性和风险。
`.trim();

  console.log('🤔 Judge 正在分析任务...\n');

  const startTime = Date.now();
  const rawResponse = await callDeepSeek(prompt);
  const latency = Date.now() - startTime;

  // 解析 JSON（处理可能的 markdown 代码块包裹）
  let jsonText = rawResponse.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
  }

  const result = JSON.parse(jsonText);

  console.log(`⏱️  用时: ${latency}ms\n`);

  return result;
}

function displayResult(result: JudgeResult) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 判断结果:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  自动化评分:  ${result.automation_score}/100`);
  console.log(`  风险等级:    ${result.risk_level.toUpperCase()}`);
  console.log(`  建议策略:    ${result.strategy}`);
  console.log(`  置信度:      ${result.confidence}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💭 判断依据:');
  console.log(`  ${result.reasoning}\n`);

  if (result.risks.length > 0) {
    console.log('⚠️  识别的风险:');
    result.risks.forEach((risk, index) => {
      const severityEmoji = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢';
      console.log(`\n  ${index + 1}. ${severityEmoji} [${risk.severity.toUpperCase()}] ${risk.category}`);
      console.log(`     描述: ${risk.description}`);
      console.log(`     缓解: ${risk.mitigation}`);
    });
    console.log();
  }
}

// 测试用例
const testTasks: TaskInput[] = [
  {
    description: '修复 README.md 中的拼写错误',
    context: {
      project_type: 'fullstack',
      tech_stack: ['Go', 'Vue3'],
      existing_code: true,
    },
  },
  {
    description: '实现用户登录接口，支持 JWT + Redis 会话管理',
    context: {
      project_type: 'backend',
      tech_stack: ['Go', 'goframe-v2', 'MySQL', 'Redis'],
      existing_code: true,
    },
  },
  {
    description: '重构告警降噪引擎，支持机器学习模型（XGBoost）',
    context: {
      project_type: 'fullstack',
      tech_stack: ['Go', 'Python', 'MySQL', 'Redis'],
      existing_code: true,
    },
  },
];

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     Orca JEV - Judge Layer Demo               ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // 检查环境变量
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ 错误: DEEPSEEK_API_KEY 环境变量未设置');
    console.error('   请运行: export DEEPSEEK_API_KEY="your-key"\n');
    process.exit(1);
  }

  // 运行所有测试用例
  for (let i = 0; i < testTasks.length; i++) {
    const task = testTasks[i];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试用例 ${i + 1}/${testTasks.length}`);
    console.log('='.repeat(60));
    console.log(`📝 任务: ${task.description}`);
    console.log(`🏗️  项目类型: ${task.context?.project_type}`);
    console.log(`🛠️  技术栈: ${task.context?.tech_stack?.join(', ')}`);
    console.log('='.repeat(60) + '\n');

    try {
      const result = await judge(task);
      displayResult(result);

      // 保存结果
      const fs = await import('fs');
      const resultFile = `/tmp/judge-result-${i + 1}.json`;
      fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
      console.log(`💾 结果已保存: ${resultFile}\n`);

    } catch (error) {
      console.error(`❌ 测试失败: ${error instanceof Error ? error.message : String(error)}\n`);
    }

    // 最后一个测试用例后不等待
    if (i < testTasks.length - 1) {
      console.log('⏳ 等待 2 秒后继续下一个测试...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有测试完成');
  console.log('='.repeat(60) + '\n');

  console.log('📊 下一步:');
  console.log('  1. 查看生成的 JSON 文件: /tmp/judge-result-*.json');
  console.log('  2. 评估 Judge 的准确性和实用性');
  console.log('  3. 如果效果好，继续实现 Evaluator 和 Validator 层\n');
}

main().catch(console.error);
