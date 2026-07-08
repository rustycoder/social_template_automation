/**
 * Excel Parser Module
 * Handles file upload (drag & drop + file picker) and Excel parsing via ExcelJS
 * Extracts embedded images from Picture and Dimension columns
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

/**
 * Extract embedded images from the worksheet and map them to data rows.
 * Images are converted to base64 data URLs and stored in the row data.
 */
async function extractEmbeddedImages(workbook, worksheet, headers, rows, imageColumns) {
  const images = worksheet.getImages();

  if (!images || images.length === 0) {
    console.log('No embedded images found in worksheet');
    return;
  }

  for (const imageInfo of images) {
    try {
      const imageId = imageInfo.imageId;
      const image = workbook.getImage(imageId);

      if (!image || !image.buffer) continue;

      // Get the cell position (0-indexed) with fallback to floating coordinates
      const col = imageInfo.range.tl.nativeCol !== undefined ? imageInfo.range.tl.nativeCol : (imageInfo.range.tl.col !== undefined ? Math.floor(imageInfo.range.tl.col) : undefined);
      const row = imageInfo.range.tl.nativeRow !== undefined ? imageInfo.range.tl.nativeRow : (imageInfo.range.tl.row !== undefined ? Math.floor(imageInfo.range.tl.row) : undefined);

      if (col === undefined || row === undefined) continue;

      // Row 0 = header row, so data row index = row - 1
      const dataRowIndex = row - 1;
      const header = headers[col];

      if (dataRowIndex < 0 || dataRowIndex >= rows.length || !header) continue;

      // Convert image buffer to base64 data URL
      const ext = image.extension || 'png';
      const mimeType = getMimeType(ext);
      const base64 = arrayBufferToBase64(image.buffer);
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Store the image data URL in the row data
      rows[dataRowIndex][header] = dataUrl;
      imageColumns.add(header.toLowerCase());
    } catch (e) {
      console.warn('Failed to extract image:', e);
    }
  }
}

/**
 * Parse an Excel file into headers, rows, and embedded image data.
 * DOM-independent — safe to use from any upload UI.
 *
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

  // Extract headers from row 1
  const headers = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cell.value?.toString().trim() || `Column ${colNumber}`;
  });

  // Fill any gaps in headers
  const maxCol = headers.length;
  for (let i = 0; i < maxCol; i++) {
    if (!headers[i]) headers[i] = `Column ${i + 1}`;
  }

  // Extract data rows (starting from row 2)
  const rows = [];
  const rowCount = worksheet.rowCount;
  for (let r = 2; r <= rowCount; r++) {
    const row = worksheet.getRow(r);
    const rowData = {};
    let hasData = false;

    headers.forEach((header, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      const value = cell.value;

      if (value !== null && value !== undefined && value !== '') {
        hasData = true;
      }

      // Handle different cell value types
      if (value && typeof value === 'object') {
        if (value.richText) {
          // Rich text: concatenate all parts
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

export class ExcelParser {
  constructor() {
    this.data = null;
    this.headers = [];
    this.rows = [];
    this.fileName = '';
    this.onDataLoaded = null;
    /** @type {Set<string>} columns that contain images (lowercase) */
    this.imageColumns = new Set();

    this._bindElements();
    this._bindEvents();
  }

  _bindElements() {
    this.dropzone = document.getElementById('csv-dropzone');
    this.fileInput = document.getElementById('csv-file-input');
    this.fileInfo = document.getElementById('file-info');
    this.fileNameEl = document.getElementById('file-name');
    this.fileMetaEl = document.getElementById('file-meta');
    this.removeFileBtn = document.getElementById('remove-file');
    this.dataPreview = document.getElementById('data-preview');
    this.previewThead = document.getElementById('preview-thead');
    this.previewTbody = document.getElementById('preview-tbody');
    this.rowCount = document.getElementById('row-count');
    this.btnToDesign = document.getElementById('btn-to-design');
  }

  _bindEvents() {
    // Dropzone click → open file picker
    this.dropzone.addEventListener('click', () => this.fileInput.click());

    // Prevent click events on the file input from bubbling up to the dropzone
    this.fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this._handleFile(e.target.files[0]);
      }
    });

    // Drag & drop
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('drag-over');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('drag-over');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        this._handleFile(e.dataTransfer.files[0]);
      }
    });

    // Remove file
    this.removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._reset();
    });
  }

  async _handleFile(file) {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      this._showError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    this.fileName = file.name;
    const fileSizeKB = (file.size / 1024).toFixed(1);

    try {
      const { headers, rows, imageColumns } = await parseExcelFile(file);
      this.headers = headers;
      this.rows = rows;
      this.imageColumns = imageColumns;

      // Update UI
      this.fileNameEl.textContent = this.fileName;
      this.fileMetaEl.textContent = `${fileSizeKB} KB · ${this.rows.length} rows · ${this.headers.length} columns`;
      this.fileInfo.classList.remove('hidden');
      this.dropzone.style.display = 'none';

      this._renderPreview();
      this.btnToDesign.disabled = false;

      if (this.onDataLoaded) {
        this.onDataLoaded(this.headers, this.rows);
      }
    } catch (error) {
      console.error('Excel parse error:', error);
      this._showError(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Extract embedded images from the worksheet and map them to data rows.
   * Images are converted to base64 data URLs and stored in the row data.
   */
  async _extractImages(workbook, worksheet) {
    await extractEmbeddedImages(workbook, worksheet, this.headers, this.rows, this.imageColumns);
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  _arrayBufferToBase64(buffer) {
    return arrayBufferToBase64(buffer);
  }

  /**
   * Get MIME type from file extension
   */
  _getMimeType(ext) {
    return getMimeType(ext);
  }

  /**
   * Check if a column contains image data
   */
  isImageColumn(header) {
    return this.imageColumns.has(header.toLowerCase());
  }

  _renderPreview() {
    // Header row
    const headerRow = document.createElement('tr');
    this.headers.forEach((h) => {
      const th = document.createElement('th');
      th.textContent = h;
      if (this.isImageColumn(h)) {
        th.textContent += ' 🖼️';
      }
      headerRow.appendChild(th);
    });
    this.previewThead.innerHTML = '';
    this.previewThead.appendChild(headerRow);

    // Data rows (show max 50 for performance)
    this.previewTbody.innerHTML = '';
    const previewRows = this.rows.slice(0, 50);
    previewRows.forEach((row) => {
      const tr = document.createElement('tr');
      this.headers.forEach((h) => {
        const td = document.createElement('td');
        const value = row[h] ?? '';

        // Render image thumbnail if it's a data URL
        if (value.startsWith('data:image/')) {
          const img = document.createElement('img');
          img.src = value;
          img.style.maxWidth = '60px';
          img.style.maxHeight = '40px';
          img.style.borderRadius = '4px';
          img.style.objectFit = 'cover';
          img.style.verticalAlign = 'middle';
          td.appendChild(img);
          td.style.padding = '4px 14px';
        } else if (h.trim().toLowerCase() === 'specs' && value.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(value.replace(/""/g, '"'));
            const keys = Object.keys(parsed);
            td.textContent = keys.length
              ? `${keys.length} fields (${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''})`
              : value;
            td.title = value;
          } catch {
            td.textContent = value;
            td.title = value;
          }
        } else {
          td.textContent = value;
          td.title = value;
        }
        tr.appendChild(td);
      });
      this.previewTbody.appendChild(tr);
    });

    this.rowCount.textContent = `Showing ${previewRows.length} of ${this.rows.length} rows`;
    this.dataPreview.classList.remove('hidden');
  }

  _reset() {
    this.data = null;
    this.headers = [];
    this.rows = [];
    this.fileName = '';
    this.imageColumns.clear();
    this.fileInput.value = '';

    this.fileInfo.classList.add('hidden');
    this.dataPreview.classList.add('hidden');
    this.dropzone.style.display = '';
    this.btnToDesign.disabled = true;

    // Restore default dropzone text
    const textEl = this.dropzone.querySelector('.dropzone-text');
    if (textEl) {
      textEl.innerHTML = `Drop your <strong>.xlsx</strong> file here`;
    }
    const subtextEl = this.dropzone.querySelector('.dropzone-subtext');
    if (subtextEl) {
      subtextEl.innerHTML = `or click to browse · supports embedded images`;
    }

    // Show showcase section again on reset
    const showcase = document.getElementById('template-showcase');
    if (showcase) {
      showcase.classList.remove('hidden');
    }
  }

  loadSampleData(templateKey) {
    let headers = [];
    let rows = [];
    this.imageColumns.clear();
    if (templateKey === 'datasheet' || templateKey === 'default') {
      headers = ['CODE', 'NAME', 'IMAGE', 'DESCRIPTION', 'DIAGRAM', 'SPECS'];
      this.imageColumns.add('image');
      this.imageColumns.add('diagram');
      
      const samplePicture = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f8fafc" stroke="%23e2e8f0" stroke-width="2"/><circle cx="150" cy="80" r="45" fill="%23f1f5f9" stroke="%23139B58" stroke-width="4"/><circle cx="150" cy="80" r="25" fill="%23ffffff"/><path d="M150 25 L150 5 M150 135 L150 155 M95 80 L75 80 M205 80 L225 80" stroke="%23139B58" stroke-width="3"/><text x="150" y="165" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%231e293b" text-anchor="middle">Azoogi Premium LED Downlight</text></svg>`;
      const sampleDimension = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f8fafc" stroke="%23e2e8f0" stroke-width="2"/><line x1="50" y1="120" x2="250" y2="120" stroke="%2364748b" stroke-width="2" stroke-dasharray="4 4"/><line x1="50" y1="105" x2="50" y2="135" stroke="%2364748b" stroke-width="2"/><line x1="250" y1="105" x2="250" y2="135" stroke="%2364748b" stroke-width="2"/><text x="150" y="95" font-family="monospace" font-size="11" fill="%23475569" text-anchor="middle">Cutout Diameter: 90mm</text><circle cx="150" cy="55" r="8" fill="none" stroke="%23475569" stroke-width="1.5"/><path d="M142 55 L158 55 M150 47 L150 63" stroke="%23475569" stroke-width="1.5"/><text x="150" y="165" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%231e293b" text-anchor="middle">Technical Dimension Drawing</text></svg>`;
 
      const sampleSpecs12W = JSON.stringify({
        Series: 'IP65 Series',
        Brand: 'Azoogi',
        Finish: 'Clear',
        Dimensions: '1100mm (L) x 92mm (W) x 90mm (H)',
        'Lamp Type': 'LED',
        Wattage: '12W',
        'Lumen Output': '960lm',
        Optics: 'Diffuse',
        'Color Temperature': '3000K / 4000K / 5000K',
        'IP Rating': 'IP44',
        Control: 'Triac Dimmable',
        Mounting: 'Recessed ceiling',
        Warranty: '3 Years',
      });

      // Second row uses a different set of keys — specs are fully dynamic per product
      const sampleSpecs15W = JSON.stringify({
        Series: 'Commercial Series',
        'Product Code': 'AZ-LN-15-SM',
        CRI: '90+',
        'Driver Type': 'Constant current',
        'Beam Angle': '38°',
        'Housing Material': 'Die-cast aluminium',
        'Operating Temp': '-20°C to 45°C',
        Certifications: 'SAA, RCM, IC-4',
        'Lead Time': '2–3 weeks',
      });

      rows = [
        {
          CODE: 'AZ-LLL001',
          NAME: 'IP65 Series',
          IMAGE: samplePicture,
          DESCRIPTION: 'The Azoogi 12W LED Downlight is a premium recessed luminaire designed for exceptional performance, modern aesthetics, and energy efficiency. It features high CRI (>80) for vibrant, accurate colors, a wide 90-degree beam angle for uniform light distribution, and a durable IP44-rated design. It is fully dimmable and matches standard cutouts, making it perfect for residential, retail, and commercial spaces.',
          DIAGRAM: sampleDimension,
          SPECS: sampleSpecs12W,
        },
        {
          CODE: 'AZ-LN-15-SM',
          NAME: 'Commercial Series',
          IMAGE: samplePicture.replace('12W', '15W').replace('45', '50').replace('25', '28'),
          DESCRIPTION: 'A high-powered 15W LED Downlight designed for higher ceilings and premium commercial spaces. It provides up to 1300 lumens of bright, comfortable light with excellent color rendering and triac dimming capability.',
          DIAGRAM: sampleDimension.replace('90mm', '110mm').replace('50', '40').replace('250', '260'),
          SPECS: sampleSpecs15W,
        },
      ];
    } else if (templateKey === 'heist') {
      headers = ['HEADLINE', 'IMAGE', 'SWIPE_TEXT'];
      this.imageColumns.add('image');
      rows = [
        {
          HEADLINE: 'China ran one of the <br> <span class="highlight">biggest AI heists <br> against Anthropic</span> for 45 <br> days without getting caught',
          IMAGE: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
          SWIPE_TEXT: 'Swipe for details'
        },
        {
          HEADLINE: 'State-sponsored hackers <br> <span class="highlight">breach defense grid</span> <br> using zero-day flaw',
          IMAGE: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
          SWIPE_TEXT: 'Learn more'
        }
      ];
    } else if (templateKey === 'certificate') {
      headers = ['certificate_type', 'name', 'description', 'issuer', 'date'];
      rows = [
        {
          certificate_type: 'Employee of the Month',
          name: 'Alex Johnson',
          description: 'For outstanding performance, dedication, and exemplary leadership in driving project success and demonstrating our core corporate values throughout May 2026.',
          issuer: 'Sarah Miller',
          date: 'May 31, 2026'
        },
        {
          certificate_type: 'Honorary Achievement',
          name: 'Jordan Smith',
          description: 'In recognition of your exceptional contributions to the development of our open-source tools and community-driven initiatives.',
          issuer: 'Robert Chen',
          date: 'May 20, 2026'
        }
      ];
    } else if (templateKey === 'invoice') {
      headers = ['invoice_number', 'date', 'due_date', 'company', 'company_address', 'client_name', 'client_address', 'description', 'amount', 'notes'];
      rows = [
        {
          invoice_number: 'INV-2026-0042',
          date: '2026-05-21',
          due_date: '2026-06-04',
          company: 'Antigravity Dev Solutions',
          company_address: '123 Innovation Way, Tech Valley',
          client_name: 'Azoogi Lighting Solutions',
          client_address: '456 Commerce St, Sydney NSW 2020',
          description: 'Professional Web Development & Testing Services',
          amount: '$4,500.00',
          notes: 'Thank you for your business! Payment is due within 14 days.'
        },
        {
          invoice_number: 'INV-2026-0043',
          date: '2026-05-22',
          due_date: '2026-06-05',
          company: 'Antigravity Dev Solutions',
          company_address: '123 Innovation Way, Tech Valley',
          client_name: 'Lighting Council Australia',
          client_address: '789 Federation Blvd, Melbourne VIC 3000',
          description: 'Cloud Infrastructure Setup & API Integration',
          amount: '$8,200.00',
          notes: 'Please quote invoice number on bank transfer.'
        }
      ];
    }

    this.headers = headers;
    this.rows = rows;
    this.fileName = `Sample - ${templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} Data`;

    // Update UI
    this.fileNameEl.textContent = this.fileName;
    this.fileMetaEl.textContent = `Sample Data · ${this.rows.length} rows · ${this.headers.length} columns`;
    this.fileInfo.classList.remove('hidden');
    this.dropzone.style.display = 'none';

    // Hide showcase section
    const showcase = document.getElementById('template-showcase');
    if (showcase) {
      showcase.classList.add('hidden');
    }

    this._renderPreview();
    this.btnToDesign.disabled = false;

    if (this.onDataLoaded) {
      this.onDataLoaded(this.headers, this.rows);
    }
  }

  _showError(message) {
    // Dispatch custom event for toast
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'error' } }));
  }

  getHeaders() {
    return this.headers;
  }

  getRows() {
    return this.rows;
  }

  getRow(index) {
    return this.rows[index] || null;
  }

  getRowCount() {
    return this.rows.length;
  }
}
