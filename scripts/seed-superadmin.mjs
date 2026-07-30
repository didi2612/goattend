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

const email = process.argv[2];
const name = process.argv[3] ?? null;

if (!email) {
  console.error("Usage: node scripts/seed-superadmin.mjs <email> [name]");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const [user] = await sql`
  INSERT INTO users (email, name, role)
  VALUES (${email.toLowerCase()}, ${name}, 'superadmin')
  ON CONFLICT (email) DO UPDATE SET role = 'superadmin', active = TRUE
  RETURNING id, email, name
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

const resend = new Resend(process.env.RESEND_API_KEY);
const { error } = await resend.emails.send({
  from: process.env.FROM_EMAIL,
  to: user.email,
  subject: "Set up your AZP Attendance Admin superadmin account",
  html: `
    <p>Hi${name ? ` ${name}` : ""},</p>
    <p>You've been set up as a superadmin on AZP Attendance Admin. Click the link below to set your password and sign in:</p>
    <p><a href="${link}">${link}</a></p>
    <p>This link expires in 7 days.</p>
  `,
});

if (error) {
  console.error("Failed to send invite email:", error);
} else {
  console.log(`Invite email sent to ${user.email}.`);
}
