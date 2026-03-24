import { BadRequestException, Injectable } from '@nestjs/common';
import type { Express } from 'express';
import * as fs from 'fs';
import type { ParsedWorkbook } from '../parser/excel.types';
import { ExcelParserService } from '../parser/excel-parser.service';
import { RunflowClientService } from '../runflow/runflow-client.service';
import { SettlementScene } from '../scenes/settlement/settlement.scene';

export interface LegacyForwardParams {
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

export interface LegacyParsedExcelSheet {
  sheetName: string;
  rowCount: number;
  headers: string[];
  previewRows: Record<string, any>[];
  rows?: Record<string, any>[];
}

export interface LegacyParsedExcelResult {
  fileName: string;
  sheetCount: number;
  sheets: LegacyParsedExcelSheet[];
}

export interface LegacyParseExcelOptions {
  sheetName?: string;
  uniqueBy?: string;
  includeRows?: boolean;
  previewLimit?: number;
  rowLimit?: number;
}

export interface LegacyParsedOrderSettlementItem {
  orderNumber: string;
  settlementNumbers: string[];
}

export interface LegacyParsedOrderSettlementSummary {
  orderTotal: number;
  settlementTotal: number;
  detailRowTotal: number;
  worksheetName: string;
}

export interface LegacyParsedOrderSettlementResult {
  summary: LegacyParsedOrderSettlementSummary;
  data: LegacyParsedOrderSettlementItem[];
}

export interface LegacyParsedUniqueColumnResult {
  fileName: string;
  sheetName: string;
  column: string;
  count: number;
  values: string[];
}

export interface LegacySavedSettlementDataFileResult {
  outputPath: string;
  summary: LegacyParsedOrderSettlementSummary;
}

@Injectable()
export class LegacyErpAdapterService {
  constructor(
    private readonly excelParser: ExcelParserService,
    private readonly settlementScene: SettlementScene,
    private readonly runflowClient: RunflowClientService,
  ) {}

  parseExcel(
    file: Express.Multer.File,
    options: LegacyParseExcelOptions = {},
  ):
    | LegacyParsedExcelResult
    | LegacyParsedOrderSettlementResult
    | LegacyParsedUniqueColumnResult {
    this.assertFile(file);

    const workbook = this.excelParser.parse(file);
    const sheets = this.selectSheets(workbook, options.sheetName);

    if (
      !options.uniqueBy &&
      options.includeRows === undefined &&
      options.previewLimit === undefined &&
      options.rowLimit === undefined
    ) {
      return this.buildSettlementData(file, options.sheetName);
    }

    if (options.uniqueBy) {
      return this.extractUniqueColumnValues(
        workbook,
        file.originalname,
        sheets[0].sheetName,
        options.uniqueBy,
      );
    }

    const includeRows = options.includeRows ?? false;
    const previewLimit = options.previewLimit ?? 20;
    const rowLimit = options.rowLimit ?? 500;

    const resultSheets = sheets.map((sheet) => {
      const rows = sheet.rows.map((row) => row.values);
      const limitedRows = includeRows ? rows.slice(0, rowLimit) : undefined;

      return {
        sheetName: sheet.sheetName,
        rowCount: rows.length,
        headers: sheet.headers,
        previewRows: rows.slice(0, previewLimit),
        rows: limitedRows,
      };
    });

    return {
      fileName: file.originalname,
      sheetCount: resultSheets.length,
      sheets: resultSheets,
    };
  }

  buildSettlementData(
    file: Express.Multer.File,
    sheetName?: string,
  ): LegacyParsedOrderSettlementResult {
    this.assertFile(file);

    const workbook = this.excelParser.parse(file);
    const data = this.settlementScene.parse({
      workbook,
      sheetName,
    });

    return {
      summary: data.summary,
      data: data.items.map((item) => ({
        orderNumber: item.orderNumber,
        settlementNumbers: item.settlementNumbers,
      })),
    };
  }

  saveSettlementDataFile(
    file: Express.Multer.File,
    outputPath: string,
    sheetName?: string,
  ): LegacySavedSettlementDataFileResult {
    const resultData = this.buildSettlementData(file, sheetName);
    fs.writeFileSync(
      outputPath,
      this.buildSettlementDataFileContent(resultData),
      'utf8',
    );

    return {
      outputPath,
      summary: resultData.summary,
    };
  }

  async forwardRunFlow(params: LegacyForwardParams): Promise<any> {
    const { _clientMeta, ...forwardParams } = params;

    if (forwardParams.dataPath) {
      const jsData = fs.readFileSync(forwardParams.dataPath, 'utf8');
      return this.runflowClient.invokeOpen({
        hostPre: String(forwardParams.hostPre || ''),
        host: forwardParams.host,
        payload: { ...forwardParams, data: jsData },
      });
    }

    if (forwardParams.hostPre) {
      return this.runflowClient.invokeOpen({
        hostPre: forwardParams.hostPre,
        host: forwardParams.host,
        payload: forwardParams,
      });
    }

    return this.runflowClient.invoke(forwardParams);
  }

  private assertFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传 Excel 文件');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('上传文件内容为空');
    }
  }

  private selectSheets(
    workbook: ParsedWorkbook,
    sheetName?: string,
  ): ParsedWorkbook['sheets'] {
    if (!sheetName) {
      return workbook.sheets;
    }

    const sheets = workbook.sheets.filter(
      (item) => item.sheetName === sheetName,
    );
    if (!sheets.length) {
      throw new BadRequestException(`未找到工作表: ${sheetName}`);
    }

    return sheets;
  }

  private extractUniqueColumnValues(
    workbook: ParsedWorkbook,
    fileName: string,
    sheetName: string,
    columnName: string,
  ): LegacyParsedUniqueColumnResult {
    const sheet = workbook.sheets.find((item) => item.sheetName === sheetName);
    if (!sheet) {
      throw new BadRequestException(`未找到工作表: ${sheetName}`);
    }

    if (!sheet.headers.includes(columnName)) {
      throw new BadRequestException(`未找到列: ${columnName}`);
    }

    const values = [
      ...new Set(
        sheet.rows
          .map((row) => String(row.values[columnName] ?? '').trim())
          .filter(Boolean),
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

  private buildSettlementDataFileContent(
    resultData: LegacyParsedOrderSettlementResult,
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
}
