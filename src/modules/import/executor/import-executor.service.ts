import { Injectable } from '@nestjs/common';
import { ImportScene } from '../scenes/import-scene.interface';
import {
  ImportExecutionResult,
  BatchExecutionResult,
  ExecutionPlan,
} from './execution.types';
import { RunflowClientService } from '../runflow/runflow-client.service';

@Injectable()
export class ImportExecutorService {
  constructor(private readonly runflowClient: RunflowClientService) {}

  async execute<TData, TItem>(params: {
    scene: ImportScene<TData, TItem>;
    plan: ExecutionPlan<TItem>;
    runflow: Record<string, any>;
    continueOnError?: boolean;
  }): Promise<ImportExecutionResult> {
    const { scene, plan, runflow, continueOnError = false } = params;
    const results: BatchExecutionResult[] = [];

    for (const batch of plan.batches) {
      const startedAt = Date.now();

      try {
        const payload = scene.buildRunflowPayload({
          batch,
          runflow,
        });
        const response = await this.runflowClient.invoke(payload);

        results.push({
          batchNo: batch.batchNo,
          start: batch.start,
          end: batch.end,
          success: true,
          durationMs: Date.now() - startedAt,
          responsePayload: response,
        });
      } catch (error: any) {
        results.push({
          batchNo: batch.batchNo,
          start: batch.start,
          end: batch.end,
          success: false,
          durationMs: Date.now() - startedAt,
          errorMessage: this.normalizeError(error),
          responsePayload: error?.response ?? error?.cause,
        });

        if (!continueOnError) {
          break;
        }
      }
    }

    return {
      mode: plan.mode,
      totalItems: plan.totalItems,
      totalBatches: plan.totalBatches,
      successBatches: results.filter((item) => item.success).length,
      failedBatches: results.filter((item) => !item.success).length,
      results,
    };
  }

  private normalizeError(error: any): string {
    if (typeof error?.message === 'string') {
      return error.message;
    }

    if (typeof error?.response?.data?.message === 'string') {
      return error.response.data.message;
    }

    return '执行失败';
  }
}
