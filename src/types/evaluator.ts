// Evaluator 层类型定义

import type { JudgeResult } from './judge';

export interface Task {
  task_id: string;
  name: string;
  type: 'manual' | 'automated' | 'review';
  owner: 'human' | 'ai';
  estimated_time_minutes: number;
  estimated_cost_usd?: number;
  dependencies: string[];
  description?: string;
  parallel_group?: number;  // 可并行执行的任务组
}

export interface ExecutionPlan {
  plan_id: 'conservative' | 'balanced' | 'aggressive';
  name: string;
  strategy: 'human_first' | 'semi_automation' | 'full_automation';
  tasks: Task[];
  total_time_minutes: number;
  total_cost_usd: number;
  automation_ratio: number;  // 0-1
  risk_score: number;        // 0-100
  confidence: number;        // 0-100
  parallel_execution?: {
    groups: number;
    max_parallelism: number;
  };
}

export interface EvaluatorResult {
  plans: ExecutionPlan[];
  recommended: 'conservative' | 'balanced' | 'aggressive';
  reasoning: string;
  metadata: {
    judge_input: JudgeResult;
    generated_at: string;
    model_used: string;
    latency_ms: number;
  };
}
