import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  
  let errors = [];
  page.on('pageerror', err => {
    console.error('Page Error: ' + err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('Console Error: ' + msg.text());
  });

  try {
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 2000));
    
    // Accept Disclaimer
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
    
    console.log('Typing query...');
    await page.type('input[type="text"]', 'Amoxicillin');
    await new Promise(r => setTimeout(r, 2000));
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log('--- SCREEN TEXT ---');
    console.log(text.substring(0, 1000));
    console.log('-------------------');
    
  } catch (e) {
    console.error('Script execution error: ' + e.message);
  }

  await browser.close();
})();