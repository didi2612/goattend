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

const IMAGE_BASE_URL = "https://interns.azmiproductions.com";

const dumpPath = path.join(__dirname, "..", "..", "db", "azmiprod_interns3.sql");
const text = readFileSync(dumpPath, "utf8");

const rowRe =
  /\((\d+),\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*([\d.]+),\s*([\d.]+),\s*'([^']*)',\s*'([^']*)'\)/g;

function unescape(s) {
  return s.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
}

const rows = [];
let m;
while ((m = rowRe.exec(text))) {
  rows.push({
    oldId: Number(m[1]),
    name: unescape(m[2]),
    imagePath: unescape(m[3]),
    latitude: Number(m[4]),
    longitude: Number(m[5]),
    timestamp: m[6],
    type: m[7],
  });
}

console.log(`Parsed ${rows.length} rows from dump.`);

const distinctNames = [...new Set(rows.map((r) => r.name))];
const existingStudents = await sql`SELECT id, name FROM students WHERE name = ANY(${distinctNames})`;
const studentIdByName = new Map(existingStudents.map((s) => [s.name, s.id]));

const missingNames = distinctNames.filter((n) => !studentIdByName.has(n));
if (missingNames.length > 0) {
  console.error(
    "These names from the dump have no matching student in the DB - aborting so nothing is created under the wrong assumptions:",
    missingNames,
  );
  process.exit(1);
}
console.log("All dump names already exist as students:", [...studentIdByName.keys()]);

rows.sort((a, b) => a.oldId - b.oldId);

let inserted = 0;
for (const row of rows) {
  const studentId = studentIdByName.get(row.name);
  const imageUrl = `${IMAGE_BASE_URL}/${row.imagePath}`;

  const existing = await sql`
    SELECT id FROM attendance_log
    WHERE student_id = ${studentId}
      AND timestamp = (${row.timestamp}::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')
      AND type = ${row.type}
    LIMIT 1
  `;
  if (existing.length > 0) continue;

  await sql`
    INSERT INTO attendance_log (student_id, type, image_url, latitude, longitude, timestamp, source)
    VALUES (
      ${studentId}, ${row.type}, ${imageUrl}, ${row.latitude}, ${row.longitude},
      (${row.timestamp}::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur'),
      'self'
    )
  `;
  inserted++;
  console.log(`  inserted: ${row.name} ${row.type} @ ${row.timestamp}`);
}

console.log(`Inserted ${inserted} new attendance_log rows (skipped ${rows.length - inserted} already present).`);
