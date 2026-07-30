import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envText = readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
for (const line of envText.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const username = process.argv[2];
const email = process.argv[3];
const name = process.argv[4] ?? null;

if (!username || !email) {
  console.error("Usage: node scripts/seed-superadmin.mjs <username> <email> [name]");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const [user] = await sql`
  INSERT INTO users (username, email, name, role)
  VALUES (${username.toLowerCase()}, ${email.toLowerCase()}, ${name}, 'superadmin')
  ON CONFLICT (email) DO UPDATE SET role = 'superadmin', active = TRUE
  RETURNING id, username, email, name
`;

const token = randomBytes(32).toString("base64url");
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

await sql`
  INSERT INTO auth_tokens (user_id, token, type, expires_at)
  VALUES (${user.id}, ${token}, 'invite', ${expiresAt.toISOString()})
`;

const link = `${process.env.APP_URL}/set-password?token=${token}`;
console.log(`Superadmin ready: ${user.email} (id ${user.id})`);
console.log(`Set-password link: ${link}`);

const ACCENT = "#4f46e5";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e5e7eb";
const SURFACE = "#f7f8fa";

const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0; padding:0; background:${SURFACE}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%; max-width:480px; background:#ffffff; border-radius:16px; border:1px solid ${BORDER}; overflow:hidden;">
            <tr>
              <td style="background:${ACCENT}; padding:22px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px; height:32px; background:rgba(255,255,255,0.18); border-radius:8px; text-align:center; vertical-align:middle; font-weight:700; color:#ffffff; font-size:15px;">G</td>
                    <td style="padding-left:10px; color:#ffffff; font-weight:700; font-size:15px; letter-spacing:0.2px;">AZP : GO ATTEND</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:19px; font-weight:700; color:${INK};">Set up your superadmin account</h1>
                <p style="margin:0 0 12px; font-size:14px; line-height:1.6; color:${INK};">Hi${name ? ` ${name}` : ""},</p>
                <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:${INK};">
                  You've been set up as a superadmin on <strong>AZP : GO ATTEND</strong>. Click below to set your password, then sign in with the username below.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px; width:100%;">
                  <tr>
                    <td style="background:${SURFACE}; border:1px solid ${BORDER}; border-radius:10px; padding:12px 16px;">
                      <p style="margin:0; font-size:12px; color:${MUTED};">Your username</p>
                      <p style="margin:2px 0 0; font-size:15px; font-weight:700; color:${INK};">${user.username}</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
                  <tr>
                    <td style="border-radius:10px; background:${ACCENT};">
                      <a href="${link}" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">Set Your Password</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0; font-size:12px; color:${MUTED}; word-break:break-all;">
                  Or paste this link into your browser:<br />
                  <a href="${link}" style="color:${ACCENT};">${link}</a>
                </p>
                <p style="margin:20px 0 0; font-size:12px; color:${MUTED};">This link expires in 7 days.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const resend = new Resend(process.env.RESEND_API_KEY);
const { error } = await resend.emails.send({
  from: process.env.FROM_EMAIL,
  to: user.email,
  subject: "Set up your AZP : GO ATTEND superadmin account",
  html,
});

if (error) {
  console.error("Failed to send invite email:", error);
} else {
  console.log(`Invite email sent to ${user.email}.`);
}
