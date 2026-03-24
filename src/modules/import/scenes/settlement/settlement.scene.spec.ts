import * as XLSX from 'xlsx';
import { BadRequestException } from '@nestjs/common';
import { ExcelParserService } from '../../parser/excel-parser.service';
import { SettlementScene } from './settlement.scene';

function buildWorkbookFile(
  rows: Record<string, unknown>[],
  sheetName = 'Sheet1',
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return {
    originalname: 'test.xlsx',
    buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  } as Express.Multer.File;
}

describe('SettlementScene', () => {
  const excelParser = new ExcelParserService();
  const scene = new SettlementScene();

  it('should group settlement rows by order number and filter non-positive quantities', () => {
    const file = buildWorkbookFile([
      { 订单号: 'A001', 结算单号: 'JS001', 结算数量: 2 },
      { 订单号: 'A001', 结算单号: 'JS002', 结算数量: 1 },
      { 订单号: 'A001', 结算单号: 'JS002', 结算数量: 1 },
      { 订单号: 'A002', 结算单号: 'JS003', 结算数量: 0 },
      { 订单号: 'A003', 结算单号: 'JS004', 结算数量: 5 },
    ]);

    const workbook = excelParser.parse(file);
    const result = scene.parse({ workbook });

    expect(result.summary).toEqual({
      orderTotal: 2,
      settlementTotal: 3,
      detailRowTotal: 4,
      worksheetName: 'Sheet1',
    });
    expect(result.items).toEqual([
      {
        orderNumber: 'A001',
        settlementNumbers: ['JS001', 'JS002'],
        sourceRowNos: [2, 3, 4],
      },
      {
        orderNumber: 'A003',
        settlementNumbers: ['JS004'],
        sourceRowNos: [6],
      },
    ]);
  });

  it('should build chunked execution plan', () => {
    const plan = scene.plan({
      data: {
        summary: {
          orderTotal: 3,
          settlementTotal: 3,
          detailRowTotal: 3,
          worksheetName: 'Sheet1',
        },
        items: [
          {
            orderNumber: 'A001',
            settlementNumbers: ['JS001'],
            sourceRowNos: [2],
          },
          {
            orderNumber: 'A002',
            settlementNumbers: ['JS002'],
            sourceRowNos: [3],
          },
          {
            orderNumber: 'A003',
            settlementNumbers: ['JS003'],
            sourceRowNos: [4],
          },
        ],
      },
      mode: 'chunked',
      chunkSize: 2,
    });

    expect(plan).toEqual({
      mode: 'chunked',
      totalItems: 3,
      totalBatches: 2,
      batches: [
        {
          batchNo: 1,
          start: 1,
          end: 2,
          items: [
            {
              orderNumber: 'A001',
              settlementNumbers: ['JS001'],
              sourceRowNos: [2],
            },
            {
              orderNumber: 'A002',
              settlementNumbers: ['JS002'],
              sourceRowNos: [3],
            },
          ],
        },
        {
          batchNo: 2,
          start: 3,
          end: 3,
          items: [
            {
              orderNumber: 'A003',
              settlementNumbers: ['JS003'],
              sourceRowNos: [4],
            },
          ],
        },
      ],
    });
  });

  it('should throw when required columns are missing', () => {
    const file = buildWorkbookFile([{ foo: 'bar' }]);
    const workbook = excelParser.parse(file);

    expect(() => scene.parse({ workbook })).toThrow(BadRequestException);
  });
});
