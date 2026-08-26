import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:4173/', {waitUntil: 'networkidle0'});
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const agree = btns.find(b => b.innerText.includes('Agree'));
    if (agree) agree.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const totalQuestions = await page.evaluate(() => {
    return document.body.innerText;
  });
  console.log('PAGE CONTENT TRUNCATED:', totalQuestions.substring(0, 500));
  
  await browser.close();
})();
