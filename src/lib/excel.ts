import * as XLSX from 'xlsx';
import type { RawCell, RawRow, WorkbookData, QsaRow } from '../types';

const CORE_HEADERS = ['วันที่แจ้งซ่อม', 'หมายเลขแจ้งงาน', 'สถานะงาน', 'ชื่อองค์กร', 'ประเภทการแจ้ง'];

const clean = (value: RawCell): string => value == null ? '' : String(value).trim();

function normalizeHeader(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function field(row: RawRow, ...names: string[]): RawCell {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') return row[name];
    const normalized = normalizeHeader(name);
    const key = Object.keys(row).find((k) => normalizeHeader(k) === normalized);
    if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return null;
}

function excelSerialToDate(value: number): Date | null {
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed) return null;
  return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, Math.floor(parsed.S || 0));
}

export function toDate(value: RawCell): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number' && value > 1) return excelSerialToDate(value);
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  const iso = new Date(text);
  if (!Number.isNaN(iso.getTime()) && /[A-Za-z]|\d{4}-\d{1,2}-\d{1,2}/.test(text)) return iso;

  const m = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (m) {
    let y = Number(m[3]);
    if (y > 2400) y -= 543;
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    const d = new Date(y, Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function numeric(value: RawCell): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(clean(value));
  return Number.isFinite(n) ? n : null;
}

function deriveWarranty(row: RawRow, received: Date | null): QsaRow['warrantyClass'] {
  const existing = clean(field(row, 'Warranty ', 'Warranty'));
  if (existing === 'Warranty ปีที่ 1' || existing === 'Warranty ปีที่ 2' || existing === 'Warranty ปีที่ 3' || existing === 'Out Warranty') {
    return existing;
  }
  if (!received) return '';

  const expiry1 = toDate(field(row, 'Organizations วันหมดประกันปีที่ 1'));
  const expiry2 = toDate(field(row, 'Organizations วันหมดประกันปีที่ 2'));
  const expiry3 = toDate(field(row, 'Organizations วันหมดประกันปีที่ 3'));
  const t = received.getTime();
  if (expiry1 && t <= expiry1.getTime()) return 'Warranty ปีที่ 1';
  if (expiry2 && t <= expiry2.getTime()) return 'Warranty ปีที่ 2';
  if (expiry3 && t <= expiry3.getTime()) return 'Warranty ปีที่ 3';
  if (expiry1 || expiry2 || expiry3) return 'Out Warranty';
  return '';
}

function inferDeviceStatus(row: RawRow, warrantyClass: QsaRow['warrantyClass']): string {
  const existing = clean(field(row, 'อุปกรณ์เสีย/ไม่เสีย'));
  if (existing) return existing === 'NO' ? 'No' : existing;

  const subtype = clean(field(row, 'ประเภทการแก้ไขย่อย'));
  if (/vendor\s*อื่น/i.test(subtype)) return 'อุปกรณ์ Vendor อื่น';
  if (!warrantyClass.startsWith('Warranty')) return '';

  const detail = clean(field(row, 'รายละเอียดการแก้ไข'));
  if (!detail) return '';
  if (/เคลม|รับ.*กลับซ่อม|ส่ง.*ซ่อม|ชำรุด|เปลี่ยน(?!หัว\s*RJ45)/i.test(detail)) return 'อุปกรณ์เสีย';
  return 'No';
}

export function inferWaitingCategory(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return 'ยังไม่ระบุ';
  const first = t.split(/\n|\r/).map((x) => x.trim()).find(Boolean) ?? t;
  const hay = `${first} ${t.slice(0, 500)}`.toLowerCase();

  if (/เคลม|เปลี่ยนสินค้าตัวใหม่|เปลี่ยน.*ตัวใหม่/.test(hay)) return 'อยู่ระหว่างเปลี่ยนสินค้าตัวใหม่';
  if (/(ส่ง|ได้รับ).*po.*อนุมัติ.*ซ่อม|po.*อนุมัติ.*ซ่อม.*แล้ว/.test(hay)) return 'อยู่ระหว่างซ่อม';
  if (/po/.test(hay) && /(สั่งซื้อ|ซื้อใหม่|เสนอขายอุปกรณ์ใหม่|สั่ง.*ใหม่)/.test(hay)) return 'รอ PO อนุมัติสั่งซื้อใหม่';
  if (/po/.test(hay) && /(ซ่อม|repair)/.test(hay)) return 'รอ PO อนุมัติซ่อม';
  if (/(อยู่ระหว่างซ่อม|อยู่ระหว่าง repair|รอ repair|ส่งซ่อม)/.test(hay)) return 'อยู่ระหว่างซ่อม';
  if (/(รอฝ่ายบริการเสนอราคา|ตรวจเช็คอาการ|ตรวจสอบอาการ|stock ส่งใบเสนอราคา)/.test(hay)) return 'รอฝ่ายบริการเสนอราคา';
  if (/(key acc|key account)/.test(hay) && /(เสนอราคา|รอ.*ราคา)/.test(hay)) return 'รอ Key Account ดำเนินการ';
  return 'อื่น ๆ / ตรวจสอบเพิ่มเติม';
}

function serviceDeskTeam(row: RawRow): string {
  const existing = clean(field(row, '3', 'ServiceDesk Team'));
  if (existing) return existing;
  const storeId = clean(field(row, 'ID', 'StoreID'));
  // The supplied workbook maps current stores to TCC; store 3258 has one historical Ditto override.
  return storeId === '3258' ? 'Ditto' : 'TCC';
}

function enrich(row: RawRow, index: number): QsaRow {
  const receivedDate = toDate(field(row, 'วันที่แจ้งซ่อม', 'วันที่แจ้ง Cases'));
  const year = numeric(field(row, 'Year')) ?? receivedDate?.getFullYear() ?? null;
  const month = numeric(field(row, 'MM')) ?? (receivedDate ? receivedDate.getMonth() + 1 : null);
  const warrantyClass = deriveWarranty(row, receivedDate);
  const supportStart = toDate(field(row, 'Organizations Helpdesk Start Support (KFC)'));
  const waitingUpdate = clean(field(row, 'อัพเดทการ Waiting'));
  const warrantyOverall = warrantyClass ? (warrantyClass === 'Out Warranty' ? 'Out Warranty' : 'Warranty') : '';

  return {
    sourceRow: index + 2,
    raw: row,
    receivedDate,
    year,
    month,
    ticketNo: clean(field(row, 'หมายเลขแจ้งงาน')),
    referenceNo: clean(field(row, 'หมายเลขงานอ้างอิง')),
    status: clean(field(row, 'สถานะงาน')),
    project: clean(field(row, 'โครงการ')),
    organization: clean(field(row, 'ชื่อองค์กร')),
    storeId: clean(field(row, 'ID')),
    subject: clean(field(row, 'หัวข้อปัญหา')),
    channel: clean(field(row, 'ช่องทางรับแจ้ง')),
    issueType: clean(field(row, 'ประเภทการแจ้ง')),
    issueSubType: clean(field(row, 'ประเภทการแจ้ง (ย่อย)')),
    assignedGroup: clean(field(row, 'กลุ่มที่รับมอบหมาย')),
    waitingUpdate,
    resolutionDetail: clean(field(row, 'รายละเอียดการแก้ไข')),
    resolutionType: clean(field(row, 'ประเภทการแก้ไข')),
    resolutionSubType: clean(field(row, 'ประเภทการแก้ไขย่อย')),
    warrantyClass,
    warrantyOverall,
    supportYear: numeric(field(row, 'Year Support')) ?? supportStart?.getFullYear() ?? null,
    supportMonth: numeric(field(row, 'Month Support')) ?? (supportStart ? supportStart.getMonth() + 1 : null),
    serviceDeskTeam: serviceDeskTeam(row),
    deviceStatus: inferDeviceStatus(row, warrantyClass),
    deviceAction: clean(field(row, 'การแก้ไข (เสีย/ไม่เสีย)')) || clean(field(row, 'รายละเอียดการแก้ไข')),
    waitingCategory: inferWaitingCategory(waitingUpdate),
  };
}

function detectPeriod(rows: QsaRow[]): { year: number; month: number } {
  const dated = rows.filter((r) => r.year && r.month).sort((a, b) => (a.year! * 12 + a.month!) - (b.year! * 12 + b.month!));
  const latest = dated[dated.length - 1];
  if (!latest) throw new Error('ไม่พบวันที่แจ้งซ่อมที่อ่านได้ในไฟล์');
  return { year: latest.year!, month: latest.month! };
}

export async function parseQsaWorkbook(file: File): Promise<WorkbookData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, dense: false });
  const sheetName = workbook.SheetNames.includes('Worksheet') ? 'Worksheet' : workbook.SheetNames[0];
  if (!sheetName) throw new Error('ไฟล์ไม่มี Worksheet');
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: null, raw: true });
  if (!rawRows.length) throw new Error('Worksheet ไม่มีข้อมูล');

  const headers = Object.keys(rawRows[0]).map(normalizeHeader);
  const missing = CORE_HEADERS.filter((h) => !headers.some((x) => x === normalizeHeader(h)));
  if (missing.length) throw new Error(`คอลัมน์หลักไม่ครบ: ${missing.join(', ')}`);

  const rows = rawRows
    .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [normalizeHeader(k), v])) as RawRow)
    .filter((r) => clean(field(r, 'หมายเลขแจ้งงาน')) || field(r, 'วันที่แจ้งซ่อม'))
    .map(enrich);

  const warnings: string[] = [];
  if (!headers.includes('Warranty')) warnings.push('ไม่พบคอลัมน์ Warranty ที่คำนวณไว้เดิม — ระบบคำนวณ Warranty ปี 1/2/3 จากวันหมดประกันให้ใหม่');
  if (!headers.includes('อุปกรณ์เสีย/ไม่เสีย')) warnings.push('ไม่พบคอลัมน์ “อุปกรณ์เสีย/ไม่เสีย” — ระบบใช้ rule จากรายละเอียดการแก้ไขสำหรับเคส Warranty');
  if (!headers.includes('3')) warnings.push('ไม่พบคอลัมน์ ServiceDesk Team — ใช้ mapping TCC/Ditto ที่ฝังจากไฟล์ตัวอย่าง');

  return { fileName: file.name, sheetName, rows, headers, period: detectPeriod(rows), warnings };
}
