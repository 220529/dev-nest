import { BadRequestException, Injectable } from '@nestjs/common';
import type { Express } from 'express';
import { ExecutionMode } from '../executor/execution.types';
import { ImportExecutorService } from '../executor/import-executor.service';
import { ExcelParserService } from '../parser/excel-parser.service';
import { ImportSceneRegistry } from '../registry/import-scene.registry';

@Injectable()
export class ImportOrchestratorService {
  constructor(
    private readonly excelParser: ExcelParserService,
    private readonly sceneRegistry: ImportSceneRegistry,
    private readonly executor: ImportExecutorService,
  ) {}

  preview(params: {
    file: Express.Multer.File;
    scene: string;
    sheetName?: string;
    mode?: ExecutionMode;
    chunkSize?: number;
  }) {
    const workbook = this.excelParser.parse(params.file);
    const scene = this.sceneRegistry.get(params.scene);
    const data = scene.parse({
      workbook,
      sheetName: params.sheetName,
    });
    const validation = scene.validate(data);
    const plan = scene.plan({
      data,
      mode: params.mode ?? this.resolveDefaultMode(),
      chunkSize: params.chunkSize ?? 20,
    });
    const issues = validation.issues.length ? validation.issues : undefined;

    return {
      scene: params.scene,
      summary: {
        ...data.summary,
        mode: plan.mode,
        totalItems: plan.totalItems,
        totalBatches: plan.totalBatches,
      },
      rows: data.items.map(({ orderNumber, settlementNumbers }) => ({
        orderNumber,
        settlementNumbers,
      })),
      issues,
    };
  }

  async execute(params: {
    file: Express.Multer.File;
    scene: string;
    sheetName?: string;
    mode?: ExecutionMode;
    chunkSize?: number;
    continueOnError?: boolean;
    runflow: Record<string, any>;
  }) {
    this.assertRunflowConfig(params.runflow);

    const workbook = this.excelParser.parse(params.file);
    const scene = this.sceneRegistry.get(params.scene);
    const data = scene.parse({
      workbook,
      sheetName: params.sheetName,
    });
    const validation = scene.validate(data);

    if (!validation.valid) {
      throw new BadRequestException({
        message: '导入数据校验失败',
        issues: validation.issues,
      });
    }

    const plan = scene.plan({
      data,
      mode: params.mode ?? this.resolveDefaultMode(),
      chunkSize: params.chunkSize ?? 20,
    });
    const execution = await this.executor.execute({
      scene,
      plan,
      runflow: params.runflow,
      continueOnError: params.continueOnError,
    });

    return {
      scene: params.scene,
      data: {
        summary: data.summary,
      },
      execution,
    };
  }

  private assertRunflowConfig(runflow: Record<string, any>) {
    if (!runflow || Array.isArray(runflow) || typeof runflow !== 'object') {
      throw new BadRequestException('runflow 配置必须是对象');
    }

    if (!String(runflow.action ?? '').trim()) {
      throw new BadRequestException('runflow.action 不能为空');
    }
  }

  private resolveDefaultMode(): ExecutionMode {
    return 'chunked';
  }
}
