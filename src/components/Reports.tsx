import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CountItem, QsaRow, WorkbookData } from '../types';
import {
  CATEGORY_ORDER, ENG_MONTHS, THAI_MONTHS, WARRANTY_ORDER,
  categoryDetail, categoryTrend, classifyPivot, currentMonth, driveThru, groupCount,
  issueSeries, lastNPeriods, pendingRows, pendingStatusHistory, reportTitleMonth,
  serviceDeskSeries, casesTypeSeries, topCategoryTable, topStoresForPeriod,
  waitingMatrix, warrantyBreakdownSeries, warrantyMatrix, warrantyRows, yearComparison,
} from '../lib/reportEngine';

const DITTO_LOGO = 'data:image/jpeg;base64,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';
const COLORS = ['#4472C4','#ED7D31','#A5A5A5','#70AD47','#FFC000','#5B9BD5','#264478','#9E480E','#43682B','#997300'];

export const REPORT_TABS = [
  'Received Cases Trend','จำแนก Type','Cases Type + Warraty','Category ALL','Warranty ปีที่ 1','Warranty ปีที่ 2','รายละเอียด Warranty ปีที่ 1','Warranty ปีที่ 3','Out Warranty','TOP 5 Category','ผลต่าง Ref.รายปี','TOP 5 Store','Cases Pending Ditto','Pending Table','Detail Pending '
] as const;
export type ReportTab = (typeof REPORT_TABS)[number];

function ReportPage({title,children,titleAccent,className=''}:{title:ReactNode;children:ReactNode;titleAccent?:'green'|'red';className?:string}){
  return <section className={`report-page ${className}`} data-report-page data-orientation="landscape">
    <header className="ppt-header"><h2 className={titleAccent?`title-${titleAccent}`:''}>{title}</h2><img src={DITTO_LOGO} className="ditto-logo"/></header>
    <div className="ppt-body">{children}</div>
  </section>;
}
function Table({headers,rows,className='',compact=false}:{headers:ReactNode[];rows:ReactNode[][];className?:string;compact?:boolean}){
  return <div className={`table-wrap ${compact?'compact':''}`}><table className={`ppt-table ${className}`}><thead><tr>{headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>):<tr><td colSpan={headers.length} className="empty-cell">ไม่มีข้อมูลในงวดนี้</td></tr>}</tbody></table></div>;
}
function CountPie({data,height=220}:{data:CountItem[];height?:number}){
  const filtered=data.filter(x=>x.value>0);
  return <ResponsiveContainer width="100%" height={height}><PieChart><Pie data={filtered} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="75%" label={({name,value}:{name?:string;value?:number})=>`${name} ${value}`} labelLine>{filtered.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>;
}
const num=(v:number)=>v===0?'':v;
const pct=(v:number)=>`${Math.round(v*100)}%`;
const monthName=(m:number|null)=>m?ENG_MONTHS[m-1]:'';
function cellText(value:string,max=150){return value.length>max?`${value.slice(0,max)}…`:value;}

function ReceivedCasesTrend({data}:{data:WorkbookData}){
  const periods=lastNPeriods(data.period.year,data.period.month,3);
  const rows=periods.map(p=>{const rs=data.rows.filter(r=>r.year===p.year&&r.month===p.month);return {period:p.label,received:rs.length,abandon:0,total:rs.length,receivedPct:rs.length?1:0,abandonPct:0};});
  return <ReportPage title="Received Cases Trend Summary">
    <div className="slide-two-chart">
      <div className="chart-panel"><div className="chart-title">Received Cases Trend Summary</div><ResponsiveContainer width="100%" height={250}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="received" name="Received" fill="#5B9BD5" radius={[2,2,0,0]}/></BarChart></ResponsiveContainer></div>
      <div className="chart-panel"><div className="chart-title">Abandon Trend Summary</div><ResponsiveContainer width="100%" height={250}><LineChart data={rows}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis domain={[0,1]} ticks={[0,.2,.4,.6,.8,1]}/><Tooltip/><Line type="linear" dataKey="abandon" name="Abandon" stroke="#ED7D31" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
    </div>
    <table className="ppt-table blue-summary received-table"><thead><tr><th>Cases Trend</th><th colSpan={3}>{data.period.year}</th></tr><tr><th></th>{periods.map(p=><th key={p.label}>{p.label}</th>)}</tr></thead><tbody>
      <tr><td>Received</td>{rows.map(r=><td key={r.period}>{r.received}</td>)}</tr><tr><td>Abandon</td>{rows.map(r=><td key={r.period}>0</td>)}</tr><tr className="total-row"><td>Grand Total</td>{rows.map(r=><td key={r.period}>{r.total}</td>)}</tr><tr><td>% Received</td>{rows.map(r=><td key={r.period}>{pct(r.receivedPct)}</td>)}</tr><tr><td>% Abandon</td>{rows.map(r=><td key={r.period}>0%</td>)}</tr>
    </tbody></table>
  </ReportPage>;
}

function ClassifyType({data}:{data:WorkbookData}){
  const piv=classifyPivot(data); const periods=[...new Set(piv.map(r=>r.period))];
  return <ReportPage title="จำแนก Type">
    <div className="mini-filter"><span>Year</span><b>{data.period.year}</b><span>เดือนล่าสุด</span><b>{reportTitleMonth(data.period.year,data.period.month)}</b></div>
    <Table className="pivot-detail" compact headers={['Months','ServiceDesk Team','Project / Cases Type','Warranty','Count']} rows={piv.map(r=>[r.period,r.team,r.project,r.warranty,r.count])}/>
    <div className="pivot-note">ตารางนี้ถอดรูปแบบ pivot จาก tab “จำแนก Type” และคำนวณใหม่จาก Worksheet ทุกครั้งที่อัปโหลด</div>
    <div className="period-chip-row">{periods.map(p=><span key={p}>{p}</span>)}</div>
  </ReportPage>;
}

function CasesTypeWarranty({data}:{data:WorkbookData}){
  const periods=lastNPeriods(data.period.year,data.period.month,3); const wb=warrantyBreakdownSeries(data,3) as Array<Record<string,string|number>>; const teams=serviceDeskSeries(data,3); const types=casesTypeSeries(data,3); const issues=issueSeries(data,3);
  return <ReportPage title="Cases Type (Cont.)">
    <div className="cases-layout">
      <div className="cases-left">
        <div className="chart-panel tall"><div className="chart-title">{reportTitleMonth(data.period.year,data.period.month)}</div><ResponsiveContainer width="100%" height={300}><BarChart data={wb}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="Warranty ปีที่ 1" stackId="w" fill="#375623"/><Bar dataKey="Warranty ปีที่ 2" stackId="w" fill="#548235"/><Bar dataKey="Warranty ปีที่ 3" stackId="w" fill="#A9D18E"/><Bar dataKey="Out Warranty" stackId="w" fill="#ff160d"/></BarChart></ResponsiveContainer></div>
        <table className="ppt-table warranty-cross"><thead><tr><th rowSpan={2}>Months</th><th colSpan={3}>Warranty</th><th>Out Warranty</th><th rowSpan={2}>Grand Total</th></tr><tr><th>Warranty ปีที่ 1</th><th>Warranty ปีที่ 2</th><th>Warranty ปีที่ 3</th><th className="red-head">Out Warranty</th></tr></thead><tbody>{wb.map((r,i)=><tr key={String(r.period)} className={i===wb.length-1?'current-row':''}><td>{r.period}</td><td>{r['Warranty ปีที่ 1']}</td><td>{r['Warranty ปีที่ 2']}</td><td>{r['Warranty ปีที่ 3']}</td><td className="red-text">{r['Out Warranty']}</td><td>{r.total}</td></tr>)}</tbody></table>
      </div>
      <div className="cases-right">
        <MiniSeriesTable title="ServiceDesk Team" periods={periods.map(p=>p.label)} rows={[['TCC',...teams.map(x=>x.TCC)],['Ditto',...teams.map(x=>num(x.Ditto))],['Total',...teams.map(x=>x.total)]]} theme="orange"/>
        <MiniSeriesTable title="Cases Type" periods={periods.map(p=>p.label)} rows={[['Percall',...types.map(x=>x.Percall)],['Warranty',...types.map(x=>x.Warranty)],['Total',...types.map(x=>x.total)]]} theme="green"/>
        <MiniSeriesTable title="Cases Issue" periods={periods.map(p=>p.label)} rows={[...issues.rows.map(r=>[r.issue,...r.values.map(num)]),['Total',...periods.map((_,i)=>issues.rows.reduce((s,r)=>s+r.values[i],0))]]} theme="blue"/>
      </div>
    </div>
  </ReportPage>;
}
function MiniSeriesTable({title,periods,rows,theme}:{title:string;periods:string[];rows:(string|number)[][];theme:'orange'|'green'|'blue'}){
  return <table className={`ppt-table mini-series ${theme}`}><thead><tr><th>{title}</th>{periods.map((p,i)=><th key={p} className={i===periods.length-1?'period-current-head':''}>{p}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className={i===rows.length-1?'total-row':''}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table>;
}

function CategoryAll({data}:{data:WorkbookData}){
  const trend=categoryTrend(data,3); const periods=lastNPeriods(data.period.year,data.period.month,3); const totals=trend.categories.map(c=>trend.rows.reduce((s,r)=>s+Number(r[c]||0),0));
  return <ReportPage title="Category Drive thru (Type การแจ้งปัญหา)">
    <div className="chart-panel category-chart"><div className="chart-title">Drive Thru</div><ResponsiveContainer width="100%" height={370}><LineChart data={trend.categories.map(cat=>({category:cat,...Object.fromEntries(trend.rows.map(r=>[String(r.period),Number(r[cat]||0)]))}))}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="category" interval={0}/><YAxis allowDecimals={false}/><Tooltip/><Legend/>{periods.map((p,i)=><Line key={p.label} type="linear" dataKey={p.label} stroke={COLORS[i]} strokeWidth={2.5}/>)}</LineChart></ResponsiveContainer></div>
    <table className="ppt-table category-cross"><thead><tr><th rowSpan={2}>ประเภทการแจ้ง</th><th colSpan={trend.categories.length+1}>Drive thru</th><th rowSpan={2}>Grand Total</th></tr><tr><th>Months</th>{trend.categories.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>
      {trend.rows.map((r,i)=><tr key={String(r.period)} className={i===trend.rows.length-1?'current-row':''}><td>{i===0?data.period.year:''}</td><td>{r.period}</td>{trend.categories.map(c=><td key={c}>{num(Number(r[c]||0))}</td>)}<td>{trend.categories.reduce((s,c)=>s+Number(r[c]||0),0)}</td></tr>)}
      <tr className="grand-row"><td>Grand Total</td><td></td>{totals.map((v,i)=><td key={i}>{v}</td>)}<td>{totals.reduce((a,b)=>a+b,0)}</td></tr>
    </tbody></table>
  </ReportPage>;
}

function WarrantyMatrixPage({data}:{data:WorkbookData}){
  const m=warrantyMatrix(data);
  return <ReportPage title={<>Category Drive thru {reportTitleMonth(data.period.year,data.period.month)}</>}>
    <table className="ppt-table warranty-matrix"><thead><tr><th rowSpan={2}>ประเภทอุปกรณ์ Drive Thru</th><th colSpan={2}>Warranty ปีที่ 1</th><th colSpan={2}>Warranty ปีที่ 2</th><th colSpan={2}>Warranty ปีที่ 3</th><th rowSpan={2} className="red-head">Out Warranty</th><th rowSpan={2}>Grand Total</th></tr><tr><th className="no-head">No</th><th className="broken-head">อุปกรณ์เสีย</th><th className="no-head">No</th><th className="broken-head">อุปกรณ์เสีย</th><th className="no-head">No</th><th className="broken-head">อุปกรณ์เสีย</th></tr></thead><tbody>
      {m.rows.map(r=><tr key={r.name}><td>{r.name}</td>{r.values.flatMap((v,i)=>[<td key={`${i}n`}>{num(v.no)}</td>,<td key={`${i}b`}>{num(v.broken)}</td>])}<td className="out-soft"></td><td className="green-text">{r.values.reduce((s,v)=>s+v.no+v.broken,0)}</td></tr>)}
      <tr className="total-row"><td>Total</td>{m.totals.flatMap((v,i)=>[<td key={`${i}n`} className="red-text">{v.no}</td>,<td key={`${i}b`} className="red-text">{v.broken}</td>])}<td className="red-text">{m.out}</td><td className="red-text">{m.grand}</td></tr>
      <tr className="grand-row"><td>Grand Total</td>{m.totals.map((v,i)=><td key={i} colSpan={2} className="yellow-text">{v.total}</td>)}<td className="red-text">{m.out}</td><td>{m.grand}</td></tr>
    </tbody></table>
  </ReportPage>;
}

function WarrantyRowsPage({data,cls}:{data:WorkbookData;cls:QsaRow['warrantyClass']}){
  const rows=warrantyRows(data,cls);
  return <ReportPage title={<>Category Drive Thru (<span className="green-inline">{cls}</span>) {reportTitleMonth(data.period.year,data.period.month)}</>}>
    <Table compact className="detail-blue" headers={['Warranty','Year','Month','Year Support','Month Support','ชื่อองค์กร','ประเภทการแก้ไขย่อย','อุปกรณ์เสีย/ไม่เสีย','การแก้ไข (เสีย/ไม่เสีย)','หมายเลขแจ้งงาน','Total']} rows={rows.map(r=>[r.warrantyClass,r.year??'',monthName(r.month),r.supportYear??'',r.supportMonth??'',r.organization,r.resolutionSubType||r.issueSubType,r.deviceStatus||'',cellText(r.deviceAction,150),r.ticketNo,1])}/>
  </ReportPage>;
}

function WarrantyCombined({data}:{data:WorkbookData}){
  const rows=WARRANTY_ORDER.slice(0,3).flatMap(cls=>warrantyRows(data,cls));
  return <ReportPage title={<>Category Drive Thru (<span className="green-inline">Warranty ปีที่ 1,2,3</span>) {reportTitleMonth(data.period.year,data.period.month)}</>}>
    <Table compact className="detail-blue warranty-combined" headers={['Warranty','Year','Month','Year Support','Month Support','ชื่อองค์กร','ประเภทการแก้ไขย่อย','อุปกรณ์เสีย/ไม่เสีย','การแก้ไข (เสีย/ไม่เสีย)','หมายเลขแจ้งงาน','Total']} rows={rows.map(r=>[<span className="green-text">{r.warrantyClass}</span>,r.year??'',monthName(r.month),r.supportYear??'',r.supportMonth??'',r.organization,r.resolutionSubType||r.issueSubType,r.deviceStatus||'',cellText(r.deviceAction,165),r.ticketNo,1])}/>
  </ReportPage>;
}

function OutWarranty({data}:{data:WorkbookData}){
  const rows=warrantyRows(data,'Out Warranty');
  return <ReportPage title={<>Category Drive Thru (<span className="red-inline">Out Warranty</span>) {reportTitleMonth(data.period.year,data.period.month)}</>}>
    <Table compact className="detail-orange" headers={['Warranty','Year','Month','Year Support','Month Support','ชื่อองค์กร','ประเภทการแก้ไขย่อย','หมายเลขแจ้งงาน','Total']} rows={rows.map(r=>['Out Warranty',r.year??'',monthName(r.month),r.supportYear??'',r.supportMonth??'',r.organization,r.resolutionSubType||r.issueSubType,r.ticketNo,1])}/>
  </ReportPage>;
}

function Top5Category({data}:{data:WorkbookData}){
  const rows=topCategoryTable(data); const periods=lastNPeriods(data.period.year,data.period.month,3); const currentTotal=driveThru(currentMonth(data)).length; const topTotal=rows.reduce((s,r)=>s+r.current,0); const delta=rows.map(r=>({name:r.category,value:Math.abs(r.delta)})).filter(x=>x.value>0);
  const details=categoryDetail(data);
  return <>
    <ReportPage title="TOP 5 Category Drive Thru">
      <table className="ppt-table top-category-table"><thead><tr><th>ประเภทการแจ้ง</th><th>ประเภทการแจ้งย่อย</th>{periods.map(p=><th key={p.label}>{p.label}</th>)}<th>ผลต่าง {periods[2].label}/{periods[1].label}</th><th>Grand Total</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.category}><td>{i===0?'Drive thru':''}</td><td>{r.category}</td><td>{r.previous2}</td><td>{r.previous}</td><td>{r.current}</td><td className={r.delta>0?'delta-pos':'delta-neg'}>{r.delta>0?'+':''}{r.delta}</td><td>{r.total3m}</td></tr>)}<tr className="total-row"><td>Total</td><td></td><td>{rows.reduce((s,r)=>s+r.previous2,0)}</td><td>{rows.reduce((s,r)=>s+r.previous,0)}</td><td>{rows.reduce((s,r)=>s+r.current,0)}</td><td></td><td>{rows.reduce((s,r)=>s+r.total3m,0)}</td></tr></tbody></table>
      <div className="top-pies"><div><div className="chart-title">{periods[2].label}</div><CountPie data={[{name:'TOP 5 Category',value:topTotal},{name:'Other Category',value:Math.max(0,currentTotal-topTotal)}]} height={230}/></div><div><div className="chart-title">ผลต่าง {periods[2].label}/{periods[1].label}</div><CountPie data={delta.length?delta:[{name:'No change',value:1}]} height={230}/></div></div>
    </ReportPage>
    <ReportPage title="TOP 5 Category Drive Thru (Cont.)">
      <div className="category-detail-layout"><table className="ppt-table category-detail-table"><thead><tr><th>ประเภทการแจ้งย่อย</th><th>ประเภทการแก้ไขย่อย</th><th>{reportTitleMonth(data.period.year,data.period.month)}</th><th>Grand Total</th></tr></thead><tbody>{details.flatMap(group=>group.details.map((d,i)=><tr key={`${group.family}-${d.name}`}><td>{i===0?group.family:''}</td><td>{d.name}</td><td>{d.value}</td><td>{i===0?group.total:''}</td></tr>))}<tr className="grand-row"><td>Grand Total</td><td></td><td>{details.reduce((s,g)=>s+g.total,0)}</td><td>{details.reduce((s,g)=>s+g.total,0)}</td></tr></tbody></table><div className="chart-panel"><div className="chart-title">{reportTitleMonth(data.period.year,data.period.month)}</div><CountPie data={details.map(g=>({name:g.family,value:g.total}))} height={360}/></div></div>
    </ReportPage>
  </>;
}

function YearDelta({data}:{data:WorkbookData}){
  const cmp=yearComparison(data); const rows=cmp.rows.filter(r=>r.previous||r.current); const bars=rows.map(r=>({category:r.category,[String(data.period.year-1)]:Math.round(r.previousPct*100),[String(data.period.year)]:Math.round(r.currentPct*100)}));
  return <ReportPage title="Category Drive Thru (Yearly)">
    <div className="chart-panel yearly-chart"><div className="chart-title">Jan-{ENG_MONTHS[data.period.month-1]} {data.period.year}</div><ResponsiveContainer width="100%" height={300}><BarChart data={bars}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="category" interval={0} angle={-15} textAnchor="end" height={60}/><YAxis unit="%"/><Tooltip/><Legend/><Bar dataKey={String(data.period.year-1)} fill="#A5A5A5"/><Bar dataKey={String(data.period.year)} fill="#4472C4"/></BarChart></ResponsiveContainer></div>
    <table className="ppt-table yearly-table"><thead><tr><th>ประเภทการแจ้ง</th><th>ประเภทการแจ้ง (ย่อย)</th><th colSpan={2}>Jan - Dec {data.period.year-1}</th><th colSpan={2}>Jan - {ENG_MONTHS[data.period.month-1]} {data.period.year}</th></tr><tr><th></th><th></th><th>ปี {data.period.year-1}</th><th>%</th><th>ปี {data.period.year}</th><th>%</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.category}><td>{i===0?'Drive thru':''}</td><td>{r.category}</td><td>{r.previous}</td><td>{pct(r.previousPct)}</td><td>{r.current}</td><td className="red-text">{pct(r.currentPct)}</td></tr>)}<tr className="total-row"><td>Total</td><td></td><td>{cmp.previousTotal}</td><td>100%</td><td>{cmp.currentTotal}</td><td className="red-text">{pct(cmp.currentTotal/(cmp.previousTotal||1))}</td></tr></tbody></table>
  </ReportPage>;
}

function StoreTable({data,year,month,theme}:{data:WorkbookData;year:number;month:number;theme:'orange'|'blue'|'green'}){
  const stores=topStoresForPeriod(data,year,month); const total=stores.reduce((s,x)=>s+x.total,0);
  return <table className={`ppt-table store-table ${theme}`}><thead><tr><th>{reportTitleMonth(year,month)}</th><th>ประเภทการแก้ไขย่อย</th><th>Total</th><th>Grand Total</th></tr></thead><tbody>{stores.flatMap(s=>s.categories.map((c,i)=><tr key={`${s.store}-${c.name}`}><td className={i===0?'store-name':''}>{i===0?s.store:''}</td><td>{c.name}</td><td>{c.value}</td><td>{i===0?s.total:''}</td></tr>))}<tr className="grand-row"><td>Grand Total</td><td></td><td>{total}</td><td>{total}</td></tr></tbody></table>;
}
function Top5Store({data}:{data:WorkbookData}){
  const ps=lastNPeriods(data.period.year,data.period.month,3);
  const current=topStoresForPeriod(data,ps[2].year,ps[2].month); const prev=topStoresForPeriod(data,ps[1].year,ps[1].month); const older=topStoresForPeriod(data,ps[0].year,ps[0].month);
  const repeated=current.map(x=>x.store).filter(s=>prev.some(p=>p.store===s)||older.some(p=>p.store===s));
  return <>
    <ReportPage title="TOP 5 Store Drive Thru"><div className="store-double"><StoreTable data={data} year={ps[2].year} month={ps[2].month} theme="orange"/><StoreTable data={data} year={ps[1].year} month={ps[1].month} theme="blue"/></div></ReportPage>
    <ReportPage title="TOP 5 Store Drive Thru (Cont.)"><div className="store-cont"><StoreTable data={data} year={ps[0].year} month={ps[0].month} theme="green"/><div className="ppt-note"><b>หมายเหตุ:</b><br/>{repeated.length?<>Store ที่ติด Top 5 ซ้ำในช่วง {ps[0].label}, {ps[1].label}, {ps[2].label}:<br/>{repeated.map(s=><span key={s}>- {s}<br/></span>)}</>:<>ไม่พบ Store ติด Top 5 ซ้ำใน 3 เดือนล่าสุด</>}</div></div></ReportPage>
  </>;
}

function CasesPending({data}:{data:WorkbookData}){
  const h=pendingStatusHistory(data); const pending=pendingRows(data); const current=driveThru(currentMonth(data)); const statusPie=groupCount(current,r=>r.status);
  return <ReportPage title={`Cases Pending Drive Thru as of ${reportTitleMonth(data.period.year,data.period.month)}`}>
    <div className="pending-chart"><div className="chart-title">{reportTitleMonth(data.period.year,data.period.month)}</div><CountPie data={statusPie} height={280}/></div>
    <table className="ppt-table pending-history"><thead><tr><th>สถานะงาน</th><th colSpan={h.periods.length}>{data.period.year}</th><th>Grand Total</th></tr><tr><th></th>{h.periods.map(p=><th key={p.label}>{p.label}</th>)}<th></th></tr></thead><tbody>{h.rows.map(r=><tr key={r.status}><td>{r.status}</td>{r.values.map((v,i)=><td key={i}>{num(v)}</td>)}<td>{r.values.reduce((a,b)=>a+b,0)}</td></tr>)}<tr className="grand-row"><td>Grand Total</td>{h.totals.map((v,i)=><td key={i}>{v}</td>)}<td>{h.totals.reduce((a,b)=>a+b,0)}</td></tr><tr className="pending-row"><td>Pending</td>{h.pending.map((v,i)=><td key={i}>{num(v)}</td>)}<td>{pending.length}</td></tr></tbody></table>
  </ReportPage>;
}

function PendingTable({data}:{data:WorkbookData}){
  const m=waitingMatrix(data); const totals=m.devices.map(d=>m.rows.reduce((s,r)=>s+(r.devices.get(d)??0),0));
  return <ReportPage title={`Cases Drive Thru Pending as of ${reportTitleMonth(data.period.year,data.period.month)}`}>
    <table className="ppt-table waiting-table"><thead><tr><th>อัพเดทการ Waiting</th><th>ชื่อองค์กร</th>{m.devices.map(d=><th key={d}>{d}</th>)}<th>Total</th></tr></thead><tbody>{m.rows.map((r,i)=><tr key={`${r.waiting}-${r.store}`}><td className="waiting-red">{i===0||m.rows[i-1].waiting!==r.waiting?r.waiting:''}</td><td>{r.store}</td>{m.devices.map(d=><td key={d}>{num(r.devices.get(d)??0)}</td>)}<td>{r.total}</td></tr>)}<tr className="grand-row"><td>Total</td><td></td>{totals.map((v,i)=><td key={i}>{v}</td>)}<td>{m.rows.reduce((s,r)=>s+r.total,0)}</td></tr></tbody></table>
  </ReportPage>;
}

function DetailPending({data}:{data:WorkbookData}){
  const rows=pendingRows(data);
  return <ReportPage title={`Detail Cases Drive Thru Pending as of ${reportTitleMonth(data.period.year,data.period.month)}`}>
    <Table compact className="pending-detail" headers={['Year','Months','สถานะงาน','ชื่อองค์กร','หมายเลขงานอ้างอิง','หัวข้อปัญหา','ประเภทการแก้ไขย่อย','อัพเดทการ Waiting','Grand Total']} rows={rows.map(r=>[r.year??'',monthName(r.month),r.status,r.organization,r.referenceNo,cellText(r.subject,115),r.resolutionSubType||r.issueSubType,<span className="waiting-red">{r.waitingCategory}</span>,1])}/>
  </ReportPage>;
}

export function ReportContent({tab,data}:{tab:ReportTab;data:WorkbookData}){
  switch(tab){
    case 'Received Cases Trend': return <ReceivedCasesTrend data={data}/>;
    case 'จำแนก Type': return <ClassifyType data={data}/>;
    case 'Cases Type + Warraty': return <CasesTypeWarranty data={data}/>;
    case 'Category ALL': return <CategoryAll data={data}/>;
    case 'Warranty ปีที่ 1': return <WarrantyMatrixPage data={data}/>;
    case 'Warranty ปีที่ 2': return <WarrantyRowsPage data={data} cls="Warranty ปีที่ 2"/>;
    case 'รายละเอียด Warranty ปีที่ 1': return <WarrantyCombined data={data}/>;
    case 'Warranty ปีที่ 3': return <WarrantyRowsPage data={data} cls="Warranty ปีที่ 3"/>;
    case 'Out Warranty': return <OutWarranty data={data}/>;
    case 'TOP 5 Category': return <Top5Category data={data}/>;
    case 'ผลต่าง Ref.รายปี': return <YearDelta data={data}/>;
    case 'TOP 5 Store': return <Top5Store data={data}/>;
    case 'Cases Pending Ditto': return <CasesPending data={data}/>;
    case 'Pending Table': return <PendingTable data={data}/>;
    case 'Detail Pending ': return <DetailPending data={data}/>;
  }
}
