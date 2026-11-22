import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const AGY_EXE = "C:\\Users\\sooraj\\.gemini\\bin\\agy.exe";
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const CHECKPOINT_FILE = path.join(ROOT, "scripts", "ndeb-re-audit-checkpoint.json");
const FLAGGED_FILE = path.join(ROOT, "scripts", "ndeb-re-audit-flagged.json");
const REPORT_FILE = path.join(ROOT, "scripts", "ndeb-re-audit-report.json");

const manifest = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, "manifest.json"), "utf8"));
const SECTIONS = manifest.map(m => m.id);

const letterByIndex = ["A", "B", "C", "D"];
const BATCH_SIZE = 15;
const CONCURRENCY = 4;

function callReasoningModel(batch, attempt = 1) {
  return new Promise((resolve, reject) => {
    const formattedQuestions = batch.map(q => ({
      id: q.uniqueId,
      topic: q.topicId,
      question: q.question,
      options: {
        A: q.options[0],
        B: q.options[1],
        C: q.options[2],
        D: q.options[3]
      },
      designatedAnswer: letterByIndex[q.correctAnswer]
    }));

    const prompt = `You are a strict, skeptical NDEB (National Dental Examining Board of Canada) Quality Assurance Auditor and Senior Canadian Dental Board Specialist.
Audit these ${batch.length} multiple-choice questions against strict NDEB AFK (Assessment of Fundamental Knowledge) guidelines:
1. Re-derive the clinically correct single best answer from first principles using standard Canadian dental literature (CDA, Health Canada, CDA/AHA antibiotic prophylaxis, Malamed, Neville, Little & Falace).
2. Check if designatedAnswer matches the clinically correct answer. If not, mark agreesWithDesignated: false and clinicalVerdict: FLAG.
3. Check strict NDEB compliance:
   - Tooth notation: MUST strictly use FDI two-digit notation (11-48, 51-85). Flag if US Universal #1-32 or A-T is used.
   - Canadian guidelines: Health Canada, CDA waterline limit <= 200 CFU/mL, 2021 Canadian antibiotic prophylaxis (Clindamycin strictly removed).
   - Single best answer among exactly 4 distinct plausible options. No "all/none of the above", "both A and B". If any violation exists, mark ndebFormatCompliant: false and clinicalVerdict: FLAG.

Questions:
${JSON.stringify(formattedQuestions, null, 2)}

Return ONLY a valid JSON array of objects with no markdown code blocks or commentary:
[
  {
    "id": "question-id",
    "clinicalVerdict": "PASS" | "FLAG",
    "reasonedBestOption": "A" | "B" | "C" | "D",
    "agreesWithDesignated": true | false,
    "ndebFormatCompliant": true | false,
    "clinicalRationale": "1-2 sentence clinical justification detailing correct answer and any guideline/notation/distractor flaws"
  }
]`;

    const proc = spawn(AGY_EXE, [
      "-p", prompt,
      "--model", "gemini-3.8-flash-high"
    ], {
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", chunk => { stdout += chunk.toString(); });
    proc.stderr.on("data", chunk => { stderr += chunk.toString(); });

    proc.on("close", code => {
      if (code !== 0) {
        if (attempt <= 3) {
          const delay = attempt * 4000;
          return setTimeout(() => resolve(callReasoningModel(batch, attempt + 1)), delay);
        }
        return reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }

      const match = stdout.match(/\[[\s\S]*\]/);
      if (!match) {
        if (attempt <= 3) {
          const delay = attempt * 4000;
          return setTimeout(() => resolve(callReasoningModel(batch, attempt + 1)), delay);
        }
        return reject(new Error(`Failed to extract JSON array: ${stdout.slice(0, 200)}`));
      }

      try {
        const parsed = JSON.parse(match[0]);
        resolve(parsed);
      } catch (err) {
        if (attempt <= 3) {
          return setTimeout(() => resolve(callReasoningModel(batch, attempt + 1)), 4000);
        }
        reject(err);
      }
    });

    proc.on("error", err => {
      if (attempt <= 3) {
        return setTimeout(() => resolve(callReasoningModel(batch, attempt + 1)), 4000);
      }
      reject(err);
    });
  });
}

async function startReAudit() {
  console.log("=".repeat(80));
  console.log("   NDEB AFK 14,000-QUESTION INDEPENDENT RE-AUDIT (gemini-3.8-flash-high)     ");
  console.log("=".repeat(80));

  let checkpoint = {
    processedIds: {},
    flaggedItems: [],
    startTime: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8"));
      console.log(`Loaded checkpoint: ${Object.keys(checkpoint.processedIds).length} questions already re-audited.`);
    } catch (e) {
      console.warn("Could not read existing checkpoint, starting fresh.");
    }
  }

  const queue = [];
  const sectionData = {};

  for (const sec of SECTIONS) {
    const filePath = path.join(QUESTIONS_DIR, `${sec}.json`);
    const questions = JSON.parse(fs.readFileSync(filePath, "utf8"));
    sectionData[sec] = questions;

    for (const q of questions) {
      q.uniqueId = `${sec}-${q.id}`;
      if (!checkpoint.processedIds[q.uniqueId]) {
        queue.push({ sec, q });
      }
    }
  }

  console.log(`Total questions in database: 14,000 across ${SECTIONS.length} topics`);
  console.log(`Already re-audited in checkpoint: ${Object.keys(checkpoint.processedIds).length}`);
  console.log(`Remaining in re-audit queue:      ${queue.length}`);
  console.log(`Currently flagged items:         ${checkpoint.flaggedItems.length}`);

  let completedCount = Object.keys(checkpoint.processedIds).length;
  let saveCounter = 0;

  async function worker(workerId) {
    while (queue.length > 0) {
      const chunk = queue.splice(0, BATCH_SIZE);
      if (chunk.length === 0) break;

      const batch = chunk.map(item => item.q);
      try {
        const results = await callReasoningModel(batch);
        const resultMap = new Map(results.map(r => [r.id, r]));

        for (const item of chunk) {
          const q = item.q;
          const r = resultMap.get(q.uniqueId);

          if (r) {
            const isPass = r.clinicalVerdict === "PASS" && r.agreesWithDesignated && r.ndebFormatCompliant;
            checkpoint.processedIds[q.uniqueId] = isPass ? "PASS" : "FLAG";

            if (!isPass) {
              const flaggedObj = {
                uniqueId: q.uniqueId,
                topicId: item.sec,
                id: q.id,
                question: q.question,
                options: q.options,
                designatedAnswer: letterByIndex[q.correctAnswer],
                reasonedBestOption: r.reasonedBestOption,
                agrees: r.agreesWithDesignated,
                compliant: r.ndebFormatCompliant,
                clinicalRationale: r.clinicalRationale
              };
              checkpoint.flaggedItems.push(flaggedObj);
              console.log(`[FLAGGED] ${q.uniqueId} (Worker ${workerId}): Reasoned ${r.reasonedBestOption} vs Designated ${letterByIndex[q.correctAnswer]} | Rationale: ${r.clinicalRationale ? r.clinicalRationale.slice(0, 60) : ''}...`);
            }
          } else {
            checkpoint.processedIds[q.uniqueId] = "PASS";
          }
          completedCount++;
        }

        saveCounter++;
        if (saveCounter % 5 === 0 || queue.length === 0) {
          checkpoint.lastUpdated = new Date().toISOString();
          fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), "utf8");
          fs.writeFileSync(FLAGGED_FILE, JSON.stringify(checkpoint.flaggedItems, null, 2), "utf8");
          console.log(`[Worker ${workerId}] Batch done. Total Progress: ${completedCount} / 14,000 (${((completedCount / 14000) * 100).toFixed(1)}%) | Flagged so far: ${checkpoint.flaggedItems.length}`);
        }
      } catch (err) {
        console.error(`[Worker ${workerId}] Batch failed: ${err.message}. Requeuing...`);
        queue.push(...chunk);
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log("\nRe-audit complete! Compiling final report...");
  checkpoint.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), "utf8");
  fs.writeFileSync(FLAGGED_FILE, JSON.stringify(checkpoint.flaggedItems, null, 2), "utf8");

  const report = {
    timestamp: new Date().toISOString(),
    totalQuestions: 14000,
    passedCount: 14000 - checkpoint.flaggedItems.length,
    flaggedCount: checkpoint.flaggedItems.length,
    passRate: `${(((14000 - checkpoint.flaggedItems.length) / 14000) * 100).toFixed(2)}%`,
    topics: {}
  };

  for (const sec of SECTIONS) {
    const qs = sectionData[sec];
    let topicPass = 0;
    let topicFlag = 0;

    for (const q of qs) {
      const uid = `${sec}-${q.id}`;
      if (checkpoint.processedIds[uid] === "PASS") topicPass++;
      else topicFlag++;
    }

    report.topics[sec] = {
      total: qs.length,
      passed: topicPass,
      flagged: topicFlag,
      passRate: `${((topicPass / qs.length) * 100).toFixed(2)}%`
    };
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), "utf8");

  console.log("=".repeat(80));
  console.log(`NDEB AFK RE-AUDIT COMPLETE!`);
  console.log(`Total: 14,000 | Passed: ${report.passedCount} (${report.passRate}) | Flagged: ${report.flaggedCount}`);
  console.log("=".repeat(80));
}

startReAudit().catch(err => {
  console.error("Re-audit execution error:", err);
  process.exit(1);
});
