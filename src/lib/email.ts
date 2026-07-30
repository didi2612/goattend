import { Resend } from "resend";

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

export async function sendInviteEmail(params: { email: string; name: string | null; token: string }) {
  const { email, name, token } = params;
  const link = `${getAppUrl()}/set-password?token=${token}`;

  const { error } = await getResend().emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "You've been invited to AZP Attendance Admin",
    html: `
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>You've been added as a supervisor on AZP Attendance Admin. Click the link below to set your password and sign in:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });

  if (error) throw new Error(`Failed to send invite email: ${error.message}`);
}

export async function sendResetEmail(params: { email: string; token: string }) {
  const { email, token } = params;
  const link = `${getAppUrl()}/set-password?token=${token}`;

  const { error } = await getResend().emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "Reset your AZP Attendance Admin password",
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) throw new Error(`Failed to send reset email: ${error.message}`);
}
