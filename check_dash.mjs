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

  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking on Dashboard tab...');
  await page.evaluate(() => {
    // the nav items have icons. We can just click the one that says "Dashboard"
    const els = document.querySelectorAll('div');
    for (let i = 0; i < els.length; i++) {
      if (els[i].textContent === 'Dashboard' || els[i].innerText === 'Dashboard') {
        els[i].click();
        break;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT:', bodyText.substring(0, 300));
  
  await browser.close();
})();