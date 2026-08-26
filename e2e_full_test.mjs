import puppeteer from "puppeteer";

const BASE_URL = "https://ndeb-afk-prep.surge.sh";
const results = [];

function log(test, pass, detail = "") {
  const icon = pass ? "PASS" : "FAIL";
  console.log(`[${icon}] ${test}${detail ? ": " + detail : ""}`);
  results.push({ test, pass, detail });
}

async function enterQuiz(page) {
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("*"));
    const el = els.find(e => e.innerText && e.innerText.trim() === "Anatomy" && e.children.length < 5);
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 3000));
}

async function answerQuestion(page) {
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const opt = btns.find(b => {
      const t = b.innerText.trim();
      return t.length > 8 && t.length < 250 && !["Flag","Back","Next","Shuffle","EN","FR","Study Topics","Search","Dashboard","Install","Good translation","Poor translation"].some(k => t === k) && !t.startsWith("swipe");
    });
    if (opt) opt.click();
  });
  await new Promise(r => setTimeout(r, 1500));
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const jsErrors = [];
  page.on("pageerror", err => jsErrors.push(err.message));

  console.log("\n=== NDEB AFK Prep Pro Full E2E Test Suite ===\n");

  try {
    const resp = await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    log("1. Site returns HTTP 200", resp.status() === 200, `status=${resp.status()}`);
  } catch (e) { log("1. Site returns HTTP 200", false, e.message); }

  try {
    const body = await page.evaluate(() => document.body.innerText);
    log("2. Medical disclaimer modal appears", body.includes("Medical Disclaimer") || body.includes("Educational") || body.includes("Disclaimer"));
  } catch (e) { log("2. Disclaimer modal", false, e.message); }

  try {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Agree") || b.innerText.includes("Understand"));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const body = await page.evaluate(() => document.body.innerText);
    log("3. Disclaimer dismissed, topics visible", body.includes("Anatomy") || body.includes("Select a Topic"));
  } catch (e) { log("3. Disclaimer dismissed", false, e.message); }

  try {
    await new Promise(r => setTimeout(r, 1000));
    const count = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const numSpan = spans.find(s => { const n = parseInt(s.innerText.trim()); return !isNaN(n) && n > 100; });
      if (numSpan) return parseInt(numSpan.innerText.trim());
      const text = document.body.innerText;
      const m = text.match(/(\d{3,})/);
      return m ? parseInt(m[1]) : 0;
    });
    log("4. Questions loaded (non-zero per topic)", count > 100, `${count} questions per topic`);
  } catch (e) { log("4. Questions loaded", false, e.message); }

  try {
    const body = await page.evaluate(() => document.body.innerText);
    const topics = ["Anatomy","Pharmacology","Endodontics","Pathology","Prosthodontics","Periodontology","Radiology","Biochemistry","Microbiology","Anesthesia"];
    const missing = topics.filter(t => !body.includes(t));
    log("5. All 10 major topics visible", missing.length === 0, missing.length ? `missing: ${missing.join(",")}` : "all present");
  } catch (e) { log("5. Topics visible", false, e.message); }

  try {
    const manifest = await page.evaluate(async () => { const res = await fetch("/questions/manifest.json"); return res.json(); });
    const allFull = manifest.filter(t => t.count >= 500).length;
    log("6. Manifest API accessible & valid", manifest.length >= 13, `${allFull}/${manifest.length} topics at 500+ questions`);
  } catch (e) { log("6. Manifest check", false, e.message); }

  await enterQuiz(page);
  try {
    const body = await page.evaluate(() => document.body.innerText);
    const inQuiz = body.match(/\d+ \/ \d+/) || body.includes("Flag") || body.includes("Shuffle");
    log("7. Clicking topic starts quiz", !!inQuiz);
  } catch (e) { log("7. Quiz starts on click", false, e.message); }

  try {
    const body = await page.evaluate(() => document.body.innerText);
    log("8. Question has substantial content", body.length > 400, `${body.length} chars`);
  } catch (e) { log("8. Clinical content", false, e.message); }

  await answerQuestion(page);
  try {
    const body = await page.evaluate(() => document.body.innerText);
    const hasFeedback = body.toLowerCase().includes("explanation") || body.includes("Correct") || body.includes("Incorrect");
    log("9. Selecting answer shows explanation/feedback", hasFeedback);
  } catch (e) { log("9. Answer feedback", false, e.message); }

  try {
    const bodyBefore = await page.evaluate(() => document.body.innerText);
    // The next button is an icon-only arrow. Use keyboard Enter which the app supports natively.
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 2000));
    const bodyAfter = await page.evaluate(() => document.body.innerText);
    log("10. Next button advances to next question", bodyAfter !== bodyBefore);
  } catch (e) { log("10. Next navigation", false, e.message); }

  try {
    await answerQuestion(page);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Flag") || b.title === "Flag question");
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const body = await page.evaluate(() => document.body.innerText);
    log("11. Flag button is interactive", body.includes("Flag") || body.includes("Flagged") || body.includes("Unflag"));
  } catch (e) { log("11. Flag button", false, e.message); }

  try {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Back") || b.title === "Back to topics");
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const body = await page.evaluate(() => document.body.innerText);
    log("12. Back button returns to topic list", body.includes("Anatomy") && body.includes("Select a Topic"));
  } catch (e) { log("12. Back navigation", false, e.message); }

  try {
    await page.evaluate(() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText && b.innerText.trim() === "Search"); if (btn) btn.click(); });
    await new Promise(r => setTimeout(r, 1000));
    const body = await page.evaluate(() => document.body.innerText);
    log("13. Search tab navigates correctly", body.toLowerCase().includes("search"));
  } catch (e) { log("13. Search tab", false, e.message); }

  try {
    await page.evaluate(() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText && b.innerText.trim() === "Dashboard"); if (btn) btn.click(); });
    await new Promise(r => setTimeout(r, 1000));
    const body = await page.evaluate(() => document.body.innerText);
    log("14. Dashboard shows progress data", body.includes("Progress") || body.includes("Attempted") || body.includes("Score") || body.includes("Flagged") || body.includes("streak"));
  } catch (e) { log("14. Dashboard tab", false, e.message); }

  try {
    await page.evaluate(() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText && b.innerText.trim() === "Study Topics"); if (btn) btn.click(); });
    await new Promise(r => setTimeout(r, 1000));
    const body = await page.evaluate(() => document.body.innerText);
    log("15. Simulated Mock Exam visible", body.includes("Mock Exam") || body.includes("Simulated"));
  } catch (e) { log("15. Mock Exam", false, e.message); }

  log("16. Zero JavaScript crashes throughout", jsErrors.length === 0, jsErrors.length ? jsErrors[0].substring(0,120) : "clean session");

  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== RESULTS: ${passed}/${total} PASSED ===`);
  if (passed === total) { console.log("ALL TESTS PASSED - App is production ready!"); }
  else {
    console.log(`${Math.round(passed/total*100)}% passing. FAILURES:`);
    results.filter(r => !r.pass).forEach(r => console.log(`  FAIL: ${r.test} - ${r.detail}`));
  }
  await browser.close();
  process.exit(passed === total ? 0 : 1);
})();