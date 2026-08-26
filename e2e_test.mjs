import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Disable cache to ensure we test the latest deployed version
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  
  let errors = [];
  page.on('pageerror', err => {
    errors.push('Page Error: ' + err.toString());
  });

  try {
    console.log('1. Loading app...');
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 3000));

    // Handle disclaimer if present
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Medical Disclaimer')) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const accept = btns.find(b => b.innerText.includes('I Understand'));
        if (accept) accept.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('2. Verifying Topic Selection (Home)...');
    const homeText = await page.evaluate(() => document.body.innerText);
    if (!homeText.includes('Simulated Mock Exam')) errors.push('Mock Exam banner missing');
    if (!homeText.includes('Review Mistakes')) errors.push('Review Mistakes banner missing');

    console.log('3. Verifying Quiz Flow (Anatomy)...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3'));
      const anatomy = cards.find(h => h.innerText === 'Anatomy');
      if (anatomy) anatomy.parentElement.parentElement.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const quizText = await page.evaluate(() => document.body.innerText);
    if (!quizText.includes('Question 1 of')) errors.push('Quiz UI failed to load');
    
    // Go back to home
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 3000));

    console.log('4. Verifying Search Tab...');
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const searchTab = spans.find(s => s.innerText === 'Search');
      if (searchTab) searchTab.parentElement.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    
    await page.type('input[type="text"]', 'Amoxicillin');
    await new Promise(r => setTimeout(r, 2000));
    const searchText = await page.evaluate(() => document.body.innerText);
    if (!searchText.includes('Endodontics') && !searchText.includes('Microbiology')) {
      errors.push('Search failed to return expected results for Amoxicillin');
    }

    console.log('5. Verifying Dashboard Tab...');
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const dashTab = spans.find(s => s.innerText === 'Dashboard');
      if (dashTab) dashTab.parentElement.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const dashText = await page.evaluate(() => document.body.innerText);
    if (!dashText.includes('Your Progress')) errors.push('Dashboard failed to load');

    console.log('6. Verifying Mistakes Banner click...');
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 3000));
    
    // The Mistakes banner triggers paywall if not premium.
    await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const mistakes = h3s.find(h => h.innerText === 'Review Mistakes');
      if (mistakes) mistakes.parentElement.parentElement.parentElement.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const mistakesText = await page.evaluate(() => document.body.innerText);
    // Since it's a fresh session (not premium), clicking it should pop up the paywall
    if (!mistakesText.includes('Unlock Full Access') && !mistakesText.includes('saved for review')) {
      errors.push('Review Mistakes click failed (neither paywall nor list appeared)');
    }

  } catch (e) {
    errors.push('Script execution error: ' + e.message);
  }

  if (errors.length > 0) {
    console.error('\n❌ TESTS FAILED WITH THE FOLLOWING ERRORS:');
    errors.forEach(e => console.error('  -', e));
  } else {
    console.log('\n✅ ALL E2E TESTS PASSED SUCCESSFULLY! No crashes detected.');
  }

  await browser.close();
})();