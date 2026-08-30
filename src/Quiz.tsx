import React, { useState, useEffect, useRef } from 'react';
import { getQuestions, loadTopicQuestions } from './lib/questionsStore';
import { topics } from './lib/data';
import { ArrowLeft } from 'lucide-react';
import { PaywallModal } from './PaywallModal';
import { getTopicProgress, getIsPremium, saveProgress, getFlaggedQuestions, toggleFlagQuestion, logSRSAnswer, getDueSRSQuestions, logQuizAttempt, getActiveMockExam, saveActiveMockExam, clearActiveMockExam, getMistakes, logMistake, removeMistake } from './lib/storage';

// Sub-components
import { QuizHeader } from './quiz/QuizHeader';
import { QuestionCard } from './quiz/QuestionCard';
import { ResultBottomSheet } from './quiz/ResultBottomSheet';

interface Props {
  topicId: string;
  onFinish: (score: number, total: number, breakdown?: Record<string, { correct: number; total: number }>) => void;
  onBack: () => void;
}

export function Quiz({ topicId, onFinish, onBack }: Props) {
  // Modes
  const isFlaggedMode = topicId === 'flagged';
  const isSimulatedMode = topicId === 'simulated';
  const isSRSMode = topicId === 'srs_review';
  const isMistakesMode = topicId === 'mistakes';
  
  const breakdownRef = useRef<Record<string, { correct: number; total: number }>>({});
  const sessionStartRef = useRef({ index: 0, score: 0 });

  const [topicQuestions, setTopicQuestions] = useState<any[]>([]);
  const [topicName, setTopicName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [timeLeft, setTimeLeft] = useState(9000); // 2.5 hours
  const [isShuffled, setIsShuffled] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const isPremium = getIsPremium();

  const recordSessionAttempt = (finalScore: number, finalIndex: number) => {
    if (isFlaggedMode || isMistakesMode || isSRSMode || isSimulatedMode) return;
    const sessionAnswered = finalIndex - sessionStartRef.current.index;
    const sessionScore = finalScore - sessionStartRef.current.score;
    if (sessionAnswered > 0) {
      logQuizAttempt(topicId, sessionScore, sessionAnswered);
    }
    sessionStartRef.current = { index: finalIndex, score: finalScore };
  };

  // Initialize questions
  useEffect(() => {
    const init = async () => {
      let qList = [];
      const currentPremium = getIsPremium();

      if (isSimulatedMode) {
        const activeMock = getActiveMockExam();
        const isExpired = activeMock?.endTime ? (activeMock.endTime - Date.now()) <= 0 : false;
        const isCompleted = activeMock ? activeMock.currentIndex >= activeMock.questions.length : false;

        if (activeMock && activeMock.questions.length > 0 && !isExpired && !isCompleted) {
          qList = activeMock.questions;
          setCurrentIndex(activeMock.currentIndex);
          setScore(activeMock.score);
          sessionStartRef.current = { index: activeMock.currentIndex, score: activeMock.score };
          if (activeMock.endTime) {
            const remaining = Math.floor((activeMock.endTime - Date.now()) / 1000);
            setTimeLeft(Math.max(0, remaining));
          }
        } else {
          const store = await import('./lib/questionsStore');
          await store.loadAllQuestions();
          qList = [...store.getQuestions()].sort(() => Math.random() - 0.5).slice(0, 100);
          const endTime = Date.now() + 9000 * 1000;
          setTimeLeft(9000);
          saveActiveMockExam({ questions: qList, currentIndex: 0, score: 0, endTime });
        }
        setTopicName("Simulated AFK Exam");
      } else if (isFlaggedMode) {
        const flags = getFlaggedQuestions();
        qList = getQuestions().filter((q: any) => flags.includes(q.id));
        setTopicName("Flagged Review");
      } else if (isMistakesMode) {
        const mistakes = getMistakes();
        qList = getQuestions().filter((q: any) => mistakes.includes(q.id));
        setTopicName("Weakness Drilling");
      } else if (isSRSMode) {
        const dueIds = getDueSRSQuestions();
        qList = getQuestions().filter((q: any) => dueIds.includes(q.id));
        setTopicName("Daily SRS Review");
      } else {
        qList = await loadTopicQuestions(topicId);
        if (!currentPremium) qList = qList.slice(0, 100);
        setTopicName(topics.find(t => t.id === topicId)?.name || "");
        const progress = getTopicProgress(topicId);
        if (progress && !progress.isFinished) {
          setCurrentIndex(progress.currentIndex);
          setScore(progress.currentScore);
          sessionStartRef.current = { index: progress.currentIndex, score: progress.currentScore };
        }
      }
      setTopicQuestions(qList);
      setInitialized(true);
    };
    init();
  }, [topicId, isSimulatedMode, isFlaggedMode, isSRSMode]);

  // Update flagged status when current question changes
  useEffect(() => {
    if (topicQuestions.length > 0 && initialized) {
      const qId = topicQuestions[currentIndex]?.id;
      if (qId) {
        const currentFlags = getFlaggedQuestions();
        setIsFlagged(currentFlags.includes(qId));
      }
    }
  }, [currentIndex, topicQuestions, initialized]);

  // Timer for simulated mode
  useEffect(() => {
    if (!isSimulatedMode || !initialized || topicQuestions.length === 0) return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [isSimulatedMode, initialized, timeLeft]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, []);

  const handleSelect = (index: number) => {
    if (!question || selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const isAnsCorrect = index === question.correctAnswer;
    let newScore = score;
    if (isAnsCorrect) {
      newScore = score + 1;
      setScore(newScore);
    }
    
    if (!isAnsCorrect) {
      logMistake(question.id);
    } else if (isMistakesMode) {
      removeMistake(question.id);
    }

    if (isSimulatedMode) {
      const breakdown = breakdownRef.current;
      if (!breakdown[question.topicId]) {
        breakdown[question.topicId] = { correct: 0, total: 0 };
      }
      breakdown[question.topicId].total += 1;
      if (isAnsCorrect) breakdown[question.topicId].correct += 1;
    }
    
    if (!isSimulatedMode && !isFlaggedMode && !isMistakesMode) logSRSAnswer(question.id, isAnsCorrect);

    if (!isFlaggedMode && !isSimulatedMode && !isSRSMode && !isMistakesMode) {
      saveProgress(topicId, newScore, topicQuestions.length, currentIndex, false, currentIndex + 1);
    }

    if (isSimulatedMode) {
      const activeMock = getActiveMockExam();
      saveActiveMockExam({ questions: topicQuestions, currentIndex, score: newScore, endTime: activeMock?.endTime });
    }
  };

  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setSelectedAnswer(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < topicQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);

      if (!isFlaggedMode && !isSimulatedMode && !isSRSMode && !isMistakesMode) {
        saveProgress(topicId, score, topicQuestions.length, nextIdx, false, currentIndex + 1);
      }
      if (isSimulatedMode) {
        const activeMock = getActiveMockExam();
        saveActiveMockExam({ questions: topicQuestions, currentIndex: nextIdx, score, endTime: activeMock?.endTime });
      }
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (!isFlaggedMode && !isSimulatedMode && !isSRSMode && !isMistakesMode) {
      saveProgress(topicId, score, topicQuestions.length, 0, true, topicQuestions.length);
    }
    if (isSimulatedMode) {
      clearActiveMockExam();
    }
    recordSessionAttempt(score, currentIndex + (selectedAnswer !== null ? 1 : 0));
    onFinish(score, topicQuestions.length, breakdownRef.current);
  };

  const handleToggleFlag = () => {
    if (!question) return;
    const flagged = toggleFlagQuestion(question.id);
    setIsFlagged(flagged);
  };

  const handleToggleShuffle = () => {
    if (!isShuffled) {
      setTopicQuestions(prev => {
        const done = prev.slice(0, currentIndex);
        const remaining = [...prev.slice(currentIndex)].sort(() => Math.random() - 0.5);
        return [...done, ...remaining];
      });
    } else {
      if (!isFlaggedMode && !isSimulatedMode && !isSRSMode) {
         // Reset to original order
         loadTopicQuestions(topicId).then(qList => {
           if (!getIsPremium()) qList = qList.slice(0, 100);
           setTopicQuestions(qList);
         });
      }
    }
    setIsShuffled(prev => !prev);
    setSelectedAnswer(null);
  };

  const handleRestartMockExam = () => {
    clearActiveMockExam();
    const qList = [...getQuestions()].sort(() => Math.random() - 0.5).slice(0, 100);
    const endTime = Date.now() + 9000 * 1000;
    setTimeLeft(9000);
    saveActiveMockExam({ questions: qList, currentIndex: 0, score: 0, endTime });
    
    breakdownRef.current = {};
    setTopicQuestions(qList);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
  };

  const playAudio = (elementId: string, fallbackText: string) => {
    if (!window.speechSynthesis) return;
    if (isPlayingAudio) { window.speechSynthesis.cancel(); setIsPlayingAudio(false); return; }
    setIsPlayingAudio(true);

    const el = document.getElementById(elementId);
    let textToRead = el?.innerText || fallbackText;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    const isFrench = document.cookie.includes('googtrans=/en/fr');
    utterance.lang = isFrench ? 'fr-FR' : 'en-US';

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleBackClick = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    recordSessionAttempt(score, currentIndex + (selectedAnswer !== null ? 1 : 0));
    onBack();
  };

  // Auto-record progress on unmount if any questions were answered
  const lastRecordedRef = useRef({ score: 0, index: 0 });
  const stateRef = useRef({ score, currentIndex, selectedAnswer, topicId });

  useEffect(() => {
    stateRef.current = { score, currentIndex, selectedAnswer, topicId };
  }, [score, currentIndex, selectedAnswer, topicId]);

  useEffect(() => {
    return () => {
      const { score: finalScore, currentIndex: finalIdx, selectedAnswer: selAns, topicId: tid } = stateRef.current;
      const finalIndex = finalIdx + (selAns !== null ? 1 : 0);

      // Prevent double recording if we already recorded this exact state (e.g. via Finish button)
      if (finalIndex > sessionStartRef.current.index && (finalIndex !== lastRecordedRef.current.index || finalScore !== lastRecordedRef.current.score)) {
        const sessionAnswered = finalIndex - sessionStartRef.current.index;
        const sessionScore = finalScore - sessionStartRef.current.score;
        if (sessionAnswered > 0) {
          logQuizAttempt(tid, sessionScore, sessionAnswered);
          lastRecordedRef.current = { score: finalScore, index: finalIndex };
        }
      }
    };
  }, []); // Run ONLY on actual unmount

  // Keyboard and Swipe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (selectedAnswer === null) {
        if (['1', 'a', 'A'].includes(e.key)) handleSelect(0);
        else if (['2', 'b', 'B'].includes(e.key)) handleSelect(1);
        else if (['3', 'c', 'C'].includes(e.key)) handleSelect(2);
        else if (['4', 'd', 'D'].includes(e.key)) handleSelect(3);
      } else {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNext(); }
      }
      if (e.key === 'f' || e.key === 'F') handleToggleFlag();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnswer, currentIndex, topicQuestions]);

  useEffect(() => {
    let startX = 0, startY = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0 && selectedAnswer !== null) handleNext();
        else if (dx > 0 && currentIndex === 0) handleBackClick();
      }
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => { document.removeEventListener('touchstart', onStart); document.removeEventListener('touchend', onEnd); };
  }, [selectedAnswer, currentIndex]);

  if (!initialized || topicQuestions.length === 0) {
    return initialized ? (
      <div style={{ padding: '2rem', textAlign: 'center', marginTop: '4rem' }}>
        <h2>{isFlaggedMode ? "No flagged questions." : isSRSMode ? "No questions due for review." : "No questions available."}</h2>
        <button onClick={onBack} className="primary-btn" style={{ marginTop: '2rem' }}>Go Back</button>
      </div>
    ) : null;
  }
  
  const question = topicQuestions[currentIndex];
  const progressPercentage = (currentIndex + (selectedAnswer !== null ? 1 : 0)) / topicQuestions.length * 100;

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <button 
        onClick={handleBackClick}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      {!isPremium && !isSimulatedMode && !isFlaggedMode && !isSRSMode && !isMistakesMode && (
        <div 
          onClick={() => setShowPaywall(true)}
          className="paywall-banner"
          style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', cursor: 'pointer', flexWrap: 'wrap', gap: '0.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '0.9rem', fontWeight: 600 }}>
            <span>Free Tier Preview: Viewing 100 questions.</span>
          </div>
          <button className="upgrade-badge">Unlock All</button>
        </div>
      )}

      <QuizHeader
        topicName={topicName}
        isSimulatedMode={isSimulatedMode}
        isSRSMode={isSRSMode}
        isFlaggedMode={isFlaggedMode}
        timeLeft={timeLeft}
        isShuffled={isShuffled}
        onToggleShuffle={handleToggleShuffle}
        onRestartMockExam={handleRestartMockExam}
        isFlagged={isFlagged}
        onToggleFlag={handleToggleFlag}
        currentIndex={currentIndex}
        totalQuestions={topicQuestions.length}
        progressPercentage={progressPercentage}
        formatTime={(s) => {
          const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
          return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }}
      />

      <QuestionCard
        question={question}
        currentIndex={currentIndex}
        selectedAnswer={selectedAnswer}
        isAnswered={selectedAnswer !== null}
        onSelect={handleSelect}
        isPlayingAudio={isPlayingAudio}
        onToggleAudio={playAudio}
      />

      <ResultBottomSheet
        isAnswered={selectedAnswer !== null}
        isCorrect={selectedAnswer === question.correctAnswer}
        isSimulatedMode={isSimulatedMode}
        explanation={question.explanation}
        correctAnswerText={question.options[question.correctAnswer]}
        isPlayingAudio={isPlayingAudio}
        onToggleAudio={playAudio}
        onNext={handleNext}
        onPrev={handlePrev}
        currentIndex={currentIndex}
        isLastQuestion={currentIndex === topicQuestions.length - 1}
      />

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="all 7,500 questions" />
    </div>
  );
}
