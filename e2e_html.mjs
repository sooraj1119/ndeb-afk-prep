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
  
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const dash = tabs.find(b => b.innerText.includes('Dashboard'));
    if (dash) dash.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Setup date in localStorage BEFORE rendering? No, let's just do it live.
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const setBtn = btns.find(b => b.innerText.includes('Set Exam Date'));
    if (setBtn) setBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (input) {
      input.value = '2026-10-26';
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (input && input.nextElementSibling) {
      input.nextElementSibling.click();
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Print outerHTML of the Pacing Engine div
  const html = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('Dynamic Study Pacer') && d.innerText.includes('Set Exam Date') === false);
    return el ? el.outerHTML : "NOT FOUND";
  });
  console.log("HTML:", html);
  
  await browser.close();
})();