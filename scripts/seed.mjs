// One-off idempotent database seed script.
// Run with: node scripts/seed.mjs
// Safe to re-run — it only inserts rows that do not already exist.
import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function hashSensitive(value) {
  const pepper = process.env.AUTH_SECRET || "dev-insecure-secret-change-me-please-0000000000";
  return crypto.createHash("sha256").update(`${pepper}:${value.trim().toLowerCase()}`).digest("hex");
}

async function main() {
  if (process.env.NODE_ENV === "production" && (!process.env.AUTH_SECRET || !process.env.ADMIN_PASSWORD)) {
    throw new Error("AUTH_SECRET and ADMIN_PASSWORD are required when seeding production data");
  }
  const client = await pool.connect();
  try {
    console.log("Seeding St Mark's Secondary School – Obambo database...");

    // --- school settings (singleton) ---
    const settingsCount = await client.query("select count(*)::int from school_settings");
    if (settingsCount.rows[0].count === 0) {
      await client.query(
        `insert into school_settings (school_name, address, motto, vision, mission, core_values, history, stats_visibility, stats_values)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          "St Mark's Secondary School – Obambo",
          "Obambo, South West Kisumu Ward, Kisumu West Sub-County, Kisumu County, Kenya",
          "Information awaiting school verification.",
          "Information awaiting school verification.",
          "Information awaiting school verification.",
          "Information awaiting school verification.",
          "St Mark's Secondary School – Obambo is a mixed day and boarding secondary school in Kisumu West Sub-County, Kisumu County. Detailed founding history is awaiting school verification.",
          JSON.stringify({ students: false, teachers: false, alumni: false, resources: true, years: false, clubs: false }),
          JSON.stringify({ resources: 0 }),
        ],
      );
      console.log("✓ School settings created");
    }

    // --- pages ---
    const pages = [
      ["about", "About St Mark's", "St Mark's Secondary School – Obambo is a mixed day and boarding secondary school located in Obambo, South West Kisumu Ward, Kisumu West Sub-County, Kisumu County, Kenya. Further verified institutional details are awaiting confirmation from the school administration."],
      ["vision", "Our Vision", "Information awaiting school verification."],
      ["mission", "Our Mission", "Information awaiting school verification."],
      ["core-values", "Core Values", "Information awaiting school verification."],
      ["history", "Our History", "Information awaiting school verification."],
      ["academic-life", "Academic Life", "Information awaiting school verification."],
      ["student-life", "Student Life", "Information awaiting school verification."],
      ["school-culture", "School Culture", "Information awaiting school verification."],
      ["community-engagement", "Community Engagement", "Information awaiting school verification."],
      ["admissions", "Admissions", "Information awaiting school verification. Please contact the school administration directly for current admission requirements, joining instructions and fee structure."],
    ];
    for (const [slug, title, content] of pages) {
      const exists = await client.query("select id from pages where slug=$1", [slug]);
      if (exists.rowCount === 0) {
        await client.query("insert into pages (slug, title, content) values ($1,$2,$3)", [slug, title, content]);
      }
    }
    console.log("✓ Core pages ensured");

    // --- subjects ---
    const subjects = [
      ["English", "Languages"], ["Kiswahili", "Languages"], ["Mathematics", "Sciences"],
      ["Biology", "Sciences"], ["Chemistry", "Sciences"], ["Physics", "Sciences"],
      ["History & Government", "Humanities"], ["Geography", "Humanities"],
      ["Christian Religious Education", "Humanities"], ["Agriculture", "Technical"],
      ["Business Studies", "Technical"], ["Computer Studies", "Technical"],
    ];
    for (const [name, department] of subjects) {
      const exists = await client.query("select id from subjects where name=$1", [name]);
      if (exists.rowCount === 0) {
        await client.query("insert into subjects (name, department) values ($1,$2)", [name, department]);
      }
    }
    console.log("✓ Subjects ensured");

    // --- class forms ---
    const forms = [["Form 1", 1], ["Form 2", 2], ["Form 3", 3], ["Form 4", 4]];
    for (const [name, level] of forms) {
      const exists = await client.query("select id from class_forms where name=$1", [name]);
      if (exists.rowCount === 0) {
        await client.query("insert into class_forms (name, level) values ($1,$2)", [name, level]);
      }
    }
    console.log("✓ Class forms ensured");

    // --- default super admin ---
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@stmarks-obambo.local").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    const adminExists = await client.query("select id from staff_users where email=$1", [adminEmail]);
    if (adminExists.rowCount === 0) {
      const hash = await bcrypt.hash(adminPassword, 12);
      await client.query(
        "insert into staff_users (name, email, password_hash, role) values ($1,$2,$3,$4)",
        ["System Administrator", adminEmail, hash, "super_admin"],
      );
      console.log(`✓ Default super admin created — ${adminEmail} / ${adminPassword} (CHANGE IMMEDIATELY)`);
    }

    // --- demo student account for testing the student portal ---
    const demoAdm = "DEMO-0001";
    const demoStudent = await client.query("select id from students where admission_number=$1", [demoAdm]);
    let demoStudentId;
    if (demoStudent.rowCount === 0) {
      const passwordHash = await bcrypt.hash("Student123!", 12);
      const birthCertHash = hashSensitive("DEMO123456");
      const inserted = await client.query(
        `insert into students (admission_number, name, form, password_hash, birth_cert_hash, birth_cert_last4, admitted_year)
         values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [demoAdm, "Demo Student (Sample Account)", "Form 3", passwordHash, birthCertHash, "3456", 2023],
      );
      demoStudentId = inserted.rows[0].id;
      console.log("✓ Demo student created — Admission: DEMO-0001 / Password: Student123! / Birth Cert: DEMO123456");
    } else {
      demoStudentId = demoStudent.rows[0].id;
    }

    // --- demo results for the demo student ---
    const resultCount = await client.query("select count(*)::int from results where student_id=$1", [demoStudentId]);
    if (resultCount.rows[0].count === 0) {
      const demoResults = [
        ["English", 72, "B", 9], ["Kiswahili", 65, "B-", 8], ["Mathematics", 58, "C+", 7],
        ["Biology", 61, "C+", 7], ["Chemistry", 55, "C", 6], ["Physics", 60, "C+", 7],
        ["Geography", 70, "B", 9], ["Business Studies", 74, "B+", 10],
      ];
      for (const [subject, marks, grade, points] of demoResults) {
        await client.query(
          `insert into results (student_id, admission_number, exam_name, subject, marks, grade, points, teacher_comment, term, year)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [demoStudentId, demoAdm, "Term 2 Mid-Term Examination", subject, marks, grade, points, "Good progress. Keep practising past papers.", "Term 2", 2025],
        );
      }
      console.log("✓ Demo results seeded for the demo student");
    }

    // --- demo announcement / news / event / resource (clearly labelled) ---
    const demoAnnouncement = await client.query("select id from announcements where slug=$1", ["welcome-to-the-new-digital-campus"]);
    if (demoAnnouncement.rowCount === 0) {
      await client.query(
        `insert into announcements (title, slug, summary, content, category, priority, author_name, pinned, target_audience)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          "[DEMO] Welcome to the New Digital Campus",
          "welcome-to-the-new-digital-campus",
          "DEMO CONTENT — REPLACE WITH VERIFIED SCHOOL INFORMATION. This sample announcement shows how announcements will appear once published by the school.",
          "DEMO CONTENT — REPLACE WITH VERIFIED SCHOOL INFORMATION.\n\nThis is a demonstration announcement created automatically while the school administration prepares official content. Administrators can edit or delete this from the School Control Center.",
          "general", "important", "School Administration", true, "everyone",
        ],
      );
    }

    const demoNews = await client.query("select id from news where slug=$1", ["demo-news-story"]);
    if (demoNews.rowCount === 0) {
      await client.query(
        `insert into news (title, slug, excerpt, content, category, author_name, reading_time_minutes, featured, gallery)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          "[DEMO] Sample News Story",
          "demo-news-story",
          "DEMO CONTENT — REPLACE WITH VERIFIED SCHOOL INFORMATION.",
          "DEMO CONTENT — REPLACE WITH VERIFIED SCHOOL INFORMATION.\n\nThis illustrates how a published news story will look, including reading time, categories and images.",
          "student-life", "Communications Office", 3, true, JSON.stringify([]),
        ],
      );
    }

    const demoEvent = await client.query("select id from events where slug=$1", ["demo-open-day"]);
    if (demoEvent.rowCount === 0) {
      const start = new Date();
      start.setDate(start.getDate() + 14);
      await client.query(
        `insert into events (title, slug, description, location, audience, category, start_at, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          "[DEMO] Sample School Open Day",
          "demo-open-day",
          "DEMO CONTENT — REPLACE WITH VERIFIED SCHOOL INFORMATION.",
          "St Mark's Secondary School – Obambo",
          "everyone", "events", start.toISOString(), "published",
        ],
      );
    }

    const demoResource = await client.query("select id from resources where title=$1", ["[DEMO] Form 3 Mathematics Revision Paper"]);
    if (demoResource.rowCount === 0) {
      await client.query(
        `insert into resources (title, description, subject, form, term, year, category, file_url, file_type, file_size, uploader_name, tags)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          "[DEMO] Form 3 Mathematics Revision Paper",
          "DEMO CONTENT — REPLACE WITH VERIFIED SCHOOL INFORMATION. Sample placeholder resource demonstrating the Learning Hub.",
          "Mathematics", "Form 3", "Term 2", 2025, "revision-papers",
          "/uploads/demo/sample-placeholder.pdf", "pdf", 0, "School Administration", JSON.stringify(["algebra", "geometry"]),
        ],
      );
    }

    console.log("Seed complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
