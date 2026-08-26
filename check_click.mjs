import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking on anatomy...');
  await page.evaluate(() => {
    const els = document.querySelectorAll('.glass-panel');
    for (let i = 0; i < els.length; i++) {
      if (els[i].textContent.includes('Anatomy')) {
        els[i].click();
        break;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT START:', bodyText.substring(0, 500));
  
  await browser.close();
})();