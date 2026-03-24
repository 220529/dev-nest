export interface ParsedSheetRow {
  rowNo: number;
  values: Record<string, unknown>;
}

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: ParsedSheetRow[];
}

export interface ParsedWorkbook {
  fileName: string;
  sheets: ParsedSheet[];
}
