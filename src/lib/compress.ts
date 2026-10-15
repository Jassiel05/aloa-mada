/**
 * Compression automatique dans le navigateur, avant tout envoi :
 * le membre n'a rien à faire, les fichiers arrivent déjà légers sur le serveur.
 */

const KB = 1024;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("conversion"))), type, quality),
  );
}

/** Abaisse la qualité jusqu'à passer sous `maxBytes` (sans descendre sous `minQuality`). */
async function encodeUnder(canvas: HTMLCanvasElement, maxBytes: number, start = 0.82, minQuality = 0.5) {
  // WebP quand le navigateur sait l'encoder (Chrome, Firefox, Edge), sinon JPEG (Safari)
  let type = "image/webp";
  let q = start;
  let blob = await canvasToBlob(canvas, type, q);
  if (blob.type !== "image/webp") {
    type = "image/jpeg";
    blob = await canvasToBlob(canvas, type, q);
  }
  while (blob.size > maxBytes && q > minQuality) {
    q = Math.max(minQuality, q - 0.08);
    blob = await canvasToBlob(canvas, type, q);
  }
  return blob;
}

async function loadBitmap(file: Blob) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

/** Photo portrait : recadrée au centre en 4:5 (720×900), moins de 120 Ko. */
export async function compressPortrait(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const W = 720;
  const H = 900;
  const ratio = W / H;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (sw / sh > ratio) sw = sh * ratio;
  else sh = sw / ratio;
  const sx = (bitmap.width - sw) / 2;
  const sy = Math.max(0, (bitmap.height - sh) / 3); // garde le visage, légèrement vers le haut
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, W, H);
  bitmap.close();
  return encodeUnder(canvas, 120 * KB);
}

// ---------------------------------------------------------------------------
// CV
// ---------------------------------------------------------------------------

export const CV_MAX_BYTES = 2 * 1024 * KB; // limite du serveur, après compression
const CV_GOOD_ENOUGH = 600 * KB; // en dessous, on garde le PDF d'origine (texte sélectionnable)
const CV_MAX_PAGES = 6;
const A4 = { w: 595.28, h: 841.89 };

export type CvResult = { blob: Blob; before: number; after: number; pages: number };

export class CvError extends Error {}

function jpegFromCanvas(canvas: HTMLCanvasElement, quality: number) {
  return canvasToBlob(canvas, "image/jpeg", quality);
}

async function imagesToPdf(pages: { jpeg: Uint8Array; width: number; height: number; pageW: number; pageH: number }[]) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  for (const p of pages) {
    const img = await doc.embedJpg(p.jpeg);
    const page = doc.addPage([p.pageW, p.pageH]);
    page.drawImage(img, { x: 0, y: 0, width: p.pageW, height: p.pageH });
  }
  doc.setProducer("Aloa-Mada");
  return new Blob([new Uint8Array(await doc.save({ useObjectStreams: true }))], { type: "application/pdf" });
}

/** Photo ou scan d'un CV (JPG, PNG) → PDF d'une page, léger. */
async function imageToPdf(file: File) {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, 1400 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let q = 0.78;
  let jpeg = await jpegFromCanvas(canvas, q);
  while (jpeg.size > 450 * KB && q > 0.5) {
    q -= 0.08;
    jpeg = await jpegFromCanvas(canvas, q);
  }
  const pageW = A4.w;
  const pageH = (canvas.height / canvas.width) * A4.w;
  return imagesToPdf([{ jpeg: new Uint8Array(await jpeg.arrayBuffer()), width: canvas.width, height: canvas.height, pageW, pageH }]);
}

/** Réenregistrement sans perte (structure compactée). */
async function losslessPdf(bytes: ArrayBuffer) {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    return { blob: new Blob([new Uint8Array(await doc.save({ useObjectStreams: true }))], { type: "application/pdf" }), pages: doc.getPageCount() };
  } catch {
    return null;
  }
}

/** Dernier recours pour les PDF très lourds (scans, photos) : pages ré-imprimées en images compressées. */
async function rasterPdf(bytes: ArrayBuffer, targetWidth: number, quality: number) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.min.mjs");
  // Le moteur PDF tourne dans la page (pas de fichier « worker » séparé à héberger)
  const worker = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  (globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)), isEvalSupported: false }).promise;
  const count = Math.min(doc.numPages, CV_MAX_PAGES);
  const pages = [];
  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: targetWidth / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const jpeg = await jpegFromCanvas(canvas, quality);
    pages.push({ jpeg: new Uint8Array(await jpeg.arrayBuffer()), width: canvas.width, height: canvas.height, pageW: base.width, pageH: base.height });
    page.cleanup();
  }
  await doc.destroy();
  return { blob: await imagesToPdf(pages), pages: count, truncated: doc.numPages > CV_MAX_PAGES };
}

/**
 * Prépare un CV : PDF ou photo du CV → PDF le plus léger possible.
 * 1. PDF déjà léger : gardé tel quel (le texte reste sélectionnable).
 * 2. Sinon, compactage sans perte.
 * 3. Toujours trop lourd : pages converties en images compressées (≈ 150 dpi).
 */
export async function prepareCv(file: File): Promise<CvResult> {
  const before = file.size;
  if (file.type.startsWith("image/")) {
    const blob = await imageToPdf(file);
    return { blob, before, after: blob.size, pages: 1 };
  }

  const bytes = await file.arrayBuffer();
  const head = new TextDecoder().decode(new Uint8Array(bytes.slice(0, 1024)));
  if (!head.includes("%PDF")) throw new CvError("Ce fichier n'est pas un PDF valide.");

  let best: { blob: Blob; pages: number } = { blob: new Blob([bytes], { type: "application/pdf" }), pages: 0 };
  if (before > CV_GOOD_ENOUGH) {
    const lossless = await losslessPdf(bytes);
    if (lossless && lossless.blob.size < best.blob.size) best = lossless;
  }

  if (best.blob.size > CV_GOOD_ENOUGH) {
    for (const [width, quality] of [[1240, 0.72], [1000, 0.6]] as const) {
      try {
        const raster = await rasterPdf(bytes, width, quality);
        if (raster.blob.size < best.blob.size) best = raster;
        if (best.blob.size <= CV_GOOD_ENOUGH) break;
      } catch (e) {
        console.warn("[cv] conversion en images impossible", e);
        break; // PDF protégé ou illisible : on garde la meilleure version obtenue
      }
    }
  }

  if (best.blob.size > CV_MAX_BYTES) {
    throw new CvError("Ce CV reste trop lourd, même compressé. Exportez-le à nouveau en PDF standard, ou envoyez une photo du CV.");
  }
  return { blob: best.blob, before, after: best.blob.size, pages: best.pages };
}

export function formatSize(bytes: number) {
  return bytes >= 1024 * KB
    ? `${(bytes / (1024 * KB)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(bytes / KB))} Ko`;
}
