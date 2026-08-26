import puppeteer from "puppeteer";
const BASE_URL = "https://ndeb-afk-prep.surge.sh";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  await page.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 30000 });

  // Dismiss disclaimer
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Agree") || b.innerText.includes("Understand"));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click Anatomy
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("*"));
    const el = els.find(e => e.innerText && e.innerText.trim() === "Anatomy" && e.children.length < 5);
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // Pick an answer
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const opt = btns.find(b => {
      const t = b.innerText.trim();
      return t.length > 8 && t.length < 250 && !["Flag","Back","Next","Shuffle","Continue"].some(k => t.includes(k));
    });
    if (opt) { console.log("Clicking option:", opt.innerText.substring(0,50)); opt.click(); }
    else console.log("No option found!");
  });
  await new Promise(r => setTimeout(r, 1500));

  // Log all buttons now visible
  const btns = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b => b.innerText.trim().substring(0,40)));
  console.log("Buttons after answer:", JSON.stringify(btns));

  // Try clicking Next
  const bodyBefore = await page.evaluate(() => document.body.innerText.substring(0, 100));
  console.log("Body before next:", bodyBefore);

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Next") || b.innerText.includes("Continue") || b.innerText.includes("?"));
    if (btn) { console.log("Clicking:", btn.innerText); btn.click(); }
    else console.log("Next button NOT FOUND");
  });
  await new Promise(r => setTimeout(r, 1500));

  const bodyAfter = await page.evaluate(() => document.body.innerText.substring(0, 100));
  console.log("Body after next:", bodyAfter);
  console.log("Changed:", bodyBefore !== bodyAfter);

  await browser.close();
})();
