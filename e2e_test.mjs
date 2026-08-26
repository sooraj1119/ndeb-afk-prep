import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await context.newPage();
  
  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
    // Accept disclaimer
    try {
      await page.waitForSelector('button:has-text("I Agree & Continue")', { timeout: 3000 });
      await page.click('button:has-text("I Agree & Continue")');
      console.log("Accepted disclaimer");
    } catch(e) {
      console.log("No disclaimer found, continuing...");
    }

    // Go to Simulated Mock Exam
    console.log("Starting Simulated Mock Exam...");
    await page.click('div:has-text("Simulated Mock Exam")');
    await page.waitForTimeout(1000);
    
    // Get initial timer text
    const initialTimer = await page.locator('div', { has: page.locator('svg.lucide-clock') }).textContent();
    console.log(`Initial timer: ${initialTimer.trim()}`);
    
    // Select first option
    console.log("Selecting option A...");
    await page.click('button:has-text("A")');
    await page.waitForTimeout(500);
    
    // Click Next
    console.log("Clicking Next...");
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Wait for timer to tick down
    console.log("Waiting 3 seconds...");
    await page.waitForTimeout(3000);
    
    // Get timer before back
    const beforeBackTimer = await page.locator('div', { has: page.locator('svg.lucide-clock') }).textContent();
    console.log(`Timer before going back: ${beforeBackTimer.trim()}`);
    
    // Click Back
    console.log("Clicking Back...");
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(1000);
    
    // Go to Simulated Mock Exam again
    console.log("Resuming Simulated Mock Exam...");
    await page.click('div:has-text("Simulated Mock Exam")');
    await page.waitForTimeout(1000);
    
    // Get resumed timer
    const resumedTimer = await page.locator('div', { has: page.locator('svg.lucide-clock') }).textContent();
    console.log(`Resumed timer: ${resumedTimer.trim()}`);
    
    // Check if it's on question 2
    const countText = await page.locator('span', { hasText: '/' }).textContent();
    console.log(`Current progress count: ${countText.trim()}`);
    
    if (initialTimer === resumedTimer) {
      console.log("❌ Timer reset bug still present (Initial == Resumed)");
    } else {
      console.log("✅ Timer correctly continued ticking");
    }
    
    // Take screenshot to check alignment
    await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/e2e_alignment.png' });
    console.log("Screenshot saved to check mobile alignment.");
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
})();
