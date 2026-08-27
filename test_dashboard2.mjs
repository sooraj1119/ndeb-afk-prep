import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
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
  
  // Click Set Exam Date
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const setBtn = btns.find(b => b.innerText.includes('Set Exam Date'));
    if (setBtn) setBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Enter date and click Save
  await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (input) {
      input.value = '2026-10-15';
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    // Find the check button (has a check icon, likely no text)
    // We can just find the button next to the input
    const input = document.querySelector('input[type="date"]');
    if (input && input.nextElementSibling && input.nextElementSibling.tagName === 'BUTTON') {
      input.nextElementSibling.click();
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'dashboard_pacing_test.png' });
  await browser.close();
})();