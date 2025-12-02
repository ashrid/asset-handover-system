import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register Handlebars helpers
Handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

Handlebars.registerHelper('formatDate', function(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
});

// Load and compile template once
const templatePath = join(__dirname, '../templates/handover-template.html');
const templateSource = readFileSync(templatePath, 'utf-8');
const template = Handlebars.compile(templateSource);

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
    // Prepare date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

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
      signatureData = {
        signature_data: signature.signature_data,
        formatted_date: signature.signature_date ? new Date(signature.signature_date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : null
      };
    }

    // Render template with data
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

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

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

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}
