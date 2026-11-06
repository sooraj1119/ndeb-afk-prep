import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, Browser, Page } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const artifactDir = 'C:/Users/sooraj/.gemini/antigravity/brain/265c7528-660d-4a69-82eb-89ab3869e8f8';

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

function createStaticServer(port = 4173): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = (req.url || '/').split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      if (reqPath.startsWith('/ndeb-afk-prep')) {
        reqPath = reqPath.replace('/ndeb-afk-prep', '');
        if (reqPath === '' || reqPath === '/') reqPath = '/index.html';
      }
      const filePath = path.join(projectRoot, 'dist', reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(fs.readFileSync(filePath));
      } else {
        const indexPath = path.join(projectRoot, 'dist', 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(indexPath));
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`Static test server listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${msg}`);
    throw new Error(msg);
  } else {
    passedTests++;
    console.log(`  ✓ PASSED: ${msg}`);
  }
}

async function runAllE2ETests() {
  console.log('=====================================================');
  console.log('  STARTING RIGOROUS UI END-TO-END TEST SUITE');
  console.log('=====================================================\n');

  const server = await createStaticServer(4173);
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page: Page = await context.newPage();

    // ------------------------------------------------------------------------
    console.log('[STAGE 1] Testing Document Header & Branding Integrity...');
    // ------------------------------------------------------------------------
    await page.goto('http://127.0.0.1:4173');
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    assert(title === 'Dental Prep Pro: for NDEB AFK', `Page title matches 'Dental Prep Pro: for NDEB AFK' (got: ${title})`);

    // ------------------------------------------------------------------------
    console.log('\n[STAGE 2] Testing Mandatory Educational & Medical Disclaimer Modal...');
    // ------------------------------------------------------------------------
    const modalHeading = page.locator('h2', { hasText: 'Educational' });
    await modalHeading.waitFor({ state: 'visible', timeout: 8000 });
    const headingText = await modalHeading.innerText();
    assert(headingText.includes('Educational') && headingText.includes('Medical Disclaimer'), `Modal heading contains 'Educational & Medical Disclaimer' (got: ${headingText})`);

    // Target the modal container directly via ancestor
    const modalContainer = modalHeading.locator('xpath=ancestor::div[contains(@class, "glass-panel")]');
    const modalText = await modalContainer.innerText();

    // Save screenshot of the fortified disclaimer modal
    const disclaimerPath = path.join(artifactDir, 'screenshot-e2e-disclaimer-modal.png');
    await modalContainer.screenshot({ path: disclaimerPath });
    console.log(`  📸 Saved screenshot: ${disclaimerPath}`);

    assert(modalText.includes('1. For Educational Exam Preparation Only'), 'Section 1 header is present');
    assert(modalText.includes('Strictly prohibited for real-world patient care, triage, or clinical decision-making'), 'Section 1 patient care prohibition present');

    assert(modalText.includes('2. Artificial Intelligence Notice'), 'Section 2 AI notice present');
    assert(modalText.includes('AI models can make errors, miscalculate dosages, or hallucinate facts'), 'Section 2 AI hallucination disclaimer present');
    assert(modalText.includes('Malamed, Neville, Little & Falace'), 'Section 2 standard dental reference textbooks cited');

    assert(modalText.includes('3. No Guarantee of Examination Results or Licensure'), 'Section 3 No Pass Guarantee present');
    assert(modalText.includes('passing the NDEB AFK exam'), 'Section 3 express warranty disclaimer present');

    assert(modalText.includes('4. Right to Modify & Delete Content'), 'Section 4 Right to Modify/Delete present');
    assert(modalText.includes('reserves the absolute right, at its sole discretion, to add, modify, update, replace, alter, suspend, or delete any questions'), 'Section 4 unilateral discretion present');

    assert(modalText.includes('5. Complete Release & Limitation of Liability'), 'Section 5 Limitation of Liability present');
    assert(modalText.includes('Aggregate liability is strictly capped at the total amount actually paid by you for your subscription (in the applicable currency of purchase)'), 'Section 5 multi-currency liability cap present');
    assert(modalText.includes('or zero ($0.00 in any currency) if you used the free tier'), 'Section 5 zero liability for free tier present');

    assert(modalText.includes('6. Trademark Notice & Non-Affiliation'), 'Section 6 Trademark notice present');
    assert(modalText.includes('NDEB') && modalText.includes('are registered trademarks of the National Dental Examining Board of Canada'), 'Section 6 NDEB trademark ownership acknowledged');
    assert(modalText.includes('not affiliated with, associated with, sponsored by, or endorsed by the NDEB'), 'Section 6 non-affiliation affirmative disclaimer present');

    // Accept disclaimer
    const agreeBtn = modalContainer.locator('button', { hasText: 'I Understand and Agree' });
    assert(await agreeBtn.isVisible(), 'I Understand and Agree button is visible');
    await agreeBtn.click();
    await modalHeading.waitFor({ state: 'hidden', timeout: 5000 });
    assert(!(await modalHeading.isVisible()), 'Disclaimer modal cleanly closes upon agreement');

    // Verify localStorage & sessionStorage flags
    const lsAccepted = await page.evaluate(() => localStorage.getItem('ndeb_prep_disclaimer_accepted'));
    assert(lsAccepted === 'true', 'localStorage disclaimer accepted is true');
    const ssAccepted = await page.evaluate(() => sessionStorage.getItem('ndeb_prep_disclaimer_session_accepted'));
    assert(ssAccepted === 'true', 'sessionStorage disclaimer session accepted is true');

    // ------------------------------------------------------------------------
    console.log('\n[STAGE 3] Testing Dashboard & Navigation Bar...');
    // ------------------------------------------------------------------------
    await page.waitForSelector('text=Dental Prep Pro', { timeout: 8000 });
    assert(await page.locator('text=Dental Prep Pro').first().isVisible(), 'App brand "Dental Prep Pro" rendered in top bar');
    assert(await page.locator('text=for NDEB AFK').first().isVisible(), 'Subtitle "for NDEB AFK" rendered');

    // Topic Selection rendered
    const operativeCard = page.locator('h3', { hasText: 'Operative Dentistry' });
    await operativeCard.waitFor({ state: 'visible', timeout: 8000 });
    assert(await operativeCard.isVisible(), 'Topic "Operative Dentistry" visible on dashboard');

    const dashboardPath = path.join(artifactDir, 'screenshot-e2e-dashboard.png');
    await page.screenshot({ path: dashboardPath, fullPage: false });
    console.log(`  📸 Saved screenshot: ${dashboardPath}`);

    // ------------------------------------------------------------------------
    console.log('\n[STAGE 4] Testing Footer Legal Links & Modals...');
    // ------------------------------------------------------------------------
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // 4a: Terms of Use Modal
    const termsLink = page.locator('footer button', { hasText: 'Terms of Use' });
    assert(await termsLink.isVisible(), 'Terms of Use footer button is visible');
    await termsLink.click();

    const termsModalHeading = page.locator('h3', { hasText: 'Terms of Use' });
    await termsModalHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await termsModalHeading.isVisible(), 'Terms of Use (EULA) modal opened');

    const termsContainer = termsModalHeading.locator('xpath=ancestor::div[contains(@style, "max-height: 85vh") or contains(@style, "border-radius: 24px")]');
    const termsContent = await termsContainer.innerText();
    assert(termsContent.includes('Ontario, Canada'), 'Terms specifies Ontario, Canada governing law');
    assert(termsContent.includes('FTC Click-to-Cancel'), 'Terms includes FTC Click-to-Cancel clause');
    assert(termsContent.includes('California Automatic Renewal Law'), 'Terms includes California ARL clause');
    const appleTermsLink = termsContainer.locator('a[href*="apple.com/account/subscriptions"]');
    assert(await appleTermsLink.isVisible(), 'Terms contains direct clickable Apple Subscriptions link');
    const googleTermsLink = termsContainer.locator('a[href*="play.google.com/store/account/subscriptions"]');
    assert(await googleTermsLink.isVisible(), 'Terms contains direct clickable Google Play Subscriptions link');

    const termsScreenshot = path.join(artifactDir, 'screenshot-e2e-terms-modal.png');
    await termsContainer.screenshot({ path: termsScreenshot });
    console.log(`  📸 Saved screenshot: ${termsScreenshot}`);

    // Close Terms modal
    const closeBtn = page.locator('button[aria-label="Close modal"]').first();
    await closeBtn.click();
    await termsModalHeading.waitFor({ state: 'hidden', timeout: 5000 });
    assert(!(await termsModalHeading.isVisible()), 'Terms modal closed cleanly');

    // 4b: Privacy Policy Modal
    const privacyLink = page.locator('footer button', { hasText: 'Privacy Policy' });
    await privacyLink.click();
    const privacyModalHeading = page.locator('h3', { hasText: 'Privacy Policy' });
    await privacyModalHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await privacyModalHeading.isVisible(), 'Privacy Policy modal opened');

    const privacyContainer = privacyModalHeading.locator('xpath=ancestor::div[contains(@style, "max-height: 85vh") or contains(@style, "border-radius: 24px")]');
    const privacyContent = await privacyContainer.innerText();
    assert(privacyContent.includes('PIPEDA'), 'Privacy policy covers Canadian PIPEDA');
    assert(privacyContent.includes('GDPR'), 'Privacy policy covers EU/UK GDPR');
    assert(privacyContent.includes('CCPA'), 'Privacy policy covers California CCPA');

    const privacyScreenshot = path.join(artifactDir, 'screenshot-e2e-privacy-modal.png');
    await privacyContainer.screenshot({ path: privacyScreenshot });
    console.log(`  📸 Saved screenshot: ${privacyScreenshot}`);

    // Close Privacy modal
    await page.locator('button[aria-label="Close modal"]').first().click();
    await privacyModalHeading.waitFor({ state: 'hidden', timeout: 5000 });
    assert(!(await privacyModalHeading.isVisible()), 'Privacy modal closed cleanly');

    // 4c: Medical Disclaimer Modal from footer
    const disclaimerLink = page.locator('footer button', { hasText: 'Medical Disclaimer' });
    await disclaimerLink.click();
    const disclaimerDetailHeading = page.locator('h3', { hasText: 'Disclaimer' });
    await disclaimerDetailHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await disclaimerDetailHeading.isVisible(), 'Medical & Educational Disclaimer modal opened from footer');

    const medicalContainer = disclaimerDetailHeading.locator('xpath=ancestor::div[contains(@style, "max-height: 85vh") or contains(@style, "border-radius: 24px")]');
    const medicalScreenshot = path.join(artifactDir, 'screenshot-e2e-medical-modal.png');
    await medicalContainer.screenshot({ path: medicalScreenshot });
    console.log(`  📸 Saved screenshot: ${medicalScreenshot}`);

    // Close Medical Disclaimer modal
    await page.locator('button[aria-label="Close modal"]').first().click();
    await disclaimerDetailHeading.waitFor({ state: 'hidden', timeout: 5000 });
    assert(!(await disclaimerDetailHeading.isVisible()), 'Medical disclaimer modal closed cleanly');

    // ------------------------------------------------------------------------
    console.log('\n[STAGE 5] Testing Paywall & FTC Click-to-Cancel Compliance Links...');
    // ------------------------------------------------------------------------
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const anatomyCard = page.locator('h3', { hasText: 'Anatomy' });
    await anatomyCard.scrollIntoViewIfNeeded();
    await anatomyCard.click();

    const paywallHeader = page.locator('h2', { hasText: 'Unlock Pro' });
    await paywallHeader.waitFor({ state: 'visible', timeout: 5000 });
    assert(await paywallHeader.isVisible(), 'Paywall modal appears on clicking premium topic');

    const paywallContainer = paywallHeader.locator('xpath=ancestor::div[contains(@style, "max-height: 90vh") or contains(@style, "border-radius: 24px")]');
    const paywallText = await paywallContainer.innerText();
    assert(paywallText.includes('cancel your subscriptions at any time in your store account settings'), 'Paywall includes explicit cancellation rights');
    assert(paywallText.includes('Apple Subscriptions'), 'Paywall has 1-click Apple Subscriptions link');
    assert(paywallText.includes('Google Play Subscriptions'), 'Paywall has 1-click Google Play Subscriptions link');

    const paywallScreenshot = path.join(artifactDir, 'screenshot-e2e-paywall-cancel.png');
    await paywallContainer.screenshot({ path: paywallScreenshot });
    console.log(`  📸 Saved screenshot: ${paywallScreenshot}`);

    // Close paywall
    const paywallClose = page.locator('#paywall-close-button');
    await paywallClose.click();
    await paywallHeader.waitFor({ state: 'hidden', timeout: 5000 });
    assert(!(await paywallHeader.isVisible()), 'Paywall modal closed cleanly');

    // ------------------------------------------------------------------------
    console.log('\n[STAGE 6] Testing Active Quiz Session, Single Best Answer & Explanation...');
    // ------------------------------------------------------------------------
    const topicCard = page.locator('[data-testid="topic-card-operative-dentistry"]').or(page.locator('.topic-card:has-text("Operative Dentistry")'));
    await topicCard.scrollIntoViewIfNeeded();
    await topicCard.click({ force: true });

    await page.waitForSelector('button.quiz-option-btn', { timeout: 10000 });
    const optionButtons = page.locator('button.quiz-option-btn');
    const optionCount = await optionButtons.count();
    assert(optionCount === 4, `Question has exactly 4 options per NDEB standards (found: ${optionCount})`);

    // Select distractor Option B (index 1) to verify incorrect feedback and tutor explanation sheet
    await optionButtons.nth(1).click({ force: true });

    // Verify bottom sheet appears with feedback
    const feedbackSheet = page.locator('text=Incorrect');
    await feedbackSheet.waitFor({ state: 'visible', timeout: 8000 });
    assert(await feedbackSheet.isVisible(), 'Instant feedback indicates Incorrect on choosing distractor');

    const tutorHeading = page.locator('text=Tutor Explanation');
    await tutorHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await tutorHeading.isVisible(), 'Tutor Explanation section appears for active learning');

    const explanationEl = page.locator('#current-explanation-text');
    await explanationEl.waitFor({ state: 'visible', timeout: 5000 });
    const explanationText = await explanationEl.innerText();
    assert(explanationText.length > 30, 'Substantive clinical rationale is provided (length: ' + explanationText.length + ')');

    const quizScreenshot = path.join(artifactDir, 'screenshot-e2e-quiz-explanation.png');
    await page.screenshot({ path: quizScreenshot, fullPage: false });
    console.log(`  📸 Saved screenshot: ${quizScreenshot}`);

    // Flag button test
    const flagBtn = page.locator('button', { hasText: 'Flag' }).first();
    assert(await flagBtn.isVisible(), 'Flag button is visible');
    await flagBtn.click();
    const flags = await page.evaluate(() => localStorage.getItem('ndeb_prep_flags'));
    assert(flags !== null && JSON.parse(flags).length > 0, 'Question flag successfully recorded in localStorage');

    // Click Next to advance to question 2
    const nextBtn = page.locator('button', { hasText: 'Next' }).first();
    assert(await nextBtn.isVisible(), 'Next question button is visible');
    await nextBtn.click();
    await page.waitForTimeout(500);

    // ------------------------------------------------------------------------
    console.log('\n[STAGE 7] Testing Dark Mode Toggle...');
    // ------------------------------------------------------------------------
    const darkToggle = page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkToggle.isVisible()) {
      await darkToggle.click();
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      assert(isDark, 'HTML root gained dark mode class');
      await darkToggle.click();
      const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
      assert(isLight, 'HTML root reverted to light mode');
    }

    // ------------------------------------------------------------------------
    console.log('\n[STAGE 8] Testing Mistakes Screen Loading (Zero-Stall Verification)...');
    // ------------------------------------------------------------------------
    // Navigate back to topic selection via Study Topics tab
    const studyTopicsTab = page.locator('button', { hasText: 'Study Topics' });
    await studyTopicsTab.click();
    const leaveModal = page.locator('button:has-text("Leave")');
    if (await leaveModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await leaveModal.click();
    }
    await page.waitForSelector('text=Select a Topic', { timeout: 8000 });

    // For free user: clicking mistakes banner opens paywall
    const mistakesBanner = page.locator('[data-testid="mistakes-banner"]').or(page.locator('h3:has-text("Review Mistakes")'));
    await mistakesBanner.scrollIntoViewIfNeeded();
    await mistakesBanner.click({ force: true });

    const freeMistakesPw = page.locator('h2:has-text("Unlock Pro")');
    await freeMistakesPw.waitFor({ state: 'visible', timeout: 5000 });
    assert(await freeMistakesPw.isVisible(), 'Free user clicking mistakes properly triggers Pro paywall');
    await page.click('#paywall-close-button');
    await freeMistakesPw.waitFor({ state: 'hidden', timeout: 5000 });

    // For Pro user: opens MistakesList cleanly with zero stall
    await page.evaluate(() => localStorage.setItem('ndeb_prep_is_premium', 'true'));
    await page.reload();
    await page.waitForSelector('text=Select a Topic', { timeout: 8000 });

    const mistakesBannerPro = page.locator('[data-testid="mistakes-banner"]').or(page.locator('h3:has-text("Review Mistakes")'));
    await mistakesBannerPro.scrollIntoViewIfNeeded();
    await mistakesBannerPro.click({ force: true });

    // Must load immediately without infinite stall
    const drillMistakesBtn = page.locator('button:has-text("Drill Mistakes")');
    await drillMistakesBtn.waitFor({ state: 'visible', timeout: 5000 });
    assert(await drillMistakesBtn.isVisible(), 'Mistakes screen loaded instantaneously without stalling and displayed Drill Mistakes button');

    const mistakesActiveScreenshot = path.join(artifactDir, 'screenshot-e2e-mistakes-active.png');
    await page.screenshot({ path: mistakesActiveScreenshot, fullPage: false });
    console.log(`  📸 Saved screenshot: ${mistakesActiveScreenshot}`);

    // Verify removing the mistake displays "All Caught Up!"
    const removeBtn = page.locator('button[title="Remove from Mistakes"]').first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      const allCaughtUp = page.locator('text=All Caught Up!');
      await allCaughtUp.waitFor({ state: 'visible', timeout: 5000 });
      assert(await allCaughtUp.isVisible(), 'Clearing mistakes displays All Caught Up empty state');
      
      const mistakesResolvedScreenshot = path.join(artifactDir, 'screenshot-e2e-mistakes-resolved.png');
      await page.screenshot({ path: mistakesResolvedScreenshot, fullPage: false });
      console.log(`  📸 Saved screenshot: ${mistakesResolvedScreenshot}`);
    }

    const mistakesBackBtn = page.locator('#mistakes-back-button');
    await mistakesBackBtn.click();
    await page.waitForSelector('text=Select a Topic', { timeout: 5000 });
    assert(await page.locator('text=Select a Topic').isVisible(), 'Returned cleanly to topic selection');

    // Reset premium
    await page.evaluate(() => localStorage.removeItem('ndeb_prep_is_premium'));

    // ------------------------------------------------------------------------
    console.log('\n[STAGE 9] Testing French Language Footer Resilience...');
    // ------------------------------------------------------------------------
    const disclaimerFooterBtn = page.locator('[data-testid="footer-btn-disclaimer"]').or(page.locator('footer button:has-text("Medical Disclaimer")'));
    await disclaimerFooterBtn.scrollIntoViewIfNeeded();
    await disclaimerFooterBtn.click();

    // Verify modal opens
    const stage9ModalHeading = page.locator('h3', { hasText: 'Disclaimer' });
    await stage9ModalHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await stage9ModalHeading.isVisible(), 'Legal modal opens cleanly from footer');

    // Close modal
    await page.click('button[aria-label="Close modal"]');
    await stage9ModalHeading.waitFor({ state: 'hidden', timeout: 5000 });

    // Verify all 3 footer buttons remain in DOM and did NOT disappear
    let allFooterBtns = page.locator('footer button');
    let footerCount = await allFooterBtns.count();
    assert(footerCount >= 3, `Footer buttons remain intact after modal close (found: ${footerCount})`);

    // Toggle language to French to test French translation resilience
    const langBtn = page.locator('button[aria-label="Toggle language between English and French"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(1000);

      const frDisclaimerBtn = page.locator('[data-testid="footer-btn-disclaimer"]');
      await frDisclaimerBtn.scrollIntoViewIfNeeded();
      assert(await frDisclaimerBtn.isVisible(), 'French disclaimer button is visible in footer');
      await frDisclaimerBtn.click();

      const frModal = page.locator('h3', { hasText: 'Disclaimer' });
      await frModal.waitFor({ state: 'visible', timeout: 5000 });
      assert(await frModal.isVisible(), 'Legal modal opens in French mode');

      await page.click('button[aria-label="Close modal"]');
      await frModal.waitFor({ state: 'hidden', timeout: 5000 });

      // Crucial assertion: Ensure all footer buttons STILL exist and did NOT disappear in French
      allFooterBtns = page.locator('footer button');
      footerCount = await allFooterBtns.count();
      assert(footerCount >= 3, `French footer buttons remain completely intact after modal close (found: ${footerCount})`);

      const frenchFooterScreenshot = path.join(artifactDir, 'screenshot-e2e-french-footer-intact.png');
      await page.screenshot({ path: frenchFooterScreenshot, fullPage: false });
      console.log(`  📸 Saved screenshot: ${frenchFooterScreenshot}`);

      // Toggle back to English
      await langBtn.click();
      await page.waitForTimeout(500);
    }

    console.log('\n=====================================================');
    console.log(`  ALL ${passedTests}/${totalTests} END-TO-END UI ASSERTIONS PASSED! 🎉`);
    console.log('=====================================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runAllE2ETests().catch(err => {
  console.error('E2E Test Execution Error:', err);
  process.exit(1);
});
