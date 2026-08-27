import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  
  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accept = btns.find(b => b.innerText.includes('I Understand'));
    if (accept) accept.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    // Just find any div that says Anatomy and click it
    const elements = Array.from(document.querySelectorAll('*'));
    const anatomyH3 = elements.find(el => el.tagName === 'H3' && el.innerText === 'Anatomy');
    if (anatomyH3) {
      anatomyH3.click();
      // click its parent just in case
      anatomyH3.parentElement.parentElement.click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- SCREEN TEXT ---');
  console.log(text.substring(0, 1000));
  
  await browser.close();
})();