import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate handover PDF matching AU official form design
 * @param {Object} params - PDF generation parameters
 * @param {Object} params.employee - Employee information
 * @param {Array} params.assets - Array of assigned assets
 * @param {Object} params.signature - Signature data (optional for initial PDF)
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateHandoverPDF({ employee, assets, signature = null }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
      });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = 595.28; // A4 width in points
      const leftMargin = 50;
      const rightMargin = 545;
      const contentWidth = rightMargin - leftMargin;

      // HEADER SECTION - Reduced top margin
      let yPosition = 30;

      // Logo (centered at top) - Smaller size
      const logoPath = join(__dirname, '../../assets/logo.png');
      try {
        const logoWidth = 60;
        const logoHeight = 60;
        const logoX = (pageWidth - logoWidth) / 2; // Center horizontally
        doc.image(logoPath, logoX, yPosition, { width: logoWidth, height: logoHeight });
        yPosition += logoHeight + 8;
      } catch (err) {
        console.warn('Logo not found, continuing without logo');
      }

      // University name and Main Store (centered) - Smaller font
      doc.fontSize(14)
         .fillColor('#0066cc')
         .font('Helvetica-Bold')
         .text('Ajman University', leftMargin, yPosition, {
           align: 'center',
           width: contentWidth
         });

      yPosition += 18;

      doc.fontSize(12)
         .fillColor('#0066cc')
         .text('Main Store', leftMargin, yPosition, {
           align: 'center',
           width: contentWidth
         });

      yPosition += 20;

      // Title: "Acknowledgement of Asset Receipt" (centered) - Smaller font
      doc.fontSize(13)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Acknowledgement of Asset Receipt', leftMargin, yPosition, {
           align: 'center',
           width: contentWidth
         });

      yPosition += 20;

      // Date field (right aligned)
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(9)
         .fillColor('#666666')
         .font('Helvetica')
         .text(`Date: ${currentDate}`, rightMargin - 150, yPosition, {
           align: 'right',
           width: 150
         });

      yPosition += 15;

      // ASSETS TABLE (start from current yPosition)

      // Table styling
      const tableBorderColor = '#000000';
      const tableHeaderBg = '#f0f0f0';

      // Define table columns (removed qty column)
      const tableLeft = leftMargin;
      const tableRight = rightMargin;
      const tableWidth = tableRight - tableLeft;

      const colWidths = {
        no: 35,
        storeCode: 120,
        description: 260,
        purchaseDate: 80
      };

      // Calculate column positions
      let currentX = tableLeft;
      const colPositions = {
        no: currentX,
        storeCode: (currentX += colWidths.no),
        description: (currentX += colWidths.storeCode),
        purchaseDate: (currentX += colWidths.description)
      };

      // Draw table header (reduced row height for compactness)
      const rowHeight = 20;
      const headerY = yPosition;

      // Header background (light gray)
      doc.rect(tableLeft, headerY, tableWidth, rowHeight).fillAndStroke('#f5f5f5', tableBorderColor);

      // Header text
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold');

      doc.text('No.', colPositions.no + 5, headerY + 8, { width: colWidths.no - 10, align: 'center' });
      doc.text('Store Code', colPositions.storeCode + 5, headerY + 8, { width: colWidths.storeCode - 10, align: 'center' });
      doc.text('Item Description', colPositions.description + 5, headerY + 8, { width: colWidths.description - 10, align: 'center' });
      doc.text('Purchase Date\n/LPO', colPositions.purchaseDate + 5, headerY + 3, { width: colWidths.purchaseDate - 10, align: 'center' });

      // Draw header cell borders
      doc.strokeColor(tableBorderColor);
      doc.moveTo(colPositions.storeCode, headerY).lineTo(colPositions.storeCode, headerY + rowHeight).stroke();
      doc.moveTo(colPositions.description, headerY).lineTo(colPositions.description, headerY + rowHeight).stroke();
      doc.moveTo(colPositions.purchaseDate, headerY).lineTo(colPositions.purchaseDate, headerY + rowHeight).stroke();

      yPosition += rowHeight;

      // Draw asset rows (only actual assets, no empty rows)
      doc.font('Helvetica').fontSize(8);

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const rowY = yPosition;

        // Check if we need a new page
        if (rowY > 700) {
          doc.addPage();
          yPosition = 50;
        }

        // Draw row background (white)
        doc.rect(tableLeft, rowY, tableWidth, rowHeight).fillAndStroke('#ffffff', tableBorderColor);

        // Row data
        const rowNumber = i + 1;
        const storeCode = asset.asset_code || '';
        const description = asset.description || asset.asset_type || '';
        const purchaseDate = asset.lpo_voucher_no || (asset.warranty_start_date ? new Date(asset.warranty_start_date).toLocaleDateString() : '');

        // Draw text in cells
        doc.fillColor('#000000');
        doc.text(rowNumber.toString(), colPositions.no + 5, rowY + 8, { width: colWidths.no - 10, align: 'center' });
        doc.text(storeCode, colPositions.storeCode + 5, rowY + 8, { width: colWidths.storeCode - 10, align: 'left' });
        doc.text(description, colPositions.description + 5, rowY + 5, { width: colWidths.description - 10, align: 'left', height: rowHeight - 10 });
        doc.text(purchaseDate, colPositions.purchaseDate + 3, rowY + 5, { width: colWidths.purchaseDate - 6, align: 'left', height: rowHeight - 10 });

        // Draw vertical borders
        doc.strokeColor(tableBorderColor);
        doc.moveTo(colPositions.storeCode, rowY).lineTo(colPositions.storeCode, rowY + rowHeight).stroke();
        doc.moveTo(colPositions.description, rowY).lineTo(colPositions.description, rowY + rowHeight).stroke();
        doc.moveTo(colPositions.purchaseDate, rowY).lineTo(colPositions.purchaseDate, rowY + rowHeight).stroke();

        yPosition += rowHeight;
      }

      yPosition += 10;

      // USER DETAILS
      doc.fontSize(9)
         .fillColor('#0066cc')
         .font('Helvetica-Bold')
         .text('User Details:', leftMargin, yPosition);

      yPosition += 15;

      // Name and User ID on same line
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Name: ', leftMargin, yPosition, { continued: true })
         .font('Helvetica')
         .text(employee.employee_name || '', { continued: false });

      doc.font('Helvetica-Bold')
         .text('User ID: ', leftMargin + 280, yPosition, { continued: true })
         .font('Helvetica')
         .text(employee.employee_id || 'N/A');

      yPosition += 15;

      // College/Office
      doc.font('Helvetica-Bold')
         .text('College / Office: ', leftMargin, yPosition, { continued: true })
         .font('Helvetica')
         .text(employee.office_college || 'N/A');

      yPosition += 15;

      // LOCATION SECTION (compact - show only selected values)
      if (signature?.location_building || signature?.location_floor || signature?.location_section) {
        doc.fontSize(8)
           .fillColor('#0066cc')
           .font('Helvetica-Bold')
           .text('Location:', leftMargin, yPosition);

        yPosition += 12;

        // Build location string
        const locationParts = [];
        if (signature?.location_building) locationParts.push(`Building: ${signature.location_building}`);
        if (signature?.location_floor) locationParts.push(`Floor: ${signature.location_floor}`);
        if (signature?.location_section) locationParts.push(`Section: ${signature.location_section}`);

        doc.fontSize(8)
           .fillColor('#000000')
           .font('Helvetica')
           .text(locationParts.join(' | '), leftMargin, yPosition, {
             width: contentWidth,
             align: 'left'
           });

        yPosition += 15;
      }

      // Check if we need a new page for declaration
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      // Helper function to draw checkbox (for device type)
      const drawCheckbox = (x, y, checked = false, size = 8) => {
        doc.rect(x, y, size, size).stroke();
        if (checked) {
          // Draw checkmark
          doc.moveTo(x + 1.5, y + 4)
             .lineTo(x + 3, y + 6)
             .lineTo(x + 6.5, y + 1.5)
             .stroke();
        }
      };

      const checkboxSize = 8;

      // DECLARATION TEXT (more compact)
      doc.fontSize(7)
         .fillColor('#000000')
         .font('Helvetica')
         .text(
           'I confirm that this device(s) is a property of Ajman University and to be returned back to AU Store after usage. This device(s) can\'t be shifted to any other user/location without a written approval from the Store.',
           leftMargin,
           yPosition,
           { align: 'justify', width: contentWidth }
         );

      yPosition += 25;

      // DEVICE TYPE SELECTION (more compact)
      doc.fontSize(7)
         .fillColor('#000000')
         .font('Helvetica-Oblique')
         .text('Please select one of the following:', leftMargin, yPosition);

      yPosition += 12;

      // Office Device
      const isOfficeDevice = signature?.device_type?.includes('Office Device');
      drawCheckbox(leftMargin, yPosition, isOfficeDevice, checkboxSize);
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Office Device', leftMargin + 12, yPosition);

      yPosition += 12;

      doc.fontSize(6.5)
         .font('Helvetica')
         .text(
           'I understand that I will be responsible for any misuse or damages that may occur. I confirm that this device(s) will be used for work purpose only.',
           leftMargin + 12,
           yPosition,
           { align: 'left', width: contentWidth - 12 }
         );

      yPosition += 22;

      // Lab Device
      const isLabDevice = signature?.device_type?.includes('Lab Device');
      drawCheckbox(leftMargin, yPosition, isLabDevice, checkboxSize);
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Lab Device', leftMargin + 12, yPosition);

      yPosition += 12;

      doc.fontSize(6.5)
         .font('Helvetica')
         .text(
           'I understand that the lab supervisor shall monitor the lab devices to avoid any misuse or damage.',
           leftMargin + 12,
           yPosition,
           { align: 'left', width: contentWidth - 12 }
         );

      yPosition += 22;

      // SIGNATURE SECTION (compact)
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Employee Signature:', leftMargin, yPosition);

      yPosition += 8;

      // If signature data exists, embed the image
      if (signature && signature.signature_data) {
        try {
          // Remove data URL prefix if present
          const base64Data = signature.signature_data.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');

          doc.image(imageBuffer, leftMargin, yPosition, {
            width: 150,
            height: 60,
            fit: [150, 60]
          });

          yPosition += 65;

          // Signature date
          if (signature.signature_date) {
            const signatureDate = new Date(signature.signature_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            doc.fontSize(6.5)
               .fillColor('#666666')
               .font('Helvetica')
               .text(`Signed on: ${signatureDate}`, leftMargin, yPosition);
          }
        } catch (error) {
          console.error('Error embedding signature image:', error);
          // Fallback to signature line if image fails
          doc.moveTo(leftMargin, yPosition + 30)
             .lineTo(leftMargin + 150, yPosition + 30)
             .stroke();
        }
      } else {
        // Draw signature line for unsigned forms
        doc.moveTo(leftMargin, yPosition + 30)
           .lineTo(leftMargin + 150, yPosition + 30)
           .stroke();
      }

      doc.end();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
}
