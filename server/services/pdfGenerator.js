import PDFDocument from 'pdfkit';

export async function generateHandoverPDF({ employee, assets }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Ajman University', { align: 'center' });
      doc.fontSize(16).text('Asset Handover Form', { align: 'center' });
      doc.moveDown(2);

      // Employee Information
      doc.fontSize(12).text('Employee Information:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Employee Name: ${employee.employee_name}`);
      if (employee.employee_id) {
        doc.text(`Work ID: ${employee.employee_id}`);
      }
      if (employee.office_college) {
        doc.text(`Office/College: ${employee.office_college}`);
      }
      doc.moveDown(1.5);

      // Declaration
      doc.fontSize(12).text('Declaration:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(
        'I confirm this device(s) is property of Ajman University and will be returned to AU Store after use. ' +
        'Devices cannot be moved to another user/location without written Store approval.',
        { align: 'justify' }
      );
      doc.moveDown(2);

      // Assets Table
      doc.fontSize(12).text('Assigned Assets:', { underline: true });
      doc.moveDown(0.5);

      // Check if any asset has LPO number
      const hasLPO = assets.some(asset => asset.lpo_voucher_no);

      // Table header
      const tableTop = doc.y;
      const colWidths = hasLPO ? [100, 100, 150, 80, 90] : [120, 120, 180, 100];
      const colPositions = [];
      let currentX = 50;

      for (const width of colWidths) {
        colPositions.push(currentX);
        currentX += width;
      }

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Asset Code', colPositions[0], tableTop, { width: colWidths[0] });
      doc.text('Asset Type', colPositions[1], tableTop, { width: colWidths[1] });
      doc.text('Description', colPositions[2], tableTop, { width: colWidths[2] });
      doc.text('Model', colPositions[3], tableTop, { width: colWidths[3] });
      if (hasLPO) {
        doc.text('LPO Number', colPositions[4], tableTop, { width: colWidths[4] });
      }

      // Draw header line
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table rows
      doc.font('Helvetica');
      let rowY = tableTop + 20;

      for (const asset of assets) {
        // Check if we need a new page
        if (rowY > 700) {
          doc.addPage();
          rowY = 50;
        }

        doc.text(asset.asset_code || '', colPositions[0], rowY, { width: colWidths[0] });
        doc.text(asset.asset_type || '', colPositions[1], rowY, { width: colWidths[1] });
        doc.text(asset.description || '', colPositions[2], rowY, { width: colWidths[2] });
        doc.text(asset.model || '', colPositions[3], rowY, { width: colWidths[3] });
        if (hasLPO) {
          doc.text(asset.lpo_voucher_no || '', colPositions[4], rowY, { width: colWidths[4] });
        }

        rowY += 25;
      }

      // Signature section
      doc.moveDown(4);
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(10);
      doc.text('Employee Signature: _________________________', 50);
      doc.moveDown(0.5);
      doc.text(`Date: _________________________`, 50);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
