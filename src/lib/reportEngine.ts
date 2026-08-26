import type { CountItem, MonthlyPoint, QsaRow, WorkbookData } from '../types';

export const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const ENG_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(year: number, month: number): string {
  return `${ENG_MONTHS[month - 1]}-${String(year).slice(-2)}`;
}

export function reportTitleMonth(year: number, month: number): string {
  return `${ENG_MONTHS[month - 1]}-${year}`;
}

export function samePeriod(row: QsaRow, year: number, month: number): boolean {
  return row.year === year && row.month === month;
}

export function periodRows(rows: QsaRow[], year: number, month: number): QsaRow[] {
  return rows.filter((r) => samePeriod(r, year, month));
}

export function driveThru(rows: QsaRow[]): QsaRow[] {
  return rows.filter((r) => r.issueType === 'Drive thru');
}

export function groupCount(rows: QsaRow[], key: (row: QsaRow) => string): CountItem[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = key(row) || '(Blank)';
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function lastNPeriods(year: number, month: number, n: number): Array<{ year: number; month: number; label: string }> {
  const out = [];
  let y = year;
  let m = month;
  for (let i = 0; i < n; i += 1) {
    out.push({ year: y, month: m, label: monthLabel(y, m) });
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
  }
  return out.reverse();
}

export function timeline(rows: QsaRow[], year: number, month: number): MonthlyPoint[] {
  const startYear = year - 1;
  const points: MonthlyPoint[] = [];
  for (let y = startYear; y <= year; y += 1) {
    const maxMonth = y === year ? month : 12;
    for (let m = 1; m <= maxMonth; m += 1) {
      const rs = periodRows(rows, y, m);
      const resolved = rs.filter((r) => r.status === 'Resolved').length;
      const pending = rs.filter((r) => r.status && r.status !== 'Resolved').length;
      points.push({
        year: y,
        month: m,
        label: monthLabel(y, m),
        total: rs.length,
        received: rs.length,
        abandon: 0,
        resolved,
        pending,
      });
    }
  }
  return points;
}

export function currentMonth(data: WorkbookData): QsaRow[] {
  return periodRows(data.rows, data.period.year, data.period.month);
}

export function warrantyBreakdown(data: WorkbookData): CountItem[] {
  const order = ['Warranty ปีที่ 1', 'Warranty ปีที่ 2', 'Warranty ปีที่ 3', 'Out Warranty'];
  const counts = new Map(groupCount(currentMonth(data), (r) => r.warrantyClass).map((x) => [x.name, x.value]));
  return order.map((name) => ({ name, value: counts.get(name) ?? 0 }));
}

export function categoryTrend(data: WorkbookData, n = 3): { categories: string[]; rows: Array<Record<string, string | number>> } {
  const periods = lastNPeriods(data.period.year, data.period.month, n);
  const base = driveThru(data.rows);
  const current = periodRows(base, data.period.year, data.period.month);
  const top = groupCount(current, (r) => r.issueSubType).slice(0, 7).map((x) => x.name);
  const rows = periods.map((p) => {
    const counts = new Map(groupCount(periodRows(base, p.year, p.month), (r) => r.issueSubType).map((x) => [x.name, x.value]));
    const row: Record<string, string | number> = { period: p.label };
    for (const c of top) row[c] = counts.get(c) ?? 0;
    return row;
  });
  return { categories: top, rows };
}

export function topCategoryTable(data: WorkbookData) {
  const periods = lastNPeriods(data.period.year, data.period.month, 3);
  const base = driveThru(data.rows);
  const now = periodRows(base, data.period.year, data.period.month);
  const top = groupCount(now, (r) => r.issueSubType).slice(0, 5);
  return top.map((item) => {
    const values = periods.map((p) => periodRows(base, p.year, p.month).filter((r) => r.issueSubType === item.name).length);
    return {
      category: item.name,
      previous2: values[0] ?? 0,
      previous: values[1] ?? 0,
      current: values[2] ?? 0,
      delta: (values[2] ?? 0) - (values[1] ?? 0),
      total3m: values.reduce((a, b) => a + b, 0),
    };
  });
}

export function yearComparison(data: WorkbookData) {
  const { year, month } = data.period;
  const base = driveThru(data.rows);
  const previous = base.filter((r) => r.year === year - 1);
  const current = base.filter((r) => r.year === year && (r.month ?? 99) <= month);
  const allCategories = new Set([...previous.map((r) => r.issueSubType), ...current.map((r) => r.issueSubType)].filter(Boolean));
  const rows = [...allCategories].map((category) => {
    const prev = previous.filter((r) => r.issueSubType === category).length;
    const curr = current.filter((r) => r.issueSubType === category).length;
    return {
      category,
      previous: prev,
      previousPct: previous.length ? prev / previous.length : 0,
      current: curr,
      currentPct: current.length ? curr / current.length : 0,
    };
  }).sort((a, b) => b.current - a.current || b.previous - a.previous).slice(0, 10);
  return { previousTotal: previous.length, currentTotal: current.length, rows };
}

export function topStores(data: WorkbookData) {
  const rows = driveThru(currentMonth(data));
  const stores = groupCount(rows, (r) => r.organization).slice(0, 5);
  return stores.map((store) => ({
    store: store.name,
    total: store.value,
    categories: groupCount(rows.filter((r) => r.organization === store.name), (r) => r.resolutionSubType),
  }));
}

export function pendingRows(data: WorkbookData): QsaRow[] {
  return data.rows.filter((r) => r.status && r.status !== 'Resolved' && ['Drive thru', 'All POS'].includes(r.issueType));
}

export function pendingSummary(data: WorkbookData) {
  const rows = pendingRows(data);
  const byWaiting = groupCount(rows, (r) => r.waitingCategory);
  const byDevice = groupCount(rows, (r) => r.resolutionSubType);
  return { rows, byWaiting, byDevice };
}

export function waitingMatrix(data: WorkbookData) {
  const rows = pendingRows(data);
  const groups = new Map<string, { waiting: string; store: string; total: number; devices: Map<string, number> }>();
  for (const row of rows) {
    const key = `${row.waitingCategory}\u0000${row.organization}`;
    const current = groups.get(key) ?? { waiting: row.waitingCategory, store: row.organization, total: 0, devices: new Map<string, number>() };
    const device = row.resolutionSubType || row.issueSubType || '(Blank)';
    current.total += 1;
    current.devices.set(device, (current.devices.get(device) ?? 0) + 1);
    groups.set(key, current);
  }
  const devices = groupCount(rows, (r) => r.resolutionSubType || r.issueSubType).slice(0, 8).map((x) => x.name);
  return { devices, rows: [...groups.values()].sort((a, b) => a.waiting.localeCompare(b.waiting, 'th') || a.store.localeCompare(b.store, 'th')) };
}

export function warrantyRows(data: WorkbookData, cls: QsaRow['warrantyClass']): QsaRow[] {
  return currentMonth(data).filter((r) => r.warrantyClass === cls);
}

export function regressionSnapshot(data: WorkbookData) {
  const current = currentMonth(data);
  const wb = warrantyBreakdown(data);
  const pending = pendingRows(data).length;
  const categories = Object.fromEntries(groupCount(driveThru(current), (r) => r.issueSubType).map((x) => [x.name, x.value]));
  return { currentTotal: current.length, warranty: Object.fromEntries(wb.map((x) => [x.name, x.value])), pending, categories };
}
