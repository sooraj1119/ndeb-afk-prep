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
    const search = tabs.find(b => b.innerText.includes('Search'));
    if (search) search.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const h2 = await page.evaluate(() => {
    const h2 = document.querySelector('h2');
    return h2 ? h2.innerText : null;
  });
  console.log("H2 on Search tab:", h2);
  
  await browser.close();
})();