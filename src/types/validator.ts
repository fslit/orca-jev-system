// Validator 层类型定义

import type { ExecutionPlan } from './evaluator';

export interface ValidationIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'resource' | 'dependency' | 'security' | 'technical' | 'process';
  message: string;
  affected_tasks: string[];
  mitigation?: string;
}

export interface Optimization {
  type: 'merge_tasks' | 'parallel_execution' | 'tool_selection' | 'cost_reduction';
  target_tasks: string[];
  reason: string;
  time_saved_minutes?: number;
  cost_saved_usd?: number;
}

export interface ValidatorResult {
  plan_id: string;
  validation_result: 'approved' | 'rejected' | 'needs_modification';
  feasibility_score: number;  // 0-100
  blocking_issues: ValidationIssue[];
  warnings: ValidationIssue[];
  optimizations: Optimization[];
  adjusted_plan?: ExecutionPlan;
  final_metrics: {
    total_time_minutes: number;
    total_cost_usd: number;
    risk_score: number;
    automation_ratio: number;
  };
  reasoning: string;
  metadata?: {
    latency_ms: number;
    model_used: string;
    timestamp: string;
  };
}

export interface ValidationContext {
  project_type: string;
  tech_stack: string[];
  available_resources: string[];
}
