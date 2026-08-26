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
  
  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 4000));
  
  const html = await page.evaluate(() => {
    return document.querySelector('main').innerText;
  });
  
  console.log('MAIN TEXT:', html);
  
  await browser.close();
})();