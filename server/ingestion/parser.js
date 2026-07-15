/**
 * Stage 1 — Document Parser
 * Extracts text from uploaded documents using pdf-parse or tesseract.js OCR.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse a document file and extract text content.
 * @param {string} filePath - Absolute path to the uploaded file
 * @param {string} docType - Document type (e.g., 'PIID', 'SOP', etc.)
 * @returns {Promise<{text: string, pageCount: number, ocrUsed: boolean}>}
 */
async function parseDocument(filePath, docType) {
  console.log(`[parser] Starting parse — file: ${path.basename(filePath)}, type: ${docType}`);

  let text = '';
  let pageCount = 0;
  let ocrUsed = false;

  try {
    // Attempt pdf-parse first (unless it's a PIID which typically needs OCR)
    if (docType !== 'PIID') {
      try {
        const pdfParse = require('pdf-parse');
        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(fileBuffer);

        text = pdfData.text || '';
        pageCount = pdfData.numpages || 1;

        console.log(`[parser] pdf-parse extracted ${text.length} chars, ${pageCount} pages`);
      } catch (pdfErr) {
        console.warn(`[parser] pdf-parse failed: ${pdfErr.message}, falling back to OCR`);
        text = ''; // Force OCR fallback
      }
    }

    // If docType is PIID or pdf-parse yielded < 200 chars, use OCR
    if (docType === 'PIID' || text.length < 200) {
      console.log(`[parser] Using tesseract.js OCR (docType=${docType}, textLen=${text.length})`);
      ocrUsed = true;

      const Tesseract = require('tesseract.js');
      const { data } = await Tesseract.recognize(filePath, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            // Log progress sparingly
            if (Math.round(info.progress * 100) % 25 === 0) {
              console.log(`[parser] OCR progress: ${Math.round(info.progress * 100)}%`);
            }
          }
        },
      });

      text = data.text || '';
      pageCount = pageCount || 1; // OCR doesn't give page count, use 1 as default
      console.log(`[parser] OCR extracted ${text.length} chars`);
    }

    // Normalize whitespace and newlines
    text = text
      .replace(/\r\n/g, '\n')       // Normalize CRLF to LF
      .replace(/\r/g, '\n')         // Normalize CR to LF
      .replace(/[ \t]+/g, ' ')      // Collapse tabs/spaces to single space
      .replace(/\n{3,}/g, '\n\n')   // Max 2 consecutive newlines
      .trim();

    console.log(`[parser] Parse complete — ${text.length} chars, ${pageCount} pages, OCR=${ocrUsed}`);

    return { text, pageCount, ocrUsed };
  } catch (error) {
    console.error(`[parser] Fatal error parsing document: ${error.message}`);
    throw new Error(`Document parsing failed: ${error.message}`);
  }
}

module.exports = { parseDocument };
