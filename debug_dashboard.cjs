const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    localStorage.setItem('hasAcceptedDisclaimer', 'true');
    const fakeHistory = [
      { id: '1', timestamp: Date.now(), topicId: 'gen_med', score: 80, total: 100 },
    ];
    localStorage.setItem('ndeb_history', JSON.stringify(fakeHistory));
  });
  
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const dashTab = tabs.find(b => b.textContent.includes('Dashboard'));
    if (dashTab) dashTab.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'dashboard_debug.png' });
  
  console.log("Screenshot saved.");
  await browser.close();
})();