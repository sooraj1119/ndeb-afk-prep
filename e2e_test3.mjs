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
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('Console Error: ' + msg.text());
  });

  try {
    console.log('1. Loading app...');
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/', { waitUntil: 'networkidle0' });
    
    // Accept Disclaimer
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const accept = btns.find(b => b.innerText.includes('I Understand'));
      if (accept) accept.click();
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('2. Starting Anatomy Quiz...');
    await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const anatomy = h3s.find(h => h.innerText === 'Anatomy');
      if (anatomy) {
        let curr = anatomy;
        while(curr && curr.onclick == null && curr.tagName !== 'BODY') {
           curr = curr.parentElement;
           if (curr.style && curr.style.cursor === 'pointer') {
               curr.click();
               return;
           }
        }
      }
    });
    
    // Wait for the quiz to load
    await page.waitForFunction(() => document.body.innerText.includes('Question 1'), { timeout: 10000 });
    console.log('Quiz loaded successfully!');
    
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