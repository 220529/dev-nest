import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ImportExecutorService } from '../executor/import-executor.service';
import { ExcelParserService } from '../parser/excel-parser.service';
import { ImportSceneRegistry } from '../registry/import-scene.registry';
import { SettlementScene } from '../scenes/settlement/settlement.scene';
import { ImportOrchestratorService } from './import-orchestrator.service';

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

describe('ImportOrchestratorService', () => {
  const excelParser = new ExcelParserService();
  const settlementScene = new SettlementScene();
  const sceneRegistry = new ImportSceneRegistry(settlementScene);
  const executor = {
    execute: jest.fn(),
  } as unknown as ImportExecutorService;

  const orchestrator = new ImportOrchestratorService(
    excelParser,
    sceneRegistry,
    executor,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preview parsed data and generated plan', () => {
    const file = buildWorkbookFile([
      { 订单号: 'A001', 结算单号: 'JS001', 结算数量: 1 },
      { 订单号: 'A002', 结算单号: 'JS002', 结算数量: 1 },
    ]);

    const result = orchestrator.preview({
      file,
      scene: 'supplier-settlement',
      mode: 'chunked',
      chunkSize: 1,
    });

    expect(result.issues).toBeUndefined();
    expect(result.summary).toEqual({
      orderTotal: 2,
      settlementTotal: 2,
      detailRowTotal: 2,
      worksheetName: 'Sheet1',
      mode: 'chunked',
      totalItems: 2,
      totalBatches: 2,
    });
    expect(result.rows).toEqual([
      {
        orderNumber: 'A001',
        settlementNumbers: ['JS001'],
      },
      {
        orderNumber: 'A002',
        settlementNumbers: ['JS002'],
      },
    ]);
  });

  it('should execute using executor result', async () => {
    executor.execute = jest.fn().mockResolvedValue({
      mode: 'chunked',
      totalItems: 1,
      totalBatches: 1,
      successBatches: 1,
      failedBatches: 0,
      results: [
        {
          batchNo: 1,
          start: 1,
          end: 1,
          success: true,
          durationMs: 10,
          responsePayload: { ok: true },
        },
      ],
    });

    const file = buildWorkbookFile([
      { 订单号: 'A001', 结算单号: 'JS001', 结算数量: 1 },
    ]);

    const result = await orchestrator.execute({
      file,
      scene: 'supplier-settlement',
      mode: 'chunked',
      chunkSize: 20,
      continueOnError: false,
      runflow: {
        action: 'sync_input_supplier_settlement_finance',
      },
    });

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      scene: 'supplier-settlement',
      data: {
        summary: {
          orderTotal: 1,
          settlementTotal: 1,
          detailRowTotal: 1,
          worksheetName: 'Sheet1',
        },
      },
      execution: {
        mode: 'chunked',
        totalItems: 1,
        totalBatches: 1,
        successBatches: 1,
        failedBatches: 0,
        results: [
          {
            batchNo: 1,
            start: 1,
            end: 1,
            success: true,
            durationMs: 10,
            responsePayload: { ok: true },
          },
        ],
      },
    });
  });

  it('should reject invalid runflow config', async () => {
    const file = buildWorkbookFile([
      { 订单号: 'A001', 结算单号: 'JS001', 结算数量: 1 },
    ]);

    await expect(
      orchestrator.execute({
        file,
        scene: 'supplier-settlement',
        runflow: {},
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
