import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });

  console.log("Navigating to site...");
  await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
  await new Promise(r => setTimeout(r, 1500));
  
  // Accept Disclaimer
  console.log("Accepting disclaimer...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accept = btns.find(b => b.innerText.includes('I Understand'));
    if (accept) accept.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Navigate to Dashboard
  console.log("Navigating to Dashboard...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const dash = tabs.find(b => b.innerText.includes('Dashboard'));
    if (dash) dash.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Verify Dashboard is open
  const dashboardTitle = await page.evaluate(() => {
    const h2 = document.querySelector('h2');
    return h2 ? h2.innerText : null;
  });
  console.log("Dashboard Title:", dashboardTitle);

  // Click Set Exam Date
  console.log("Clicking 'Set Exam Date'...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const setBtn = btns.find(b => b.innerText.includes('Set Exam Date'));
    if (setBtn) setBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Enter a date (e.g. 60 days from now)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 60);
  const targetDateStr = targetDate.toISOString().split('T')[0];
  console.log("Entering date:", targetDateStr);
  
  await page.evaluate((dateStr) => {
    const input = document.querySelector('input[type="date"]');
    if (input) {
      input.value = dateStr;
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  }, targetDateStr);
  
  await new Promise(r => setTimeout(r, 500));
  
  // Click Save
  console.log("Clicking 'Save'...");
  await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (input && input.nextElementSibling && input.nextElementSibling.tagName === 'BUTTON') {
      input.nextElementSibling.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Extract Stats
  console.log("Extracting Pacing Stats...");
  const stats = await page.evaluate(() => {
    const textNodes = Array.from(document.querySelectorAll('div')).map(d => d.innerText);
    const getStat = (label) => {
      // Find a div containing the label, then look for the big number next to it or above it
      // Actually let's just grab the whole container text
      const container = Array.from(document.querySelectorAll('div')).find(el => el.innerText.includes('Questions / Day'));
      return container ? container.innerText.replace(/\n/g, ' | ') : null;
    };
    return getStat();
  });
  console.log("Stats visible on screen:", stats);
  
  // Test persistence by reloading
  console.log("Reloading page to test persistence...");
  await page.reload();
  await new Promise(r => setTimeout(r, 1500));
  
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const dash = tabs.find(b => b.innerText.includes('Dashboard'));
    if (dash) dash.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const statsAfterReload = await page.evaluate(() => {
    const container = Array.from(document.querySelectorAll('div')).find(el => el.innerText && el.innerText.includes('Questions / Day'));
    return container ? container.innerText.replace(/\n/g, ' | ') : null;
  });
  console.log("Stats after reload:", statsAfterReload);
  
  await browser.close();
  console.log("E2E Test Complete.");
})();