import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  
  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 1500));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accept = btns.find(b => b.innerText.includes('I Understand'));
    if (accept) accept.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const simulated = divs.find(d => d.innerText && d.innerText.includes('Simulated Mock Exam') && d.innerText.includes('100 random questions'));
    if (simulated) {
      simulated.click();
      if(simulated.parentElement) simulated.parentElement.click();
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- SCREEN TEXT ---');
  console.log(text.substring(0, 500));
  
  await browser.close();
})();