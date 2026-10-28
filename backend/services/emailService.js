const nodemailer = require('nodemailer');
require('dotenv').config();

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER or EMAIL_PASS not configured in environment.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

const DEFAULT_LOGIN_URL = process.env.FRONTEND_URL 
  ? `${process.env.FRONTEND_URL}/login`
  : 'https://solarerp-gamma.vercel.app/login';

/**
 * Send welcome email with login credentials to employee
 */
async function sendEmployeeCredentials({
  to,
  employeeName,
  employeeId,
  email,
  password,
  role = 'Sub-Admin',
  organizationName = 'WhereReady Solar OS',
  loginUrl = DEFAULT_LOGIN_URL
}) {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('Skipping email send: Transporter not configured.');
      return { sent: false, reason: 'Email service not configured' };
    }

    if (!to) {
      return { sent: false, reason: 'Recipient email missing' };
    }

    const roleName = role === 'TENANT_ADMIN' ? 'Tenant Administrator' : 'Operations Sub-Admin / Technician';

    const mailOptions = {
      from: `"WhereReady Solar OS" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Welcome to ${organizationName} — Your Solar OS Login Credentials`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; color: #94a3b8; font-size: 13px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .creds-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .cred-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .cred-row:last-child { margin-bottom: 0; }
    .cred-label { color: #64748b; font-weight: 600; }
    .cred-value { font-family: monospace; font-size: 14px; font-weight: 700; color: #0f172a; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #e0e7ff; color: #3730a3; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700; margin: 16px 0; text-align: center; }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400e; margin-top: 20px; }
    .footer { padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>WHEREREADY SOLAR OS</h1>
      <p>Enterprise Workforce & Operations Platform</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${employeeName || 'Team Member'},</div>
      <p style="font-size: 13px; line-height: 1.6; color: #475569;">
        You have been registered as an active workforce member at <strong>${organizationName}</strong>. 
        Your user access credentials have been provisioned to allow you to log in to the solar management system.
      </p>

      <div class="creds-box">
        <div class="cred-row">
          <span class="cred-label">Employee ID:</span>
          <span class="cred-value">${employeeId || 'N/A'}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">System Role:</span>
          <span class="badge">${roleName}</span>
        </div>
        <div class="cred-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          <span class="cred-label">Login Username / Email:</span>
          <span class="cred-value">${email || to}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Password:</span>
          <span class="cred-value" style="background:#e2e8f0; padding:2px 8px; border-radius:4px;">${password}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" class="btn">Sign In to WhereReady Solar OS</a>
      </div>

      <div class="warning">
        <strong>⚠️ Security Advisory:</strong> This is an auto-generated temporary password. You will be prompted to choose a secure, private password upon your first sign-in.
      </div>
    </div>
    <div class="footer">
      This is an automated system notification from WhereReady Solar OS on behalf of ${organizationName}.<br/>
      If you received this email in error, please contact your organization administrator.
    </div>
  </div>
</body>
</html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Credentials email sent to ${to} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send credentials email to ${to}:`, error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordReset({
  to,
  employeeName,
  password,
  organizationName = 'WhereReady Solar OS',
  loginUrl = DEFAULT_LOGIN_URL
}) {
  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, reason: 'Email service not configured' };

    const mailOptions = {
      from: `"WhereReady Solar OS" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Password Reset Notification — ${organizationName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
    .content { padding: 32px 24px; }
    .creds-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size:18px;">Password Reset Notification</h2>
    </div>
    <div class="content">
      <p>Hello <strong>${employeeName}</strong>,</p>
      <p style="font-size: 13px; color: #475569;">
        Your system login credentials have been reset by your organization administrator.
      </p>
      <div class="creds-box">
        <p style="margin:0 0 8px; font-size: 13px; color: #64748b;"><strong>New Temporary Password:</strong></p>
        <span style="font-family: monospace; font-size: 16px; font-weight: 700; background:#e2e8f0; padding:4px 10px; border-radius:6px;">${password}</span>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${loginUrl}" class="btn">Login & Update Password</a>
      </div>
    </div>
  </div>
</body>
</html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Password reset email sent to ${to} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send password reset email to ${to}:`, error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Send account suspension notification
 */
async function sendAccountSuspended({
  to,
  employeeName,
  organizationName = 'WhereReady Solar OS'
}) {
  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false };

    const mailOptions = {
      from: `"WhereReady Solar OS" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Account Status Notice — Access Suspended`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h3 style="color: #e11d48; margin-top: 0;">Account Access Suspended</h3>
          <p>Hello ${employeeName},</p>
          <p>Your system access to <strong>${organizationName}</strong> has been suspended by your administrator. You will not be able to log in to the solar portal until reactivated.</p>
          <p style="font-size: 12px; color: #64748b;">For assistance, please contact your organization administrator.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error(`[EmailService] Failed to send suspension email:`, error.message);
    return { sent: false };
  }
}

/**
 * Send account reactivation notification
 */
async function sendAccountReactivated({
  to,
  employeeName,
  organizationName = 'WhereReady Solar OS',
  loginUrl = DEFAULT_LOGIN_URL
}) {
  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false };

    const mailOptions = {
      from: `"WhereReady Solar OS" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Account Status Notice — Access Reactivated`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h3 style="color: #059669; margin-top: 0;">Account Access Reactivated</h3>
          <p>Hello ${employeeName},</p>
          <p>Your system access to <strong>${organizationName}</strong> has been reactivated by your administrator. You can now log in to the portal.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${loginUrl}" style="background:#0f172a; color:#fff; padding:10px 20px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:13px;">Go to Login</a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error(`[EmailService] Failed to send reactivation email:`, error.message);
    return { sent: false };
  }
}

module.exports = {
  sendEmployeeCredentials,
  sendPasswordReset,
  sendAccountSuspended,
  sendAccountReactivated
};
