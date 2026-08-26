import type { CountItem, MonthlyPoint, QsaRow, WorkbookData } from '../types';

export const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const ENG_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WARRANTY_ORDER: QsaRow['warrantyClass'][] = ['Warranty ปีที่ 1', 'Warranty ปีที่ 2', 'Warranty ปีที่ 3', 'Out Warranty'];
export interface WarrantySeriesRow { period: string; total: number; [key: string]: string | number; }

export function monthLabel(year: number, month: number): string { return `${ENG_MONTHS[month - 1]}-${String(year).slice(-2)}`; }
export function reportTitleMonth(year: number, month: number): string { return `${ENG_MONTHS[month - 1]}-${year}`; }
export function samePeriod(row: QsaRow, year: number, month: number): boolean { return row.year === year && row.month === month; }
export function periodRows(rows: QsaRow[], year: number, month: number): QsaRow[] { return rows.filter((r) => samePeriod(r, year, month)); }
export function driveThru(rows: QsaRow[]): QsaRow[] { return rows.filter((r) => r.issueType === 'Drive thru'); }
export function driveThruAndPos(rows: QsaRow[]): QsaRow[] { return rows.filter((r) => ['Drive thru', 'All POS'].includes(r.issueType)); }

export function groupCount(rows: QsaRow[], key: (row: QsaRow) => string): CountItem[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = key(row) || '(Blank)';
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'th'));
}

export function lastNPeriods(year: number, month: number, n: number): Array<{ year: number; month: number; label: string }> {
  const out: Array<{ year: number; month: number; label: string }> = [];
  let y = year; let m = month;
  for (let i = 0; i < n; i += 1) {
    out.push({ year: y, month: m, label: monthLabel(y, m) });
    m -= 1; if (m < 1) { m = 12; y -= 1; }
  }
  return out.reverse();
}

export function timeline(rows: QsaRow[], year: number, month: number): MonthlyPoint[] {
  const startYear = year - 1; const points: MonthlyPoint[] = [];
  for (let y = startYear; y <= year; y += 1) {
    const maxMonth = y === year ? month : 12;
    for (let m = 1; m <= maxMonth; m += 1) {
      const rs = periodRows(rows, y, m); const resolved = rs.filter((r) => r.status === 'Resolved').length; const pending = rs.filter((r) => r.status && r.status !== 'Resolved').length;
      points.push({ year:y, month:m, label:monthLabel(y,m), total:rs.length, received:rs.length, abandon:0, resolved, pending });
    }
  }
  return points;
}

export function currentMonth(data: WorkbookData): QsaRow[] { return periodRows(data.rows, data.period.year, data.period.month); }

export function warrantyBreakdown(data: WorkbookData, year = data.period.year, month = data.period.month): CountItem[] {
  const counts = new Map(groupCount(periodRows(data.rows, year, month), (r) => r.warrantyClass).map((x) => [x.name, x.value]));
  return WARRANTY_ORDER.map((name) => ({ name, value: counts.get(name) ?? 0 }));
}

export function warrantyBreakdownSeries(data: WorkbookData, n = 3): WarrantySeriesRow[] {
  return lastNPeriods(data.period.year, data.period.month, n).map((p) => {
    const wb = warrantyBreakdown(data, p.year, p.month);
    return { period:p.label, ...Object.fromEntries(wb.map((x) => [x.name, x.value])), total:wb.reduce((s,x)=>s+x.value,0) } as WarrantySeriesRow;
  });
}

export function serviceDeskSeries(data: WorkbookData, n = 3) {
  return lastNPeriods(data.period.year, data.period.month, n).map((p) => {
    const rows = periodRows(data.rows, p.year, p.month);
    return { period:p.label, TCC:rows.filter(r=>r.serviceDeskTeam==='TCC').length, Ditto:rows.filter(r=>r.serviceDeskTeam==='Ditto').length, total:rows.length };
  });
}

export function casesTypeSeries(data: WorkbookData, n = 3) {
  return lastNPeriods(data.period.year, data.period.month, n).map((p) => {
    const rows = periodRows(data.rows, p.year, p.month);
    const percall = rows.filter(r=>r.project==='PerCall').length;
    const warranty = rows.filter(r=>r.project.startsWith('Warranty')).length;
    return { period:p.label, Percall:percall, Warranty:warranty, total:rows.length };
  });
}

export const ISSUE_ORDER = ['Drive thru', 'IT QSA (หักลบออก)', 'All POS', 'Warranty 14', 'Line ไฟ', 'Vendor อื่น'];
export function issueSeries(data: WorkbookData, n = 3) {
  const periods = lastNPeriods(data.period.year, data.period.month, n);
  const extras = new Set<string>();
  for (const p of periods) for (const r of periodRows(data.rows,p.year,p.month)) if (r.issueType && !ISSUE_ORDER.includes(r.issueType)) extras.add(r.issueType);
  const issues = [...ISSUE_ORDER, ...extras];
  return { periods, issues, rows:issues.map(issue=>({ issue, values:periods.map(p=>periodRows(data.rows,p.year,p.month).filter(r=>r.issueType===issue).length) })) };
}

export const CATEGORY_ORDER = ['COD', 'Dashboard DT', 'Headset', 'Battery Headset', 'Loop Detector', 'ฟองน้ำหูฟัง', 'Charger Battery'];
export function categoryTrend(data: WorkbookData, n = 3): { categories: string[]; rows: Array<Record<string, string | number>> } {
  const periods = lastNPeriods(data.period.year, data.period.month, n); const base = driveThru(data.rows);
  const present = new Set<string>(); for (const p of periods) for (const r of periodRows(base,p.year,p.month)) if(r.issueSubType) present.add(r.issueSubType);
  const categories = [...CATEGORY_ORDER.filter(c=>present.has(c)), ...[...present].filter(c=>!CATEGORY_ORDER.includes(c)).sort((a,b)=>a.localeCompare(b,'th'))];
  const rows = periods.map((p) => { const counts = new Map(groupCount(periodRows(base, p.year, p.month), (r) => r.issueSubType).map((x) => [x.name, x.value])); const row:Record<string,string|number>={period:p.label}; for(const c of categories) row[c]=counts.get(c)??0; return row; });
  return { categories, rows };
}

export function categoryFamily(row: QsaRow): string {
  const c = row.issueSubType.trim();
  if (['Headset','Battery Headset','Charger Battery','ฟองน้ำหูฟัง','HME Base Station'].includes(c)) return 'Headset';
  return c;
}

export function topCategoryTable(data: WorkbookData) {
  const periods = lastNPeriods(data.period.year, data.period.month, 3); const base = driveThru(data.rows); const now = periodRows(base,data.period.year,data.period.month);
  const top = groupCount(now, categoryFamily).filter(x=>x.name!=='(Blank)').slice(0,5);
  return top.map((item) => {
    const values = periods.map((p) => periodRows(base,p.year,p.month).filter((r)=>categoryFamily(r)===item.name).length);
    return { category:item.name, previous2:values[0]??0, previous:values[1]??0, current:values[2]??0, delta:(values[2]??0)-(values[1]??0), total3m:values.reduce((a,b)=>a+b,0) };
  });
}

export function categoryDetail(data: WorkbookData) {
  const rows = driveThru(currentMonth(data)); const families = groupCount(rows,categoryFamily).filter(x=>x.name!=='(Blank)').slice(0,5).map(x=>x.name);
  return families.map((family)=>({ family, total:rows.filter(r=>categoryFamily(r)===family).length, details:groupCount(rows.filter(r=>categoryFamily(r)===family),(r)=>r.resolutionSubType||r.issueSubType) }));
}

export function yearComparison(data: WorkbookData) {
  const {year,month}=data.period; const base=driveThru(data.rows); const previous=base.filter(r=>r.year===year-1); const current=base.filter(r=>r.year===year&&(r.month??99)<=month);
  const allCategories=new Set([...previous.map(r=>r.issueSubType),...current.map(r=>r.issueSubType)].filter(Boolean));
  const denominator=previous.length || 1;
  const rows=[...allCategories].map(category=>{ const prev=previous.filter(r=>r.issueSubType===category).length; const curr=current.filter(r=>r.issueSubType===category).length; return {category,previous:prev,previousPct:prev/denominator,current:curr,currentPct:curr/denominator}; }).sort((a,b)=>b.previous-a.previous||b.current-a.current);
  return {previousTotal:previous.length,currentTotal:current.length,rows};
}

export function topStoresForPeriod(data: WorkbookData, year:number, month:number, limit=5) {
  const rows=driveThru(periodRows(data.rows,year,month)); const stores=groupCount(rows,r=>r.organization).filter(x=>x.name!=='(Blank)').slice(0,limit);
  return stores.map(store=>({store:store.name,total:store.value,categories:groupCount(rows.filter(r=>r.organization===store.name),r=>r.resolutionSubType||r.issueSubType)}));
}
export function topStores(data:WorkbookData){ return topStoresForPeriod(data,data.period.year,data.period.month); }

export function pendingRows(data: WorkbookData): QsaRow[] { return driveThruAndPos(data.rows).filter((r)=>r.status&&r.status!=='Resolved'); }
export function pendingSummary(data: WorkbookData) { const rows=pendingRows(data); return {rows,byWaiting:groupCount(rows,r=>r.waitingCategory),byDevice:groupCount(rows,r=>r.resolutionSubType||r.issueSubType)}; }

export function pendingStatusHistory(data:WorkbookData){
  const {year,month}=data.period; const base=driveThruAndPos(data.rows).filter(r=>r.year===year&&(r.month??99)<=month); const periods=Array.from({length:month},(_,i)=>({year,month:i+1,label:monthLabel(year,i+1)}));
  const preferred=['Open','Wait for customer','Closed Wait_Return','Inprogress','Resolved']; const extras=[...new Set(base.map(r=>r.status).filter(Boolean))].filter(s=>!preferred.includes(s)); const statuses=[...preferred,...extras];
  const rows=statuses.map(status=>({status,values:periods.map(p=>periodRows(base,p.year,p.month).filter(r=>r.status===status).length)}));
  const totals=periods.map(p=>periodRows(base,p.year,p.month).length); const pending=periods.map(p=>periodRows(base,p.year,p.month).filter(r=>r.status!=='Resolved').length);
  return {periods,rows,totals,pending};
}

export function waitingMatrix(data: WorkbookData) {
  const rows=pendingRows(data); const groups=new Map<string,{waiting:string;store:string;total:number;devices:Map<string,number>}>();
  for(const row of rows){ const key=`${row.waitingCategory}\u0000${row.organization}`; const current=groups.get(key)??{waiting:row.waitingCategory,store:row.organization,total:0,devices:new Map<string,number>()}; const device=row.resolutionSubType||row.issueSubType||'(Blank)'; current.total+=1; current.devices.set(device,(current.devices.get(device)??0)+1); groups.set(key,current); }
  const devices=groupCount(rows,r=>r.resolutionSubType||r.issueSubType).filter(x=>x.name!=='(Blank)').slice(0,8).map(x=>x.name);
  return {devices,rows:[...groups.values()].sort((a,b)=>a.waiting.localeCompare(b.waiting,'th')||a.store.localeCompare(b.store,'th'))};
}

export function warrantyRows(data:WorkbookData,cls:QsaRow['warrantyClass']):QsaRow[]{ return currentMonth(data).filter(r=>r.warrantyClass===cls); }

export function warrantyMatrix(data:WorkbookData){
  const current=currentMonth(data); const warranty=current.filter(r=>r.warrantyClass.startsWith('Warranty')); const rowNames=groupCount(warranty,r=>r.resolutionSubType||r.issueSubType).map(x=>x.name).filter(x=>x!=='(Blank)');
  const rows=rowNames.map(name=>({name,values:['Warranty ปีที่ 1','Warranty ปีที่ 2','Warranty ปีที่ 3'].map(cls=>{ const rs=warranty.filter(r=>(r.resolutionSubType||r.issueSubType)===name&&r.warrantyClass===cls); return {no:rs.filter(r=>r.deviceStatus!=='อุปกรณ์เสีย').length,broken:rs.filter(r=>r.deviceStatus==='อุปกรณ์เสีย').length};})}));
  const totals=['Warranty ปีที่ 1','Warranty ปีที่ 2','Warranty ปีที่ 3'].map(cls=>{ const rs=warranty.filter(r=>r.warrantyClass===cls); return {no:rs.filter(r=>r.deviceStatus!=='อุปกรณ์เสีย').length,broken:rs.filter(r=>r.deviceStatus==='อุปกรณ์เสีย').length,total:rs.length};});
  const out=current.filter(r=>r.warrantyClass==='Out Warranty').length;
  return {rows,totals,out,grand:current.length};
}

export function classifyPivot(data:WorkbookData){
  const periods=lastNPeriods(data.period.year,data.period.month,6); const rows:Array<{period:string;team:string;project:string;warranty:string;count:number}>=[];
  for(const p of periods){ const rs=periodRows(data.rows,p.year,p.month); const keys=new Map<string,{team:string;project:string;warranty:string;count:number}>(); for(const r of rs){ const k=`${r.serviceDeskTeam}\0${r.project}\0${r.warrantyClass}`; const v=keys.get(k)??{team:r.serviceDeskTeam||'(Blank)',project:r.project||'(Blank)',warranty:r.warrantyClass||'(Blank)',count:0}; v.count+=1; keys.set(k,v); } for(const v of keys.values()) rows.push({period:p.label,...v}); }
  return rows;
}

export function regressionSnapshot(data:WorkbookData){ const current=currentMonth(data); const wb=warrantyBreakdown(data); const pending=pendingRows(data).length; const categories=Object.fromEntries(groupCount(driveThru(current),r=>r.issueSubType).map(x=>[x.name,x.value])); return {currentTotal:current.length,warranty:Object.fromEntries(wb.map(x=>[x.name,x.value])),pending,categories}; }
