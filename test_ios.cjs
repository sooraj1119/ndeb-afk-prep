const { chromium, devices } = require('playwright');

(async () => {
  console.log('Starting iOS Headless Test...');
  const iPhone = devices['iPhone 13'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    console.log('Waiting for Disclaimer...');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/ios_disclaimer.png' });
    
    console.log('Accepting Disclaimer...');
    await page.click('button:has-text(\'I Understand and Agree\')');
    await page.waitForTimeout(1000);
    
    console.log('Testing iOS Install Modal...');
    const installBtn = await page.locator('button[title="Install App"]');
    if (await installBtn.count() > 0) {
        await installBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'scratch/ios_install_modal.png' });
        
        console.log('Closing modal...');
        // Close modal
        await page.click('button:has(.lucide-x)');
        await page.waitForTimeout(500);
    }
    
    console.log('Testing Dashboard...');
    await page.click('button:has-text(\'Dashboard\')');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/ios_dashboard.png' });
    
    console.log('Testing Practice Quiz...');
    await page.click('button:has-text(\'Study Topics\')');
    await page.waitForTimeout(1000);
    
    console.log('Clicking topic...');
    // Click on a topic to start quiz
    await page.click('.glass-panel h3'); // clicks first topic
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/ios_quiz.png' });
    
    console.log('Answering question...');
    // The option div has letter "A"
    await page.click('button:has-text("A")'); 
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/ios_answered.png' });

    console.log('Done! All screenshots saved.');
  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await browser.close();
  }
})();
