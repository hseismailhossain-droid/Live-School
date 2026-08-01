import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Clock, Award, Volume2, HelpCircle, Check, Sparkles, RefreshCw, 
  CheckCircle2, XCircle, FileText, ChevronDown, ChevronUp, Languages, Shuffle, PenTool
} from 'lucide-react';
import { EnglishQuestionSet, EnglishExamResult, EnglishSubResult } from '../types';
import { toBengaliNumeral } from '../utils/storage';
import { evaluateEnglishTranslationOffline, speakEnglishSentence } from '../utils/englishEvaluator';

interface EnglishExamRunnerProps {
  set: EnglishQuestionSet;
  userName: string;
  onFinishEnglish: (result: EnglishExamResult) => void;
  onCancel: () => void;
}

// Helper to shuffle array deterministically or pseudo-randomly
function shuffleWords(words: string[]): string[] {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Clean words for chip rendering
function getCleanWordsFromSentence(sentence: string): string[] {
  if (!sentence) return [];
  // Split by whitespace
  return sentence.trim().split(/\s+/).filter(Boolean);
}

export const EnglishExamRunner: React.FC<EnglishExamRunnerProps> = ({
  set,
  userName,
  onFinishEnglish,
  onCancel,
}) => {
  const items = set.items && set.items.length > 0 ? set.items : [];
  const totalMaxMarks = items.reduce((acc, it) => acc + (it.marks || 10), 0);

  // Map of itemId -> user typed/constructed sentence
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});

  // Map of itemId -> scrambled word bank
  const [scrambledWordsMap, setScrambledWordsMap] = useState<Record<string, string[]>>({});

  // Map of itemId -> array of selected word chip indices
  const [selectedWordIndicesMap, setSelectedWordIndicesMap] = useState<Record<string, number[]>>({});

  // Map of itemId -> boolean for hints toggle
  const [showHintsMap, setShowHintsMap] = useState<Record<string, boolean>>({});

  // Results State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subResults, setSubResults] = useState<EnglishSubResult[] | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  // Countdown timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState((set.timeLimitMinutes || 15) * 60);

  // Initialize scrambled word banks on mount
  useEffect(() => {
    const scrambled: Record<string, string[]> = {};
    items.forEach((item) => {
      const words = getCleanWordsFromSentence(item.englishSentence);
      scrambled[item.id] = shuffleWords(words);
    });
    setScrambledWordsMap(scrambled);
  }, [set]);

  // Countdown timer effect
  useEffect(() => {
    if (subResults) return;
    if (timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, subResults]);

  const formatTimer = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${toBengaliNumeral(String(mins).padStart(2, '0'))}:${toBengaliNumeral(String(secs).padStart(2, '0'))}`;
  };

  // Word Chip Tapped
  const handleWordChipClick = (itemId: string, wordIndex: number, word: string) => {
    const currentSelectedIndices = selectedWordIndicesMap[itemId] || [];
    if (currentSelectedIndices.includes(wordIndex)) return; // already selected

    const newIndices = [...currentSelectedIndices, wordIndex];
    setSelectedWordIndicesMap((prev) => ({ ...prev, [itemId]: newIndices }));

    // Reconstruct answer string from selected chips
    const pool = scrambledWordsMap[itemId] || [];
    const constructedSentence = newIndices.map((idx) => pool[idx]).join(' ');
    setAnswersMap((prev) => ({ ...prev, [itemId]: constructedSentence }));
  };

  // Deselect / Remove Word Chip
  const handleRemoveSelectedWord = (itemId: string, selectedPosIndex: number) => {
    const currentSelectedIndices = selectedWordIndicesMap[itemId] || [];
    const newIndices = currentSelectedIndices.filter((_, idx) => idx !== selectedPosIndex);
    setSelectedWordIndicesMap((prev) => ({ ...prev, [itemId]: newIndices }));

    const pool = scrambledWordsMap[itemId] || [];
    const constructedSentence = newIndices.map((idx) => pool[idx]).join(' ');
    setAnswersMap((prev) => ({ ...prev, [itemId]: constructedSentence }));
  };

  // Reset words for a question
  const handleResetWords = (itemId: string) => {
    setSelectedWordIndicesMap((prev) => ({ ...prev, [itemId]: [] }));
    setAnswersMap((prev) => ({ ...prev, [itemId]: '' }));
  };

  // Direct Text Input change
  const handleDirectInputChange = (itemId: string, value: string) => {
    setAnswersMap((prev) => ({ ...prev, [itemId]: value }));
  };

  const isAnyAnswerEntered = items.some((item) => (answersMap[item.id] || '').trim().length > 0);

  // Submit and Evaluate
  const handleSubmit = () => {
    if (!isAnyAnswerEntered) {
      alert('অনুগ্রহ করে অন্তত একটি বাক্যের অনুবাদ তৈরি করুন।');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const results: EnglishSubResult[] = items.map((item) => {
          const userAns = (answersMap[item.id] || '').trim();
          const evalResult = evaluateEnglishTranslationOffline(
            item.bengaliSentence,
            item.englishSentence,
            userAns,
            item.marks || 10
          );

          return {
            itemId: item.id,
            itemNum: item.itemNum || 1,
            bengaliSentence: item.bengaliSentence,
            userEnglishAnswer: userAns,
            modelEnglishSentence: item.englishSentence,
            maxMarks: item.marks || 10,
            obtainedMarks: evalResult.obtainedMarks,
            accuracyPercentage: evalResult.accuracyPercentage,
            feedback: evalResult.feedback,
            matchedWords: evalResult.matchedWords,
            missingWords: evalResult.missingWords,
          };
        });

        setSubResults(results);

        const totalObtained = results.reduce((acc, r) => acc + r.obtainedMarks, 0);
        const avgAccuracy = Math.round(
          results.reduce((acc, r) => acc + r.accuracyPercentage, 0) / results.length
        );

        const resultObj: EnglishExamResult = {
          id: 'eng_res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userName: userName,
          setId: set.id,
          setTitle: set.title || set.setName || 'ইংরেজি অনুবাদ সেট',
          subResults: results,
          totalMaxMarks: totalMaxMarks,
          totalObtainedMarks: totalObtained,
          overallAccuracy: avgAccuracy,
          timestamp: new Date().toISOString(),
        };

        onFinishEnglish(resultObj);
      } catch (err) {
        alert('মূল্যায়নে সমস্যা দেখা দিয়েছে। আবার চেষ্টা করুন।');
      } finally {
        setIsSubmitting(false);
      }
    }, 300);
  };

  const totalObtainedMarks = subResults ? subResults.reduce((acc, r) => acc + r.obtainedMarks, 0) : 0;
  const overallAccuracyPct = subResults && subResults.length > 0
    ? Math.round(subResults.reduce((acc, r) => acc + r.accuracyPercentage, 0) / subResults.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Bar Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ফিরে যান</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-black">
            <span>বাক্য সংখ্যা: {toBengaliNumeral(items.length)} টি</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>পূর্ণমান: {toBengaliNumeral(totalMaxMarks)}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
            timeLeftSeconds < 180 ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <Clock className="w-4 h-4" />
            <span>সময়: {formatTimer(timeLeftSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Set Title Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-blue-500/30 text-blue-200 text-xs font-black rounded-lg border border-blue-400/30 flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-blue-300" />
            <span>ইংরেজি অনুবাদ ও বাক্য গঠন</span>
          </span>
          {set.levelNum && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-200 text-xs font-black rounded-lg border border-amber-400/30">
              লেভেল {toBengaliNumeral(set.levelNum)}
            </span>
          )}
          {set.setNum && (
            <span className="px-3 py-1 bg-purple-500/20 text-purple-200 text-xs font-black rounded-lg border border-purple-400/30">
              সেট {toBengaliNumeral(set.setNum)}
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white">
          {set.title || set.setName}
        </h2>
        <p className="text-xs text-blue-200 mt-1 font-medium">
          নিচের বাংলা বাক্যগুলোর জন্য প্রদত্ত এলোমেলো শব্দগুচ্ছ (Word Chips) ট্যাপ করে ইংরেজি বাক্য তৈরি করুন।
        </p>
      </div>

      {/* Questions or Results Display */}
      {!subResults ? (
        <div className="space-y-6">
          {items.map((item, idx) => {
            const scrambledWords = scrambledWordsMap[item.id] || [];
            const selectedIndices = selectedWordIndicesMap[item.id] || [];
            const userSentence = answersMap[item.id] || '';
            const showHints = showHintsMap[item.id] || false;

            return (
              <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 text-xs font-black rounded-lg">
                      বাক্য নম্বর {toBengaliNumeral(item.itemNum || idx + 1)}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed pt-1">
                      বাংলা: <span className="text-blue-900 font-black">{item.bengaliSentence}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.hints && (
                      <button
                        type="button"
                        onClick={() => setShowHintsMap((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{showHints ? 'হিন্টস লুকান' : 'ভোকাভুলারি হিন্টস'}</span>
                      </button>
                    )}

                    <span className="shrink-0 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200">
                      মান: {toBengaliNumeral(item.marks || 10)}
                    </span>
                  </div>
                </div>

                {/* Hints Box */}
                {showHints && item.hints && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl text-xs font-medium space-y-1">
                    <strong className="text-amber-900 block font-bold">💡 শব্দার্থ ও পরামর্শ (Hints):</strong>
                    <p>{item.hints}</p>
                  </div>
                )}

                {/* Constructed English Sentence Display Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-blue-600" />
                      <span>আপনার তৈরি করা ইংরেজি বাক্য:</span>
                    </label>

                    {selectedIndices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleResetWords(item.id)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>শব্দগুলো রিসেট করুন</span>
                      </button>
                    )}
                  </div>

                  {/* Word Chips Selected Box */}
                  <div className="min-h-[56px] p-3 bg-slate-50 border border-slate-300 rounded-2xl flex flex-wrap items-center gap-2">
                    {selectedIndices.length === 0 ? (
                      <span className="text-xs text-slate-400 italic font-medium">
                        নিচের এলোমেলো শব্দগুলোতে ট্যাপ করুন অথবা সরাসরি টাইপ করুন...
                      </span>
                    ) : (
                      selectedIndices.map((chipIdx, posIdx) => (
                        <button
                          key={`${chipIdx}-${posIdx}`}
                          type="button"
                          onClick={() => handleRemoveSelectedWord(item.id, posIdx)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                          title="ট্যাপ করে বাতিল করুন"
                        >
                          <span>{scrambledWords[chipIdx]}</span>
                          <span className="text-[10px] opacity-70">✕</span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Editable textarea backup */}
                  <textarea
                    rows={2}
                    value={userSentence}
                    onChange={(e) => handleDirectInputChange(item.id, e.target.value)}
                    placeholder="অথবা কীবোর্ডে সরাসরি ইংরেজি টাইপ করুন..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Scrambled Word Chips Bank */}
                <div className="p-4 bg-blue-50/60 border border-blue-150 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                      <span>এডমিনের এলোমেলো শব্দগুচ্ছ (ট্যাপ করে সাজান):</span>
                    </span>
                    <span className="text-[11px] font-semibold text-blue-800">
                      অবশিষ্ট: {toBengaliNumeral(scrambledWords.length - selectedIndices.length)} / {toBengaliNumeral(scrambledWords.length)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {scrambledWords.map((word, wIdx) => {
                      const isSelected = selectedIndices.includes(wIdx);

                      return (
                        <button
                          key={wIdx}
                          type="button"
                          disabled={isSelected}
                          onClick={() => handleWordChipClick(item.id, wIdx, word)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-40'
                              : 'bg-white hover:bg-blue-600 hover:text-white text-slate-800 border border-blue-200 shadow-xs active:scale-95'
                          }`}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}

          {/* Submit Action Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg flex items-center justify-between gap-4 sticky bottom-4 z-10">
            <p className="text-xs text-slate-600 font-medium hidden sm:block">
              💡 সকল বাক্যের অনুবাদ সম্পন্ন করে এক ক্লিকে অফলাইন AI মূল্যায়ন পান।
            </p>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isAnyAnswerEntered}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                isSubmitting || !isAnyAnswerEntered
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ইংরেজি অনুবাদ মূল্যায়ন হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>সব উত্তর জমা দিন ও অনুবাদ মূল্যায়ন দেখুন</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        /* Result Evaluation Screen */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            {/* Score Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="px-3.5 py-1 bg-white/20 text-white text-xs font-black rounded-lg">
                  ইংরেজি অনুবাদ মূল্যায়ন সম্পন্ন 🎉
                </span>
                <h3 className="text-2xl sm:text-3xl font-black">
                  মোট নম্বর: {toBengaliNumeral(totalObtainedMarks)} / {toBengaliNumeral(totalMaxMarks)}
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">
                  পরীক্ষার্থী: {userName} • মোট বাক্য: {toBengaliNumeral(subResults.length)} টি
                </p>
              </div>

              {/* Accuracy Badge */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 text-center min-w-[160px] shadow-lg">
                <span className="text-xs font-black text-slate-500 block uppercase tracking-wider">সঠিকতার হার</span>
                <span className="text-3xl sm:text-4xl font-black text-blue-600 block my-1">
                  {toBengaliNumeral(overallAccuracyPct)}%
                </span>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${overallAccuracyPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Per Sentence Breakdown */}
            <div className="space-y-6 pt-2">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>প্রতিটি বাক্যের বিস্তারিত নম্বর ও মডেল অনুবাদ:</span>
              </h4>

              {subResults.map((sr, idx) => {
                const isShowModel = expandedAnswers[sr.itemId] || false;

                return (
                  <div key={sr.itemId || idx} className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                    
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-lg">
                          বাক্য {toBengaliNumeral(sr.itemNum)}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          বাংলা: {sr.bengaliSentence}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-black rounded-lg border border-emerald-300">
                          প্রাপ্ত নম্বর: {toBengaliNumeral(sr.obtainedMarks)} / {toBengaliNumeral(sr.maxMarks)}
                        </span>
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-900 text-xs font-black rounded-lg">
                          সঠিকতা: {toBengaliNumeral(sr.accuracyPercentage)}%
                        </span>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs sm:text-sm text-blue-950 font-medium">
                      <strong className="text-blue-900">ফলাফল মূল্যায়ন:</strong> {sr.feedback}
                    </div>

                    {/* User Answer vs Model English Answer */}
                    <div className="space-y-3 pt-1">
                      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 block">আপনার তৈরি করা ইংরেজি উত্তর:</span>
                        <p className="text-xs sm:text-sm text-slate-900 font-bold leading-relaxed">
                          {sr.userEnglishAnswer || '(কোনো উত্তর প্রদান করা হয়নি)'}
                        </p>
                      </div>

                      {/* Correct Model Answer with Pronunciation Speaker Button */}
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>এডমিনের মডেল ইংরেজি অনুবাদ (Model Answer):</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => speakEnglishSentence(sr.modelEnglishSentence)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="সঠিক উচ্চারণ শুনুন"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>উচ্চারণ শুনুন (Listen)</span>
                          </button>
                        </div>

                        <p className="text-sm font-black text-emerald-950 leading-relaxed tracking-wide">
                          "{sr.modelEnglishSentence}"
                        </p>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs transition-colors cursor-pointer shadow-md"
              >
                ইংরেজি সেটে ফিরে যান
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
