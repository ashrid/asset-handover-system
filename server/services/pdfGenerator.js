import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lazy-load puppeteer for faster server startup
// Puppeteer (~300MB with Chromium) is only loaded when generating PDFs
let puppeteerModule = null;
const getPuppeteer = async () => {
  if (!puppeteerModule) {
    puppeteerModule = await import('puppeteer');
  }
  return puppeteerModule.default;
};

// Register Handlebars helpers
Handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

Handlebars.registerHelper('formatDate', function(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
});

// Lazy-load and compile template on first use
let compiledTemplate = null;
const getTemplate = () => {
  if (!compiledTemplate) {
    const templatePath = join(__dirname, '../templates/handover-template.html');
    const templateSource = readFileSync(templatePath, 'utf-8');
    compiledTemplate = Handlebars.compile(templateSource);
  }
  return compiledTemplate;
};

/**
 * Generate handover PDF using Puppeteer and HTML template
 * @param {Object} params - PDF generation parameters
 * @param {Object} params.employee - Employee information
 * @param {Array} params.assets - Array of assigned assets
 * @param {Object} params.signature - Signature data (optional for initial PDF)
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateHandoverPDF({ employee, assets, signature = null }) {
  try {
    // Prepare date (dd-mmm-yyyy format)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();
    const currentDate = `${day}-${month}-${year}`;

    // Prepare logo (convert to base64 if exists)
    let logoBase64 = null;
    try {
      const logoPath = join(__dirname, '../../assets/logo.png');
      const logoBuffer = readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (err) {
      console.warn('Logo not found, continuing without logo');
    }

    // Prepare location text (compact format)
    let hasLocation = false;
    let locationText = '';
    if (signature?.location_building || signature?.location_floor || signature?.location_section) {
      hasLocation = true;
      const locationParts = [];
      if (signature?.location_building) locationParts.push(`Building: ${signature.location_building}`);
      if (signature?.location_floor) locationParts.push(`Floor: ${signature.location_floor}`);
      if (signature?.location_section) locationParts.push(`Section: ${signature.location_section}`);
      locationText = locationParts.join(' | ');
    }

    // Prepare device type flags
    const isOfficeDevice = signature?.device_type?.includes('Office Device');
    const isLabDevice = signature?.device_type?.includes('Lab Device');

    // Prepare signature
    let signatureData = null;
    if (signature && signature.signature_data) {
      let formattedDate = null;
      if (signature.signature_date) {
        const sigDate = new Date(signature.signature_date);
        const sigDay = String(sigDate.getDate()).padStart(2, '0');
        const sigMonth = sigDate.toLocaleDateString('en-US', { month: 'short' });
        const sigYear = sigDate.getFullYear();
        const hours = String(sigDate.getHours()).padStart(2, '0');
        const minutes = String(sigDate.getMinutes()).padStart(2, '0');
        formattedDate = `${sigDay}-${sigMonth}-${sigYear} ${hours}:${minutes}`;
      }

      signatureData = {
        signature_data: signature.signature_data,
        formatted_date: formattedDate,
        signed_by_email: signature.signed_by_email,
        is_backup_signer: signature.is_backup_signer
      };
    }

    // Render template with data (lazy-loaded)
    const template = getTemplate();
    const html = template({
      logo: logoBase64,
      date: currentDate,
      assets: assets,
      employee: {
        employee_name: employee.employee_name || '',
        employee_id: employee.employee_id || 'N/A',
        office_college: employee.office_college || 'N/A'
      },
      hasLocation: hasLocation,
      locationText: locationText,
      isOfficeDevice: isOfficeDevice,
      isLabDevice: isLabDevice,
      signature: signatureData
    });

    // Launch Puppeteer and generate PDF (lazy-loaded)
    const puppeteer = await getPuppeteer();
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        }
      });

      return pdfBuffer;
    } finally {
      // Ensure browser is always closed, even if an error occurs
      await browser.close();
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}
