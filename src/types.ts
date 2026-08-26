export type RawCell = string | number | boolean | Date | null | undefined;
export type RawRow = Record<string, RawCell>;

export interface QsaRow {
  sourceRow: number;
  raw: RawRow;
  receivedDate: Date | null;
  year: number | null;
  month: number | null;
  ticketNo: string;
  referenceNo: string;
  status: string;
  project: string;
  organization: string;
  storeId: string;
  subject: string;
  channel: string;
  issueType: string;
  issueSubType: string;
  assignedGroup: string;
  waitingUpdate: string;
  resolutionDetail: string;
  resolutionType: string;
  resolutionSubType: string;
  warrantyClass: 'Warranty ปีที่ 1' | 'Warranty ปีที่ 2' | 'Warranty ปีที่ 3' | 'Out Warranty' | '';
  warrantyOverall: 'Warranty' | 'Out Warranty' | '';
  supportYear: number | null;
  supportMonth: number | null;
  serviceDeskTeam: string;
  deviceStatus: string;
  deviceAction: string;
  waitingCategory: string;
}

export interface WorkbookData {
  fileName: string;
  sheetName: string;
  rows: QsaRow[];
  headers: string[];
  period: { year: number; month: number };
  warnings: string[];
}

export interface CountItem {
  name: string;
  value: number;
}

export interface MonthlyPoint {
  year: number;
  month: number;
  label: string;
  total: number;
  received: number;
  abandon: number;
  resolved: number;
  pending: number;
}
