async function waitForImages(root: HTMLElement): Promise<void> {
  const images = [...root.querySelectorAll<HTMLImageElement>('img')];
  await Promise.all(images.map(async (img) => {
    if (img.complete && img.naturalWidth > 0) {
      if (typeof img.decode === 'function') {
        try { await img.decode(); } catch { /* browser already has a rendered image */ }
      }
      return;
    }

    await Promise.race([
      new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]);
  }));
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function exportReportPdf(
  elements: HTMLElement[],
  fileName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  if (!elements.length) throw new Error('ไม่พบหน้ารายงานสำหรับ export');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const pageW = 297;
  const pageH = 210;
  const margin = 4;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;

  for (let i = 0; i < elements.length; i += 1) {
    const el = elements[i];
    await waitForImages(el);
    await nextFrame();

    const canvas = await html2canvas(el, {
      scale: 1,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 5000,
      width: 1280,
      height: 720,
      windowWidth: 1280,
      windowHeight: 720,
      onclone: (doc) => {
        doc.querySelectorAll<HTMLElement>('.report-page').forEach((page) => {
          page.style.boxShadow = 'none';
          page.style.border = '0';
        });
        doc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
          img.style.visibility = 'visible';
          img.style.opacity = '1';
        });
      },
    });

    if (i > 0) pdf.addPage('a4', 'landscape');

    const fit = Math.min(maxW / canvas.width, maxH / canvas.height);
    const imgW = canvas.width * fit;
    const imgH = canvas.height * fit;
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;
    const imageData = canvas.toDataURL('image/jpeg', 0.82);

    pdf.addImage(imageData, 'JPEG', x, y, imgW, imgH, undefined, 'FAST');

    canvas.width = 1;
    canvas.height = 1;
    onProgress?.(i + 1, elements.length);
    await nextFrame();
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
