export async function exportReportPdf(elements: HTMLElement[], fileName: string): Promise<void> {
  if (!elements.length) return;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

  let pdf: InstanceType<typeof jsPDF> | null = null;
  for (let i = 0; i < elements.length; i += 1) {
    const el = elements[i];
    const canvas = await html2canvas(el, {
      scale: 1.6,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: Math.max(el.scrollWidth, 1200),
    });
    const orientation = el.dataset.orientation === 'portrait' ? 'portrait' : 'landscape';
    const width = orientation === 'landscape' ? 297 : 210;
    const height = orientation === 'landscape' ? 210 : 297;
    if (!pdf) pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
    else pdf.addPage('a4', orientation);

    const margin = 7;
    const maxW = width - margin * 2;
    const maxH = height - margin * 2;
    const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
    const imgW = canvas.width * scale;
    const imgH = canvas.height * scale;
    const x = (width - imgW) / 2;
    const y = (height - imgH) / 2;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', x, y, imgW, imgH, undefined, 'FAST');
  }
  pdf?.save(fileName);
}
