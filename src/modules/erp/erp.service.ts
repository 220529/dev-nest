import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Express } from 'express';
import * as fs from 'fs';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { getErpConfig } from './erp.config';

/**
 * 转发请求的参数模型
 */
export interface ForwardParams {
  dataPath?: string;
  hostPre?: string;
  host?: string;
  _clientMeta?: {
    pageNo?: number;
    totalPages?: number;
    start?: number;
    end?: number;
  };
  [key: string]: any;
}

export interface ParsedExcelSheet {
  sheetName: string;
  rowCount: number;
  headers: string[];
  previewRows: Record<string, any>[];
  rows?: Record<string, any>[];
}

export interface ParsedExcelResult {
  fileName: string;
  sheetCount: number;
  sheets: ParsedExcelSheet[];
}

export interface ParseExcelOptions {
  sheetName?: string;
  uniqueBy?: string;
  includeRows?: boolean;
  previewLimit?: number;
  rowLimit?: number;
}

export interface ParsedOrderSettlementItem {
  orderNumber: string;
  settlementNumbers: string[];
}

export interface ParsedOrderSettlementSummary {
  orderTotal: number;
  settlementTotal: number;
  detailRowTotal: number;
  worksheetName: string;
}

export interface ParsedOrderSettlementResult {
  summary: ParsedOrderSettlementSummary;
  data: ParsedOrderSettlementItem[];
}

export interface ParsedUniqueColumnResult {
  fileName: string;
  sheetName: string;
  column: string;
  count: number;
  values: string[];
}

export interface SavedSettlementDataFileResult {
  outputPath: string;
  summary: ParsedOrderSettlementSummary;
}

const SETTLEMENT_QUANTITY_COLUMN = '结算数量';
const DEFAULT_SETTLEMENT_DATA_OUTPUT_PATH =
  '/Users/kaixin/erp/t1/t1-code/prodSrc/codeFlow/test/测试数据.js';

@Injectable()
export class ErpService {
  private readonly logger = new Logger(ErpService.name);

  constructor(private readonly httpService: HttpService) {}

  parseExcel(
    file: Express.Multer.File,
    options: ParseExcelOptions = {},
  ):
    | ParsedExcelResult
    | ParsedOrderSettlementResult
    | ParsedUniqueColumnResult
    | ParsedOrderSettlementItem[] {
    if (!file) {
      throw new BadRequestException('请上传 Excel 文件');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('上传文件内容为空');
    }

    try {
      this.logger.log(`开始解析 Excel: ${file.originalname}`);
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetNames = options.sheetName
        ? workbook.SheetNames.filter(
            (sheetName) => sheetName === options.sheetName,
          )
        : workbook.SheetNames;

      if (options.sheetName && sheetNames.length === 0) {
        throw new BadRequestException(`未找到工作表: ${options.sheetName}`);
      }

      if (
        !options.uniqueBy &&
        options.includeRows === undefined &&
        options.previewLimit === undefined &&
        options.rowLimit === undefined
      ) {
        const result = this.extractOrderSettlementGroups(workbook, sheetNames[0]);
        this.logger.log(
          `Excel 解析完成: ${file.originalname}, 订单 ${result.summary.orderTotal}, 结算单 ${result.summary.settlementTotal}`,
        );
        return result;
      }

      if (options.uniqueBy) {
        return this.extractUniqueColumnValues(
          workbook,
          file.originalname,
          sheetNames[0],
          options.uniqueBy,
        );
      }

      const includeRows = options.includeRows ?? false;
      const previewLimit = options.previewLimit ?? 20;
      const rowLimit = options.rowLimit ?? 500;

      const sheets = sheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
          defval: '',
        });
        const headers = this.extractHeaders(sheet);
        const limitedRows = includeRows ? rows.slice(0, rowLimit) : undefined;

        return {
          sheetName,
          rowCount: rows.length,
          headers,
          previewRows: rows.slice(0, previewLimit),
          rows: limitedRows,
        };
      });

      const result = {
        fileName: file.originalname,
        sheetCount: sheets.length,
        sheets,
      };
      this.logger.log(
        `Excel 解析完成: ${file.originalname}, 工作表 ${result.sheetCount}`,
      );
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
    if (!file) {
      throw new BadRequestException('请上传 Excel 文件');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('上传文件内容为空');
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const targetSheetName = sheetName?.trim() || workbook.SheetNames[0];

      if (!workbook.SheetNames.includes(targetSheetName)) {
        throw new BadRequestException(`未找到工作表: ${targetSheetName}`);
      }

      return this.extractOrderSettlementGroups(workbook, targetSheetName);
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
    const resultData = this.buildSettlementData(file, sheetName);
    const content = this.buildSettlementDataFileContent(resultData);

    fs.writeFileSync(outputPath, content, 'utf8');

    return {
      outputPath,
      summary: resultData.summary,
    };
  }

  getDefaultSettlementDataOutputPath(): string {
    return DEFAULT_SETTLEMENT_DATA_OUTPUT_PATH;
  }

  private extractOrderSettlementGroups(
    workbook: XLSX.WorkBook,
    sheetName: string,
  ): ParsedOrderSettlementResult {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
    });
    const headers = this.extractHeaders(sheet);
    const orderColumn = '订单号';
    const settlementColumn = '结算单号';
    const hasSettlementQuantityColumn = headers.includes(
      SETTLEMENT_QUANTITY_COLUMN,
    );

    if (!headers.includes(orderColumn)) {
      throw new BadRequestException(`未找到列: ${orderColumn}`);
    }

    if (!headers.includes(settlementColumn)) {
      throw new BadRequestException(`未找到列: ${settlementColumn}`);
    }

    const grouped = new Map<string, Set<string>>();
    const settlementNos = new Set<string>();
    let validRowCount = 0;

    for (const row of rows) {
      const orderNo = String(row[orderColumn] ?? '').trim();
      const jsNo = String(row[settlementColumn] ?? '').trim();
      const settlementQuantity = hasSettlementQuantityColumn
        ? this.parseSettlementQuantity(row[SETTLEMENT_QUANTITY_COLUMN])
        : null;

      if (!orderNo || !jsNo) {
        continue;
      }

      if (settlementQuantity !== null && settlementQuantity <= 0) {
        continue;
      }

      validRowCount += 1;
      settlementNos.add(jsNo);

      if (!grouped.has(orderNo)) {
        grouped.set(orderNo, new Set<string>());
      }

      grouped.get(orderNo)?.add(jsNo);
    }

    const data = Array.from(grouped.entries()).map(([orderNo, jsNoSet]) => ({
      orderNumber: orderNo,
      settlementNumbers: Array.from(jsNoSet),
    }));

    return {
      summary: {
        orderTotal: grouped.size,
        settlementTotal: settlementNos.size,
        detailRowTotal: validRowCount,
        worksheetName: sheetName,
      },
      data,
    };
  }

  private parseSettlementQuantity(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const normalized = String(value).replace(/,/g, '').trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private buildSettlementDataFileContent(
    resultData: ParsedOrderSettlementResult,
  ): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const updateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    return [
      '/**',
      ' * @flowId 937',
      ' * @flowKey yd1rrlmgndkghbb9',
      ' * @flowName 测试数据',
      ' * @flowNodeName 测试数据',
      ' * @flowNodeType funEditNode',
      ' * @flowNodeId 1',
      ` * @updateTime ${updateTime}`,
      ' */',
      '',
      '// @ts-ignore',
      `const resultData = ${JSON.stringify(resultData, null, 2)};`,
      '',
      'return resultData;',
      '',
    ].join('\n');
  }

  private extractUniqueColumnValues(
    workbook: XLSX.WorkBook,
    fileName: string,
    sheetName: string,
    columnName: string,
  ): ParsedUniqueColumnResult {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
    });
    const headers = this.extractHeaders(sheet);

    if (!headers.includes(columnName)) {
      throw new BadRequestException(`未找到列: ${columnName}`);
    }

    const values = [
      ...new Set(
        rows.map((row) => String(row[columnName] ?? '').trim()).filter(Boolean),
      ),
    ];

    return {
      fileName,
      sheetName,
      column: columnName,
      count: values.length,
      values,
    };
  }

  private extractHeaders(sheet: XLSX.WorkSheet): string[] {
    const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');
    const headers: string[] = [];

    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: column });
      const cellValue = sheet[cellAddress]?.v;

      headers.push(
        cellValue === undefined || cellValue === null ? '' : String(cellValue),
      );
    }

    return headers;
  }

  /**
   * 调用ERP runFlow接口
   */
  private async callRunFlow(params: any): Promise<any> {
    const erpConfig = getErpConfig();
    const apiUrl = erpConfig.baseUrl + erpConfig.runFlowPath;

    const response = await firstValueFrom(
      this.httpService.post(apiUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: erpConfig.authorization,
          'app-version': erpConfig.appVersion,
          Accept: '*/*',
          Connection: 'keep-alive',
        },
        timeout: erpConfig.timeout,
      }),
    );

    return response.data;
  }

  /**
   * 调用开放接口
   */
  private async callOpenRunFlow(params: any): Promise<any> {
    const erpConfig = getErpConfig();
    const apiUrl = params.hostPre + erpConfig.openRunFlowPath;

    const response = await firstValueFrom(
      this.httpService.post(apiUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          Host: params.host,
          Connection: 'keep-alive',
        },
        timeout: 30000,
      }),
    );

    return response.data;
  }

  /**
   * 转发服务 - 处理runFlow请求转发
   */
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

      // 如果有dataPath，从文件读取数据
      if (forwardParams.dataPath) {
        const fs = require('fs');
        const jsData = fs.readFileSync(forwardParams.dataPath, 'utf8');
        const data = { ...forwardParams, data: jsData };

        const result = await this.callOpenRunFlow(data);
        this.logger.log('runFlow 调用完成');
        return result;
      }

      // 如果有hostPre，使用开放接口
      if (forwardParams.hostPre) {
        const result = await this.callOpenRunFlow(forwardParams);
        this.logger.log('runFlow 调用完成');
        return result;
      }

      // 否则直接调用内部runFlow接口
      const result = await this.callRunFlow(forwardParams);
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
