import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  console.log("Navigating to localhost...");
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 1500));
  
  console.log("Accepting disclaimer...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accept = btns.find(b => b.innerText.includes('I Understand'));
    if (accept) accept.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  console.log("Navigating to Dashboard...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const dash = tabs.find(b => b.innerText.includes('Dashboard'));
    if (dash) dash.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  console.log("Taking before screenshot...");
  await page.screenshot({ path: 'local_before.png' });
  
  console.log("Clicking 'Set Exam Date'...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const setBtn = btns.find(b => b.innerText.includes('Set Exam Date'));
    if (setBtn) setBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  console.log("Entering date: 2026-10-31");
  await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (input) {
      input.value = '2026-10-31';
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  console.log("Clicking Save...");
  await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (input && input.nextElementSibling && input.nextElementSibling.tagName === 'BUTTON') {
      input.nextElementSibling.click();
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Taking after screenshot...");
  await page.screenshot({ path: 'local_after.png' });
  
  const stats = await page.evaluate(() => {
    const container = Array.from(document.querySelectorAll('div')).find(el => el.innerText && el.innerText.includes('Questions / Day'));
    return container ? container.innerText.replace(/\n/g, ' | ') : null;
  });
  console.log("Stats visible:", stats);
  
  await browser.close();
})();