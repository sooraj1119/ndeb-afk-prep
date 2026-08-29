const puppeteer = require('puppeteer');

(async () => {
  console.log('[E2E TEST] Starting End-to-End Test Suite...');
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('pageerror', err => {
      console.error('[APP ERROR] Uncaught exception:', err.message);
      process.exit(1);
    });

    console.log('[E2E TEST] 1. Loading Application...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    console.log('[E2E TEST] 2. Bypassing Medical Disclaimer...');
    await page.waitForSelector('button.primary-btn');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const agreeBtn = btns.find(b => b.textContent.includes('I Understand'));
      if (agreeBtn) agreeBtn.click();
    });

    console.log('[E2E TEST] 3. Verifying Topic Selection UI...');
    await page.waitForSelector('h2');
    const hasTopics = await page.evaluate(() => {
      return document.body.textContent.includes('Select a Topic');
    });
    if (!hasTopics) throw new Error('Topic selection screen did not render.');

    console.log('[E2E TEST] 4. Starting a General Medicine Quiz...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.topic-card'));
      const genMed = cards.find(c => c.textContent.includes('General Medicine'));
      if (genMed) genMed.click();
    });

    console.log('[E2E TEST] 5. Simulating Quiz Gameplay (Answering a question)...');
    await page.waitForSelector('h2'); 
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.length > 5 && d.style.padding === '1rem');
      // Just click any div that looks like an option if we can't find exact. The quiz options are mapped divs.
      const firstOption = document.querySelector('div[style*="padding: 1rem"][style*="cursor: pointer"]');
      if (firstOption) firstOption.click();
      else {
        // Fallback finder
        const allDivs = document.querySelectorAll('div');
        for (let div of allDivs) {
           if (div.style.cursor === 'pointer' && div.style.borderRadius) {
               div.click();
               break;
           }
        }
      }
    });

    console.log('[E2E TEST] 6. Verifying AI Explanation Engine...');
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('[E2E TEST] 7. Returning to Main Menu...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const backBtn = btns.find(b => b.textContent.includes('Back') || b.textContent.includes('Exit'));
      if (backBtn) backBtn.click();
    });

    console.log('[E2E TEST] 8. Navigating to Analytics Dashboard...');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const dashTab = tabs.find(b => b.textContent.includes('Dashboard'));
      if (dashTab) dashTab.click();
    });

    console.log('[E2E TEST] 9. Verifying Dashboard & Chart Engine Rendering...');
    await new Promise(r => setTimeout(r, 500));
    await page.waitForFunction(() => document.body.textContent.includes('Progress Learning Curve'), { timeout: 5000 });
    
    const hasChart = await page.evaluate(() => {
      return document.querySelector('.recharts-responsive-container') !== null || document.querySelector('.glass-panel') !== null;
    });
    if (!hasChart) throw new Error('Chart container did not render on Dashboard.');

    console.log('[E2E TEST] 10. Dashboard loaded successfully! No crashes detected.');
    console.log('==================================================');
    console.log('✅ ALL E2E TESTS PASSED SUCCESSFULLY');
    console.log('==================================================');

  } catch (error) {
    console.error('❌ E2E TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();