import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  
  console.log('Navigating to app...');
  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Accepting disclaimer...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accept = btns.find(b => b.innerText.includes('I Understand'));
    if (accept) accept.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Clicking Anatomy topic...');
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const anatomy = divs.find(d => d.innerText && d.innerText.includes('Anatomy') && d.innerText.includes('500 Questions'));
    if (anatomy) anatomy.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- QUIZ SCREEN TEXT ---');
  console.log(text.substring(0, 800));
  
  await page.screenshot({ path: 'quiz_banner_verify.png', fullPage: true });
  console.log('Screenshot saved to quiz_banner_verify.png');
  
  await browser.close();
})();