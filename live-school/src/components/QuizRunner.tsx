import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft, ArrowRight, 
  HelpCircle, Sparkles, Send, RefreshCw, BookOpen, Maximize2, Image as ImageIcon 
} from 'lucide-react';
import { Category, LevelInfo, Question, QuizAnswerRecord, QuizResult, QuizSettings } from '../types';
import { playSoundEffect, toBengaliNumeral } from '../utils/storage';
import { ImageViewModal } from './Common/ImageViewModal';

interface QuizRunnerProps {
  category: Category;
  level: LevelInfo;
  questions: Question[];
  userName: string;
  settings: QuizSettings;
  soundEnabled: boolean;
  onFinishQuiz: (result: QuizResult) => void;
  onCancelQuiz: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  category,
  level,
  questions,
  userName,
  settings,
  soundEnabled,
  onFinishQuiz,
  onCancelQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [viewImageModal, setViewImageModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
  });

  // Time tracking
  const timeLimitSeconds = (level.defaultTimeLimitMinutes || settings.timeLimitMinutes) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(timeLimitSeconds);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const selectedIndex = userAnswers[currentQuestion?.id] ?? null;
  const hasAnsweredCurrent = selectedIndex !== null;

  const handleSelectOption = (optIndex: number) => {
    if (hasAnsweredCurrent) return; // Prevent re-answering once answered

    const updated = { ...userAnswers, [currentQuestion.id]: optIndex };
    setUserAnswers(updated);

    // Audio feedback
    if (soundEnabled) {
      if (optIndex === currentQuestion.correctAnswerIndex) {
        playSoundEffect('correct');
      } else {
        playSoundEffect('wrong');
      }
    }
  };

  const calculateResults = (): QuizResult => {
    let correctCount = 0;
    let wrongCount = 0;
    const answerRecords: QuizAnswerRecord[] = [];

    questions.forEach((q) => {
      const selected = userAnswers[q.id] ?? null;
      const isCorrect = selected === q.correctAnswerIndex;

      if (selected !== null) {
        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      answerRecords.push({
        questionId: q.id,
        questionText: q.questionText,
        options: q.options,
        selectedIndex: selected,
        correctIndex: q.correctAnswerIndex,
        isCorrect: isCorrect,
        explanation: q.explanation,
        imageUrl: q.imageUrl,
        explanationImageUrl: q.explanationImageUrl,
      });
    });

    const negRate = level.defaultNegativeMarking || settings.negativeMarkPerWrong;
    const negDeducted = wrongCount * negRate;
    const rawScore = correctCount - negDeducted;
    const finalScore = Math.max(0, Number(rawScore.toFixed(2)));
    const percentage = Math.round((finalScore / totalQuestions) * 100);

    // Time spent formatting
    const minutesSpent = Math.floor(timeSpentSeconds / 60);
    const secondsSpent = timeSpentSeconds % 60;
    const timeSpentFormatted = `${toBengaliNumeral(minutesSpent)} মিনিট ${toBengaliNumeral(secondsSpent)} সেকেন্ড`;

    return {
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      userName,
      categoryId: category.id,
      categoryName: category.nameBn,
      levelId: level.id,
      levelName: level.nameBn,
      totalQuestions,
      answeredCount: Object.keys(userAnswers).length,
      correctCount,
      wrongCount,
      negativeMarkRate: negRate,
      negativeMarksDeducted: Number(negDeducted.toFixed(2)),
      finalScore,
      maxPossibleScore: totalQuestions,
      percentage,
      timeSpentSeconds,
      timeSpentFormatted,
      timestamp: new Date().toISOString(),
      answersDetail: answerRecords,
    };
  };

  const handleAutoSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const result = calculateResults();
    if (soundEnabled) playSoundEffect('complete');
    onFinishQuiz(result);
  };

  const handleManualSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const result = calculateResults();
    if (soundEnabled) playSoundEffect('complete');
    onFinishQuiz(result);
  };

  // Time format
  const formatTime = (secs: number) => {
    const totalSecs = Math.max(0, Math.floor(secs || 0));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${toBengaliNumeral(String(m).padStart(2, '0'))}:${toBengaliNumeral(String(s).padStart(2, '0'))}`;
  };

  const isTimeLow = secondsRemaining <= 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Top Bar: Title, Timer & Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-4 sticky top-18 z-30">
        <button
          onClick={onCancelQuiz}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">পরীক্ষা ত্যাগ করুন</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
            {category.nameBn} • {level.nameBn}
          </span>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            পরীক্ষার্থী: <strong className="text-slate-800">{userName}</strong>
          </div>
        </div>

        {/* Live Countdown Timer */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-extrabold font-mono transition-all ${
          isTimeLow 
            ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse' 
            : 'bg-slate-50 text-slate-800 border-slate-200'
        }`}>
          <Clock className={`w-4 h-4 ${isTimeLow ? 'text-rose-600' : 'text-emerald-600'}`} />
          <span>{formatTime(secondsRemaining)}</span>
        </div>
      </div>

      {/* Progress & Question Navigation Pills */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>প্রশ্ন {toBengaliNumeral(currentIndex + 1)} / {toBengaliNumeral(totalQuestions)}</span>
          <span>উত্তর প্রদান: {toBengaliNumeral(Object.keys(userAnswers).length)} / {toBengaliNumeral(totalQuestions)}</span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Selector Quick Grid */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          {questions.map((q, idx) => {
            const isAnswered = userAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-emerald-500 bg-emerald-600 text-white'
                    : isAnswered
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {toBengaliNumeral(idx + 1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-block text-xs font-bold text-slate-400 uppercase tracking-wider">
                প্রশ্ন নম্বর {toBengaliNumeral(currentIndex + 1)}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {currentQuestion.questionText}
              </h3>
            </div>
            
            <div className="shrink-0 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
              ১ মার্কস
            </div>
          </div>

          {/* Question Diagram / Image */}
          {currentQuestion.imageUrl && (
            <div className="relative group bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center">
              <img
                src={currentQuestion.imageUrl}
                alt="Question Diagram"
                className="max-h-72 max-w-full object-contain rounded-xl shadow-xs cursor-pointer bg-white p-2 border border-slate-100"
                onClick={() => setViewImageModal({
                  isOpen: true,
                  imageUrl: currentQuestion.imageUrl || '',
                  title: `প্রশ্ন #${toBengaliNumeral(currentIndex + 1)}-এর চিত্র`,
                })}
              />
              <button
                type="button"
                onClick={() => setViewImageModal({
                  isOpen: true,
                  imageUrl: currentQuestion.imageUrl || '',
                  title: `প্রশ্ন #${toBengaliNumeral(currentIndex + 1)}-এর চিত্র`,
                })}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
                <span>🔍 চিত্রটি বড় করে দেখুন</span>
              </button>
            </div>
          )}

          {/* Options Grid (4 Options) */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = selectedIndex === optIdx;
              const isCorrectOption = optIdx === currentQuestion.correctAnswerIndex;

              // Styles according to feedback requirements:
              // Correct option clicked -> Green
              // Incorrect option clicked -> Red, and correct option highlighted in Green!
              let optionStyle = 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-100/80';
              let badgeIcon = null;

              if (hasAnsweredCurrent) {
                if (isCorrectOption) {
                  // Green highlight for correct answer
                  optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30 font-semibold';
                  badgeIcon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
                } else if (isSelected && !isCorrectOption) {
                  // Red highlight for incorrect user pick
                  optionStyle = 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/30 font-semibold';
                  badgeIcon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
                } else {
                  // Unselected options after answer
                  optionStyle = 'bg-slate-50 border-slate-200 opacity-60 text-slate-600';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={hasAnsweredCurrent}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      hasAnsweredCurrent && isCorrectOption
                        ? 'bg-emerald-600 text-white'
                        : hasAnsweredCurrent && isSelected && !isCorrectOption
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700'
                    }`}>
                      {toBengaliNumeral(optIdx + 1)}
                    </span>
                    <span className="text-sm sm:text-base leading-snug">
                      {optionText}
                    </span>
                  </div>

                  {badgeIcon}
                </button>
              );
            })}
          </div>

          {/* Explanation Box (ব্যাখ্যা) - Revealed immediately when answered */}
          {hasAnsweredCurrent && (
            <div className={`p-5 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 ${
              selectedIndex === currentQuestion.correctAnswerIndex
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>সঠিক উত্তরের ব্যাখ্যা (Explanation):</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                {currentQuestion.explanation || 'এই প্রশ্নের জন্য কোনো অতিরিক্ত ব্যাখ্যা দেওয়া হয়নি।'}
              </p>

              {/* Explanation Diagram / Solution Image */}
              {currentQuestion.explanationImageUrl && (
                <div className="pt-2 border-t border-emerald-200/60 flex flex-col items-center">
                  <img
                    src={currentQuestion.explanationImageUrl}
                    alt="Explanation Diagram"
                    className="max-h-60 max-w-full object-contain rounded-xl bg-white p-2 border border-slate-200 shadow-2xs cursor-pointer"
                    onClick={() => setViewImageModal({
                      isOpen: true,
                      imageUrl: currentQuestion.explanationImageUrl || '',
                      title: `প্রশ্ন #${toBengaliNumeral(currentIndex + 1)}-এর উত্তরের ব্যাখ্যা চিত্র`,
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setViewImageModal({
                      isOpen: true,
                      imageUrl: currentQuestion.explanationImageUrl || '',
                      title: `প্রশ্ন #${toBengaliNumeral(currentIndex + 1)}-এর উত্তরের ব্যাখ্যা চিত্র`,
                    })}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>🔍 সমাধান চিত্রটি বড় করে দেখুন</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation & Submit Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                currentIndex === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>পূর্ববর্তী</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>পরবর্তী প্রশ্ন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>পরীক্ষা জমা দিন</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              পরীক্ষাটি সম্পন্ন করতে চান?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              আপনি মোট <strong>{toBengaliNumeral(totalQuestions)}</strong> টির মধ্যে <strong>{toBengaliNumeral(Object.keys(userAnswers).length)}</strong> টি প্রশ্নের উত্তর দিয়েছেন।
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                onClick={handleManualSubmit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                হ্যাঁ, জমা দিন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImageViewModal
        isOpen={viewImageModal.isOpen}
        imageUrl={viewImageModal.imageUrl}
        title={viewImageModal.title}
        onClose={() => setViewImageModal({ isOpen: false, imageUrl: '', title: '' })}
      />

    </div>
  );
};
