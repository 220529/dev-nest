import {
  ExecutionMode,
  ExecutionPlan,
  ExecutionPlanBatch,
  ValidationResult,
} from '../executor/execution.types';
import { ParsedWorkbook } from '../parser/excel.types';

export interface ImportScene<TData = any, TItem = any> {
  readonly scene: string;

  parse(params: { workbook: ParsedWorkbook; sheetName?: string }): TData;

  validate(data: TData): ValidationResult;

  plan(params: {
    data: TData;
    mode: ExecutionMode;
    chunkSize?: number;
  }): ExecutionPlan<TItem>;

  buildRunflowPayload(params: {
    batch: ExecutionPlanBatch<TItem>;
    runflow: Record<string, any>;
  }): Record<string, any>;
}
