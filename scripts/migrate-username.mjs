import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envText = readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
for (const line of envText.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const sql = neon(process.env.DATABASE_URL);

function usernameFromEmail(email) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  return base || "user";
}

async function columnExists(table, column) {
  const rows = await sql.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return rows.length > 0;
}

if (!(await columnExists("users", "username"))) {
  console.log("Adding users.username...");
  await sql.query(`ALTER TABLE users ADD COLUMN username TEXT`);
}

const users = await sql`SELECT id, email, username FROM users WHERE username IS NULL ORDER BY id`;
const taken = new Set(
  (await sql`SELECT username FROM users WHERE username IS NOT NULL`).map((r) => r.username),
);

for (const user of users) {
  const base = usernameFromEmail(user.email);
  let username = base;
  let n = 2;
  while (taken.has(username)) username = `${base}${n++}`;
  taken.add(username);

  await sql`UPDATE users SET username = ${username} WHERE id = ${user.id}`;
  console.log(`  ${user.email} -> username: ${username}`);
}

await sql.query(`ALTER TABLE users ALTER COLUMN username SET NOT NULL`);
const hasUniqueConstraint = await sql`
  SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
`;
if (hasUniqueConstraint.length === 0) {
  await sql.query(`ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username)`);
}

console.log("Migration complete. Existing users can now log in with the username shown above.");
