import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  
  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 4000));
  
  // Accept Disclaimer
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accept = btns.find(b => b.innerText.includes('I Understand'));
    if (accept) accept.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Anatomy
  await page.evaluate(() => {
    const h3s = Array.from(document.querySelectorAll('h3'));
    const anatomy = h3s.find(h => h.innerText === 'Anatomy');
    if (anatomy) {
      let curr = anatomy;
      while(curr && curr.onclick == null && curr.tagName !== 'BODY') {
         curr = curr.parentElement;
         if (curr.style && curr.style.cursor === 'pointer') {
             curr.click();
             return;
         }
      }
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'quiz_screen.png' });
  await browser.close();
})();