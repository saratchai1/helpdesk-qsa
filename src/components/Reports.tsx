import type { ReactNode } from 'react';
import '../ppt16.css';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { QsaRow, WorkbookData } from '../types';
import {
  ENG_MONTHS, WARRANTY_ORDER,
  categoryDetail, categoryTrend, currentMonth, driveThru,
  issueSeries, lastNPeriods, pendingRows, pendingStatusHistory,
  periodRows, reportTitleMonth, serviceDeskSeries, casesTypeSeries,
  topCategoryTable, topStoresForPeriod, waitingMatrix, warrantyBreakdownSeries,
  warrantyMatrix, warrantyRows, yearComparison,
} from '../lib/reportEngine';

const COLORS = ['#4472C4','#ED7D31','#A5A5A5','#FFC000','#5B9BD5','#70AD47','#264478','#9E480E','#43682B','#997300'];
const WARRANTY_COLORS = ['#385723','#548235','#A9D18E','#FF0000'];
const COUNT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export const REPORT_TABS = [
  'Cover',
  'Received Cases Trend',
  'Cases Type (Cont.)',
  'Category Drive thru',
  'Category Warranty Matrix',
  'Warranty 1,2,3 Detail',
  'Out Warranty',
  'TOP 5 Category',
  'TOP 5 Category (Cont.)',
  'Yearly Comparison',
  'TOP 5 Store',
  'TOP 5 Store (Cont.)',
  'Cases Pending',
  'Pending Matrix',
  'Detail Pending ',
  'Thank you',
] as const;
export type ReportTab = (typeof REPORT_TABS)[number];

function sum(values:number[]){ return values.reduce((a,b)=>a+b,0); }
function num(value:number|null|undefined, blankZero=false){ if(value==null || !Number.isFinite(value)) return ''; if(blankZero && value===0) return ''; return COUNT.format(value); }
function pct(value:number){ return `${Math.round(value*100)}%`; }
function periodText(data:WorkbookData){ return reportTitleMonth(data.period.year,data.period.month); }
function ticket(r:QsaRow){ return r.ticketNo || r.referenceNo; }
function monthName(month:number|null){ return month ? ENG_MONTHS[month-1] : ''; }

function BrandLogo({className=''}:{className?:string}){ return <img src="/ditto-logo.png" className={`ditto-logo-img ${className}`} alt="Ditto Data Intelligence"/>; }
function ReportPage({title,children,titleAccent,className=''}:{title:ReactNode;children:ReactNode;titleAccent?:'green'|'red';className?:string}){
  return <section className={`report-page ${className}`} data-report-page data-orientation="landscape">
    <header className="ppt-header"><h2 className={titleAccent?`title-${titleAccent}`:''}>{title}</h2><BrandLogo/></header>
    <div className="ppt-body">{children}</div>
  </section>;
}

function BasicTable({headers,rows,className=''}:{headers:ReactNode[];rows:ReactNode[][];className?:string}){
  return <div className="table-wrap"><table className={`ppt-table ${className}`}>
    <thead><tr>{headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody>
  </table></div>;
}

function Cover({data}:{data:WorkbookData}){
  const label=`${ENG_MONTHS[data.period.month-1]} - ${data.period.year}`;
  return <section className="report-page cover-slide" data-report-page data-orientation="landscape">
    <BrandLogo className="cover-logo"/>
    <div className="cover-geo cover-geo-a"/><div className="cover-geo cover-geo-b"/><div className="cover-geo cover-geo-c"/>
    <div className="cover-content">
      <div className="cover-kicker">{label}</div>
      <div className="cover-title">Monthly<br/><b>Report</b></div>
      <div className="cover-subtitle">Cases Drive Thru KFC QSA</div>
    </div>
  </section>;
}

function ReceivedCasesTrend({data}:{data:WorkbookData}){
  const periods=lastNPeriods(data.period.year,data.period.month,3);
  const rows=periods.map(p=>({period:p.label,received:periodRows(data.rows,p.year,p.month).length,abandon:0}));
  return <ReportPage title="Received Cases Trend Summary">
    <div className="slide-two-chart">
      <div className="chart-panel"><div className="chart-title">Received Cases Trend Summary</div><ResponsiveContainer width="100%" height={300}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="received" name="Received" fill="#4472C4"/></BarChart></ResponsiveContainer></div>
      <div className="chart-panel"><div className="chart-title">Abandon Trend Summary</div><ResponsiveContainer width="100%" height={300}><LineChart data={rows}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis domain={[0,1]} allowDecimals/><Tooltip/><Line type="monotone" dataKey="abandon" name="Abandon" stroke="#ED7D31" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
    </div>
    <div className="received-table-wrap"><table className="ppt-table received-table"><thead><tr><th>Cases Trend</th>{periods.map(p=><th key={p.label}>{p.label}</th>)}</tr></thead><tbody>
      <tr><td>Received</td>{rows.map(r=><td key={r.period}>{r.received}</td>)}</tr>
      <tr><td>Abandon</td>{rows.map(r=><td key={r.period}>0</td>)}</tr>
      <tr className="grand-row"><td>Grand Total</td>{rows.map(r=><td key={r.period}>{r.received}</td>)}</tr>
      <tr><td>% Received</td>{rows.map(r=><td key={r.period}>100%</td>)}</tr>
      <tr><td>% Abandon</td>{rows.map(r=><td key={r.period}>0%</td>)}</tr>
    </tbody></table></div>
  </ReportPage>;
}

function MiniSeriesTable({title,periods,rows,tone}:{title:string;periods:string[];rows:{name:string;values:number[]}[];tone:'orange'|'green'|'blue'}){
  const totals=periods.map((_,i)=>sum(rows.map(r=>r.values[i]??0)));
  return <table className={`ppt-table mini-series ${tone}`}><thead><tr><th>{title}</th>{periods.map((p,i)=><th key={p} className={i===periods.length-1?'period-current-head':''}>{p}</th>)}</tr></thead><tbody>
    {rows.map(r=><tr key={r.name}><td>{r.name}</td>{r.values.map((v,i)=><td key={i}>{v||''}</td>)}</tr>)}
    <tr className="total-row"><td>Total</td>{totals.map((v,i)=><td key={i}>{v}</td>)}</tr>
  </tbody></table>;
}

function CasesTypeCont({data}:{data:WorkbookData}){
  const periods=lastNPeriods(data.period.year,data.period.month,3); const labels=periods.map(p=>p.label);
  const wb=warrantyBreakdownSeries(data,3); const service=serviceDeskSeries(data,3); const types=casesTypeSeries(data,3); const issues=issueSeries(data,3);
  const serviceRows=['TCC','Ditto'].map(name=>({name,values:service.map(x=>Number((x as Record<string,unknown>)[name]??0))}));
  const typeRows=['Percall','Warranty'].map(name=>({name,values:types.map(x=>Number((x as Record<string,unknown>)[name]??0))}));
  const issueRows=issues.rows.map(r=>({name:r.issue,values:r.values}));
  return <ReportPage title="Cases Type (Cont.)">
    <div className="cases-layout">
      <div className="cases-left">
        <div className="chart-panel"><div className="chart-title">{periodText(data)}</div><ResponsiveContainer width="100%" height={350}><BarChart data={wb}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/>{WARRANTY_ORDER.map((w,i)=><Bar key={w} dataKey={w} stackId="w" fill={WARRANTY_COLORS[i]} />)}</BarChart></ResponsiveContainer></div>
        <table className="ppt-table warranty-cross"><thead><tr><th>Months</th><th>Warranty ปีที่ 1</th><th>Warranty ปีที่ 2</th><th>Warranty ปีที่ 3</th><th className="red-head">Out Warranty</th><th>Grand Total</th></tr></thead><tbody>
          {wb.map((r,i)=><tr key={r.period} className={i===wb.length-1?'current-row':''}><td>{r.period}</td><td>{r['Warranty ปีที่ 1']}</td><td>{r['Warranty ปีที่ 2']}</td><td>{r['Warranty ปีที่ 3']}</td><td>{r['Out Warranty']}</td><td>{r.total}</td></tr>)}
          <tr className="grand-row"><td>Grand Total</td>{WARRANTY_ORDER.map(w=><td key={w}>{sum(wb.map(r=>Number(r[w])))}</td>)}<td>{sum(wb.map(r=>r.total))}</td></tr>
        </tbody></table>
      </div>
      <div className="cases-right"><MiniSeriesTable title="ServiceDesk Team" periods={labels} rows={serviceRows} tone="orange"/><MiniSeriesTable title="Cases Type" periods={labels} rows={typeRows} tone="green"/><MiniSeriesTable title="Cases Issue" periods={labels} rows={issueRows} tone="blue"/></div>
    </div>
  </ReportPage>;
}

function CategoryDriveThru({data}:{data:WorkbookData}){
  const trend=categoryTrend(data,3); const periods=lastNPeriods(data.period.year,data.period.month,3); const categories=trend.categories;
  const grand=categories.map(c=>sum(trend.rows.map(r=>Number(r[c]??0))));
  const chartRows=categories.map(category=>({category,...Object.fromEntries(trend.rows.map(r=>[String(r.period),Number(r[category]??0)]))}));
  return <ReportPage title="Category Drive thru (Type การแจ้งปัญหา)">
    <div className="chart-panel category-chart"><div className="chart-title">Drive Thru</div><ResponsiveContainer width="100%" height={360}><LineChart data={chartRows}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="category" interval={0} tick={{fontSize:10}}/><YAxis allowDecimals={false}/><Tooltip formatter={(value:any)=>num(Number(value))}/><Legend/>{periods.map((p,i)=><Line key={p.label} type="monotone" dataKey={p.label} name={p.label} stroke={['#4472C4','#ED7D31','#A5A5A5'][i]} strokeWidth={2}/>)}</LineChart></ResponsiveContainer></div>
    <table className="ppt-table category-cross"><thead><tr><th>ประเภทการแจ้ง</th><th>Months</th>{categories.map(c=><th key={c}>{c}</th>)}<th>Grand Total</th></tr></thead><tbody>
      {trend.rows.map((r,i)=>{const total=sum(categories.map(c=>Number(r[c]??0))); return <tr key={String(r.period)} className={i===trend.rows.length-1?'current-row':''}><td>{i===0?String(data.period.year):''}</td><td>{String(r.period)}</td>{categories.map(c=><td key={c}>{num(Number(r[c]??0),true)}</td>)}<td>{num(total)}</td></tr>})}
      <tr className="grand-row"><td>Grand Total</td><td></td>{grand.map((v,i)=><td key={i}>{num(v)}</td>)}<td>{num(sum(grand))}</td></tr>
    </tbody></table>
  </ReportPage>;
}

function CategoryWarrantyMatrix({data}:{data:WorkbookData}){
  const m=warrantyMatrix(data);
  return <ReportPage title={<><span>Category Drive thru </span><span className="green-inline">{periodText(data)}</span></>}>
    <table className="ppt-table warranty-matrix"><thead>
      <tr><th rowSpan={2}>ประเภทอุปกรณ์ Drive Thru</th><th colSpan={2}>Warranty ปีที่ 1</th><th colSpan={2}>Warranty ปีที่ 2</th><th colSpan={2}>Warranty ปีที่ 3</th><th rowSpan={2} className="red-head">Out Warranty</th><th rowSpan={2}>Grand Total</th></tr>
      <tr><th className="no-head">No</th><th className="broken-head">อุปกรณ์เสีย</th><th className="no-head">No</th><th className="broken-head">อุปกรณ์เสีย</th><th className="no-head">No</th><th className="broken-head">อุปกรณ์เสีย</th></tr>
    </thead><tbody>
      {m.rows.map(r=>{const g=sum(r.values.flatMap(v=>[v.no,v.broken])); return <tr key={r.name}><td>{r.name}</td>{r.values.flatMap((v,i)=>[<td key={`${i}n`}>{v.no||''}</td>,<td key={`${i}b`}>{v.broken||''}</td>])}<td className="out-soft"></td><td>{g}</td></tr>})}
      <tr className="total-row"><td>Total</td>{m.totals.flatMap((v,i)=>[<td key={`${i}n`}>{v.no}</td>,<td key={`${i}b`}>{v.broken}</td>])}<td>{m.out}</td><td>{m.grand}</td></tr>
      <tr className="grand-row"><td>Grand Total</td>{m.totals.map((v,i)=><td key={i} colSpan={2}>{v.total}</td>)}<td>{m.out}</td><td>{m.grand}</td></tr>
    </tbody></table>
  </ReportPage>;
}

function Warranty123Detail({data}:{data:WorkbookData}){
  const rows=WARRANTY_ORDER.slice(0,3).flatMap(cls=>warrantyRows(data,cls));
  return <ReportPage title={<><span>Category Drive Thru </span><span className="green-inline">(Warranty ปีที่ 1,2,3)</span> {periodText(data)}</>}>
    <table className="ppt-table detail-blue warranty-combined"><thead><tr><th>Warranty</th><th>Year</th><th>Month</th><th>Year Support</th><th>Month Support</th><th>ชื่อองค์กร</th><th>ประเภทการแก้ไขย่อย</th><th>อุปกรณ์เสีย/ไม่เสีย</th><th>การแก้ไข (เสีย/ไม่เสีย)</th><th>หมายเลขแจ้งงาน</th><th>Total</th></tr></thead><tbody>
      {rows.map((r,i)=><tr key={`${ticket(r)}-${i}`}><td>{r.warrantyClass}</td><td>{r.year??''}</td><td>{monthName(r.month)}</td><td>{r.supportYear??''}</td><td>{r.supportMonth??''}</td><td>{r.organization}</td><td>{r.resolutionSubType||r.issueSubType}</td><td>{r.deviceStatus}</td><td>{r.deviceAction||r.resolutionDetail}</td><td>{ticket(r)}</td><td>1</td></tr>)}
      <tr className="grand-row"><td>Grand Total</td><td colSpan={9}></td><td>{rows.length}</td></tr>
    </tbody></table>
  </ReportPage>;
}

function OutWarranty({data}:{data:WorkbookData}){
  const rows=warrantyRows(data,'Out Warranty');
  return <ReportPage title={<><span>Category Drive Thru </span><span className="red-inline">(Out Warranty)</span> {periodText(data)}</>}>
    <table className="ppt-table detail-orange"><thead><tr><th>Warranty</th><th>Year</th><th>Month</th><th>Year Support</th><th>Month Support</th><th>ชื่อองค์กร</th><th>ประเภทการแก้ไขย่อย</th><th>หมายเลขแจ้งงาน</th><th>Total</th></tr></thead><tbody>
      {rows.map((r,i)=><tr key={`${ticket(r)}-${i}`}><td>{r.warrantyClass}</td><td>{r.year??''}</td><td>{monthName(r.month)}</td><td>{r.supportYear??''}</td><td>{r.supportMonth??''}</td><td>{r.organization}</td><td>{r.resolutionSubType||r.issueSubType}</td><td>{ticket(r)}</td><td>1</td></tr>)}
      <tr className="grand-row"><td>Grand Total</td><td colSpan={7}></td><td>{rows.length}</td></tr>
    </tbody></table>
  </ReportPage>;
}

function PieBlock({data,height=220,colors=COLORS}:{data:{name:string;value:number}[];height?:number;colors?:string[]}){
  const filtered=data.filter(x=>x.value>0);
  return <ResponsiveContainer width="100%" height={height}><PieChart><Pie data={filtered} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="78%" label={({name,value}:any)=>`${name} ${num(Number(value))}`} labelLine>{filtered.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={(value:any)=>num(Number(value))}/></PieChart></ResponsiveContainer>;
}

function Top5Category({data}:{data:WorkbookData}){
  const rows=topCategoryTable(data); const periods=lastNPeriods(data.period.year,data.period.month,3); const totals=periods.map(p=>driveThru(periodRows(data.rows,p.year,p.month)).length);
  const selected=[sum(rows.map(r=>r.previous2)),sum(rows.map(r=>r.previous)),sum(rows.map(r=>r.current))]; const other=totals.map((v,i)=>Math.max(0,v-selected[i])); const currentTop=selected[2];
  const deltaData=rows.filter(r=>r.delta!==0).map(r=>({name:`${r.category} ${r.delta>0?'+':''}${r.delta}`,value:Math.abs(r.delta)}));
  return <ReportPage title="TOP 5 Category Drive Thru">
    <table className="ppt-table top-category-table"><thead><tr><th>ประเภทการแจ้ง</th><th>ประเภทการแจ้งย่อย</th>{periods.map(p=><th key={p.label}>{p.label}</th>)}<th>ผลต่าง {periods[2].label}/{periods[1].label}</th><th>Grand Total</th></tr></thead><tbody>
      {rows.map((r,i)=><tr key={r.category}><td>{i===0?'Drive thru':''}</td><td>{r.category}</td><td>{r.previous2}</td><td>{r.previous}</td><td>{r.current}</td><td className={r.delta>0?'delta-pos':r.delta<0?'delta-neg':''}>{r.delta>0?'+':''}{r.delta}</td><td>{r.total3m}</td></tr>)}
      <tr><td>Other</td><td></td>{other.map((v,i)=><td key={i}>{v||''}</td>)}<td></td><td>{sum(other)}</td></tr>
      <tr className="grand-row"><td>Grand Total</td><td></td>{totals.map((v,i)=><td key={i}>{v}</td>)}<td></td><td>{sum(totals)}</td></tr>
    </tbody></table>
    <div className="top-pies"><div className="chart-panel"><div className="chart-title">{periodText(data)}</div><PieBlock data={[{name:'TOP 5 Category',value:currentTop},{name:'Other Category',value:other[2]}]} height={235}/></div><div className="chart-panel"><div className="chart-title">ผลต่าง {periods[2].label}/{periods[1].label}</div><PieBlock data={deltaData.length?deltaData:[{name:'No change',value:1}]} height={235}/></div></div>
  </ReportPage>;
}

function Top5CategoryCont({data}:{data:WorkbookData}){
  const detail=categoryDetail(data); const current=driveThru(currentMonth(data)).length;
  const tableRows:ReactNode[][]=[];
  for(const group of detail){ group.details.forEach((d,i)=>tableRows.push([i===0?group.family:'',d.name,d.value,i===0?group.total:''])); }
  tableRows.push(['Grand Total','',current,current]);
  return <ReportPage title="TOP 5 Category Drive Thru (Cont.)">
    <div className="category-detail-layout"><div><BasicTable className="category-detail-table" headers={['ประเภทการแจ้งย่อย','ประเภทการแก้ไขย่อย',periodText(data),'Grand Total']} rows={tableRows}/></div><div className="chart-panel"><div className="chart-title">{periodText(data)}</div><PieBlock data={detail.map(x=>({name:x.family,value:x.total}))} height={330}/></div></div>
  </ReportPage>;
}

function YearlyComparison({data}:{data:WorkbookData}){
  const cmp=yearComparison(data); const y0=data.period.year-1; const y1=data.period.year; const chart=cmp.rows.map(r=>({category:r.category,[String(y0)]:Math.round(r.previousPct*100),[String(y1)]:Math.round(r.currentPct*100)}));
  return <ReportPage title="Category Drive Thru (Yearly)">
    <div className="chart-panel yearly-chart"><div className="chart-title">Jan-{ENG_MONTHS[data.period.month-1]} {y1}</div><ResponsiveContainer width="100%" height={300}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="category" angle={-20} textAnchor="end" interval={0} height={70} tick={{fontSize:10}}/><YAxis unit="%"/><Tooltip/><Legend/><Bar dataKey={String(y0)} fill="#4472C4"/><Bar dataKey={String(y1)} fill="#ED7D31"/></BarChart></ResponsiveContainer></div>
    <table className="ppt-table yearly-table"><thead><tr><th>ประเภทการแจ้ง</th><th>ประเภทการแจ้ง (ย่อย)</th><th>ปี {y0}</th><th>%</th><th>ปี {y1}</th><th>%</th></tr></thead><tbody>
      {cmp.rows.map((r,i)=><tr key={r.category}><td>{i===0?'Drive thru':''}</td><td>{r.category}</td><td>{r.previous||''}</td><td>{pct(r.previousPct)}</td><td>{r.current||''}</td><td>{pct(r.currentPct)}</td></tr>)}
      <tr className="grand-row"><td>Total</td><td></td><td>{cmp.previousTotal}</td><td>100%</td><td>{cmp.currentTotal}</td><td>{pct(cmp.currentTotal/(cmp.previousTotal||1))}</td></tr>
    </tbody></table>
  </ReportPage>;
}

function repeatedTopStores(data:WorkbookData){
  const periods=lastNPeriods(data.period.year,data.period.month,3); const all=periods.map(p=>topStoresForPeriod(data,p.year,p.month).map(s=>s.store)); const counts=new Map<string,number>(); for(const arr of all) for(const s of arr) counts.set(s,(counts.get(s)??0)+1); return new Set([...counts].filter(([,n])=>n>1).map(([s])=>s));
}
function StoreTable({label,stores,tone,repeated}:{label:string;stores:ReturnType<typeof topStoresForPeriod>;tone:'orange'|'blue'|'green';repeated:Set<string>}){
  const rows:ReactNode[][]=[]; for(const store of stores){ store.categories.forEach((c,i)=>rows.push([i===0?<span className={repeated.has(store.store)?'store-name':''}>{store.store}</span>:'',c.name,c.value,i===0?store.total:''])); }
  rows.push(['Grand Total','',sum(stores.map(s=>s.total)),sum(stores.map(s=>s.total))]);
  return <BasicTable className={`store-table ${tone}`} headers={[label,'ประเภทการแก้ไขย่อย','Total','Grand Total']} rows={rows}/>;
}

function Top5Store({data}:{data:WorkbookData}){
  const periods=lastNPeriods(data.period.year,data.period.month,3); const repeated=repeatedTopStores(data); const prev=periods[1],now=periods[2]; const current=topStoresForPeriod(data,now.year,now.month), previous=topStoresForPeriod(data,prev.year,prev.month);
  return <ReportPage title="TOP 5 Store Drive Thru"><div className="store-double"><StoreTable label={now.label} stores={current} tone="orange" repeated={repeated}/><StoreTable label={prev.label} stores={previous} tone="blue" repeated={repeated}/></div></ReportPage>;
}

function Top5StoreCont({data}:{data:WorkbookData}){
  const periods=lastNPeriods(data.period.year,data.period.month,3); const repeated=repeatedTopStores(data); const first=periods[0]; const stores=topStoresForPeriod(data,first.year,first.month);
  const sample=data.period.year===2026&&data.period.month===6;
  const repeatedNames=[...repeated];
  return <ReportPage title="TOP 5 Store Drive Thru (Cont.)"><div className="store-cont"><StoreTable label={first.label} stores={stores} tone="green" repeated={repeated}/><div className="ppt-note"><b>หมายเหตุ:</b><br/>เดือน {periods[2].label}, {periods[1].label}, {periods[0].label} มี Store แจ้งซ้ำ {repeatedNames.length} Store<br/>{sample?<>-1690 - Home Pro Phetkasem (FSDT+Fusion) แจ้ง Dashboard DT หน้าจอไม่แสดงและไม่มีสัญญาณ Network ปัญหาเกิดจากมีไฟตกไฟดับ/แนะนำสาขาทำการปิด/เปิดกล่อง CU ใหม่<br/>-1661 - Petchkasem Power Center ตรวจสอบอุปกรณ์ที่แจ้งไม่ซ้ำกัน</>:repeatedNames.map(s=><span key={s}>-{s}<br/></span>)}</div></div></ReportPage>;
}

function CasesPending({data}:{data:WorkbookData}){
  const h=pendingStatusHistory(data); const last=h.periods.length-1; const pie=h.rows.map(r=>({name:r.status,value:r.values[last]??0})).filter(x=>x.value>0);
  return <ReportPage title={`Cases Pending Drive Thru as of ${periodText(data)}`}>
    <div className="pending-chart chart-panel"><div className="chart-title">{periodText(data)}</div><PieBlock data={pie} height={270} colors={pie.map(x=>x.name==='Resolved'?'#4472C4':'#A5A5A5')}/></div>
    <table className="ppt-table pending-history"><thead><tr><th>สถานะงาน</th>{h.periods.map(p=><th key={p.label}>{p.label}</th>)}<th>Grand Total</th></tr></thead><tbody>
      {h.rows.map(r=><tr key={r.status}><td>{r.status}</td>{r.values.map((v,i)=><td key={i}>{v||''}</td>)}<td>{sum(r.values)||''}</td></tr>)}
      <tr className="grand-row"><td>Grand Total</td>{h.totals.map((v,i)=><td key={i}>{v}</td>)}<td>{sum(h.totals)}</td></tr>
      <tr className="pending-row"><td>Pending</td>{h.pending.map((v,i)=><td key={i}>{v||''}</td>)}<td>{sum(h.pending)}</td></tr>
    </tbody></table>
  </ReportPage>;
}

function PendingMatrix({data}:{data:WorkbookData}){
  const m=waitingMatrix(data); const totals=m.devices.map(d=>sum(m.rows.map(r=>r.devices.get(d)??0)));
  return <ReportPage title={`Cases Drive Thru Pending as of ${periodText(data)}`}><table className="ppt-table waiting-table"><thead><tr><th>อัพเดทการ Waiting</th><th>ชื่อองค์กร</th>{m.devices.map(d=><th key={d}>{d}</th>)}<th>Total</th></tr></thead><tbody>
    {m.rows.map((r,i)=><tr key={`${r.waiting}-${r.store}-${i}`}><td className="waiting-red">{r.waiting}</td><td>{r.store}</td>{m.devices.map(d=><td key={d}>{r.devices.get(d)??''}</td>)}<td>{r.total}</td></tr>)}
    <tr className="grand-row"><td>Total</td><td></td>{totals.map((v,i)=><td key={i}>{v}</td>)}<td>{sum(totals)}</td></tr>
  </tbody></table></ReportPage>;
}

function DetailPending({data}:{data:WorkbookData}){
  const rows=pendingRows(data);
  return <ReportPage title={`Detail Cases Drive Thru Pending as of ${periodText(data)}`}><table className="ppt-table pending-detail"><thead><tr><th>Year</th><th>Months</th><th>สถานะงาน</th><th>ชื่อองค์กร</th><th>หมายเลขงานอ้างอิง</th><th>หัวข้อปัญหา</th><th>ประเภทการแก้ไขย่อย</th><th>อัพเดทการ Waiting</th><th>Grand Total</th></tr></thead><tbody>
    {rows.map((r,i)=><tr key={`${ticket(r)}-${i}`}><td>{r.year??''}</td><td>{monthName(r.month)}</td><td>{r.status}</td><td>{r.organization}</td><td>{r.referenceNo||r.ticketNo}</td><td>{r.subject}</td><td>{r.resolutionSubType||r.issueSubType}</td><td className="waiting-red">{r.waitingCategory}</td><td>1</td></tr>)}
    <tr className="grand-row"><td>Total</td><td colSpan={7}></td><td>{rows.length}</td></tr>
  </tbody></table></ReportPage>;
}

function ThankYou(){ return <section className="report-page thank-slide" data-report-page data-orientation="landscape"><BrandLogo className="thank-logo"/><div className="thank-photo"><div className="handshake-shape left"/><div className="handshake-shape right"/></div><div className="thank-text">Thank you</div></section>; }

export function ReportContent({tab,data}:{tab:ReportTab;data:WorkbookData}){
  switch(tab){
    case 'Cover': return <Cover data={data}/>;
    case 'Received Cases Trend': return <ReceivedCasesTrend data={data}/>;
    case 'Cases Type (Cont.)': return <CasesTypeCont data={data}/>;
    case 'Category Drive thru': return <CategoryDriveThru data={data}/>;
    case 'Category Warranty Matrix': return <CategoryWarrantyMatrix data={data}/>;
    case 'Warranty 1,2,3 Detail': return <Warranty123Detail data={data}/>;
    case 'Out Warranty': return <OutWarranty data={data}/>;
    case 'TOP 5 Category': return <Top5Category data={data}/>;
    case 'TOP 5 Category (Cont.)': return <Top5CategoryCont data={data}/>;
    case 'Yearly Comparison': return <YearlyComparison data={data}/>;
    case 'TOP 5 Store': return <Top5Store data={data}/>;
    case 'TOP 5 Store (Cont.)': return <Top5StoreCont data={data}/>;
    case 'Cases Pending': return <CasesPending data={data}/>;
    case 'Pending Matrix': return <PendingMatrix data={data}/>;
    case 'Detail Pending ': return <DetailPending data={data}/>;
    case 'Thank you': return <ThankYou/>;
  }
}
