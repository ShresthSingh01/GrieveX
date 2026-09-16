export interface Claim {
  id: string;
  text: string;
  category: string;
  confidence: number;
}

export interface Authority {
  id: string;
  name: string;
  role: string;
  department: string;
  confidence: number;
}

export interface Conflict {
  id: string;
  claim_text: string;
  party_a: string;
  party_b: string;
  description: string;
  status: 'UNRESOLVED' | 'RESOLVED';
  resolution_notes?: string;
}

export interface MissingInfo {
  id: string;
  field_name: string;
  description: string;
  importance: string;
  action_required: string;
  status: 'PENDING' | 'PROVIDED';
  provided_value?: string;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  authority: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  requires_human_approval: boolean;
  approval_rule_id?: string;
  approval_authority_required?: string;
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'HUMAN_APPROVAL_REQUIRED' | 'INVALIDATED';
  dependencies: string[];
  required_evidence: string[];
  submitted_evidence: Array<{
    title: string;
    content: string;
    submitted_by: string;
    timestamp?: string;
  }>;
  is_replanned: boolean;
  invalidated: boolean;
  invalidated_reason?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface AuditEvent {
  id: number;
  case_id: string;
  event_type: string;
  description: string;
  reason?: string;
  actor: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CaseDetail {
  id: string;
  title: string;
  complaint_text: string;
  citizen_name: string;
  location: string;
  category: string;
  goal?: string;
  status: string;
  assumed_authority?: string;
  workflow_name?: string;
  claims: Claim[];
  authorities: Authority[];
  conflicts: Conflict[];
  missing_info: MissingInfo[];
  tasks: Task[];
  audit_events: AuditEvent[];
  ready_tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface GraphData {
  case_id: string;
  workflow_name: string;
  nodes: any[];
  edges: any[];
  active_tasks_count: number;
  ready_tasks_count: number;
  parallel_execution_enabled: boolean;
}

export interface VerificationResult {
  case_id: string;
  recommendation: 'CLOSE_RECOMMENDED' | 'DO_NOT_CLOSE';
  can_close: boolean;
  checklist: Array<{
    criterion: string;
    passed: boolean;
    details: string;
  }>;
  blocking_reasons: string[];
  summary: string;
}

export interface EvaluationScorecard {
  scorecard: {
    total_test_cases: number;
    passed_test_cases: number;
    task_completeness_rate: string;
    dependency_accuracy: string;
    conflict_detection_f1: string;
    dynamic_replanning_accuracy: string;
    unsafe_autonomous_actions: number;
    human_escalation_precision: string;
  };
  detailed_results: Array<{
    test_id: string;
    description: string;
    passed: boolean;
    notes: string;
  }>;
}
