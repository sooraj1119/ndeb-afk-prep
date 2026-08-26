import { chromium, devices } from 'playwright';

(async () => {
  const pixel5 = devices['Pixel 5'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...pixel5,
    colorScheme: 'dark'
  });
  const page = await context.newPage();
  
  console.log("Navigating...");
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  console.log("Clicking disclaimer...");
  await page.click('button:has-text("Understand")');
  await page.waitForTimeout(1000);
  
  console.log("Saving Practice Screenshot...");
  await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/android_practice.png', fullPage: true });

  console.log("Navigating to Search...");
  await page.click('text="Search"');
  await page.waitForTimeout(1000);
  console.log("Saving Search Screenshot...");
  await page.screenshot({ path: 'C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/android_search.png', fullPage: true });
  
  await browser.close();
  console.log("Done");
})();
