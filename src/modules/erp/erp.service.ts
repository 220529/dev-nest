import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { Express } from 'express';
import {
  LegacyErpAdapterService,
  type LegacyForwardParams as ForwardParams,
  type LegacyParseExcelOptions as ParseExcelOptions,
  type LegacyParsedExcelResult as ParsedExcelResult,
  type LegacyParsedOrderSettlementItem as ParsedOrderSettlementItem,
  type LegacyParsedOrderSettlementResult as ParsedOrderSettlementResult,
  type LegacyParsedOrderSettlementSummary as ParsedOrderSettlementSummary,
  type LegacyParsedUniqueColumnResult as ParsedUniqueColumnResult,
  type LegacySavedSettlementDataFileResult as SavedSettlementDataFileResult,
} from '@/modules/import/compat/legacy-erp-adapter.service';

const DEFAULT_SETTLEMENT_DATA_OUTPUT_PATH =
  '/Users/kaixin/erp/t1/t1-code/prodSrc/codeFlow/test/测试数据.js';

@Injectable()
export class ErpService {
  private readonly logger = new Logger(ErpService.name);

  constructor(private readonly legacyErpAdapter: LegacyErpAdapterService) {}

  parseExcel(
    file: Express.Multer.File,
    options: ParseExcelOptions = {},
  ):
    | ParsedExcelResult
    | ParsedOrderSettlementResult
    | ParsedUniqueColumnResult
    | ParsedOrderSettlementItem[] {
    try {
      this.logger.log(`开始解析 Excel: ${file?.originalname ?? '-'}`);
      const result = this.legacyErpAdapter.parseExcel(file, options);
      this.logger.log('Excel 解析完成');
      return result;
    } catch (error) {
      this.logger.error(`Excel 解析失败: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Excel 文件解析失败，请确认文件格式正确');
    }
  }

  buildSettlementData(
    file: Express.Multer.File,
    sheetName?: string,
  ): ParsedOrderSettlementResult {
    try {
      return this.legacyErpAdapter.buildSettlementData(file, sheetName);
    } catch (error) {
      this.logger.error(`Excel 解析失败: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Excel 文件解析失败，请确认文件格式正确');
    }
  }

  saveSettlementDataFile(
    file: Express.Multer.File,
    outputPath = DEFAULT_SETTLEMENT_DATA_OUTPUT_PATH,
    sheetName?: string,
  ): SavedSettlementDataFileResult {
    return this.legacyErpAdapter.saveSettlementDataFile(
      file,
      outputPath,
      sheetName,
    );
  }

  getDefaultSettlementDataOutputPath(): string {
    return DEFAULT_SETTLEMENT_DATA_OUTPUT_PATH;
  }

  async forwardRunFlow(params: ForwardParams): Promise<any> {
    try {
      const { _clientMeta, ...forwardParams } = params;
      const rowCount = Array.isArray(forwardParams.rows)
        ? forwardParams.rows.length
        : Array.isArray(forwardParams.data)
          ? forwardParams.data.length
          : 0;
      const pageLog =
        _clientMeta?.pageNo && _clientMeta?.totalPages
          ? `, page=${_clientMeta.pageNo}/${_clientMeta.totalPages}, range=${_clientMeta.start || 0}-${_clientMeta.end || 0}`
          : '';
      this.logger.log(
        `开始调用 runFlow: action=${String(forwardParams.action || '') || '-'}, rows=${rowCount}${pageLog}`,
      );

      const result = await this.legacyErpAdapter.forwardRunFlow(params);
      this.logger.log('runFlow 调用完成');
      return result;
    } catch (error) {
      this.logger.error('转发请求失败:', error.message);

      if (error.code === 'ENOENT') {
        return { error: 'Data file not found' };
      }

      if (error.response) {
        return {
          error: 'Target API error',
          statusCode: error.response.status,
          message: error.response.data,
        };
      }

      return { error: 'Failed to fetch data: ' + error.message };
    }
  }
}

export type {
  ForwardParams,
  ParseExcelOptions,
  ParsedExcelResult,
  ParsedOrderSettlementItem,
  ParsedOrderSettlementResult,
  ParsedOrderSettlementSummary,
  ParsedUniqueColumnResult,
  SavedSettlementDataFileResult,
};
