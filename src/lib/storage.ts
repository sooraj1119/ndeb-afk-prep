export interface TopicProgress {
  topicId: string;
  highestScore: number;
  totalQuestions: number;
  currentIndex: number;
  currentScore: number;
  isFinished: boolean;
  questionsAnswered: number;
}

export interface SRSData {
  questionId: number;
  interval: number; // days until next review
  repetition: number; // consecutive correct reviews
  efactor: number; // easiness factor (starts at 2.5)
  nextReviewDate: number; // timestamp in ms
}

const STORAGE_KEY = 'ndeb_prep_progress';
const FLAGS_KEY = 'ndeb_prep_flags';
const DISCLAIMER_KEY = 'ndeb_prep_disclaimer_accepted';
const SRS_KEY = 'ndeb_prep_srs';

// --- Topic Progress ---

export const saveProgress = (
  topicId: string, 
  score: number, 
  total: number, 
  currentIndex: number, 
  isFinished: boolean,
  questionsAnswered: number
) => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const existing: Record<string, TopicProgress> = existingStr ? JSON.parse(existingStr) : {};
    
    const prevHigh = existing[topicId]?.highestScore || 0;
    
    existing[topicId] = {
      topicId,
      highestScore: isFinished ? Math.max(prevHigh, score) : prevHigh,
      totalQuestions: total,
      currentIndex: isFinished ? 0 : currentIndex,
      currentScore: isFinished ? 0 : score,
      isFinished,
      questionsAnswered: isFinished ? total : questionsAnswered
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
};

export const getProgress = (): Record<string, TopicProgress> => {
  try {
    const str = localStorage.getItem(STORAGE_KEY);
    return str ? JSON.parse(str) : {};
  } catch (error) {
    return {};
  }
};

export const getTopicProgress = (topicId: string): TopicProgress | null => {
  const all = getProgress();
  return all[topicId] || null;
};

// --- Flags ---

export const getFlaggedQuestions = (): number[] => {
  try {
    const str = localStorage.getItem(FLAGS_KEY);
    return str ? JSON.parse(str) : [];
  } catch (error) {
    return [];
  }
};

export const toggleFlagQuestion = (questionId: number): boolean => {
  try {
    let flags = getFlaggedQuestions();
    let isFlagged = false;
    if (flags.includes(questionId)) {
      flags = flags.filter(id => id !== questionId);
    } else {
      flags.push(questionId);
      isFlagged = true;
    }
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
    return isFlagged;
  } catch (error) {
    console.error("Failed to toggle flag:", error);
    return false;
  }
};

// --- Disclaimer ---

export const hasAcceptedDisclaimer = (): boolean => {
  try {
    return localStorage.getItem(DISCLAIMER_KEY) === 'true';
  } catch (error) {
    return false;
  }
};

export const acceptDisclaimer = () => {
  try {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
  } catch (error) {
    console.error("Failed to save disclaimer acceptance:", error);
  }
};

// --- Spaced Repetition System (SM-2 Algorithm) ---

export const getAllSRSData = (): Record<number, SRSData> => {
  try {
    const str = localStorage.getItem(SRS_KEY);
    return str ? JSON.parse(str) : {};
  } catch (error) {
    return {};
  }
};

export const getDueSRSQuestions = (): number[] => {
  const allData = getAllSRSData();
  const now = Date.now();
  const dueIds: number[] = [];
  
  for (const qId in allData) {
    if (allData[qId].nextReviewDate <= now) {
      dueIds.push(Number(qId));
    }
  }
  return dueIds;
};

// Log a question answer using SuperMemo-2 (SM-2)
export const logSRSAnswer = (questionId: number, isCorrect: boolean) => {
  try {
    const allData = getAllSRSData();
    const existing = allData[questionId];
    
    let interval = 1;
    let repetition = 0;
    let efactor = 2.5;
    
    if (existing) {
      interval = existing.interval;
      repetition = existing.repetition;
      efactor = existing.efactor;
    }

    const quality = isCorrect ? 4 : 0;

    if (quality >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    // 1 day = 86400000 ms
    const nextReviewDate = Date.now() + (interval * 86400000);

    allData[questionId] = {
      questionId,
      interval,
      repetition,
      efactor,
      nextReviewDate
    };

    localStorage.setItem(SRS_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Failed to log SRS answer:", error);
  }
};

// --- Gamification ---
const GAMIFICATION_KEY = 'ndeb_prep_gamification';

export interface GamificationData {
  currentStreak: number;
  lastVisitDate: string; // YYYY-MM-DD
  badges: string[];
}

export const getGamification = (): GamificationData => {
  try {
    const str = localStorage.getItem(GAMIFICATION_KEY);
    if (str) {
      return JSON.parse(str);
    }
  } catch (e) {}
  
  return {
    currentStreak: 0,
    lastVisitDate: '',
    badges: []
  };
};

export const logDailyVisit = () => {
  try {
    const data = getGamification();
    const today = new Date().toISOString().split('T')[0];
    
    if (data.lastVisitDate === today) {
      // Already logged today
      return data.currentStreak;
    }
    
    const lastVisit = new Date(data.lastVisitDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastVisit.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      data.currentStreak += 1;
    } else if (diffDays > 1 || !data.lastVisitDate) {
      data.currentStreak = 1;
    }
    
    data.lastVisitDate = today;
    localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
    return data.currentStreak;
  } catch (e) {
    return 0;
  }
};

export const awardBadge = (badgeId: string) => {
  try {
    const data = getGamification();
    if (!data.badges.includes(badgeId)) {
      data.badges.push(badgeId);
      localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
      return true; // newly awarded
    }
    return false;
  } catch (e) {
    return false;
  }
};

// --- Premium State ---
const PREMIUM_KEY = 'ndeb_prep_is_premium';

export const getIsPremium = (): boolean => {
  try {
    return localStorage.getItem(PREMIUM_KEY) === 'true';
  } catch (error) {
    return false;
  }
};

export const setIsPremium = (status: boolean) => {
  try {
    localStorage.setItem(PREMIUM_KEY, status ? 'true' : 'false');
    // Dispatch an event so components can update instantly
    window.dispatchEvent(new Event('premium_status_changed'));
  } catch (error) {}
};

// --- History / Learning Curve ---
const HISTORY_KEY = 'ndeb_prep_history';

export interface QuizAttempt {
  topicId: string; // 'simulated', 'srs', or actual topic ID
  score: number;
  total: number;
  timestamp: number;
}

export const getHistory = (): QuizAttempt[] => {
  try {
    const str = localStorage.getItem(HISTORY_KEY);
    return str ? JSON.parse(str) : [];
  } catch (error) {
    return [];
  }
};

export const logQuizAttempt = (topicId: string, score: number, total: number) => {
  try {
    const history = getHistory();
    history.push({
      topicId,
      score,
      total,
      timestamp: Date.now()
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
};

// --- Active Mock Exam State ---
const MOCK_EXAM_KEY = 'ndeb_prep_active_mock';

export interface ActiveMockExam {
  questions: any[];
  currentIndex: number;
  score: number;
  endTime?: number;
}

export const getActiveMockExam = (): ActiveMockExam | null => {
  try {
    const str = localStorage.getItem(MOCK_EXAM_KEY);
    return str ? JSON.parse(str) : null;
  } catch (error) {
    return null;
  }
};

export const saveActiveMockExam = (data: ActiveMockExam) => {
  try {
    localStorage.setItem(MOCK_EXAM_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save active mock exam:", error);
  }
};

export const clearActiveMockExam = () => {
  try {
    localStorage.removeItem(MOCK_EXAM_KEY);
  } catch (error) {}
};

export const resetAllProgress = () => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(FLAGS_KEY); localStorage.removeItem(SRS_KEY); localStorage.removeItem(GAMIFICATION_KEY); localStorage.removeItem(HISTORY_KEY); localStorage.removeItem(MOCK_EXAM_KEY); window.location.reload(); };

// --- Mistakes Tracking ---

const MISTAKES_KEY = 'ndeb_prep_mistakes';

export const getMistakes = (): number[] => {
  try {
    const data = localStorage.getItem(MISTAKES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const logMistake = (questionId: number) => {
  const mistakes = getMistakes();
  if (!mistakes.includes(questionId)) {
    mistakes.push(questionId);
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
  }
};

export const removeMistake = (questionId: number) => {
  const mistakes = getMistakes();
  const updated = mistakes.filter(id => id !== questionId);
  localStorage.setItem(MISTAKES_KEY, JSON.stringify(updated));
};
