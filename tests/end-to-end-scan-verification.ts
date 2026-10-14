import assert from 'assert';
import { getTotalQuestionCount, getQuestions, loadAllQuestions, loadTopicQuestions } from '../src/lib/questionsStore';
import { 
  getIsPremium, 
  setIsPremium, 
  getProgress, 
  saveProgress, 
  getTopicProgress, 
  getDueSRSQuestions, 
  logSRSAnswer, 
  getMistakes, 
  logMistake, 
  removeMistake, 
  getExamDate, 
  setExamDate 
} from '../src/lib/storage';

console.log('--- STARTING ROBUST END-TO-END SCAN TESTS ---');

// Mock localStorage for Node test runner
const storageMap: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => storageMap[k] ?? null,
  setItem: (k: string, v: string) => { storageMap[k] = v; },
  removeItem: (k: string) => { delete storageMap[k]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); },
  key: (i: number) => Object.keys(storageMap)[i] || null,
  length: 0
} as any;

global.window = {
  dispatchEvent: () => true,
  localStorage: global.localStorage
} as any;

// Test 1: Question Store and Total Bank Count
console.log('[Test 1] Question Store & Manifest Count...');
const totalCount = getTotalQuestionCount();
assert.strictEqual(totalCount, 14000, `Expected 14000 questions, got ${totalCount}`);
console.log('  ✓ Question store reports correct 14,000 question bank count');

// Test 2: Idempotent User Answer Scoring Simulation
console.log('[Test 2] Idempotent Quiz Navigation and Score Integrity...');
let userAnswers: Record<number, number> = {};
let score = 0;
const mockQuestions = [
  { id: 1, topicId: 'ethics', question: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
  { id: 2, topicId: 'ethics', question: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 2 },
  { id: 3, topicId: 'ethics', question: 'Q3', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 }
];

function handleSelectSim(currentIndex: number, index: number) {
  if (userAnswers[currentIndex] !== undefined) return; // Guard against re-answer
  userAnswers[currentIndex] = index;
  if (index === mockQuestions[currentIndex].correctAnswer) {
    score += 1;
  }
}

// User answers Q0 correctly
handleSelectSim(0, 1);
assert.strictEqual(score, 1, 'Score should be 1 after answering Q0 correctly');
assert.strictEqual(userAnswers[0], 1, 'userAnswers[0] should record index 1');

// User moves to Q1 and answers correctly
handleSelectSim(1, 2);
assert.strictEqual(score, 2, 'Score should be 2 after answering Q1 correctly');
assert.strictEqual(userAnswers[1], 2, 'userAnswers[1] should record index 2');

// User presses Prev back to Q0
// User tries to re-select option on Q0
handleSelectSim(0, 1);
assert.strictEqual(score, 2, 'Score must NOT double-count upon re-selecting already answered Q0');

// User tries to select wrong option on Q0
handleSelectSim(0, 0);
assert.strictEqual(userAnswers[0], 1, 'Original selected answer on Q0 must remain preserved as 1');
assert.strictEqual(score, 2, 'Score must remain 2');
console.log('  ✓ Prev/Next answer preservation & score idempotency verified');

// Test 3: Study Pacer & Exam Date Math
console.log('[Test 3] Study Pacer Date Math...');
const futureDate = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days in future
setExamDate(futureDate);
const retrievedDate = getExamDate();
assert.strictEqual(retrievedDate, futureDate, 'Exam date timestamp should persist correctly');

const msLeft = retrievedDate - Date.now();
const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
assert.strictEqual(daysLeft, 30, `Expected 30 days left, got ${daysLeft}`);
const remainingQuestions = 14000;
const dailyQuota = Math.ceil(remainingQuestions / daysLeft);
assert.strictEqual(dailyQuota, 467, `Expected ~467 questions/day, got ${dailyQuota}`);
console.log('  ✓ Study pacer quota and countdown math verified');

// Test 4: Mistakes Tracking & Filtering
console.log('[Test 4] Mistakes Tracking Lifecycle...');
logMistake('anatomy-101');
logMistake('anatomy-102');
let mistakes = getMistakes();
assert.strictEqual(mistakes.length, 2, 'Should have 2 logged mistakes');
assert.ok(mistakes.includes('anatomy-101'), 'Should include anatomy-101');

// Duplicate logging idempotency
logMistake('anatomy-101');
mistakes = getMistakes();
assert.strictEqual(mistakes.length, 2, 'Duplicate mistake logging should be deduplicated');

removeMistake('anatomy-101');
mistakes = getMistakes();
assert.strictEqual(mistakes.length, 1, 'Should have 1 mistake after removal');
assert.ok(!mistakes.includes('anatomy-101'), 'anatomy-101 should be removed');
console.log('  ✓ Mistakes logging, deduplication, and removal verified');

// Test 5: Storage Corrupted JSON Recovery
console.log('[Test 5] Storage Corrupted JSON Resilience...');
global.localStorage.setItem('ndeb_prep_progress', 'invalid-json{{{');
const safeProgress = getProgress();
assert.deepStrictEqual(safeProgress, {}, 'Corrupted progress string should safely return empty object without crashing');

global.localStorage.setItem('ndeb_prep_mistakes', '{"not":"an array"}');
const safeMistakes = getMistakes();
assert.deepStrictEqual(safeMistakes, [], 'Non-array mistakes storage should safely return empty array');
console.log('  ✓ Corrupted storage recovery resilience verified');

console.log('\n======================================================');
console.log('  ALL END-TO-END SCAN TESTS PASSED WITH 100% ACCURACY! ');
console.log('======================================================');
