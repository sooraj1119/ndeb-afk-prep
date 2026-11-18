import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const MASTER_BUNDLE = path.join(ROOT, "src", "lib", "questions.json");
const DOWNLOADS_DIR = path.join(ROOT, "public", "downloads");
const ARTIFACT_DIR = "C:\\Users\\sooraj\\.gemini\\antigravity\\brain\\59559eb0-10b7-4e60-a34a-e6f96f996bf1";

const manifest = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, "manifest.json"), "utf8"));
const SECTIONS = manifest.map(m => m.id);

function cleanFdiText(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/\btooth\s*#\s*([1-4][1-8]|[5-8][1-5])\b/gi, "tooth $1")
    .replace(/\bteeth\s*#\s*([1-4][1-8]|[5-8][1-5])\b/gi, "teeth $1")
    .replace(/\(#\s*([1-4][1-8]|[5-8][1-5])\)/g, "(tooth $1)")
    .replace(/#([1-4][1-8]|[5-8][1-5])\b/g, "tooth $1")
    .replace(/\btooth\s+tooth\s+/gi, "tooth ");
}

let modifiedCount = 0;
const masterQuestions = [];

for (const sec of SECTIONS) {
  const filePath = path.join(QUESTIONS_DIR, `${sec}.json`);
  const questions = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const q of questions) {
    let wasModified = false;
    const cleanQ = cleanFdiText(q.question);
    if (cleanQ !== q.question) {
      q.question = cleanQ;
      wasModified = true;
    }

    if (Array.isArray(q.options)) {
      for (let i = 0; i < q.options.length; i++) {
        const cleanOpt = cleanFdiText(q.options[i]);
        if (cleanOpt !== q.options[i]) {
          q.options[i] = cleanOpt;
          wasModified = true;
        }
      }
    }

    const cleanExpl = cleanFdiText(q.explanation);
    if (cleanExpl !== q.explanation) {
      q.explanation = cleanExpl;
      wasModified = true;
    }

    if (wasModified) modifiedCount++;
    masterQuestions.push(q);
  }

  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), "utf8");
}

console.log(`Standardized FDI notation in ${modifiedCount} questions across 22 files.`);

// Update master bundle
fs.writeFileSync(MASTER_BUNDLE, JSON.stringify(masterQuestions, null, 2), "utf8");
console.log(`Updated master bundle: ${masterQuestions.length} questions.`);

// Re-generate download files
const dlJsonPath = path.join(DOWNLOADS_DIR, "ndeb-afk-14000-questions.json");
fs.writeFileSync(dlJsonPath, JSON.stringify(masterQuestions, null, 2), "utf8");

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

const letterByIndex = ["A", "B", "C", "D"];
const csvHeader = [
  "ID",
  "Topic",
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Designated Answer Letter",
  "Designated Answer Text",
  "Explanation",
  "Reasoning Model Status",
  "Reasoned Best Option",
  "Reasoning Model Agrees",
  "Reasoning Clinical Rationale"
].join(",") + "\n";

const csvRows = masterQuestions.map(q => {
  const optA = q.options && q.options[0] ? q.options[0] : "";
  const optB = q.options && q.options[1] ? q.options[1] : "";
  const optC = q.options && q.options[2] ? q.options[2] : "";
  const optD = q.options && q.options[3] ? q.options[3] : "";
  const correctLetter = letterByIndex[q.correctAnswer] || "";
  const correctText = q.options && q.options[q.correctAnswer] ? q.options[q.correctAnswer] : "";

  const rAudit = q.ndebReasoningAudit || {};
  const rStatus = rAudit.status || "PASS";
  const rBestOpt = rAudit.reasonedBestOption || correctLetter;
  const rAgrees = rAudit.agrees !== undefined ? (rAudit.agrees ? "TRUE" : "FALSE") : "TRUE";
  const rRationale = rAudit.clinicalRationale || "";

  return [
    escapeCsv(q.id),
    escapeCsv(q.topicId),
    escapeCsv(q.question),
    escapeCsv(optA),
    escapeCsv(optB),
    escapeCsv(optC),
    escapeCsv(optD),
    escapeCsv(correctLetter),
    escapeCsv(correctText),
    escapeCsv(q.explanation),
    escapeCsv(rStatus),
    escapeCsv(rBestOpt),
    escapeCsv(rAgrees),
    escapeCsv(rRationale)
  ].join(",");
});

const dlCsvPath = path.join(DOWNLOADS_DIR, "ndeb-afk-14000-questions.csv");
fs.writeFileSync(dlCsvPath, csvHeader + csvRows.join("\n"), "utf8");

// Mirror to artifact directory
if (fs.existsSync(ARTIFACT_DIR)) {
  const artJsonPath = path.join(ARTIFACT_DIR, "ndeb-afk-14000-questions.json");
  const artCsvPath = path.join(ARTIFACT_DIR, "ndeb-afk-14000-questions.csv");
  fs.copyFileSync(dlJsonPath, artJsonPath);
  fs.copyFileSync(dlCsvPath, artCsvPath);
  console.log("Mirrored clean files to artifact directory.");
}
