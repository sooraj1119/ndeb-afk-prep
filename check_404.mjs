import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  
  page.on('response', response => {
    if (response.status() === 404) {
      console.log('404 URL:', response.url());
    }
  });

  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
})();