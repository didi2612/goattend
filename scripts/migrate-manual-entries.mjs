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

console.log("Making image_url/latitude/longitude nullable on attendance_log...");
await sql.query(`ALTER TABLE attendance_log ALTER COLUMN image_url DROP NOT NULL`);
await sql.query(`ALTER TABLE attendance_log ALTER COLUMN latitude DROP NOT NULL`);
await sql.query(`ALTER TABLE attendance_log ALTER COLUMN longitude DROP NOT NULL`);

if (!(await columnExists("attendance_log", "source"))) {
  console.log("Adding attendance_log.source...");
  await sql.query(
    `ALTER TABLE attendance_log ADD COLUMN source TEXT NOT NULL DEFAULT 'self' CHECK (source IN ('self', 'manual'))`,
  );
}

if (!(await columnExists("attendance_log", "recorded_by"))) {
  console.log("Adding attendance_log.recorded_by...");
  await sql.query(`ALTER TABLE attendance_log ADD COLUMN recorded_by INTEGER REFERENCES users(id)`);
}

console.log("Migration complete.");
