// Draws a sample document on a canvas, encodes it as JPEG and wraps it in a PDF. Runs only in the browser.
import { tx } from '../../i18n/extra';
import type { Lang } from '../../utils/format';
import { buildPdf } from '../../utils/pdf';

export interface SampleDoc { ref: string; title: string; date: string; lang: Lang }

const W = 1240; // A4 at 150 dpi
const H = 1754;
const font = (weight: number, size: number) => `${weight} ${size}px "BBL Sans", system-ui, sans-serif`;

function drawPage(doc: SampleDoc): HTMLCanvasElement {
  const L = doc.lang;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('canvas unavailable');

  g.fillStyle = '#FFFFFF';
  g.fillRect(0, 0, W, H);

  // Header band with the prototype's own mark (not a third-party logo)
  g.fillStyle = '#0D2B5E';
  g.fillRect(0, 0, W, 230);
  g.fillStyle = '#1E8A63';
  g.beginPath(); g.arc(150, 115, 62, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3FB58A';
  g.beginPath(); g.ellipse(170, 96, 26, 14, -0.6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#FFFFFF';
  g.font = font(700, 54);
  g.fillText('BBL HI PRO', 250, 120);
  g.font = font(400, 28);
  g.fillStyle = '#C7D6F1';
  g.fillText(tx(L, 'pdf_brand_sub'), 250, 168);

  // Heading and rows
  g.fillStyle = '#141B2D';
  g.font = font(700, 58);
  g.fillText(tx(L, 'pdf_heading'), 110, 360);
  const rows: [string, string][] = [
    [tx(L, 'pdf_applicant'), tx(L, 'pdf_applicant_name')],
    [tx(L, 'pdf_row_ref'), doc.ref],
    [tx(L, 'pdf_row_type'), doc.title],
    [tx(L, 'pdf_row_date'), doc.date],
    [tx(L, 'pdf_row_status'), tx(L, 'pdf_status_ready')],
  ];
  let y = 480;
  rows.forEach(([label, value]) => {
    g.strokeStyle = '#E6E4DC';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(110, y + 40); g.lineTo(W - 110, y + 40); g.stroke();
    g.font = font(400, 34);
    g.fillStyle = '#5F6878';
    g.fillText(label, 110, y);
    g.font = font(700, 36);
    g.fillStyle = '#141B2D';
    g.fillText(value, 520, y);
    y += 110;
  });

  // Diagonal watermark: this is not a real document
  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(-Math.PI / 6);
  g.textAlign = 'center';
  g.font = font(800, 130);
  g.fillStyle = 'rgba(201,150,58,0.16)';
  g.fillText(tx(L, 'pdf_watermark'), 0, 0);
  g.restore();

  g.textAlign = 'left';
  g.font = font(400, 28);
  g.fillStyle = '#5F6878';
  g.fillText(tx(L, 'pdf_footer'), 110, H - 120);
  return canvas;
}

/** Builds the PDF and starts a download. The file is watermarked as a simulated sample. */
export async function downloadSamplePdf(doc: SampleDoc): Promise<void> {
  try {
    await document.fonts.load('700 40px "BBL Sans"');
    await document.fonts.load('400 28px "BBL Sans"');
  } catch {
    // Fall back to the browser's own Thai-capable fonts.
  }
  const canvas = drawPage(doc);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('jpeg encode failed'))), 'image/jpeg', 0.92));
  const pdf = buildPdf(new Uint8Array(await blob.arrayBuffer()), W, H);
  const url = URL.createObjectURL(new Blob([pdf.buffer as ArrayBuffer], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.ref}-sample.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
