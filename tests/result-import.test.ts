import assert from "node:assert/strict";
import test, { before } from "node:test";

let validatePerformanceRows: typeof import("../src/lib/result-import").validatePerformanceRows;
before(async () => {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/test";
  ({ validatePerformanceRows } = await import("../src/lib/result-import"));
});

const students = [{ id: 1, admissionNumber: "A-001", name: "Ada Student", form: "Form 3", stream: "North" }];

test("performance validation accepts a valid row and maps it to the database contract", () => {
  const result = validatePerformanceRows([
    ["Admission Number", "Student Name", "Form", "Stream", "Term", "Year", "Exam", "Subject", "Marks", "Grade", "Points", "Comment"],
    ["A-001", "Ada Student", "Form 3", "North", "Term 1", "2026", "Mid Term", "Mathematics", "78", "B+", "10", "Good progress"],
  ], students);
  assert.equal(result.validRows, 1);
  assert.equal(result.invalidRows, 0);
  assert.equal(result.data[0].studentId, 1);
  assert.equal(result.data[0].marks, 78);
});

test("performance validation rejects unknown students and duplicate logical rows", () => {
  const result = validatePerformanceRows([
    ["Admission Number", "Student Name", "Form", "Term", "Year", "Exam", "Subject", "Marks", "Grade"],
    ["UNKNOWN", "", "", "Term 1", "2026", "Mid Term", "Mathematics", "70", "B"],
    ["A-001", "Ada Student", "Form 3", "Term 1", "2026", "Mid Term", "Mathematics", "70", "B"],
    ["A-001", "Ada Student", "Form 3", "Term 1", "2026", "Mid Term", "Mathematics", "72", "B+"],
  ], students);
  assert.equal(result.validRows, 1);
  assert.equal(result.invalidRows, 2);
  assert.match(result.errorReport.map((item) => item.error).join(" "), /Student not found/);
  assert.match(result.errorReport.map((item) => item.error).join(" "), /same student/);
});
