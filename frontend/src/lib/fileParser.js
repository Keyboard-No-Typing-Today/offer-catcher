async function getPdfJs() {
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const worker = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
  lib.GlobalWorkerOptions.workerSrc = worker;
  return lib;
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.markdown'];

export function extensionOf(name = '') {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

export function isAcceptedFile(file) {
  if (!file) return false;
  return ACCEPTED_EXTENSIONS.includes(extensionOf(file.name));
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsArrayBuffer(file);
  });
}

async function extractPdf(file) {
  const pdfjsLib = await getPdfJs();
  const buffer = await readAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });
  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (error) {
    throw new Error('PDF 打不开，可能设置了密码或文件已损坏。');
  }
  const pages = [];
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();
    let text = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      text += item.str;
      text += item.hasEOL ? '\n' : ' ';
    }
    pages.push(text.trim());
    page.cleanup();
  }
  try {
    await loadingTask.destroy();
  } catch {
    /* some pdf.js versions handle cleanup internally */
  }
  return pages.filter(Boolean).join('\n\n');
}

async function extractDocx(file) {
  const JSZip = (await import('jszip')).default;
  const buffer = await readAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) throw new Error('不是有效的 DOCX 文件。');
  const xml = await documentFile.async('string');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const paragraphs = Array.from(doc.getElementsByTagNameNS(ns, 'p'));
  const lines = paragraphs.map((paragraph) => {
    const texts = Array.from(paragraph.getElementsByTagNameNS(ns, 't'));
    return texts.map((node) => node.textContent || '').join('');
  }).filter((line) => line.trim());
  return lines.join('\n');
}

export async function extractTextFromFile(file) {
  if (!file) throw new Error('请选择文件。');
  if (!isAcceptedFile(file)) throw new Error('仅支持 PDF、DOCX、TXT、Markdown 文件。');
  if (file.size > MAX_FILE_BYTES) throw new Error('文件超过 10MB，请压缩后再试。');

  const extension = extensionOf(file.name);
  let text = '';

  if (extension === '.pdf') text = await extractPdf(file);
  else if (extension === '.docx') text = await extractDocx(file);
  else text = await file.text();

  const cleaned = String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00a0\u3000]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length < 30) {
    throw new Error('没有读到足够的文字。扫描版 PDF 请先转成可复制文字的 PDF，或直接粘贴文本。');
  }
  return {
    text: cleaned,
    fileName: file.name,
    fileType: file.type || extension,
    size: file.size,
  };
}

export async function extractTextFromName(name, text) {
  return {
    text: String(text || '').trim(),
    fileName: name || '粘贴的文本',
    fileType: extensionOf(name) || 'text/plain',
    size: String(text || '').length,
  };
}