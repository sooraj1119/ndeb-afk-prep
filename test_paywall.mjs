import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 1500));
  await page.setViewport({ width: 1080, height: 1080 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accept = btns.find(b => b.innerText.includes('I Understand'));
    if (accept) accept.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const upgrade = btns.find(b => b.innerText.includes('Upgrade to Pro'));
    if (upgrade) upgrade.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'paywall_strikethrough.png' });
  await browser.close();
})();