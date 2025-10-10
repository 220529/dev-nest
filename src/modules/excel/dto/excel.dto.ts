export class ParseExcelDto {
  mappingType?: string = 'materials';
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
  filterRate?: number;
  jsonPath?: string;
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
