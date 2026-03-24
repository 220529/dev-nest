import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ExecutionMode,
  ExecutionPlan,
  ValidationResult,
} from '../../executor/execution.types';
import { ParsedSheet, ParsedWorkbook } from '../../parser/excel.types';
import { ImportScene } from '../import-scene.interface';
import { SettlementImportData, SettlementImportItem } from './settlement.types';

const ORDER_COLUMN = '订单号';
const SETTLEMENT_COLUMN = '结算单号';
const SETTLEMENT_QUANTITY_COLUMN = '结算数量';

@Injectable()
export class SettlementScene
  implements ImportScene<SettlementImportData, SettlementImportItem>
{
  readonly scene = 'supplier-settlement';

  parse(params: {
    workbook: ParsedWorkbook;
    sheetName?: string;
  }): SettlementImportData {
    const sheet = this.findTargetSheet(params.workbook, params.sheetName);

    if (!sheet.headers.includes(ORDER_COLUMN)) {
      throw new BadRequestException(`未找到列: ${ORDER_COLUMN}`);
    }

    if (!sheet.headers.includes(SETTLEMENT_COLUMN)) {
      throw new BadRequestException(`未找到列: ${SETTLEMENT_COLUMN}`);
    }

    const hasSettlementQuantityColumn = sheet.headers.includes(
      SETTLEMENT_QUANTITY_COLUMN,
    );
    const grouped = new Map<
      string,
      { settlementNos: Set<string>; sourceRowNos: number[] }
    >();
    const settlementNoSet = new Set<string>();
    let validRowCount = 0;

    for (const row of sheet.rows) {
      const orderNo = String(row.values[ORDER_COLUMN] ?? '').trim();
      const settlementNo = String(row.values[SETTLEMENT_COLUMN] ?? '').trim();
      const settlementQuantity = hasSettlementQuantityColumn
        ? this.parseSettlementQuantity(row.values[SETTLEMENT_QUANTITY_COLUMN])
        : null;

      if (!orderNo || !settlementNo) {
        continue;
      }

      if (settlementQuantity !== null && settlementQuantity <= 0) {
        continue;
      }

      validRowCount += 1;
      settlementNoSet.add(settlementNo);

      if (!grouped.has(orderNo)) {
        grouped.set(orderNo, {
          settlementNos: new Set<string>(),
          sourceRowNos: [],
        });
      }

      const target = grouped.get(orderNo)!;
      target.settlementNos.add(settlementNo);
      target.sourceRowNos.push(row.rowNo);
    }

    const items: SettlementImportItem[] = Array.from(grouped.entries()).map(
      ([orderNumber, value]) => ({
        orderNumber,
        settlementNumbers: Array.from(value.settlementNos),
        sourceRowNos: value.sourceRowNos,
      }),
    );

    return {
      summary: {
        orderTotal: items.length,
        settlementTotal: settlementNoSet.size,
        detailRowTotal: validRowCount,
        worksheetName: sheet.sheetName,
      },
      items,
    };
  }

  validate(data: SettlementImportData): ValidationResult {
    const issues: ValidationResult['issues'] = [];

    if (!data.items.length) {
      issues.push({
        code: 'EMPTY_DATA',
        message: '未解析出可执行的数据',
        level: 'error' as const,
      });
    }

    return {
      valid: !issues.some((issue) => issue.level === 'error'),
      issues,
    };
  }

  plan(params: {
    data: SettlementImportData;
    mode: ExecutionMode;
    chunkSize?: number;
  }): ExecutionPlan<SettlementImportItem> {
    const items = params.data.items;

    if (params.mode === 'full') {
      return {
        mode: 'full',
        totalItems: items.length,
        totalBatches: items.length > 0 ? 1 : 0,
        batches:
          items.length > 0
            ? [
                {
                  batchNo: 1,
                  start: 1,
                  end: items.length,
                  items,
                },
              ]
            : [],
      };
    }

    const chunkSize = params.chunkSize ?? 20;
    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new BadRequestException('chunkSize 必须为正整数');
    }

    const batches: ExecutionPlan<SettlementImportItem>['batches'] = [];
    for (let index = 0; index < items.length; index += chunkSize) {
      const batchNo = Math.floor(index / chunkSize) + 1;
      const chunk = items.slice(index, index + chunkSize);
      batches.push({
        batchNo,
        start: index + 1,
        end: index + chunk.length,
        items: chunk,
      });
    }

    return {
      mode: 'chunked',
      totalItems: items.length,
      totalBatches: batches.length,
      batches,
    };
  }

  buildRunflowPayload(params: {
    batch: { items: SettlementImportItem[] };
    runflow: Record<string, any>;
  }): Record<string, any> {
    return {
      ...params.runflow,
      rows: params.batch.items.map((item) => ({
        orderNumber: item.orderNumber,
        settlementNumbers: item.settlementNumbers,
      })),
    };
  }

  private findTargetSheet(
    workbook: ParsedWorkbook,
    sheetName?: string,
  ): ParsedSheet {
    if (!workbook.sheets.length) {
      throw new BadRequestException('Excel 中没有可用工作表');
    }

    if (!sheetName) {
      return workbook.sheets[0];
    }

    const sheet = workbook.sheets.find((item) => item.sheetName === sheetName);
    if (!sheet) {
      throw new BadRequestException(`未找到工作表: ${sheetName}`);
    }

    return sheet;
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
}
