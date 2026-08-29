import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting Rigorous E2E Test Suite...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));

  try {
    // 1. App Initialization & Disclaimer
    console.log('[TEST] Navigating to app...');
    await page.goto('http://localhost:5173/');
    await new Promise(r => setTimeout(r, 1500));
    
    console.log('[TEST] Accepting Disclaimer...');
    await page.evaluate(() => {
      const accept = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('I Understand'));
      if (accept) accept.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 2. Topic Selection
    console.log('[TEST] Verifying Topic Selection...');
    const hasTopics = await page.evaluate(() => {
      return document.body.innerText.includes('General Medicine');
    });
    if (!hasTopics) throw new Error("Topics are missing!");

    // 3. Start a Quiz
    console.log('[TEST] Starting General Medicine Quiz...');
    await page.evaluate(() => {
      const topic = Array.from(document.querySelectorAll('div')).find(d => d.innerText.includes('General Medicine') && d.innerText.includes('questions'));
      if (topic) topic.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Answer 3 questions
    console.log('[TEST] Answering questions...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const options = document.querySelectorAll('button[style*="text-align: left"]');
        if (options.length > 0) options[0].click(); // Pick first option
      });
      await new Promise(r => setTimeout(r, 500));
      
      // Click Next
      await page.evaluate(() => {
        const next = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.innerText.includes('Finish'));
        if (next) next.click();
      });
      await new Promise(r => setTimeout(r, 500));
    }

    // 4. Verify Dashboard & Pacing Engine
    console.log('[TEST] Navigating to Dashboard...');
    await page.evaluate(() => {
      const dash = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Dashboard'));
      if (dash) dash.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('[TEST] Setting Exam Date...');
    await page.evaluate(() => {
      const setBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Set Exam Date'));
      if (setBtn) setBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
      const input = document.querySelector('input[type="date"]');
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, '2026-12-31');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
      const input = document.querySelector('input[type="date"]');
      if (input && input.nextElementSibling) input.nextElementSibling.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const pacingStats = await page.evaluate(() => {
      return document.body.innerText.includes('Questions / Day') && document.body.innerText.includes('Days Left');
    });
    if (!pacingStats) throw new Error("Pacing Engine stats did not render after saving date.");

    // 5. Check Pro Features (Paywall trigger)
    console.log('[TEST] Triggering Paywall...');
    await page.evaluate(() => {
      const proBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Unlock Pro'));
      if (proBtn) proBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const paywallOpen = await page.evaluate(() => {
      return document.body.innerText.includes('15.99') && document.body.innerText.includes('6.99');
    });
    if (!paywallOpen) throw new Error("Paywall modal failed to open or is missing pricing.");

    // Close paywall
    await page.evaluate(() => {
      // Find the SVG close button (lucide XCircle or similar inside a button)
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.innerHTML.includes('<svg') && !b.innerText);
      if (closeBtn) closeBtn.click();
      else if (btns.length > 0) btns[btns.length-1].click(); // fallback
    });
    await new Promise(r => setTimeout(r, 500));
    
    // 6. Navigation to Search and Settings
    console.log('[TEST] Checking Search Tab...');
    await page.evaluate(() => {
      const search = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Search'));
      if (search) search.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const searchWorks = await page.evaluate(() => document.querySelector('input[placeholder="Search topics or content..."]') !== null);
    if (!searchWorks) throw new Error("Search tab failed to render.");

    console.log('[TEST] E2E Suite Passed Successfully.');

  } catch (err) {
    console.error('[FAILED]', err.message);
    errors.push(err.message);
  } finally {
    if (errors.length > 0) {
      console.log('--- ERRORS DETECTED ---');
      errors.forEach(e => console.log(e));
    } else {
      console.log('No console errors or runtime exceptions detected.');
    }
    await browser.close();
  }
})();