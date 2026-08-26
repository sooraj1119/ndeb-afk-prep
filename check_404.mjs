import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (!response.ok()) {
      console.log('404 URL:', response.url());
    }
  });

  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();