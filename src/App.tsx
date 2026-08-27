import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Loader2, RotateCcw, ShieldCheck, UploadCloud } from 'lucide-react';
import { parseQsaWorkbook } from './lib/excel';
import { exportReportPdf } from './lib/exportPdf';
import { regressionSnapshot, reportTitleMonth } from './lib/reportEngine';
import { REPORT_TABS, ReportContent } from './components/Reports';
import type { WorkbookData } from './types';

export default function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [data, setData] = useState<WorkbookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  const snapshot = useMemo(() => (data ? regressionSnapshot(data) : null), [data]);
  const sampleMatch = data?.period.year === 2026 && data?.period.month === 6 && snapshot
    ? snapshot.currentTotal === 30
      && snapshot.warranty['Out Warranty'] === 25
      && snapshot.warranty['Warranty ปีที่ 1'] === 3
      && snapshot.warranty['Warranty ปีที่ 2'] === 2
      && snapshot.pending === 9
    : null;

  async function loadFile(file: File) {
    if (!/\.xlsx?$/i.test(file.name)) {
      setError('รองรับไฟล์ Excel .xlsx / .xls เท่านั้น');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const parsed = await parseQsaWorkbook(file);
      setData(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อ่านไฟล์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function exportAll() {
    if (!data) return;
    const pages = [...document.querySelectorAll<HTMLElement>('#report-book [data-report-page]')];
    if (!pages.length) return;
    setExporting(true);
    try {
      await exportReportPdf(
        pages,
        `QSA_Monthly_Report_${reportTitleMonth(data.period.year, data.period.month)}.pdf`,
      );
    } finally {
      setExporting(false);
    }
  }

  if (!data) {
    return (
      <main className="landing">
        <div className="landing-card">
          <img src="/ditto-logo.png" className="app-logo-image" alt="Ditto Data Intelligence" />
          <p className="overline">HELPDESK QSA</p>
          <h1>QSA Monthly Report Generator</h1>
          <p className="lead">อัปโหลด raw data จากระบบ แล้วสร้างตาราง กราฟ และ PDF ตาม Excel/PPT Monthly QSA โดยอัตโนมัติ</p>
          <div
            className={`dropzone ${drag ? 'drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const file = e.dataTransfer.files[0];
              if (file) void loadFile(file);
            }}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? <Loader2 className="spin" size={42} /> : <UploadCloud size={42} />}
            <strong>{loading ? 'กำลังอ่านและคำนวณรายงาน…' : 'วางไฟล์ Excel ที่นี่ หรือคลิกเพื่อเลือกไฟล์'}</strong>
            <span>หา tab “Worksheet” อัตโนมัติ · ตารางและกราฟสร้างจาก raw data · ประมวลผลใน Browser</span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void loadFile(file);
              }}
            />
          </div>
          {error && <div className="error-box"><AlertTriangle size={18} />{error}</div>}
          <div className="privacy-note"><ShieldCheck size={18} /><span><b>Client-side only:</b> raw helpdesk data อยู่ในเครื่องของผู้ใช้ การสร้างรายงานและ PDF ทำใน browser</span></div>
        </div>
      </main>
    );
  }

  return (
    <main className="report-app">
      <header className="report-toolbar">
        <div className="report-toolbar-title">
          <p className="overline">MONTHLY QSA REPORT</p>
          <h1>{reportTitleMonth(data.period.year, data.period.month)}</h1>
          <div className="report-meta">
            {data.fileName} · {data.rows.length.toLocaleString('en-US')} records · {data.sheetName} · {REPORT_TABS.length} pages
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="button secondary" onClick={() => { setData(null); setError(''); }}>
            <RotateCcw size={17} /> Upload new file
          </button>
          <button className="button primary" onClick={exportAll} disabled={exporting}>
            {exporting ? <Loader2 className="spin" size={17} /> : <Download size={17} />}
            Export PDF
          </button>
        </div>
      </header>

      {data.warnings.length > 0 && (
        <div className="warning-strip report-status-strip">
          <AlertTriangle size={17} />
          <div>{data.warnings.map((warning, i) => <span key={i}>{warning}</span>)}</div>
        </div>
      )}

      {sampleMatch !== null && (
        <div className={`validation-strip report-status-strip ${sampleMatch ? 'ok' : 'bad'}`}>
          {sampleMatch ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          <span>{sampleMatch
            ? 'Jun-2026 regression check ผ่าน: 30 cases / Warranty 3-2-0-25 / Pending 9 ตรงกับไฟล์ตัวอย่าง'
            : 'Jun-2026 regression check ไม่ตรงกับ baseline — ควรตรวจรูปแบบ raw data หรือ classification columns'}</span>
        </div>
      )}

      <section id="report-book" className="report-book" aria-label="QSA monthly report pages">
        {REPORT_TABS.map((tab, index) => (
          <div className="report-page-shell" key={tab}>
            <div className="report-page-number">Page {index + 1} / {REPORT_TABS.length}</div>
            <ReportContent tab={tab} data={data} />
          </div>
        ))}
      </section>
    </main>
  );
}
