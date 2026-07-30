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

async function columnExists(table, column) {
  const rows = await sql.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return rows.length > 0;
}

if (!(await columnExists("attendance_log", "flagged"))) {
  console.log("Adding attendance_log.flagged...");
  await sql.query(`ALTER TABLE attendance_log ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT FALSE`);
}

if (!(await columnExists("attendance_log", "flag_reason"))) {
  console.log("Adding attendance_log.flag_reason...");
  await sql.query(`ALTER TABLE attendance_log ADD COLUMN flag_reason TEXT`);
}

console.log("Migration complete.");
