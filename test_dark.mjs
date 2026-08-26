import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await context.newPage();
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
  });
  await page.reload();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/dark_dashboard.png', fullPage: true });
  await page.click('button:has-text("General Medicine")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/dark_quiz.png', fullPage: true });
  await browser.close();
})();
