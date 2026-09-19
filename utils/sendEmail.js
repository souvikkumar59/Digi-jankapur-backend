const nodemailer = require('nodemailer');

/**
 * Send 6-digit OTP verification email
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} options.purpose - 'registration', 'login', or 'password reset'
 */
const sendEmail = async ({ to, subject, otp, purpose = 'authentication' }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Check if live credentials exist
  if (!emailUser || !emailPass) {
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log(`║ 📧 [SIMULATED EMAIL TO: ${to}]`);
    console.log(`║ 🔑 6-Digit OTP Code: ${otp}`);
    console.log(`║ 🏷️  Purpose: ${purpose.toUpperCase()}`);
    console.log('║ 💡 To deliver real emails, set EMAIL_USER & EMAIL_PASS in .env      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #1c1917; padding: 24px; text-align: center;">
          <h1 style="color: #fbbf24; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">JANKAPUR ACADEMIC NETWORK</h1>
          <p style="color: #a8a29e; margin: 6px 0 0 0; font-size: 12px;">Student & Scholar Portal</p>
        </div>
        
        <div style="padding: 32px 28px; text-align: center;">
          <h2 style="color: #1c1917; margin: 0 0 12px 0; font-size: 22px; font-weight: 700;">Your Verification Code</h2>
          <p style="color: #57534e; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">
            Use the 6-digit code below to complete your <strong>${purpose}</strong>. This code will expire in <strong>5 minutes</strong>.
          </p>
          
          <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 12px; padding: 18px; margin: 0 auto 24px auto; display: inline-block;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #78350f;">
              ${otp}
            </span>
          </div>
          
          <p style="color: #a8a29e; font-size: 12px; margin: 0 0 20px 0;">
            If you did not request this verification code, please ignore this email. Do not share this code with anyone.
          </p>
        </div>
        
        <div style="background-color: #f5f5f4; padding: 16px; text-align: center; border-top: 1px solid #e7e5e4;">
          <p style="color: #78716c; font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} Smart Jankapur Portal. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Jankapur Hub" <${emailUser}>`,
      to,
      subject: subject || `Your Jankapur Hub Verification Code: ${otp}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Live OTP sent to ${to}: MessageId=${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
    throw new Error('Failed to send verification email. Please check your email address or server config.');
  }
};

module.exports = sendEmail;
