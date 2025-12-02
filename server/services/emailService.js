import nodemailer from 'nodemailer';

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
    console.log('Using Ethereal email for development');
    console.log('Test account:', testAccount.user);
  }

  return transporter;
}

export async function sendHandoverEmail({ email, employeeName, signingUrl, expiresAt, assetCount, pdfBuffer }) {
  try {
    const transporter = await getTransporter();

    // Format expiration date
    const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    // If pdfBuffer is provided, send signed PDF email (Phase 3)
    // Otherwise, send signing link email (Phase 2)
    const isSignedPDF = !!pdfBuffer;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ajman University Asset Management" <assets@ajman.ac.ae>',
      to: email,
      subject: isSignedPDF
        ? 'Asset Handover - Signed Confirmation - Ajman University'
        : 'Asset Handover - Signature Required - Ajman University',
      text: isSignedPDF
        ? `Dear ${employeeName},\n\nThank you for signing the Asset Handover Form.\n\nPlease find attached your signed copy for your records.\n\nBest regards,\nAjman University Main Store`
        : `Dear ${employeeName},\n\nAssets have been assigned to you. Please review and sign the acknowledgement form:\n\n🔗 Sign Acknowledgement: ${signingUrl}\n\nThis link will expire on ${expiryDate}.\n\nIf you have any issues with the assigned assets, please use the "Dispute Assets" button on the signing page.\n\nBest regards,\nAjman University Main Store`,
      html: isSignedPDF
        ? `
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
        `
        : `
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
        `,
      attachments: pdfBuffer ? [
        {
          filename: 'Asset_Handover_Form_Signed.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    });

    console.log('Email sent:', info.messageId);

    // For development, log the preview URL
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
