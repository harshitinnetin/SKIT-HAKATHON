import path from 'path';
import { createRequire } from 'module';
import { createWorker } from 'tesseract.js';
import prisma from '../config/prisma.js';
import openrouter from '../config/openrouter.js';
import { runDocumentIntelligence, scanQRCode } from '../services/intelligenceService.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const PDFJS = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

PDFJS.disableWorker = true;

const CHUNK_SIZE = 500; // words per chunk
const CHUNK_OVERLAP = 50;
const MAX_OCR_PAGES = 30; // Limit max pages for OCR to prevent production memory spikes

// --- Tesseract Worker Singleton with Auto-Idle Cleanup ---
let ocrWorker = null;
let ocrWorkerIdleTimer = null;

const getOCRWorker = async () => {
  if (ocrWorkerIdleTimer) {
    clearTimeout(ocrWorkerIdleTimer);
    ocrWorkerIdleTimer = null;
  }
  if (!ocrWorker) {
    console.log('Initializing shared Tesseract OCR worker...');
    ocrWorker = await createWorker('eng');
  }
  return ocrWorker;
};

const scheduleWorkerIdleCleanup = () => {
  if (ocrWorkerIdleTimer) clearTimeout(ocrWorkerIdleTimer);
  ocrWorkerIdleTimer = setTimeout(async () => {
    if (ocrWorker) {
      console.log('Terminating idle Tesseract worker to free memory...');
      try {
        await ocrWorker.terminate();
      } catch (err) {
        console.warn('Tesseract worker cleanup error:', err.message);
      }
      ocrWorker = null;
    }
  }, 60000);
};

// Split text into overlapping chunks
const chunkText = (text) => {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    const chunkWords = words.slice(start, end);
    chunks.push(chunkWords.join(' '));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
    if (start >= words.length) break;
  }

  return chunks;
};

// Generate embedding for a text chunk
const generateEmbedding = async (text) => {
  try {
    const response = await openrouter.embeddings.create({
      model: 'openai/text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error.message);
    return null;
  }
};

// Extract text from digital PDF buffer
const extractPDFText = async (buffer) => {
  const data = await pdfParse(buffer);
  return { text: data.text, pageCount: data.numpages, isScanned: false };
};

// Extract page images from PDF for scanned document OCR
const extractPDFPageImages = async (pdfBuffer) => {
  const images = [];
  try {
    const loadingTask = PDFJS.getDocument({ data: new Uint8Array(pdfBuffer) });
    const doc = await loadingTask.promise;
    const numPages = Math.min(doc.numPages, MAX_OCR_PAGES);

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const opList = await page.getOperatorList();
        let pageExtracted = false;

        for (let j = 0; j < opList.fnArray.length; j++) {
          const fn = opList.fnArray[j];
          if (
            fn === PDFJS.OPS.paintImageXObject ||
            fn === PDFJS.OPS.paintInlineImageXObject ||
            fn === PDFJS.OPS.paintJpegXObject
          ) {
            const imgName = opList.argsArray[j][0];
            const imgObj = await new Promise((resolve) => {
              page.objs.get(imgName, (obj) => resolve(obj));
            });

            if (imgObj) {
              if (imgObj.data && imgObj.width && imgObj.height) {
                images.push({
                  type: 'raw',
                  raw: {
                    data: Buffer.from(imgObj.data),
                    width: imgObj.width,
                    height: imgObj.height,
                    channels: 4,
                  },
                });
                pageExtracted = true;
                break;
              } else if (imgObj.src) {
                const base64Data = imgObj.src.replace(/^data:image\/\w+;base64,/, '');
                images.push({ type: 'buffer', buffer: Buffer.from(base64Data, 'base64') });
                pageExtracted = true;
                break;
              }
            }
          }
        }
      } catch (pageErr) {
        console.warn(`Page ${i} image extraction warning:`, pageErr.message);
      }
    }

    if (doc.destroy) doc.destroy();
  } catch (err) {
    console.warn('PDFJS operator image extraction error:', err.message);
  }

  // Fallback: scan binary stream for embedded JPEG markers if operator list yielded no images
  if (images.length === 0) {
    console.log('PDFJS operator list yielded 0 images. Scanning PDF binary stream for embedded JPEG markers...');
    let offset = 0;
    while (offset < pdfBuffer.length && images.length < MAX_OCR_PAGES) {
      const start = pdfBuffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]), offset);
      if (start === -1) break;
      const end = pdfBuffer.indexOf(Buffer.from([0xff, 0xd9]), start + 3);
      if (end === -1) break;

      const jpegBuf = pdfBuffer.slice(start, end + 2);
      if (jpegBuf.length > 1024) {
        images.push({ type: 'buffer', buffer: jpegBuf });
      }
      offset = end + 2;
    }
    if (images.length > 0) {
      console.log(`Extracted ${images.length} embedded JPEG image(s) from PDF binary.`);
    }
  }

  return images;
};

// Perform OCR on single image object or buffer
const performOCR = async (imageInput) => {
  const worker = await getOCRWorker();
  let result;
  if (imageInput.type === 'raw') {
    result = await worker.recognize(imageInput.raw);
  } else if (imageInput.type === 'buffer') {
    result = await worker.recognize(imageInput.buffer);
  } else {
    // Direct Buffer input for PNG/JPEG image files
    result = await worker.recognize(imageInput);
  }
  return {
    text: result.data.text || '',
    confidence: result.data.confidence || 0,
  };
};

// Extract text from scanned image or scanned PDF buffer using OCR
const extractOCRText = async (buffer, isPDF = false) => {
  let combinedText = '';
  const confidences = [];
  let pageCount = 1;

  try {
    if (isPDF) {
      console.log('Extracting images from scanned PDF pages for OCR...');
      const pageImages = await extractPDFPageImages(buffer);

      if (pageImages.length === 0) {
        console.warn('No images could be extracted from scanned PDF.');
        return { text: '', pageCount: 1, isScanned: true, ocrConfidence: 0 };
      }

      pageCount = pageImages.length;
      console.log(`Performing OCR on ${pageCount} scanned page image(s)...`);

      for (let i = 0; i < pageImages.length; i++) {
        try {
          const { text, confidence } = await performOCR(pageImages[i]);
          if (text.trim()) {
            combinedText += `--- Page ${i + 1} ---\n${text.trim()}\n\n`;
            confidences.push(confidence);
          }
        } catch (pageOcrErr) {
          console.warn(`OCR failed on page ${i + 1}:`, pageOcrErr.message);
        }
      }
    } else {
      // Standard image file (PNG/JPG/TIFF/WebP)
      const { text, confidence } = await performOCR(buffer);
      combinedText = text;
      confidences.push(confidence);
    }
  } finally {
    scheduleWorkerIdleCleanup();
  }

  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return {
    text: combinedText.trim(),
    pageCount,
    isScanned: true,
    ocrConfidence: Math.round(avgConfidence),
  };
};

// Main document processing pipeline
export const processDocument = async (documentId, buffer, fileName) => {
  try {
    console.log(`Processing document: ${documentId}`);

    let extractionResult;
    const isPDF = fileName.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      try {
        extractionResult = await extractPDFText(buffer);
        // If extracted text is very short (< 100 chars), PDF is likely scanned
        if (!extractionResult.text || extractionResult.text.trim().length < 100) {
          console.log('PDF appears to be scanned (text < 100 chars), running OCR...');
          const ocrResult = await extractOCRText(buffer, true);
          if (ocrResult.text.trim().length > 0) {
            extractionResult = ocrResult;
          }
        }
      } catch (pdfError) {
        console.log('PDF parse failed, falling back to OCR...', pdfError.message);
        extractionResult = await extractOCRText(buffer, true);
      }
    } else {
      // Image file (PNG, JPG, etc.)
      extractionResult = await extractOCRText(buffer, false);
    }

    const { text, pageCount, isScanned, ocrConfidence } = extractionResult;
    // Sanitize text: PostgreSQL does not allow \u0000 (null byte) in UTF-8 strings
    const cleanText = (text || '').replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    if (!cleanText || cleanText.trim().length < 10) {
      console.warn(`Document ${documentId} extracted insufficient text (< 10 chars).`);
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
      return;
    }

    // Step 2: Chunk the text
    const textChunks = chunkText(cleanText);
    console.log(`Generated ${textChunks.length} chunks`);

    // Step 3: Generate embeddings and save chunks
    const chunkData = [];
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i].replace(/\u0000/g, '');
      const embedding = await generateEmbedding(chunk);

      chunkData.push({
        documentId,
        content: chunk,
        chunkIndex: i,
        pageNumber: Math.floor((i / textChunks.length) * (pageCount || 1)) + 1,
        tokenCount: Math.ceil(chunk.split(/\s+/).length * 1.3),
        embedding: embedding ? JSON.stringify(embedding) : null,
      });
    }

    // Save all chunks
    await prisma.documentChunk.createMany({ data: chunkData });

    const totalTokens = chunkData.reduce((sum, c) => sum + (c.tokenCount || 0), 0);

    // Step 4: Run AI Document Intelligence (Classification, QR & Barcode detection, Entity Extraction, Anomaly Detection)
    console.log(`Running Document Intelligence on ${documentId}...`);
    let intelligenceData = {};
    try {
      intelligenceData = await runDocumentIntelligence({
        text: cleanText,
        buffer,
        fileName,
        ocrConfidence: ocrConfidence || 95,
      });
      console.log(`Intelligence complete for ${documentId}: DocType = ${intelligenceData.docType}, Has QR = ${intelligenceData.hasQrCode}`);
    } catch (intelErr) {
      console.warn(`Intelligence error for ${documentId}:`, intelErr.message);
    }

    // Step 5: Update document as ready with all intelligence fields
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'READY',
        pageCount: pageCount || 1,
        isScanned: isScanned || false,
        ocrConfidence: ocrConfidence || null,
        tokenCount: totalTokens,
        ...intelligenceData,
      },
    });

    console.log(`✅ Document ${documentId} processed and indexed with full intelligence.`);
  } catch (error) {
    console.error(`❌ Document processing failed: ${documentId}`, error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' },
    }).catch(() => {});
  }
};

