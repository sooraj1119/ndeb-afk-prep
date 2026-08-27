import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 1500));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accept = btns.find(b => b.innerText.includes('I Understand'));
    if (accept) accept.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const dash = tabs.find(b => b.innerText.includes('Dashboard'));
    if (dash) dash.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const setBtn = btns.find(b => b.innerText.includes('Set Exam Date'));
    if (setBtn) setBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (input) {
      input.value = '2026-10-31';
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (input && input.nextElementSibling && input.nextElementSibling.tagName === 'BUTTON') {
      input.nextElementSibling.click();
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const outer = await page.evaluate(() => {
    const pacingCard = Array.from(document.querySelectorAll('div')).find(el => el.innerText && el.innerText.includes('Dynamic Study Pacer') && !el.innerText.includes('Set Exam Date'));
    return pacingCard ? pacingCard.outerHTML : "NOT FOUND (Or Set Exam Date still exists)";
  });
  console.log("OUTER HTML:", outer);
  
  await browser.close();
})();