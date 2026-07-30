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
const KNOWN_ACTIVE_NAMES = new Set(["Nazhan", "Afif", "Adam", "Nor Affendi Bin Anuar"]);

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
console.log("Distinct names:", distinctNames);

// 1. Ensure every employee referenced in the dump exists.
const employeeIdByName = new Map();
for (const name of distinctNames) {
  const active = KNOWN_ACTIVE_NAMES.has(name);
  const [employee] = await sql`
    INSERT INTO employees (name, active) VALUES (${name}, ${active})
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  `;
  employeeIdByName.set(employee.name, employee.id);
  console.log(`Employee ready: ${employee.name} -> id ${employee.id} (active=${active})`);
}

// 2. Insert attendance rows in timestamp order, skipping duplicates on retry.
rows.sort((a, b) => a.oldId - b.oldId);

let inserted = 0;
for (const row of rows) {
  const employeeId = employeeIdByName.get(row.name);
  const imageUrl = `${IMAGE_BASE_URL}/${row.imagePath}`;

  // The dump's timestamp is Asia/Kuala_Lumpur wall-clock time (the original PHP
  // converted to MYT before saving), so it must be interpreted as MYT, not UTC,
  // when casting into a timestamptz column.
  const existing = await sql`
    SELECT id FROM attendance_log
    WHERE employee_id = ${employeeId}
      AND timestamp = (${row.timestamp}::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')
      AND type = ${row.type}
    LIMIT 1
  `;
  if (existing.length > 0) continue;

  await sql`
    INSERT INTO attendance_log (employee_id, type, image_url, latitude, longitude, timestamp)
    VALUES (
      ${employeeId}, ${row.type}, ${imageUrl}, ${row.latitude}, ${row.longitude},
      (${row.timestamp}::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')
    )
  `;
  inserted++;
}

console.log(`Inserted ${inserted} new attendance_log rows (skipped ${rows.length - inserted} already present).`);
