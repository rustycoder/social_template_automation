/**
 * @file features/domain/csvParser.js
 * @description Excel workbook parser for bulk upload — extracts headers, rows, and embedded images.
 * @dependencies exceljs
 * @state None — DOM-independent pure parsing.
 */

/**
 * Excel parsing for bulk upload — DOM-independent.
 */
import ExcelJS from 'exceljs';

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getMimeType(ext) {
  const types = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    tiff: 'image/tiff',
    emf: 'image/emf',
    wmf: 'image/wmf',
  };
  return types[ext.toLowerCase()] || 'image/png';
}

async function extractEmbeddedImages(workbook, worksheet, headers, rows, imageColumns) {
  const images = worksheet.getImages();
  if (!images || images.length === 0) return;

  for (const imageInfo of images) {
    try {
      const imageId = imageInfo.imageId;
      const image = workbook.getImage(imageId);
      if (!image || !image.buffer) continue;

      const col =
        imageInfo.range.tl.nativeCol !== undefined
          ? imageInfo.range.tl.nativeCol
          : imageInfo.range.tl.col !== undefined
            ? Math.floor(imageInfo.range.tl.col)
            : undefined;
      const row =
        imageInfo.range.tl.nativeRow !== undefined
          ? imageInfo.range.tl.nativeRow
          : imageInfo.range.tl.row !== undefined
            ? Math.floor(imageInfo.range.tl.row)
            : undefined;

      if (col === undefined || row === undefined) continue;

      const dataRowIndex = row - 1;
      const header = headers[col];
      if (dataRowIndex < 0 || dataRowIndex >= rows.length || !header) continue;

      const ext = image.extension || 'png';
      const mimeType = getMimeType(ext);
      const base64 = arrayBufferToBase64(image.buffer);
      rows[dataRowIndex][header] = `data:${mimeType};base64,${base64}`;
      imageColumns.add(header.toLowerCase());
    } catch (e) {
      console.warn('Failed to extract image:', e);
    }
  }
}

/**
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: object[], imageColumns: Set<string>, fileName: string }>}
 */
export async function parseExcelFile(file) {
  const ext = file.name.toLowerCase();
  if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
    throw new Error('Please upload an Excel file (.xlsx or .xls)');
  }

  const fileName = file.name;
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file');
  }

  const headers = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cell.value?.toString().trim() || `Column ${colNumber}`;
  });

  const maxCol = headers.length;
  for (let i = 0; i < maxCol; i++) {
    if (!headers[i]) headers[i] = `Column ${i + 1}`;
  }

  const rows = [];
  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const rowData = {};
    let hasData = false;

    headers.forEach((header, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      const value = cell.value;

      if (value !== null && value !== undefined && value !== '') {
        hasData = true;
      }

      if (value && typeof value === 'object') {
        if (value.richText) {
          rowData[header] = value.richText.map((rt) => rt.text).join('');
        } else if (value.text) {
          rowData[header] = value.text;
        } else if (value.result !== undefined) {
          rowData[header] = value.result?.toString() ?? '';
        } else {
          rowData[header] = value.toString();
        }
      } else {
        rowData[header] = value?.toString() ?? '';
      }
    });

    if (hasData) {
      rows.push(rowData);
    }
  }

  const imageColumns = new Set();
  await extractEmbeddedImages(workbook, worksheet, headers, rows, imageColumns);

  return { headers, rows, imageColumns, fileName };
}
