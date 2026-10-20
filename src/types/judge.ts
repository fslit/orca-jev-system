// Judge 层类型定义

export interface Risk {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
}

export interface JudgeResult {
  automation_score: number;  // 0-100
  risk_level: 'low' | 'medium' | 'high';
  strategy: 'full_automation' | 'semi_automation' | 'human_first';
  reasoning: string;
  risks: Risk[];
  confidence: number;  // 0-100
  metadata?: {
    model_used: string;
    latency_ms: number;
    timestamp: string;
  };
}

export interface JudgeContext {
  project_type?: string;
  tech_stack?: string[];
  available_resources?: string[];
  complexity?: string;
}
