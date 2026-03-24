import {
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
import { ErpService, type ParseExcelOptions } from './erp.service';

@ApiTags('ERP')
@Controller('api')
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  /**
   * 转发服务 - runFlow接口
   * 兼容原有的转发逻辑
   */
  @Post('runFlow')
  @ApiOperation({ summary: 'ERP转发服务 - runFlow' })
  async runFlow(@Body() body: any) {
    return this.erpService.forwardRunFlow(body);
  }

  @Post('excel/parse')
  @UseInterceptors(FileInterceptor('file', buildExcelFileInterceptorOptions()))
  @ApiOperation({ summary: '上传并解析 Excel 文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: EXCEL_FILE_DESCRIPTION,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '解析成功；返回按订单号分组的全部结算单号及汇总信息',
  })
  async parseExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    const options: ParseExcelOptions = {
      sheetName: this.parseOptionalText(body.sheetName),
      uniqueBy: this.parseOptionalText(body.uniqueBy),
      includeRows: this.parseBoolean(body.includeRows),
      previewLimit: this.parseNumber(body.previewLimit),
      rowLimit: this.parseNumber(body.rowLimit),
    };

    return this.erpService.parseExcel(file, options);
  }

  @Post('excel/save-settlement-data')
  @UseInterceptors(FileInterceptor('file', buildExcelFileInterceptorOptions()))
  @ApiOperation({ summary: '上传 Excel 并写入结算测试数据文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: EXCEL_FILE_DESCRIPTION,
        },
        outputPath: {
          type: 'string',
          description: '可选，输出文件路径',
          nullable: true,
        },
        sheetName: {
          type: 'string',
          description: '可选，指定工作表名称',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '写入成功；返回输出路径和汇总信息',
  })
  async saveSettlementData(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    const outputPath =
      this.parseOptionalText(body.outputPath) ??
      this.erpService.getDefaultSettlementDataOutputPath();
    const sheetName = this.parseOptionalText(body.sheetName);

    return this.erpService.saveSettlementDataFile(file, outputPath, sheetName);
  }

  private parseBoolean(value?: string): boolean | undefined {
    if (value === undefined || value === '' || value === 'string') {
      return undefined;
    }

    if (value !== 'true' && value !== 'false') {
      return undefined;
    }

    return value === 'true';
  }

  private parseOptionalText(value?: string): string | undefined {
    const normalized = value?.trim();
    if (!normalized || normalized === 'string') {
      return undefined;
    }

    return normalized;
  }

  private parseNumber(value: string | undefined): number | undefined {
    if (!value || value === 'string') {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }

    return parsed;
  }
}
