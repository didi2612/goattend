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

console.log("Creating student_access_grants table...");
await sql.query(`
  CREATE TABLE IF NOT EXISTS student_access_grants (
    id SERIAL PRIMARY KEY,
    grantee_admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (grantee_admin_id, student_id)
  )
`);

const oldGrants = await sql`SELECT COUNT(*)::int AS count FROM admin_access_grants`;
if (oldGrants[0].count > 0) {
  console.log(
    `Note: admin_access_grants still has ${oldGrants[0].count} row(s) from the old per-admin-pool model. ` +
      `These are NOT auto-converted to per-student grants (the old model granted a whole admin's ` +
      `entire student roster, which doesn't map 1:1 to specific students). Re-grant access manually ` +
      `via the Users page if needed.`,
  );
} else {
  console.log("admin_access_grants was empty - dropping the old table.");
  await sql.query(`DROP TABLE admin_access_grants`);
}

console.log("Migration complete.");
