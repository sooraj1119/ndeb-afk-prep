import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    localStorage.setItem('hasAcceptedDisclaimer', 'true');
    // Add some fake history
    const fakeHistory = [
      { id: '1', timestamp: Date.now(), topicId: 'gen_med', score: 80, total: 100 },
      { id: '2', timestamp: Date.now(), topicId: 'ethics', score: 90, total: 100 },
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