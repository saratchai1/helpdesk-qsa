async function waitForImages(root: HTMLElement): Promise<void> {
  const images = [...root.querySelectorAll<HTMLImageElement>('img')];
  await Promise.all(images.map(async (img) => {
    if (!img.complete || img.naturalWidth === 0) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    }
    if (typeof img.decode === 'function') {
      try { await img.decode(); } catch { /* capture whatever the browser rendered */ }
    }
  }));
}

export async function exportReportPdf(elements: HTMLElement[], fileName: string): Promise<void> {
  if (!elements.length) return;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

  let pdf: InstanceType<typeof jsPDF> | null = null;
  for (let i = 0; i < elements.length; i += 1) {
    const el = elements[i];
    await waitForImages(el);

    const canvas = await html2canvas(el, {
      scale: 1.6,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 10000,
      windowWidth: Math.max(el.scrollWidth, 1280),
      windowHeight: Math.max(el.scrollHeight, 720),
      onclone: (doc) => {
        doc.querySelectorAll<HTMLImageElement>('.ditto-logo-img').forEach((img) => {
          img.style.objectFit = 'contain';
          img.style.objectPosition = 'center';
          img.style.overflow = 'visible';
          img.style.maxWidth = 'none';
        });
      },
    });

    const orientation = el.dataset.orientation === 'portrait' ? 'portrait' : 'landscape';
    const width = orientation === 'landscape' ? 297 : 210;
    const height = orientation === 'landscape' ? 210 : 297;

    if (!pdf) pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
    else pdf.addPage('a4', orientation);

    const margin = 5;
    const maxW = width - margin * 2;
    const maxH = height - margin * 2;
    const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
    const imgW = canvas.width * scale;
    const imgH = canvas.height * scale;
    const x = (width - imgW) / 2;
    const y = (height - imgH) / 2;

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', x, y, imgW, imgH, undefined, 'FAST');
  }

  pdf?.save(fileName);
}
