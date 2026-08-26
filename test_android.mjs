import { chromium, devices } from 'playwright';

(async () => {
  // Emulate Pixel 5
  const pixel5 = devices['Pixel 5'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...pixel5,
    colorScheme: 'dark' // Test in dark mode!
  });
  const page = await context.newPage();

  console.log("Navigating to app...");
  await page.goto('http://localhost:5173');

  // Wait for the modal and click "I Understand and Agree"
  console.log("Accepting disclaimer...");
  await page.waitForSelector('text="I Understand and Agree"');
  await page.click('text="I Understand and Agree"');
  
  // Wait for animation to clear
  await page.waitForTimeout(1000);

  // Take screenshot of Practice screen (Topic Selection)
  console.log("Capturing Practice Screen...");
  await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/android_practice.png', fullPage: true });

  // Navigate to Dashboard
  console.log("Navigating to Dashboard...");
  await page.click('text="Dashboard"');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/android_dashboard.png', fullPage: true });

  // Navigate to Search
  console.log("Navigating to Search...");
  await page.click('text="Search"');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/android_search.png', fullPage: true });

  // Go back to practice and click Anatomy to see Quiz UI
  console.log("Navigating to Quiz...");
  await page.click('text="Practice"');
  await page.waitForTimeout(1000);
  await page.click('text="Anatomy"');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/android_quiz.png', fullPage: true });

  await browser.close();
  console.log("Android E2E Test Complete.");
})();
