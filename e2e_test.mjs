import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting End-to-End Test for Simulated Mock Exam...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCache');
    await client.send('Network.setBypassServiceWorker', { bypass: true });
    
    console.log("Navigating to app...");
    await page.goto('https://sooraj1119.github.io/ndeb-afk-prep/');
    await new Promise(r => setTimeout(r, 2000));
    
    // Accept Disclaimer
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const accept = btns.find(b => b.innerText.includes('I Understand'));
      if (accept) accept.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Start Simulated Mock Exam
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const mockH3 = headers.find(h => h.innerText.includes('Simulated Mock Exam'));
      if (mockH3 && mockH3.parentElement && mockH3.parentElement.parentElement) {
        mockH3.parentElement.parentElement.click();
      }
    });
    await new Promise(r => setTimeout(r, 3000));
    
    const quizText1 = await page.evaluate(() => document.body.innerText);
    if (quizText1.includes("1 / 100") && quizText1.includes("Simulated AFK Exam")) {
      console.log("✅ Mock Exam successfully generated and loaded (1/100).");
    } else {
      console.error("❌ Failed to load Mock Exam. Screen text:", quizText1.substring(0, 500));
      throw new Error("Failed to load Mock Exam");
    }

    // Answer Q1
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('button'));
      const optA = options.find(b => b.innerText.match(/^[A-D]\n/)); 
      if (optA) optA.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Next'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const quizText2 = await page.evaluate(() => document.body.innerText);
    if (quizText2.includes("2 / 100")) {
      console.log("✅ Successfully progressed to Question 2.");
    } else {
      console.error("❌ Failed to progress. Screen text:", quizText2.substring(0, 500));
    }

    // Test Persistence (Refresh & Resume)
    console.log("Refreshing page to test persistence...");
    await page.reload();
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const mockH3 = headers.find(h => h.innerText.includes('Simulated Mock Exam'));
      if (mockH3 && mockH3.parentElement && mockH3.parentElement.parentElement) {
        mockH3.parentElement.parentElement.click();
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    const quizText3 = await page.evaluate(() => document.body.innerText);
    if (quizText3.includes("2 / 100")) {
      console.log("✅ Successfully restored state from localStorage (still on 2/100).");
    } else {
      console.error("❌ Failed to restore state. Screen text:", quizText3.substring(0, 500));
    }

    // Test Completion (Skip to question 100)
    console.log("Fast-forwarding to Question 100 via localStorage injection...");
    await page.evaluate(() => {
      const activeMock = JSON.parse(localStorage.getItem('ndeb_prep_active_mock'));
      activeMock.currentIndex = 99; // 0-indexed, so 99 is Q100
      localStorage.setItem('ndeb_prep_active_mock', JSON.stringify(activeMock));
    });
    
    await page.reload();
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const mockH3 = headers.find(h => h.innerText.includes('Simulated Mock Exam'));
      if (mockH3 && mockH3.parentElement && mockH3.parentElement.parentElement) {
        mockH3.parentElement.parentElement.click();
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    const quizText4 = await page.evaluate(() => document.body.innerText);
    if (quizText4.includes("100 / 100")) {
      console.log("✅ Successfully resumed at Question 100.");
    } else {
      console.error("❌ Failed to load Q100.", quizText4.substring(0, 300));
    }

    // Answer Q100 and Finish
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('button'));
      const optA = options.find(b => b.innerText.match(/^[A-D]\n/));
      if (optA) optA.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Next') || b.innerText.includes('Finish'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const quizText5 = await page.evaluate(() => document.body.innerText);
    if (quizText5.includes("Quiz Complete!")) {
      console.log("✅ Successfully reached the Results screen! End-to-end test passed.");
    } else {
      console.error("❌ Did not reach Results screen. Text:", quizText5.substring(0, 500));
    }
    
    // Test restarting a fresh mock exam
    console.log("Testing fresh mock exam generation after completion...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const backBtn = btns.find(b => b.innerText.includes('Choose Another Topic') || b.innerText.includes('Back'));
      if (backBtn) backBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const mockH3 = headers.find(h => h.innerText.includes('Simulated Mock Exam'));
      if (mockH3 && mockH3.parentElement && mockH3.parentElement.parentElement) {
        mockH3.parentElement.parentElement.click();
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const quizText6 = await page.evaluate(() => document.body.innerText);
    if (quizText6.includes("1 / 100")) {
      console.log("✅ BUG FIXED! Successfully started a FRESH Mock Exam after completing one.");
    } else {
      console.error("❌ FAILED! Stuck on complete screen or broken. Text:", quizText6.substring(0, 500));
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
})();
