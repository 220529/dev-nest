export class ParseExcelDto {
  mappingType?: string = 'materials';
  sheetName?: string; // 指定要读取的Sheet名称，不指定则读取第一个
  sheetIndex?: number; // 或者通过索引指定Sheet，从0开始
}

export class RunFlowDto {
  dataPath: string;
  action?: string = 'materials_excel';
  batchSize?: number = 200;
  testMode?: boolean = false;
  testLimit?: number = 1000;
  flowId?: string = 'z244yolix5cg9meb';
}

export interface ExcelParseResult {
  success: boolean;
  data?: any[];
  total?: number;
  originalTotal?: number;
  invalidTotal?: number;
  filterRate?: number;
  jsonPath?: string;
  invalidJsonPath?: string;
  mappingType?: string;
  message: string;
}

export interface BatchProcessResult {
  success: boolean;
  totalCount: number;
  processedCount: number;
  errorCount: number;
  batchCount: number;
  results?: any[];
  message: string;
}
