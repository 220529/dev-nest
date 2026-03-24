export type ExecutionMode = 'full' | 'chunked';

export interface ValidationIssue {
  rowNo?: number;
  field?: string;
  code: string;
  message: string;
  level: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ExecutionPlanBatch<TItem = any> {
  batchNo: number;
  start: number;
  end: number;
  items: TItem[];
}

export interface ExecutionPlan<TItem = any> {
  mode: ExecutionMode;
  totalItems: number;
  totalBatches: number;
  batches: ExecutionPlanBatch<TItem>[];
}

export interface BatchExecutionResult {
  batchNo: number;
  start: number;
  end: number;
  success: boolean;
  durationMs: number;
  responsePayload?: any;
  errorMessage?: string;
}

export interface ImportExecutionResult {
  mode: ExecutionMode;
  totalItems: number;
  totalBatches: number;
  successBatches: number;
  failedBatches: number;
  results: BatchExecutionResult[];
}
