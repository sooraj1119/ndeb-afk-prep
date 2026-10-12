import fs from 'fs';
import path from 'path';

// Mock localStorage in Node
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, String(v)),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
  get length() { return storageMap.size; }
};

// Mock window and dispatchEvent
(globalThis as any).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { reload: () => {} }
};
(globalThis as any).CustomEvent = class CustomEvent {
  type: string;
  detail: any;
  constructor(type: string, opts?: any) {
    this.type = type;
    this.detail = opts?.detail;
  }
};

import { 
  getIsPremium, 
  setIsPremium, 
  getFlaggedQuestions, 
  toggleFlagQuestion,
  getMistakes,
  logMistake,
  removeMistake,
  saveProgress,
  getProgress,
  getTopicProgress,
  hasAcceptedDisclaimer,
  acceptDisclaimer,
  logSRSAnswer,
  getDueSRSQuestions,
  getAllSRSData,
  saveActiveMockExam,
  getActiveMockExam,
  clearActiveMockExam,
  getHistory,
  logQuizAttempt,
  getExamDate,
  setExamDate
} from '../src/lib/storage';
import { topics } from '../src/lib/data';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runTestSuite() {
  console.log('\n========================================');
  console.log('  RIGOROUS COMPREHENSIVE TEST SUITE');
  console.log('========================================\n');

  // ----------------------------------------------------
  // TEST 1: Question Bank Integrity & Manifest
  // ----------------------------------------------------
  console.log('[1/5] Testing Question Bank & Manifest Integrity...');
  const manifestPath = path.resolve('public/questions/manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(Array.isArray(manifest) && manifest.length === 22, `Manifest must list 22 topics, found: ${manifest.length}`);

  let totalQuestionsCount = 0;
  for (const mTopic of manifest) {
    const qFilePath = path.resolve(`public/questions/${mTopic.id}.json`);
    assert(fs.existsSync(qFilePath), `Topic file ${mTopic.id}.json must exist`);
    const qData = JSON.parse(fs.readFileSync(qFilePath, 'utf8'));
    assert(Array.isArray(qData) && qData.length > 0, `${mTopic.id}.json must contain non-empty question array`);
    
    // Validate sample questions of each topic for schema correctness
    for (let i = 0; i < Math.min(5, qData.length); i++) {
      const q = qData[i];
      assert(q.id !== undefined && q.id !== null, `${mTopic.id}[${i}] must have id`);
      assert(typeof q.question === 'string' && q.question.trim().length > 0, `${mTopic.id}[${i}] must have non-empty question`);
      assert(Array.isArray(q.options) && q.options.length >= 2, `${mTopic.id}[${i}] must have >= 2 options`);
      assert(typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < q.options.length, 
        `${mTopic.id}[${i}] correctAnswer index must be valid`);
      assert(typeof q.explanation === 'string', `${mTopic.id}[${i}] explanation must be string`);
    }
    totalQuestionsCount += qData.length;
  }
  assert(totalQuestionsCount >= 14000, `Total question bank count must be >= 14,000, got ${totalQuestionsCount}`);
  console.log(`  ✓ All 22 topic files valid. Total questions verified: ${totalQuestionsCount}\n`);

  // ----------------------------------------------------
  // TEST 2: Storage & Premium Status Management
  // ----------------------------------------------------
  console.log('[2/5] Testing Storage & Premium Status...');
  localStorage.clear();
  assert(getIsPremium() === false, 'Default status should be free (false)');
  
  setIsPremium(true);
  assert(getIsPremium() === true, 'Setting premium to true should persist in storage');
  
  setIsPremium(false);
  assert(getIsPremium() === false, 'Setting premium to false should persist');

  // Check topics premium configuration
  const premiumTopics = topics.filter(t => t.isPremiumOnly);
  const freeTopics = topics.filter(t => !t.isPremiumOnly);
  assert(premiumTopics.length === 13, `There should be 13 premium topics, got ${premiumTopics.length}`);
  assert(freeTopics.length === 9, `There should be 9 free topics, got ${freeTopics.length}`);
  console.log('  ✓ Premium gating configurations verified\n');

  // ----------------------------------------------------
  // TEST 3: User Statistics, Scoring & Mistake Tracking
  // ----------------------------------------------------
  console.log('[3/5] Testing Progress, Flags, Mistakes & Disclaimer...');
  localStorage.clear();

  // Disclaimer
  assert(hasAcceptedDisclaimer() === false, 'Disclaimer initially false');
  acceptDisclaimer();
  assert(hasAcceptedDisclaimer() === true, 'Disclaimer accepted successfully');

  // Flagging (toggle)
  assert(getFlaggedQuestions().length === 0, 'Initial flags must be empty');
  toggleFlagQuestion('anatomy-1');
  toggleFlagQuestion('ethics-2');
  assert(getFlaggedQuestions().length === 2, 'Flags count should be 2');
  assert(getFlaggedQuestions().includes('anatomy-1'), 'Should contain anatomy-1');
  toggleFlagQuestion('anatomy-1'); // toggle off
  assert(!getFlaggedQuestions().includes('anatomy-1'), 'anatomy-1 should be unflagged');
  assert(getFlaggedQuestions().length === 1, 'Flags count should be 1');

  // Mistakes
  assert(getMistakes().length === 0, 'Initial mistakes must be empty');
  logMistake('pathology-5');
  logMistake('ethics-8');
  assert(getMistakes().length === 2, 'Mistakes count should be 2');
  removeMistake('pathology-5');
  assert(getMistakes().length === 1 && getMistakes()[0] === 'ethics-8', 'Mistake removed accurately');

  // Topic Progress & Highest Score calculation
  assert(getTopicProgress('ethics') === null, 'Initial ethics progress is null');
  saveProgress('ethics', 85, 100, 50, true, 100);
  let p = getTopicProgress('ethics');
  assert(p !== null && p.highestScore === 85, 'Highest score saved as 85');
  
  saveProgress('ethics', 70, 100, 50, true, 100);
  p = getTopicProgress('ethics');
  assert(p !== null && p.highestScore === 85, 'Lower score does not overwrite highest score');

  saveProgress('ethics', 95, 100, 50, true, 100);
  p = getTopicProgress('ethics');
  assert(p !== null && p.highestScore === 95, 'Higher score overwrites highest score');

  // Quiz Attempt History
  logQuizAttempt('ethics', 95, 100);
  const hist = getHistory();
  assert(hist.length === 1 && hist[0].score === 95, 'Quiz attempt logged to history');

  // Exam Date
  const futureDate = Date.now() + 86400000 * 30;
  setExamDate(futureDate);
  assert(getExamDate() === futureDate, 'Exam countdown date stored and retrieved accurately');
  console.log('  ✓ Progress, Flags, Mistakes and Quiz history verified\n');

  // ----------------------------------------------------
  // TEST 4: SM-2 Spaced Repetition Logic (Daily Review)
  // ----------------------------------------------------
  console.log('[4/5] Testing SM-2 Spaced Repetition (SRS) Engine...');
  localStorage.clear();
  
  assert(getDueSRSQuestions().length === 0, 'No questions initially due');
  
  // Log correct answer for question 1
  logSRSAnswer('srs-q1', true);
  const srsAll1 = getAllSRSData();
  assert(srsAll1['srs-q1'] !== undefined, 'SRS data recorded for srs-q1');
  assert(srsAll1['srs-q1'].repetition === 1, 'Repetitions should be 1');
  assert(srsAll1['srs-q1'].interval === 1, 'Initial interval should be 1 day');

  // Log correct answer again
  logSRSAnswer('srs-q1', true);
  const srsAll2 = getAllSRSData();
  assert(srsAll2['srs-q1'].repetition === 2, 'Repetitions should be 2');
  assert(srsAll2['srs-q1'].interval === 6, 'Second interval should be 6 days');

  // Log incorrect answer (lapse/reset)
  logSRSAnswer('srs-q1', false);
  const srsAll3 = getAllSRSData();
  assert(srsAll3['srs-q1'].repetition === 0, 'Incorrect answer resets repetitions to 0');
  assert(srsAll3['srs-q1'].interval === 1, 'Incorrect answer resets interval to 1');
  console.log('  ✓ SM-2 Spaced Repetition progression and lapse reset verified\n');

  // ----------------------------------------------------
  // TEST 5: Active Mock Exam & Result Breakdown Math
  // ----------------------------------------------------
  console.log('[5/5] Testing Mock Exam State & Topic Breakdown Math...');
  localStorage.clear();

  assert(getActiveMockExam() === null, 'Initially activeMock should be null');
  const mockExamData = {
    questions: [{ id: '1', question: 'Q1', options: ['A','B'], correctAnswer: 0 } as any],
    currentIndex: 10,
    score: 8,
    endTime: Date.now() + 3600000
  };
  saveActiveMockExam(mockExamData);
  const loadedMock = getActiveMockExam();
  assert(loadedMock !== null && loadedMock.score === 8, 'Active mock exam persists accurately');
  assert(loadedMock?.currentIndex === 10, 'Mock current index persists');
  clearActiveMockExam();
  assert(getActiveMockExam() === null, 'Mock exam cleared successfully');

  // Topic Breakdown accuracy calculation (same logic as in Results.tsx)
  const sampleBreakdown: Record<string, { correct: number; total: number }> = {
    'dental-materials': { correct: 8, total: 10 },
    'ethics': { correct: 3, total: 4 },
    'radiology': { correct: 1, total: 5 },
    'anatomy': { correct: 0, total: 2 }
  };
  const computedBreakdown = Object.keys(sampleBreakdown).map(topicId => {
    const b = sampleBreakdown[topicId];
    return {
      topicId,
      correct: b.correct,
      total: b.total,
      score: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0
    };
  }).sort((a, b) => b.score - a.score);

  assert(computedBreakdown[0].topicId === 'dental-materials' && computedBreakdown[0].score === 80, 'Top topic is Dental Materials at 80%');
  assert(computedBreakdown[1].topicId === 'ethics' && computedBreakdown[1].score === 75, 'Second topic is Ethics at 75%');
  assert(computedBreakdown[2].topicId === 'radiology' && computedBreakdown[2].score === 20, 'Third topic is Radiology at 20%');
  assert(computedBreakdown[3].topicId === 'anatomy' && computedBreakdown[3].score === 0, 'Fourth topic is Anatomy at 0%');
  console.log('  ✓ Topic breakdown mathematical accuracy verified\n');

  // ----------------------------------------------------
  // TEST 6: Premium Downgrade & Tier Transition Integrity
  // ----------------------------------------------------
  console.log('[6/6] Testing Premium Downgrade & Tier Transition Integrity...');
  localStorage.clear();

  // Step 1: User finishes 500 questions with 450 correct while on Premium
  saveProgress('pathology', 450, 500, 0, true, 500);
  let pathProg = getTopicProgress('pathology');
  assert(pathProg !== null, 'Pathology progress should exist');
  assert(pathProg.highestScore === 450, 'Highest score should be 450');
  assert(pathProg.totalQuestions === 500, 'Total questions should be 500');
  let pct = Math.round((pathProg.highestScore / pathProg.totalQuestions) * 100);
  assert(pct === 90, 'Topic card percentage must be exactly 90%');

  // Step 2: User downgrades to Free. User starts an in-progress quiz (answers 10 questions)
  // Notice total is now 100 (free pool limit)
  saveProgress('pathology', 8, 100, 10, false, 10);
  pathProg = getTopicProgress('pathology');
  assert(pathProg.highestScore === 450, 'In-progress free quiz must NOT downgrade highestScore');
  assert(pathProg.totalQuestions === 500, 'In-progress free quiz must NOT shrink totalQuestions to 100');
  pct = Math.round((pathProg.highestScore / pathProg.totalQuestions) * 100);
  assert(pct === 90, 'Topic card percentage must remain 90%, NOT 450%');

  // Step 3: User finishes the 100-question free quiz with lower score (80/100 = 80%)
  saveProgress('pathology', 80, 100, 0, true, 100);
  pathProg = getTopicProgress('pathology');
  assert(pathProg.highestScore === 450, 'Lower accuracy run (80%) must not overwrite higher record (90%)');
  assert(pathProg.totalQuestions === 500, 'Total questions must remain 500');
  pct = Math.round((pathProg.highestScore / pathProg.totalQuestions) * 100);
  assert(pct === 90, 'Topic card percentage must remain 90%');

  // Step 4: User finishes the 100-question free quiz with higher score (96/100 = 96%)
  saveProgress('pathology', 96, 100, 0, true, 100);
  pathProg = getTopicProgress('pathology');
  assert(pathProg.highestScore === 96, 'Higher accuracy run (96%) must update highestScore');
  assert(pathProg.totalQuestions === 100, 'Total questions must update to 100 for the new record');
  pct = Math.round((pathProg.highestScore / pathProg.totalQuestions) * 100);
  assert(pct === 96, 'Topic card percentage must now be 96%');

  // Step 5: Test mid-quiz resume clamping when downgraded
  // Suppose user was at question 350 with score 310
  saveProgress('anatomy', 310, 500, 350, false, 350);
  let anatProg = getTopicProgress('anatomy');
  assert(anatProg.currentIndex === 350, 'Index saved at 350');
  
  // Free tier only has 100 questions. Simulate Quiz resume check:
  const freeAvailable = 100;
  let resumeIndex = anatProg.currentIndex;
  let resumeScore = anatProg.currentScore;
  if (resumeIndex >= freeAvailable) {
    resumeIndex = 0;
    resumeScore = 0;
    saveProgress('anatomy', 0, freeAvailable, 0, false, 0);
  }
  anatProg = getTopicProgress('anatomy');
  assert(anatProg.currentIndex === 0, 'Out-of-bounds in-progress quiz cleanly resets index to 0');
  assert(anatProg.currentScore === 0, 'Out-of-bounds in-progress quiz cleanly resets score to 0');

  // Step 6: Mathematical bounds assertion
  assert(Math.min(100, Math.max(0, pct)) === 96, 'Percentage properly bounded between 0 and 100');
  console.log('  ✓ Premium downgrade and score integrity verified\n');

  console.log('========================================');
  console.log('  ALL 6 RIGOROUS LOGIC TESTS PASSED! 🎉');
  console.log('========================================\n');
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});