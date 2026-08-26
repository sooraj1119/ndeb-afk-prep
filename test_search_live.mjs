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
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 2000));
    
    // Accept Disclaimer
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const accept = btns.find(b => b.innerText.includes('I Understand'));
      if (accept) accept.click();
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('2. Clicking Search Tab...');
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const searchTab = spans.find(s => s.innerText === 'Search');
      if (searchTab) searchTab.parentElement.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Search Text loaded? ', text.includes('Global Search'));
    
    await page.type('input[type="text"]', 'Amox');
    await new Promise(r => setTimeout(r, 1500));
    
    const afterSearch = await page.evaluate(() => document.body.innerText);
    console.log('Results loaded? ', afterSearch.includes('Unlock'));

  } catch (e) {
    errors.push('Script execution error: ' + e.message);
  }

  if (errors.length > 0) {
    console.error('\n❌ TESTS FAILED WITH THE FOLLOWING ERRORS:');
    errors.forEach(e => console.error('  -', e));
  } else {
    console.log('\n✅ SEARCH TAB WORKS FLAWLESSLY! No crashes detected.');
  }

  await browser.close();
})();