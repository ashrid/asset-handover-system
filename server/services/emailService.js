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

export async function sendHandoverEmail({ email, employeeName, pdfBuffer }) {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Ajman University Asset Management" <assets@ajman.ac.ae>',
      to: email,
      subject: 'Asset Handover Confirmation - Ajman University',
      text: `Dear ${employeeName},\n\nPlease find attached the Asset Handover Form for the devices assigned to you.\n\nKindly review the document, sign it, and return it to the AU Store.\n\nThank you.\n\nBest regards,\nAjman University Asset Management`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003366;">Asset Handover Confirmation</h2>
          <p>Dear ${employeeName},</p>
          <p>Please find attached the Asset Handover Form for the devices assigned to you.</p>
          <p>Kindly review the document, sign it, and return it to the AU Store.</p>
          <p>Thank you.</p>
          <br>
          <p>Best regards,<br>
          <strong>Ajman University Asset Management</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: 'Asset_Handover_Form.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
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
