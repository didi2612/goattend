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

if (!(await columnExists("attendance_log", "remarks"))) {
  console.log("Adding attendance_log.remarks...");
  await sql.query(`ALTER TABLE attendance_log ADD COLUMN remarks TEXT`);
}

console.log("Re-pointing attendance_log's student FK to ON DELETE CASCADE...");
// Find the FK constraint whose single column is student_id, regardless of its
// (possibly stale, pre-rename) constraint name.
const [fk] = await sql.query(`
  SELECT c.conname
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'attendance_log'::regclass
    AND c.contype = 'f'
    AND c.confdeltype != 'c'
    AND a.attname = 'student_id'
`);
if (fk) {
  await sql.query(`ALTER TABLE attendance_log DROP CONSTRAINT ${fk.conname}`);
  await sql.query(`
    ALTER TABLE attendance_log
    ADD CONSTRAINT attendance_log_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  `);
} else {
  console.log("No matching FK found (already migrated?) - skipping.");
}

console.log("Migration complete.");
