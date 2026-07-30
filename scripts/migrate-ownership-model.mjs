import { neon } from "@neondatabase/serverless";
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

const sql = neon(process.env.DATABASE_URL);

async function tableExists(name) {
  const rows = await sql.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name],
  );
  return rows.length > 0;
}

async function columnExists(table, column) {
  const rows = await sql.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return rows.length > 0;
}

// 1. Rename employees -> students (only if students doesn't already exist).
if ((await tableExists("employees")) && !(await tableExists("students"))) {
  console.log("Renaming employees -> students...");
  await sql.query(`ALTER TABLE employees RENAME TO students`);
} else {
  console.log("students table already present (or employees never existed) - skipping rename.");
}

// 2. Rename attendance_log.employee_id -> student_id.
if (
  (await columnExists("attendance_log", "employee_id")) &&
  !(await columnExists("attendance_log", "student_id"))
) {
  console.log("Renaming attendance_log.employee_id -> student_id...");
  await sql.query(`ALTER TABLE attendance_log RENAME COLUMN employee_id TO student_id`);
} else {
  console.log("attendance_log.student_id already present - skipping rename.");
}

// 3. Add owner_id / attendance_token columns.
if (!(await columnExists("students", "owner_id"))) {
  console.log("Adding students.owner_id...");
  await sql.query(`ALTER TABLE students ADD COLUMN owner_id INTEGER REFERENCES users(id)`);
}
if (!(await columnExists("students", "attendance_token"))) {
  console.log("Adding students.attendance_token...");
  await sql.query(`ALTER TABLE students ADD COLUMN attendance_token TEXT`);
}

// 4. Backfill owner_id with the first superadmin, for pre-existing rows.
const missingOwner = await sql.query(
  `SELECT id FROM students WHERE owner_id IS NULL`,
);
if (missingOwner.length > 0) {
  const [superadmin] = await sql.query(
    `SELECT id FROM users WHERE role = 'superadmin' ORDER BY id LIMIT 1`,
  );
  if (!superadmin) {
    console.error("No superadmin found to backfill owner_id - run seed-superadmin.mjs first.");
    process.exit(1);
  }
  console.log(`Backfilling owner_id for ${missingOwner.length} students -> superadmin id ${superadmin.id}`);
  await sql.query(`UPDATE students SET owner_id = $1 WHERE owner_id IS NULL`, [superadmin.id]);
}

// 5. Backfill attendance_token per row (must be unique, so generate individually).
const missingToken = await sql.query(
  `SELECT id FROM students WHERE attendance_token IS NULL`,
);
for (const row of missingToken) {
  const token = randomBytes(16).toString("base64url");
  await sql.query(`UPDATE students SET attendance_token = $1 WHERE id = $2`, [token, row.id]);
}
if (missingToken.length > 0) {
  console.log(`Backfilled attendance_token for ${missingToken.length} students.`);
}

// 6. Enforce NOT NULL + UNIQUE now that every row has a value.
await sql.query(`ALTER TABLE students ALTER COLUMN owner_id SET NOT NULL`);
await sql.query(`ALTER TABLE students ALTER COLUMN attendance_token SET NOT NULL`);
if (
  !(await sql
    .query(
      `SELECT 1 FROM pg_constraint WHERE conname = 'students_attendance_token_key'`,
    )
    .then((r) => r.length > 0))
) {
  await sql.query(`ALTER TABLE students ADD CONSTRAINT students_attendance_token_key UNIQUE (attendance_token)`);
}

// 7. Indexes + access grants table (idempotent).
await sql.query(`CREATE INDEX IF NOT EXISTS idx_students_owner_id ON students(owner_id)`);
await sql.query(`CREATE INDEX IF NOT EXISTS idx_students_attendance_token ON students(attendance_token)`);
await sql.query(`CREATE INDEX IF NOT EXISTS idx_attendance_log_student_id ON attendance_log(student_id)`);

await sql.query(`
  CREATE TABLE IF NOT EXISTS admin_access_grants (
    id SERIAL PRIMARY KEY,
    grantee_admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (grantee_admin_id, target_admin_id)
  )
`);

console.log("Migration complete.");
