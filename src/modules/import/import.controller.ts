import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Express } from 'express';
import {
  buildExcelFileInterceptorOptions,
  EXCEL_FILE_DESCRIPTION,
} from '@/common/excel-upload';
import { ImportOrchestratorService } from './orchestrator/import-orchestrator.service';
import { ExecutionMode } from './executor/execution.types';

@ApiTags('Import')
@Controller('api/import')
export class ImportController {
  constructor(private readonly orchestrator: ImportOrchestratorService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file', buildExcelFileInterceptorOptions()))
  @ApiOperation({ summary: '预览 Excel 导入结果并生成执行计划' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'scene'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: EXCEL_FILE_DESCRIPTION,
        },
        scene: {
          type: 'string',
          example: 'supplier-settlement',
        },
        sheetName: {
          type: 'string',
          nullable: true,
        },
        mode: {
          type: 'string',
          enum: ['full', 'chunked'],
          nullable: true,
        },
        chunkSize: {
          type: 'integer',
          nullable: true,
          example: 20,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '返回解析摘要、校验结果和执行计划',
  })
  preview(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    return this.orchestrator.preview({
      file,
      scene: this.parseRequiredText(body.scene, 'scene'),
      sheetName: this.parseOptionalText(body.sheetName),
      mode: this.parseMode(body.mode),
      chunkSize: this.parseNumber(body.chunkSize),
    });
  }

  @Post('execute')
  @UseInterceptors(FileInterceptor('file', buildExcelFileInterceptorOptions()))
  @ApiOperation({ summary: '执行 Excel 导入并调用 runflow' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'scene', 'runflowConfig'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: EXCEL_FILE_DESCRIPTION,
        },
        scene: {
          type: 'string',
          example: 'supplier-settlement',
        },
        sheetName: {
          type: 'string',
          nullable: true,
        },
        mode: {
          type: 'string',
          enum: ['full', 'chunked'],
          nullable: true,
        },
        chunkSize: {
          type: 'integer',
          nullable: true,
          example: 20,
        },
        continueOnError: {
          type: 'string',
          enum: ['true', 'false'],
          nullable: true,
        },
        runflowConfig: {
          type: 'string',
          description: 'runflow 配置 JSON 字符串',
          example:
            '{"flowKey":"am0xuhyt9p6mfcat","action":"sync_input_supplier_settlement_finance","debug":true}',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '返回执行摘要和每批次执行结果',
  })
  execute(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    const runflowConfigText = this.parseRequiredText(
      body.runflowConfig,
      'runflowConfig',
    );

    let runflow: Record<string, any>;
    try {
      runflow = JSON.parse(runflowConfigText);
    } catch {
      throw new BadRequestException('runflowConfig 不是合法 JSON');
    }

    return this.orchestrator.execute({
      file,
      scene: this.parseRequiredText(body.scene, 'scene'),
      sheetName: this.parseOptionalText(body.sheetName),
      mode: this.parseMode(body.mode),
      chunkSize: this.parseNumber(body.chunkSize),
      continueOnError: this.parseBoolean(body.continueOnError) ?? false,
      runflow,
    });
  }

  private parseRequiredText(value: string | undefined, field: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} 不能为空`);
    }

    return normalized;
  }

  private parseOptionalText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private parseMode(value?: string): ExecutionMode | undefined {
    if (!value) {
      return undefined;
    }

    if (value !== 'full' && value !== 'chunked') {
      throw new BadRequestException('mode 仅支持 full 或 chunked');
    }

    return value;
  }

  private parseNumber(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException('chunkSize 必须为正整数');
    }

    return parsed;
  }

  private parseBoolean(value?: string): boolean | undefined {
    if (!value) {
      return undefined;
    }

    if (value !== 'true' && value !== 'false') {
      throw new BadRequestException('continueOnError 仅支持 true 或 false');
    }

    return value === 'true';
  }
}
