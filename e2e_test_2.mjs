import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept());
  
  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
    // Bypass disclaimer
    await page.evaluate(() => {
      localStorage.setItem('ndeb_prep_disclaimer_accepted', 'true');
    });
    await page.reload();

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/e2e_debug_1.png' });
    console.log("Saved debug screenshot");

    // Wait for the button to be visible
    await page.waitForSelector('h3:has-text("Simulated Mock Exam")');
    console.log("Starting Simulated Mock Exam...");
    await page.click('h3:has-text("Simulated Mock Exam")');
    await page.waitForTimeout(1000);
    
    // Take a screenshot right after loading
    await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/e2e_after_start.png' });
    console.log("Screenshot saved.");
    
    // Click Back
    console.log("Clicking Back...");
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(1000);
    
    // Start again
    console.log("Resuming Simulated Mock Exam...");
    await page.click('h3:has-text("Simulated Mock Exam")');
    await page.waitForTimeout(1000);
    
    // Take a final screenshot
    await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/e2e_resumed.png' });
    console.log("Final screenshot saved.");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
})();
