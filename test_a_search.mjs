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
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const accept = btns.find(b => b.innerText.includes('I Understand'));
      if (accept) accept.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const searchTab = tabs.find(b => b.innerText.includes('Search'));
      if (searchTab) searchTab.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.type('input[type="text"]', 'a');
    await new Promise(r => setTimeout(r, 2000));
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 500));
  } catch (e) {
    console.error('Script error:', e);
  }

  if (errors.length > 0) {
    console.error('\nERRORS FOUND:');
    errors.forEach(e => console.error(e));
  }

  await browser.close();
})();