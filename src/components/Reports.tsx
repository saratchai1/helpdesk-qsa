import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CountItem, QsaRow, WorkbookData } from '../types';
import {
  THAI_MONTHS,
  categoryTrend,
  currentMonth,
  driveThru,
  groupCount,
  lastNPeriods,
  monthLabel,
  pendingRows,
  pendingSummary,
  reportTitleMonth,
  timeline,
  topCategoryTable,
  topStores,
  waitingMatrix,
  warrantyBreakdown,
  warrantyRows,
  yearComparison,
} from '../lib/reportEngine';

const COLORS = ['#4472C4', '#ED7D31', '#70AD47', '#FFC000', '#5B9BD5', '#A5A5A5', '#264478', '#9E480E', '#43682B', '#997300'];

export const REPORT_TABS = [
  'Received Cases Trend',
  'จำแนก Type',
  'Cases Type + Warraty',
  'Category ALL',
  'Warranty ปีที่ 1',
  'Warranty ปีที่ 2',
  'รายละเอียด Warranty ปีที่ 1',
  'Warranty ปีที่ 3',
  'Out Warranty',
  'TOP 5 Category',
  'ผลต่าง Ref.รายปี',
  'TOP 5 Store',
  'Cases Pending Ditto',
  'Pending Table',
  'Detail Pending ',
] as const;

export type ReportTab = (typeof REPORT_TABS)[number];

function ReportPage({
  title,
  subtitle,
  children,
  orientation = 'landscape',
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  orientation?: 'landscape' | 'portrait';
  className?: string;
}) {
  return (
    <section className={`report-page ${className}`} data-report-page data-orientation={orientation}>
      <header className="report-titlebar">
        <div>
          <div className="report-eyebrow">QSA Monthly Report</div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="report-brand">DITTO · QSA</div>
      </header>
      {children}
      <footer className="report-footer">Generated from uploaded Worksheet · calculations reproduced from the Excel monthly report logic</footer>
    </section>
  );
}

function Kpi({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="kpi-card"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function KpiRow({ children }: { children: React.ReactNode }) {
  return <div className="kpi-row">{children}</div>;
}

function Table({ headers, rows, compact = false }: { headers: string[]; rows: React.ReactNode[][]; compact?: boolean }) {
  return (
    <div className={`table-wrap ${compact ? 'compact' : ''}`}>
      <table>
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>) : <tr><td colSpan={headers.length} className="empty-cell">ไม่มีข้อมูลในงวดนี้</td></tr>}</tbody>
      </table>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="report-section"><h3>{title}</h3>{children}</div>;
}

function CountBars({ data, height = 280 }: { data: CountItem[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 55 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" name="Cases" fill="#4472C4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieBlock({ data, height = 270 }: { data: CountItem[]; height?: number }) {
  const filtered = data.filter((x) => x.value > 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="name" cx="50%" cy="48%" outerRadius="78%" label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}`} labelLine>
          {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function formatPct(n: number) { return `${(n * 100).toFixed(1)}%`; }
function cellText(value: string, max = 130) { return value.length > max ? `${value.slice(0, max)}…` : value; }

function ReceivedCasesTrend({ data }: { data: WorkbookData }) {
  const tl = timeline(data.rows, data.period.year, data.period.month);
  const last3 = tl.slice(-3);
  const current = currentMonth(data);
  const resolved = current.filter((r) => r.status === 'Resolved').length;
  const pending = current.length - resolved;
  const channels = groupCount(current, (r) => r.channel);
  const team = groupCount(current, (r) => r.serviceDeskTeam);
  return (
    <ReportPage title="Received Cases Trend Summary" subtitle={`Cases Trend · ${reportTitleMonth(data.period.year, data.period.month)}`}>
      <KpiRow><Kpi label="Received" value={current.length} /><Kpi label="Resolved" value={resolved} /><Kpi label="Pending" value={pending} /><Kpi label="% Received" value="100%" /></KpiRow>
      <div className="grid-2">
        <Section title="Received Cases Trend (Last 3 Months)">
          <ResponsiveContainer width="100%" height={285}>
            <BarChart data={last3}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="received" name="Received" fill="#4472C4"/><Bar dataKey="abandon" name="Abandon" fill="#ED7D31"/></BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Monthly Case Trend">
          <ResponsiveContainer width="100%" height={285}>
            <LineChart data={tl}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label" interval={Math.max(0, Math.floor(tl.length / 8))}/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="total" name="Cases" stroke="#4472C4" strokeWidth={2.5}/></LineChart>
          </ResponsiveContainer>
        </Section>
      </div>
      <div className="grid-2 small-gap"><Section title="Channel"><Table compact headers={['Channel','Cases']} rows={channels.map(x=>[x.name,x.value])}/></Section><Section title="ServiceDesk Team"><Table compact headers={['Team','Cases']} rows={team.map(x=>[x.name,x.value])}/></Section></div>
    </ReportPage>
  );
}

function ClassifyType({ data }: { data: WorkbookData }) {
  const rows = currentMonth(data);
  const teams = groupCount(rows, (r) => r.serviceDeskTeam);
  const projects = groupCount(rows, (r) => r.project.startsWith('Warranty') ? 'Warranty' : r.project);
  const issueTypes = groupCount(rows, (r) => r.issueType);
  const warranty = warrantyBreakdown(data);
  return <ReportPage title="จำแนก Type" subtitle={`${THAI_MONTHS[data.period.month - 1]} ${data.period.year}`}>
    <KpiRow><Kpi label="Total Cases" value={rows.length}/>{teams.slice(0,3).map(x=><Kpi key={x.name} label={x.name} value={x.value}/>)}</KpiRow>
    <div className="grid-2"><Section title="Project / Contract Type"><CountBars data={projects}/></Section><Section title="Issue Type"><CountBars data={issueTypes}/></Section></div>
    <Section title="Warranty Classification"><Table compact headers={['Warranty','Cases']} rows={warranty.map(x=>[x.name,x.value])}/></Section>
  </ReportPage>;
}

function CasesTypeWarranty({ data }: { data: WorkbookData }) {
  const periods = lastNPeriods(data.period.year, data.period.month, 3);
  const byMonth = periods.map(p => {
    const rs = data.rows.filter(r=>r.year===p.year&&r.month===p.month);
    return {
      period:p.label,
      PerCall:rs.filter(r=>r.project==='PerCall').length,
      Warranty:rs.filter(r=>r.project.startsWith('Warranty')).length,
      TCC:rs.filter(r=>r.serviceDeskTeam==='TCC').length,
      Ditto:rs.filter(r=>r.serviceDeskTeam==='Ditto').length,
    };
  });
  const wb = warrantyBreakdown(data);
  const current = currentMonth(data);
  return <ReportPage title="Cases Type + Warraty" subtitle={`${reportTitleMonth(data.period.year, data.period.month)} · Type / Warranty Summary`}>
    <KpiRow><Kpi label="Total" value={current.length}/><Kpi label="PerCall" value={current.filter(r=>r.project==='PerCall').length}/><Kpi label="Warranty Project" value={current.filter(r=>r.project.startsWith('Warranty')).length}/><Kpi label="Drive thru" value={current.filter(r=>r.issueType==='Drive thru').length}/></KpiRow>
    <div className="grid-2"><Section title="Cases Type (Last 3 Months)"><ResponsiveContainer width="100%" height={285}><BarChart data={byMonth}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="PerCall" fill="#4472C4"/><Bar dataKey="Warranty" fill="#ED7D31"/></BarChart></ResponsiveContainer></Section><Section title="Warranty Breakdown"><PieBlock data={wb}/></Section></div>
    <Section title="ServiceDesk Team (Last 3 Months)"><Table compact headers={['Month','TCC','Ditto','Total']} rows={byMonth.map(x=>[x.period,x.TCC,x.Ditto,x.TCC+x.Ditto])}/></Section>
  </ReportPage>;
}

function CategoryAll({ data }: { data: WorkbookData }) {
  const trend = categoryTrend(data, 3);
  const current = groupCount(driveThru(currentMonth(data)), (r) => r.issueSubType);
  return <ReportPage title="Category ALL" subtitle={`Drive Thru · ${reportTitleMonth(data.period.year, data.period.month)}`}>
    <div className="grid-2 wide-left"><Section title="Category Trend (3 Months)"><ResponsiveContainer width="100%" height={350}><LineChart data={trend.rows}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/>{trend.categories.map((c,i)=><Line key={c} type="monotone" dataKey={c} stroke={COLORS[i%COLORS.length]} strokeWidth={2}/>)}</LineChart></ResponsiveContainer></Section><Section title="Current Month"><Table compact headers={['Category','Cases']} rows={current.map(x=>[x.name,x.value])}/></Section></div>
  </ReportPage>;
}

function WarrantyDetailPage({ data, cls }: { data: WorkbookData; cls: QsaRow['warrantyClass'] }) {
  const rows = warrantyRows(data, cls);
  const byDevice = groupCount(rows, r => r.resolutionSubType || r.issueSubType);
  const byStatus = groupCount(rows, r => r.deviceStatus || 'ไม่ระบุ');
  const title = cls || 'Warranty';
  return <ReportPage title={title} subtitle={`${reportTitleMonth(data.period.year, data.period.month)} · ${rows.length} cases`}>
    <KpiRow><Kpi label={title} value={rows.length}/><Kpi label="อุปกรณ์เสีย" value={rows.filter(r=>r.deviceStatus==='อุปกรณ์เสีย').length}/><Kpi label="No" value={rows.filter(r=>r.deviceStatus==='No').length}/><Kpi label="Stores" value={new Set(rows.map(r=>r.organization)).size}/></KpiRow>
    <div className="grid-2 compact-charts"><Section title="ประเภทการแก้ไขย่อย"><CountBars data={byDevice.slice(0,8)} height={235}/></Section><Section title="อุปกรณ์เสีย/ไม่เสีย"><PieBlock data={byStatus} height={235}/></Section></div>
    <Section title="Case Detail"><Table compact headers={['Year Support','Month Support','ชื่อองค์กร','ประเภทการแก้ไขย่อย','อุปกรณ์เสีย/ไม่เสีย','หมายเลขงานอ้างอิง']} rows={rows.map(r=>[r.supportYear??'',r.supportMonth??'',r.organization,r.resolutionSubType||r.issueSubType,r.deviceStatus||'',r.referenceNo])}/></Section>
  </ReportPage>;
}

function WarrantyOneResolution({ data }: { data: WorkbookData }) {
  const rows = warrantyRows(data, 'Warranty ปีที่ 1');
  return <ReportPage title="รายละเอียด Warranty ปีที่ 1" subtitle={`Resolution detail · ${reportTitleMonth(data.period.year, data.period.month)}`}>
    <Section title="รายละเอียดการแก้ไข"><Table headers={['ประเภทการแก้ไขย่อย','รายละเอียดการแก้ไข','อุปกรณ์เสีย/ไม่เสีย','Count']} rows={rows.map(r=>[r.resolutionSubType||r.issueSubType,cellText(r.resolutionDetail,260),r.deviceStatus||'',1])}/></Section>
  </ReportPage>;
}

function Top5Category({ data }: { data: WorkbookData }) {
  const rows = topCategoryTable(data);
  const now = driveThru(currentMonth(data));
  const topCount = rows.reduce((s,r)=>s+r.current,0);
  const pie = [{name:'TOP 5 Category',value:topCount},{name:'Other Category',value:Math.max(0,now.length-topCount)}];
  const deltaPie = rows.map(r=>({name:r.category,value:Math.abs(r.delta)})).filter(x=>x.value>0);
  const periods=lastNPeriods(data.period.year,data.period.month,3);
  return <ReportPage title="TOP 5 Category" subtitle={`${reportTitleMonth(data.period.year, data.period.month)} · comparison with previous month`}>
    <div className="grid-3"><Section title="Top 5 vs Other"><PieBlock data={pie} height={245}/></Section><Section title="Top 5 Current Month"><PieBlock data={rows.map(r=>({name:r.category,value:r.current}))} height={245}/></Section><Section title="Absolute Change"><PieBlock data={deltaPie.length?deltaPie:[{name:'No change',value:1}]} height={245}/></Section></div>
    <Section title="TOP 5 Category"><Table compact headers={['Category',periods[0].label,periods[1].label,periods[2].label,`ผลต่าง ${periods[2].label}/${periods[1].label}`,'Grand Total']} rows={rows.map(r=>[r.category,r.previous2,r.previous,r.current,<span className={r.delta>0?'delta-up':r.delta<0?'delta-down':''}>{r.delta>0?'+':''}{r.delta}</span>,r.total3m])}/></Section>
  </ReportPage>;
}

function YearDelta({ data }: { data: WorkbookData }) {
  const cmp = yearComparison(data);
  const currentPie = cmp.rows.map(r=>({name:r.category,value:r.current}));
  const bars=cmp.rows.map(r=>({category:r.category,[String(data.period.year-1)]:Number((r.previousPct*100).toFixed(1)),[String(data.period.year)]:Number((r.currentPct*100).toFixed(1))}));
  return <ReportPage title="ผลต่าง Ref.รายปี" subtitle={`Jan-Dec ${data.period.year-1} vs Jan-${ENGMonth(data.period.month)} ${data.period.year}`}>
    <div className="grid-2"><Section title={`Jan-${ENGMonth(data.period.month)} ${data.period.year}`}><PieBlock data={currentPie} height={300}/></Section><Section title="Category Share Comparison"><ResponsiveContainer width="100%" height={300}><BarChart data={bars} layout="vertical" margin={{left:90}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" unit="%"/><YAxis dataKey="category" type="category" width={95} tick={{fontSize:10}}/><Tooltip/><Legend/><Bar dataKey={String(data.period.year-1)} fill="#A5A5A5"/><Bar dataKey={String(data.period.year)} fill="#4472C4"/></BarChart></ResponsiveContainer></Section></div>
    <Section title="Reference Table"><Table compact headers={['ประเภทการแจ้ง (ย่อย)',`ปี ${data.period.year-1}`,'% ',`ปี ${data.period.year}`,'%']} rows={cmp.rows.map(r=>[r.category,r.previous,formatPct(r.previousPct),r.current,formatPct(r.currentPct)])}/></Section>
  </ReportPage>;
}

function ENGMonth(month:number){ return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month-1]; }

function Top5Store({ data }: { data: WorkbookData }) {
  const stores = topStores(data);
  return <ReportPage title="TOP 5 Store" subtitle={`${reportTitleMonth(data.period.year, data.period.month)} · Drive thru`}>
    <div className="grid-2 wide-left"><Section title="Top 5 Store"><CountBars data={stores.map(s=>({name:s.store,value:s.total}))} height={340}/></Section><Section title="Store / Category Detail"><Table compact headers={['Store','ประเภทการแก้ไขย่อย','Total']} rows={stores.flatMap(s=>s.categories.map((c,i)=>[i===0?s.store:'',c.name,c.value]))}/></Section></div>
  </ReportPage>;
}

function CasesPending({ data }: { data: WorkbookData }) {
  const p = pendingSummary(data);
  const tl=timeline(data.rows.filter(r=>['Drive thru','All POS'].includes(r.issueType)),data.period.year,data.period.month);
  const currentPending=currentMonth(data).filter(r=>r.status!=='Resolved').length;
  return <ReportPage title={`Cases pending as of ${reportTitleMonth(data.period.year, data.period.month)}`} subtitle="Drive thru + All POS">
    <KpiRow><Kpi label="Pending as of period" value={p.rows.length}/><Kpi label="New pending this month" value={currentPending}/><Kpi label="Resolved this month" value={currentMonth(data).filter(r=>r.status==='Resolved').length}/><Kpi label="Pending stores" value={new Set(p.rows.map(r=>r.organization)).size}/></KpiRow>
    <div className="grid-2"><Section title="Monthly Resolved / Pending"><ResponsiveContainer width="100%" height={300}><BarChart data={tl}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" interval={Math.max(0,Math.floor(tl.length/8))}/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="resolved" name="Resolved" stackId="a" fill="#70AD47"/><Bar dataKey="pending" name="Pending" stackId="a" fill="#ED7D31"/></BarChart></ResponsiveContainer></Section><Section title={reportTitleMonth(data.period.year,data.period.month)}><PieBlock data={groupCount(currentMonth(data),r=>r.status)} height={300}/></Section></div>
  </ReportPage>;
}

function PendingTable({ data }: { data: WorkbookData }) {
  const m = waitingMatrix(data);
  return <ReportPage title={`Cases Drive Thru Pending as of ${reportTitleMonth(data.period.year, data.period.month)}`} subtitle="Waiting status / store / device">
    <Section title="Pending Table"><Table compact headers={['อัพเดทการ Waiting','ชื่อองค์กร',...m.devices,'Total']} rows={m.rows.map(r=>[r.waiting,r.store,...m.devices.map(d=>r.devices.get(d)??''),r.total])}/></Section>
  </ReportPage>;
}

function DetailPending({ data }: { data: WorkbookData }) {
  const rows=pendingRows(data);
  return <ReportPage title={`Cases Drive Thru Pending as of ${reportTitleMonth(data.period.year, data.period.month)}`} subtitle={`${rows.length} open / waiting cases`}>
    <Section title="Detail Pending"><Table compact headers={['Year','Months','สถานะงาน','ชื่อองค์กร','หมายเลขงานอ้างอิง','หัวข้อปัญหา','ประเภทการแก้ไขย่อย','อัพเดทการ Waiting']} rows={rows.map(r=>[r.year??'',r.month?ENGMonth(r.month):'',r.status,r.organization,r.referenceNo,cellText(r.subject,90),r.resolutionSubType||r.issueSubType,<><strong className="waiting-label">{r.waitingCategory}</strong><br/><span className="muted">{cellText(r.waitingUpdate,150)}</span></>])}/></Section>
  </ReportPage>;
}

export function ReportContent({ tab, data }: { tab: ReportTab; data: WorkbookData }) {
  switch(tab){
    case 'Received Cases Trend': return <ReceivedCasesTrend data={data}/>;
    case 'จำแนก Type': return <ClassifyType data={data}/>;
    case 'Cases Type + Warraty': return <CasesTypeWarranty data={data}/>;
    case 'Category ALL': return <CategoryAll data={data}/>;
    case 'Warranty ปีที่ 1': return <WarrantyDetailPage data={data} cls="Warranty ปีที่ 1"/>;
    case 'Warranty ปีที่ 2': return <WarrantyDetailPage data={data} cls="Warranty ปีที่ 2"/>;
    case 'รายละเอียด Warranty ปีที่ 1': return <WarrantyOneResolution data={data}/>;
    case 'Warranty ปีที่ 3': return <WarrantyDetailPage data={data} cls="Warranty ปีที่ 3"/>;
    case 'Out Warranty': return <WarrantyDetailPage data={data} cls="Out Warranty"/>;
    case 'TOP 5 Category': return <Top5Category data={data}/>;
    case 'ผลต่าง Ref.รายปี': return <YearDelta data={data}/>;
    case 'TOP 5 Store': return <Top5Store data={data}/>;
    case 'Cases Pending Ditto': return <CasesPending data={data}/>;
    case 'Pending Table': return <PendingTable data={data}/>;
    case 'Detail Pending ': return <DetailPending data={data}/>;
  }
}
