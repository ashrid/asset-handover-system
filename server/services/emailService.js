import nodemailer from 'nodemailer';
import { createModuleLogger, logEmailSent } from './logger.js';

const logger = createModuleLogger('email-service');

// Configure email transporter
// For development, using ethereal.email (test email service)
// In production, replace with actual SMTP credentials
let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  // Check if environment variables are set for production
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    logger.info({ host: process.env.SMTP_HOST }, 'Using configured SMTP server');
  } else {
    // Development: Create ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    logger.info({ user: testAccount.user }, 'Using Ethereal email for development');
  }

  return transporter;
}

export async function sendHandoverEmail({ email, employeeName, employeeId, primaryEmail, employeeEmail, officeCollege, signingUrl, expiresAt, assetCount, signatureDate, assignmentId, assets, disputeReason, pdfBuffer, isPrimary = true, isAdminCopy = false, isDispute = false, isReminder = false, reminderNumber = 1, daysRemaining = 0, isTransfer = false, isTransferNotification = false, originalEmployeeName = '', originalEmail = '', transferReason = '' }) {
  try {
    const transporter = await getTransporter();

    // Format expiration date (dd-mmm-yyyy)
    const expiryDate = expiresAt ? (() => {
      const date = new Date(expiresAt);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    })() : '';

    // If pdfBuffer is provided, send signed PDF email (Phase 3)
    // Otherwise, send signing link email (Phase 2)
    const isSignedPDF = !!pdfBuffer;

    // Determine email content based on recipient type (primary or backup)
    let subject, textContent, htmlContent;

    if (isDispute) {
      // Dispute notification email to admin
      const assetList = assets.map((asset, index) =>
        `${index + 1}. ${asset.asset_code} - ${asset.asset_type}${asset.description ? ` (${asset.description})` : ''}`
      ).join('\n');

      subject = `⚠️ Asset Assignment Disputed - ${employeeName}`;
      textContent = `Asset Assignment Disputed\n\n` +
        `An employee has disputed their asset assignment.\n\n` +
        `Employee Details:\n` +
        `- Name: ${employeeName}\n` +
        `${employeeId ? `- Employee ID: ${employeeId}\n` : ''}` +
        `- Email: ${employeeEmail}\n` +
        `${officeCollege ? `- Office/College: ${officeCollege}\n` : ''}` +
        `- Assignment ID: ${assignmentId}\n\n` +
        `Disputed Assets (${assets.length} items):\n${assetList}\n\n` +
        `Dispute Reason:\n"${disputeReason}"\n\n` +
        `Please review this dispute and take appropriate action.\n\n` +
        `Best regards,\nAjman University Asset Management System`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">⚠️ Asset Assignment Disputed</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; font-weight: bold;">An employee has disputed their asset assignment.</p>

            <div style="margin: 20px 0; padding: 20px; background: white; border-left: 4px solid #dc2626; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #dc2626;">Employee Details:</h3>
              <p style="margin: 5px 0; color: #333;"><strong>Name:</strong> ${employeeName}</p>
              ${employeeId ? `<p style="margin: 5px 0; color: #333;"><strong>Employee ID:</strong> ${employeeId}</p>` : ''}
              <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${employeeEmail}</p>
              ${officeCollege ? `<p style="margin: 5px 0; color: #333;"><strong>Office/College:</strong> ${officeCollege}</p>` : ''}
              <p style="margin: 5px 0; color: #333;"><strong>Assignment ID:</strong> ${assignmentId}</p>
            </div>

            <div style="margin: 20px 0; padding: 20px; background: white; border-left: 4px solid #0969da; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #0969da;">Disputed Assets (${assets.length} items):</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${assets.map(asset => `
                  <li style="margin: 5px 0; color: #333;">
                    <strong>${asset.asset_code}</strong> - ${asset.asset_type}
                    ${asset.description ? `<br><span style="color: #666; font-size: 14px;">${asset.description}</span>` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>

            <div style="margin: 20px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #856404;">Dispute Reason:</h3>
              <p style="margin: 0; color: #333; font-style: italic;">"${disputeReason}"</p>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">Please review this dispute and take appropriate action through the admin panel.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Asset Management System</strong></p>
          </div>
        </div>
      `;
    } else if (isReminder) {
      // Reminder email for unsigned assignments
      subject = `Reminder #${reminderNumber}: Asset Handover Signature Required - Ajman University`;
      textContent = `Dear ${employeeName},\n\n` +
        `This is reminder #${reminderNumber} that you have assets assigned to you requiring acknowledgement.\n\n` +
        `🔗 Sign Acknowledgement: ${signingUrl}\n\n` +
        `⏰ This link will expire in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} on ${expiryDate}.\n\n` +
        `If you have issues with the assigned assets, use the "Dispute Assets" button on the signing page.\n\n` +
        `Best regards,\nAjman University Main Store`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ffc107; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: #212529; margin: 0; font-size: 24px;">⏰ Reminder #${reminderNumber}: Signature Required</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Dear ${employeeName},</p>
            <p style="font-size: 16px; color: #333;">This is <strong>reminder #${reminderNumber}</strong> that you have <strong>${assetCount} asset${assetCount !== 1 ? 's' : ''}</strong> assigned to you requiring acknowledgement.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${signingUrl}" style="display: inline-block; padding: 15px 40px; background: #0969da; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(9, 105, 218, 0.3);">
                🔗 Sign Acknowledgement Form
              </a>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: white; border-left: 4px solid ${daysRemaining <= 3 ? '#dc2626' : '#ffc107'}; border-radius: 5px;">
              <p style="margin: 0; color: ${daysRemaining <= 3 ? '#dc2626' : '#856404'}; font-size: 14px;">
                <strong>⏰ Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}:</strong> ${expiryDate}
              </p>
            </div>

            <p style="font-size: 14px; color: #666;">If you have any issues with the assigned assets, please use the <strong>"Dispute Assets"</strong> button on the signing page.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Main Store</strong></p>
          </div>
        </div>
      `;
    } else if (isTransfer && isAdminCopy) {
      // Admin notification for asset transfer
      const assetList = assets ? assets.map((asset, index) =>
        `${index + 1}. ${asset.asset_code} - ${asset.asset_type}${asset.description ? ` (${asset.description})` : ''}`
      ).join('\n') : '';

      subject = `Asset Transfer Completed - ${originalEmployeeName} → ${employeeName}`;
      textContent = `Asset Transfer Completed\n\n` +
        `Assets have been transferred between employees.\n\n` +
        `From Employee:\n` +
        `- Name: ${originalEmployeeName}\n` +
        `- Email: ${originalEmail}\n\n` +
        `To Employee:\n` +
        `- Name: ${employeeName}\n` +
        `${employeeId ? `- Employee ID: ${employeeId}\n` : ''}` +
        `- Email: ${email}\n` +
        `${officeCollege ? `- Office/College: ${officeCollege}\n` : ''}\n` +
        `Transferred Assets (${assetCount} items):\n${assetList}\n\n` +
        `Transfer Reason:\n"${transferReason}"\n\n` +
        `A signing link has been sent to the new employee.\n\n` +
        `Best regards,\nAjman University Asset Management System`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #7c3aed; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">🔄 Asset Transfer Completed</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; font-weight: bold;">Assets have been transferred between employees.</p>

            <div style="margin: 20px 0; padding: 20px; background: white; border-left: 4px solid #dc2626; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #dc2626;">From Employee:</h3>
              <p style="margin: 5px 0; color: #333;"><strong>Name:</strong> ${originalEmployeeName}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${originalEmail}</p>
            </div>

            <div style="text-align: center; margin: 10px 0;">
              <span style="font-size: 24px;">↓</span>
            </div>

            <div style="margin: 20px 0; padding: 20px; background: white; border-left: 4px solid #28a745; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #28a745;">To Employee:</h3>
              <p style="margin: 5px 0; color: #333;"><strong>Name:</strong> ${employeeName}</p>
              ${employeeId ? `<p style="margin: 5px 0; color: #333;"><strong>Employee ID:</strong> ${employeeId}</p>` : ''}
              <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${email}</p>
              ${officeCollege ? `<p style="margin: 5px 0; color: #333;"><strong>Office/College:</strong> ${officeCollege}</p>` : ''}
            </div>

            <div style="margin: 20px 0; padding: 20px; background: white; border-left: 4px solid #0969da; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #0969da;">Transferred Assets (${assetCount} items):</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${assets ? assets.map(asset => `
                  <li style="margin: 5px 0; color: #333;">
                    <strong>${asset.asset_code}</strong> - ${asset.asset_type}
                    ${asset.description ? `<br><span style="color: #666; font-size: 14px;">${asset.description}</span>` : ''}
                  </li>
                `).join('') : ''}
              </ul>
            </div>

            <div style="margin: 20px 0; padding: 20px; background: #f3e8ff; border-left: 4px solid #7c3aed; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #7c3aed;">Transfer Reason:</h3>
              <p style="margin: 0; color: #333; font-style: italic;">"${transferReason}"</p>
            </div>

            <p style="font-size: 14px; color: #666;">A signing link has been sent to the new employee.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Asset Management System</strong></p>
          </div>
        </div>
      `;
    } else if (isTransferNotification) {
      // Notification to original employee about transfer
      const assetList = assets ? assets.map((asset, index) =>
        `${index + 1}. ${asset.asset_code} - ${asset.asset_type}${asset.description ? ` (${asset.description})` : ''}`
      ).join('\n') : '';

      subject = `Asset Transfer Notice - Ajman University`;
      textContent = `Dear ${employeeName},\n\n` +
        `This is to inform you that the following assets previously assigned to you have been transferred to another employee.\n\n` +
        `Transferred Assets (${assetCount} items):\n${assetList}\n\n` +
        `Transfer Reason:\n"${transferReason}"\n\n` +
        `If you have any questions about this transfer, please contact the Main Store.\n\n` +
        `Best regards,\nAjman University Main Store`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f97316; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">🔄 Asset Transfer Notice</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Dear ${employeeName},</p>
            <p style="font-size: 16px; color: #333;">This is to inform you that the following assets previously assigned to you have been transferred to another employee.</p>

            <div style="margin: 20px 0; padding: 20px; background: white; border-left: 4px solid #f97316; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #f97316;">Transferred Assets (${assetCount} items):</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${assets ? assets.map(asset => `
                  <li style="margin: 5px 0; color: #333;">
                    <strong>${asset.asset_code}</strong> - ${asset.asset_type}
                    ${asset.description ? `<br><span style="color: #666; font-size: 14px;">${asset.description}</span>` : ''}
                  </li>
                `).join('') : ''}
              </ul>
            </div>

            <div style="margin: 20px 0; padding: 20px; background: #fff7ed; border-left: 4px solid #f97316; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #c2410c;">Transfer Reason:</h3>
              <p style="margin: 0; color: #333; font-style: italic;">"${transferReason}"</p>
            </div>

            <p style="font-size: 14px; color: #666;">If you have any questions about this transfer, please contact the Main Store.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Main Store</strong></p>
          </div>
        </div>
      `;
    } else if (isTransfer) {
      // Transfer signing link email to new employee
      subject = `Asset Transfer - Signature Required - Ajman University`;
      textContent = `Dear ${employeeName},\n\n` +
        `${assetCount} asset${assetCount !== 1 ? 's have' : ' has'} been transferred to you from ${originalEmployeeName}. Please review and sign the acknowledgement form:\n\n` +
        `🔗 Sign Acknowledgement: ${signingUrl}\n\n` +
        `This link will expire on ${expiryDate}.\n\n` +
        `If you have any issues with the assigned assets, please use the "Dispute Assets" button on the signing page.\n\n` +
        `Best regards,\nAjman University Main Store`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0969da; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">🔄 Asset Transfer - Signature Required</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Dear ${employeeName},</p>
            <p style="font-size: 16px; color: #333;"><strong>${assetCount} asset${assetCount !== 1 ? 's have' : ' has'}</strong> been transferred to you from <strong>${originalEmployeeName}</strong>.</p>
            <p style="font-size: 16px; color: #333;">Please review and sign the acknowledgement form:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${signingUrl}" style="display: inline-block; padding: 15px 40px; background: #0969da; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(9, 105, 218, 0.3);">
                🔗 Sign Acknowledgement Form
              </a>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #ffc107; border-radius: 5px;">
              <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⏰ Expires:</strong> ${expiryDate}</p>
            </div>

            <p style="font-size: 14px; color: #666;">If you have any issues with the assigned assets, please use the <strong>"Dispute Assets"</strong> button on the signing page.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Main Store</strong></p>
          </div>
        </div>
      `;
    } else if (isSignedPDF && isAdminCopy) {
      // Admin copy of signed PDF
      const formattedDate = signatureDate ? (() => {
        const date = new Date(signatureDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
      })() : '';

      subject = `Asset Handover Signed - ${employeeName} - Ajman University`;
      textContent = `Asset Handover Completed\n\nEmployee: ${employeeName}${employeeId ? `\nEmployee ID: ${employeeId}` : ''}${officeCollege ? `\nOffice/College: ${officeCollege}` : ''}\nAssets: ${assetCount} item${assetCount !== 1 ? 's' : ''}\nSigned: ${formattedDate}\n\nPlease find the signed PDF attached for your records.\n\nBest regards,\nAjman University Asset Management System`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #28a745; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">✓ Asset Handover Signed</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; font-weight: bold;">Asset handover form has been signed.</p>
            <div style="margin: 20px 0; padding: 20px; background: white; border-left: 4px solid #28a745; border-radius: 5px;">
              <p style="margin: 5px 0; color: #333;"><strong>Employee:</strong> ${employeeName}</p>
              ${employeeId ? `<p style="margin: 5px 0; color: #333;"><strong>Employee ID:</strong> ${employeeId}</p>` : ''}
              ${officeCollege ? `<p style="margin: 5px 0; color: #333;"><strong>Office/College:</strong> ${officeCollege}</p>` : ''}
              <p style="margin: 5px 0; color: #333;"><strong>Assets:</strong> ${assetCount} item${assetCount !== 1 ? 's' : ''}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Signed:</strong> ${formattedDate}</p>
            </div>
            <p style="font-size: 14px; color: #666;">The signed PDF is attached to this email for your records.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Asset Management System</strong></p>
          </div>
        </div>
      `;
    } else if (isSignedPDF) {
      // Signed PDF email (for employee)
      subject = 'Asset Handover - Signed Confirmation - Ajman University';
      textContent = `Dear ${employeeName},\n\nThank you for signing the Asset Handover Form.\n\nPlease find attached your signed copy for your records.\n\nBest regards,\nAjman University Main Store`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0969da; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Asset Handover Confirmation</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Dear ${employeeName},</p>
            <p style="font-size: 16px; color: #333;">Thank you for signing the Asset Handover Form.</p>
            <p style="font-size: 16px; color: #333;">Please find attached your signed copy for your records.</p>
            <div style="margin: 30px 0; padding: 20px; background: white; border-left: 4px solid #28a745; border-radius: 5px;">
              <p style="margin: 0; color: #28a745; font-weight: bold;">✓ Signature Confirmed</p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Main Store</strong></p>
          </div>
        </div>
      `;
    } else if (isPrimary) {
      // Primary employee signing link email
      subject = 'Asset Handover - Signature Required - Ajman University';
      textContent = `Dear ${employeeName},\n\nAssets have been assigned to you. Please review and sign the acknowledgement form:\n\n🔗 Sign Acknowledgement: ${signingUrl}\n\nThis link will expire on ${expiryDate}.\n\nIf you have any issues with the assigned assets, please use the "Dispute Assets" button on the signing page.\n\nBest regards,\nAjman University Main Store`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0969da; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Asset Handover - Signature Required</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Dear ${employeeName},</p>
            <p style="font-size: 16px; color: #333;">${assetCount} asset${assetCount !== 1 ? 's have' : ' has'} been assigned to you. Please review and sign the acknowledgement form:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signingUrl}" style="display: inline-block; padding: 15px 40px; background: #0969da; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(9, 105, 218, 0.3);">
                🔗 Sign Acknowledgement Form
              </a>
            </div>
            <div style="margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #ffc107; border-radius: 5px;">
              <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⏰ Expires:</strong> ${expiryDate}</p>
            </div>
            <p style="font-size: 14px; color: #666;">If you have any issues with the assigned assets, please use the <strong>"Dispute Assets"</strong> button on the signing page.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Main Store</strong></p>
          </div>
        </div>
      `;
    } else {
      // Backup signer email
      subject = 'Asset Handover - Signature Required (Backup Signer) - Ajman University';
      textContent = `Dear Colleague,\n\nYou have been designated as a backup signer for ${employeeName}'s asset acknowledgement.\n\nEmployee: ${employeeName}${employeeId ? ` (ID: ${employeeId})` : ''}\nPrimary Email: ${primaryEmail}\nAssets: ${assetCount} item${assetCount !== 1 ? 's' : ''}\n\nThe employee may be unavailable (vacation, travel, etc.). You may sign this acknowledgement on their behalf:\n\n🔗 Sign Acknowledgement: ${signingUrl}\n\nThis link will expire on ${expiryDate}.\n\nIf you have any questions, please contact the Main Store.\n\nBest regards,\nAjman University Main Store`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0969da; padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Asset Handover - Backup Signer</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Dear Colleague,</p>
            <p style="font-size: 16px; color: #333;">You have been designated as a <strong>backup signer</strong> for the following employee's asset acknowledgement:</p>
            <div style="margin: 20px 0; padding: 20px; background: white; border-left: 4px solid #0969da; border-radius: 5px;">
              <p style="margin: 5px 0; color: #333;"><strong>Employee:</strong> ${employeeName}</p>
              ${employeeId ? `<p style="margin: 5px 0; color: #333;"><strong>Employee ID:</strong> ${employeeId}</p>` : ''}
              <p style="margin: 5px 0; color: #333;"><strong>Primary Email:</strong> ${primaryEmail}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Assets:</strong> ${assetCount} item${assetCount !== 1 ? 's' : ''}</p>
            </div>
            <p style="font-size: 14px; color: #666;">The employee may be unavailable (vacation, sick leave, business travel, etc.). You may sign this acknowledgement on their behalf:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signingUrl}" style="display: inline-block; padding: 15px 40px; background: #0969da; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(9, 105, 218, 0.3);">
                🔗 Sign Acknowledgement Form
              </a>
            </div>
            <div style="margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #ffc107; border-radius: 5px;">
              <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⏰ Expires:</strong> ${expiryDate}</p>
            </div>
            <p style="font-size: 14px; color: #666;">If you have any questions, please contact the Main Store.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>
            <strong style="color: #333;">Ajman University Main Store</strong></p>
          </div>
        </div>
      `;
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ajman University Asset Management" <assets@ajman.ac.ae>',
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
      attachments: pdfBuffer ? [
        {
          filename: 'Asset_Handover_Form_Signed.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    });

    // Determine email type for logging
    const emailType = isDispute ? 'dispute' :
      isReminder ? 'reminder' :
      (isTransfer && isAdminCopy) ? 'transfer-admin' :
      isTransferNotification ? 'transfer-notification' :
      isTransfer ? 'transfer-signing' :
      isAdminCopy ? 'admin-copy' :
      pdfBuffer ? 'signed-pdf' :
      isPrimary ? 'signing-link' : 'backup-signer';

    logEmailSent(emailType, email, true);

    // For development, log the preview URL
    if (!process.env.SMTP_HOST) {
      logger.debug({ previewUrl: nodemailer.getTestMessageUrl(info) }, 'Email preview available');
    }

    return info;
  } catch (error) {
    // Determine email type for logging
    const emailType = isDispute ? 'dispute' :
      isReminder ? 'reminder' :
      (isTransfer && isAdminCopy) ? 'transfer-admin' :
      isTransferNotification ? 'transfer-notification' :
      isTransfer ? 'transfer-signing' :
      isAdminCopy ? 'admin-copy' :
      pdfBuffer ? 'signed-pdf' :
      isPrimary ? 'signing-link' : 'backup-signer';

    logEmailSent(emailType, email, false, error);
    throw error;
  }
}
