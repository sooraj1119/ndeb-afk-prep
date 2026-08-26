import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  
  let errors = [];
  page.on('pageerror', err => {
    errors.push('Page Error: ' + err.toString());
  });

  try {
    console.log('1. Loading app...');
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 3000));

    // Handle disclaimer if present
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Medical Disclaimer')) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const accept = btns.find(b => b.innerText.includes('I Understand'));
        if (accept) accept.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('2. Verifying Quiz Flow (Anatomy)...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3'));
      const anatomy = cards.find(h => h.innerText === 'Anatomy');
      // Go up 3 levels to the motion.div
      if (anatomy) anatomy.parentElement.parentElement.parentElement.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const quizText = await page.evaluate(() => document.body.innerText);
    if (!quizText.includes('Question 1 of')) errors.push('Quiz UI failed to load for Anatomy');

    console.log('3. Verifying Dashboard Tab...');
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 3000));
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      // The dashboard tab button has the text Dashboard inside it
      const dashBtn = btns.find(b => b.innerText.includes('Dashboard'));
      if (dashBtn) dashBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const dashText = await page.evaluate(() => document.body.innerText);
    if (!dashText.includes('Your Progress')) errors.push('Dashboard UI failed to load');

  } catch (e) {
    errors.push('Script execution error: ' + e.message);
  }

  if (errors.length > 0) {
    console.error('\n❌ TESTS FAILED WITH THE FOLLOWING ERRORS:');
    errors.forEach(e => console.error('  -', e));
  } else {
    console.log('\n✅ ALL E2E TESTS PASSED SUCCESSFULLY! No crashes detected.');
  }

  await browser.close();
})();