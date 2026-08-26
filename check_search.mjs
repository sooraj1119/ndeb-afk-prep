import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const context = browser.defaultBrowserContext();
  await context.clearPermissionOverrides();
  
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', req => console.log('REQ FAIL:', req.url()));

  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking on Search tab...');
  await page.evaluate(() => {
    const els = document.querySelectorAll('button');
    for (let i = 0; i < els.length; i++) {
      if (els[i].textContent.includes('Search')) {
        els[i].click();
        break;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 4000));
  
  const html = await page.evaluate(() => {
    return document.querySelector('#root').innerText;
  });
  
  console.log('ROOT TEXT:', html.substring(0, 1500));
  
  await browser.close();
})();