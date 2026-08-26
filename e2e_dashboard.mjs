import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept());
  
  try {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Switch to Dashboard tab
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(1000);
    
    // Scroll down to Topic Breakdown
    await page.evaluate(() => {
      window.scrollBy(0, 1500);
    });
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/dashboard_alignment_debug.png' });
    console.log("Saved dashboard screenshot.");
  } finally {
    await browser.close();
  }
})();
