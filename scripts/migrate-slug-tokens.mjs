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

function slugify(name) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "student";
}

// Only re-slug tokens that still look like the old random base64url format.
// Slugs are always lowercase letters/digits/hyphens only, so any token
// containing an uppercase letter or underscore is unmistakably an old
// random token (base64url) - this makes re-running the script a safe no-op
// once every student has a real slug.
const students = await sql`
  SELECT id, name, attendance_token FROM students
  WHERE attendance_token ~ '[A-Z_]'
  ORDER BY id
`;

console.log(`Found ${students.length} students with random tokens to convert.`);

const taken = new Set(
  (await sql`SELECT attendance_token FROM students`).map((r) => r.attendance_token),
);

for (const student of students) {
  taken.delete(student.attendance_token);

  const base = slugify(student.name);
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);

  await sql`UPDATE students SET attendance_token = ${slug} WHERE id = ${student.id}`;
  console.log(`  ${student.name}: ${student.attendance_token} -> ${slug}`);
}

console.log("Done. Any previously shared links for these students are now invalid.");
