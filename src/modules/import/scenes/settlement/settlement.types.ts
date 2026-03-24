export interface SettlementImportItem {
  orderNumber: string;
  settlementNumbers: string[];
  sourceRowNos: number[];
}

export interface SettlementImportSummary {
  orderTotal: number;
  settlementTotal: number;
  detailRowTotal: number;
  worksheetName: string;
}

export interface SettlementImportData {
  summary: SettlementImportSummary;
  items: SettlementImportItem[];
}
