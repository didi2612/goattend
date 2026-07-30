import { Resend } from "resend";

const ACCENT = "#4f46e5";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e5e7eb";
const SURFACE = "#f7f8fa";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

function getAppUrl() {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL is not set");
  return url.replace(/\/$/, "");
}

function emailShell(params: { preheader: string; heading: string; bodyHtml: string }) {
  const { preheader, heading, bodyHtml } = params;
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background:${SURFACE}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%; max-width:480px; background:#ffffff; border-radius:16px; border:1px solid ${BORDER}; overflow:hidden;">
            <tr>
              <td style="background:${ACCENT}; padding:22px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px; height:32px; background:rgba(255,255,255,0.18); border-radius:8px; text-align:center; vertical-align:middle; font-weight:700; color:#ffffff; font-size:15px;">
                      G
                    </td>
                    <td style="padding-left:10px; color:#ffffff; font-weight:700; font-size:15px; letter-spacing:0.2px;">
                      AZP : GO ATTEND
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:19px; font-weight:700; color:${INK};">${heading}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="max-width:480px; margin:20px 0 0; font-size:12px; color:${MUTED}; text-align:center;">
            AZP : GO ATTEND student attendance tracking.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function ctaButton(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
      <tr>
        <td style="border-radius:10px; background:${ACCENT};">
          <a href="${href}" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 0; font-size:12px; color:${MUTED}; word-break:break-all;">
      Or paste this link into your browser:<br />
      <a href="${href}" style="color:${ACCENT};">${href}</a>
    </p>
  `;
}

export async function sendInviteEmail(params: { email: string; name: string | null; token: string }) {
  const { email, name, token } = params;
  const link = `${getAppUrl()}/set-password?token=${token}`;

  const html = emailShell({
    preheader: "You've been invited to AZP : GO ATTEND. Set your password to get started.",
    heading: "You've been invited",
    bodyHtml: `
      <p style="margin:0 0 12px; font-size:14px; line-height:1.6; color:${INK};">
        Hi${name ? ` ${name}` : ""},
      </p>
      <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:${INK};">
        You've been added as a supervisor on <strong>AZP : GO ATTEND</strong>. Click below to set
        your password and sign in.
      </p>
      ${ctaButton(link, "Set Your Password")}
      <p style="margin:20px 0 0; font-size:12px; color:${MUTED};">This link expires in 7 days.</p>
    `,
  });

  const { error } = await getResend().emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "You've been invited to AZP : GO ATTEND",
    html,
  });

  if (error) throw new Error(`Failed to send invite email: ${error.message}`);
}

export async function sendResetEmail(params: { email: string; token: string }) {
  const { email, token } = params;
  const link = `${getAppUrl()}/set-password?token=${token}`;

  const html = emailShell({
    preheader: "Reset your AZP : GO ATTEND password.",
    heading: "Reset your password",
    bodyHtml: `
      <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:${INK};">
        We received a request to reset your password. Click below to choose a new one.
      </p>
      ${ctaButton(link, "Reset Password")}
      <p style="margin:20px 0 0; font-size:12px; color:${MUTED};">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    `,
  });

  const { error } = await getResend().emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "Reset your AZP : GO ATTEND password",
    html,
  });

  if (error) throw new Error(`Failed to send reset email: ${error.message}`);
}
