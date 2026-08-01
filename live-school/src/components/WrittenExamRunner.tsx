import React, { useState, useEffect } from 'react';
import { 
  PenTool, ArrowLeft, Clock, Sparkles, Award, BookOpen, 
  CheckCircle2, XCircle, FileText, Check, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { WrittenQuestion, WrittenSubQuestion, WrittenExamResult, WrittenSubResult } from '../types';
import { toBengaliNumeral } from '../utils/storage';
import { evaluateWrittenAnswerOffline } from '../utils/writtenEvaluator';

interface WrittenExamRunnerProps {
  question: WrittenQuestion;
  userName: string;
  onFinishWritten: (result: WrittenExamResult) => void;
  onCancel: () => void;
}

export const WrittenExamRunner: React.FC<WrittenExamRunnerProps> = ({
  question,
  userName,
  onFinishWritten,
  onCancel,
}) => {
  const subQuestions: WrittenSubQuestion[] = 
    question.questions && question.questions.length > 0
      ? question.questions
      : [
          {
            id: 'sq_fallback',
            questionNum: 1,
            questionText: question.questionText || question.title,
            modelAnswer: question.modelAnswer || '',
            marks: question.marks || 10,
            hints: question.hints || '',
          },
        ];

  const totalMaxMarks = subQuestions.reduce((acc, q) => acc + (q.marks || 10), 0);

  // Map of subQuestion.id -> userAnswer text
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subResults, setSubResults] = useState<WrittenSubResult[] | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState((question.timeLimitMinutes || 20) * 60);

  // Countdown timer
  useEffect(() => {
    if (subResults) return; // Stop timer once evaluated
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

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswersMap((prev) => ({ ...prev, [qId]: val }));
  };

  const isAnyAnswerFilled = subQuestions.some((q) => (answersMap[q.id] || '').trim().length > 0);

  const handleSubmit = () => {
    if (!isAnyAnswerFilled) {
      alert('অনুগ্রহ করে অন্তত একটি প্রশ্নের উত্তর লিখুন।');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const results: WrittenSubResult[] = subQuestions.map((sq) => {
          const userAns = (answersMap[sq.id] || '').trim();
          const evalResult = evaluateWrittenAnswerOffline(
            sq.questionText,
            sq.modelAnswer,
            userAns,
            sq.marks || 10
          );

          return {
            questionId: sq.id,
            questionNum: sq.questionNum || 1,
            questionText: sq.questionText,
            userAnswer: userAns,
            modelAnswer: sq.modelAnswer,
            maxMarks: sq.marks || 10,
            obtainedMarks: evalResult.obtainedMarks,
            matchPercentage: evalResult.matchPercentage,
            feedback: evalResult.feedback,
            keyPointsFound: evalResult.keyPointsFound,
            keyPointsMissing: evalResult.keyPointsMissing,
          };
        });

        setSubResults(results);

        const totalObtained = results.reduce((acc, r) => acc + r.obtainedMarks, 0);
        const avgMatch = Math.round(
          results.reduce((acc, r) => acc + r.matchPercentage, 0) / results.length
        );

        const firstResult = results[0];

        const resultObj: WrittenExamResult = {
          id: 'wr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userName: userName,
          questionId: question.id,
          questionTitle: question.title || question.setName || 'রিটেন পরীক্ষা সেট',
          subResults: results,
          totalMaxMarks: totalMaxMarks,
          totalObtainedMarks: totalObtained,
          overallMatchPercentage: avgMatch,
          // Single question compatibility
          questionText: firstResult.questionText,
          userAnswer: firstResult.userAnswer,
          modelAnswer: firstResult.modelAnswer,
          maxMarks: totalMaxMarks,
          obtainedMarks: totalObtained,
          matchPercentage: avgMatch,
          feedback: `মোট ${toBengaliNumeral(results.length)} টি প্রশ্নের গড় সঠিকতার হার: ${toBengaliNumeral(avgMatch)}%`,
          timestamp: new Date().toISOString(),
        };

        onFinishWritten(resultObj);
      } catch (err: any) {
        alert('মূল্যায়নে সমস্যা দেখা দিয়েছে। আবার চেষ্টা করুন।');
      } finally {
        setIsSubmitting(false);
      }
    }, 300);
  };

  const toggleModelAnswer = (qId: string) => {
    setExpandedAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const totalObtainedMarks = subResults ? subResults.reduce((acc, r) => acc + r.obtainedMarks, 0) : 0;
  const overallMatchPct = subResults && subResults.length > 0
    ? Math.round(subResults.reduce((acc, r) => acc + r.matchPercentage, 0) / subResults.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ফিরে যান</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-black">
            <span>প্রশ্ন সংখ্যা: {toBengaliNumeral(subQuestions.length)} টি</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>মোট পূর্ণমান: {toBengaliNumeral(totalMaxMarks)} মার্কস</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
            timeLeftSeconds < 180 ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <Clock className="w-4 h-4" />
            <span>সময়: {formatTimer(timeLeftSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Set Banner Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-black rounded-lg border border-indigo-400/30">
            ✍️ রিটেন প্রশ্ন সেট ({toBengaliNumeral(subQuestions.length)} টি প্রশ্ন)
          </span>
          {question.levelNum && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-200 text-xs font-black rounded-lg border border-amber-400/30">
              লেভেল {toBengaliNumeral(question.levelNum)}
            </span>
          )}
          {question.setNum && (
            <span className="px-3 py-1 bg-purple-500/20 text-purple-200 text-xs font-black rounded-lg border border-purple-400/30">
              সেট {toBengaliNumeral(question.setNum)}
            </span>
          )}
          {question.categoryName && (
            <span className="px-3 py-1 bg-white/10 text-slate-200 text-xs font-bold rounded-lg">
              {question.categoryName}
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white">
          {question.title || question.setName}
        </h2>
        <p className="text-xs text-indigo-200 mt-1 font-medium">
          নিচের প্রশ্নগুলোর উত্তর আলাদা বক্সগুলোতে টাইপ করুন এবং শেষে জমা দিন।
        </p>
      </div>

      {/* Questions & Answer Inputs or Results */}
      {!subResults ? (
        <div className="space-y-6">
          {subQuestions.map((sq, idx) => {
            const ansText = answersMap[sq.id] || '';
            const wCount = ansText.trim() ? ansText.trim().split(/\s+/).length : 0;
            const cCount = ansText.length;

            return (
              <div key={sq.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                {/* Question Badge & Title */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-900 text-xs font-black rounded-lg">
                      প্রশ্ন নম্বর {toBengaliNumeral(sq.questionNum || idx + 1)}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed pt-1">
                      {sq.questionText}
                    </h3>
                  </div>
                  <span className="shrink-0 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200">
                    পূর্ণমান: {toBengaliNumeral(sq.marks || 10)}
                  </span>
                </div>

                {sq.hints && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2 font-medium">
                    <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span><strong>হিন্টস/পরামর্শ:</strong> {sq.hints}</span>
                  </div>
                )}

                {/* Answer Text Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                      <span>আপনার উত্তর টাইপ করুন:</span>
                    </label>
                    <div className="text-[11px] font-semibold text-slate-500 space-x-2">
                      <span>শব্দ: <strong>{toBengaliNumeral(wCount)}</strong></span>
                      <span>•</span>
                      <span>অক্ষর: <strong>{toBengaliNumeral(cCount)}</strong></span>
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    value={ansText}
                    onChange={(e) => handleAnswerChange(sq.id, e.target.value)}
                    placeholder={`প্রশ্ন ${toBengaliNumeral(sq.questionNum || idx + 1)}-এর উত্তর এখানে বিস্তারিত লিখুন...`}
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium leading-relaxed resize-y"
                  />
                </div>
              </div>
            );
          })}

          {/* Global Submit Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg flex items-center justify-between gap-4 sticky bottom-4 z-10">
            <p className="text-xs text-slate-600 font-medium hidden sm:block">
              💡 সকল প্রশ্নের উত্তর সম্পূর্ণ করার পর এক ক্লিকে অফলাইন AI মূল্যায়ন পান।
            </p>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isAnyAnswerFilled}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                isSubmitting || !isAnyAnswerFilled
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>সেটের সকল উত্তর মূল্যায়ন হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>সকল উত্তর জমা দিন ও ফলাফল দেখুন ({toBengaliNumeral(subQuestions.length)} টি প্রশ্ন)</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Evaluation Results Card */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            {/* Total Score Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="px-3.5 py-1 bg-white/20 text-white text-xs font-black rounded-lg">
                  লিখিত পরীক্ষা মূল্যায়ন সম্পন্ন 🎉
                </span>
                <h3 className="text-2xl sm:text-3xl font-black">
                  মোট নম্বর: {toBengaliNumeral(totalObtainedMarks)} / {toBengaliNumeral(totalMaxMarks)}
                </h3>
                <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                  পরীক্ষার্থী: {userName} • মোট প্রশ্ন: {toBengaliNumeral(subResults.length)} টি
                </p>
              </div>

              {/* Overall Match Percentage */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 text-center min-w-[160px] shadow-lg">
                <span className="text-xs font-black text-slate-500 block uppercase tracking-wider">গড় সঠিকতার হার</span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-600 block my-1">
                  {toBengaliNumeral(overallMatchPct)}%
                </span>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${overallMatchPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Per Question Result Breakdown */}
            <div className="space-y-6 pt-2">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>প্রতিটি প্রশ্নের বিস্তারিত নম্বর ও উত্তর বিশ্লেষণ:</span>
              </h4>

              {subResults.map((sr, idx) => {
                const isShowModel = expandedAnswers[sr.questionId] || false;

                return (
                  <div key={sr.questionId || idx} className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                    
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg">
                          প্রশ্ন {toBengaliNumeral(sr.questionNum)}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {sr.questionText}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-black rounded-lg border border-emerald-300">
                          প্রাপ্ত নম্বর: {toBengaliNumeral(sr.obtainedMarks)} / {toBengaliNumeral(sr.maxMarks)}
                        </span>
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-900 text-xs font-black rounded-lg">
                          সঠিকতা: {toBengaliNumeral(sr.matchPercentage)}%
                        </span>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs sm:text-sm text-indigo-950 font-medium">
                      <strong className="text-indigo-800">মডেল ফিডব্যাক:</strong> {sr.feedback}
                    </div>

                    {/* Points Found & Missing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                        <div className="font-bold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>উপস্থিত প্রধান পয়েন্টসমূহ:</span>
                        </div>
                        {sr.keyPointsFound && sr.keyPointsFound.length > 0 ? (
                          <ul className="space-y-0.5 text-emerald-950 font-medium">
                            {sr.keyPointsFound.map((pt, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-500 italic">কোনো প্রধান শব্দ মেলেনি।</span>
                        )}
                      </div>

                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                        <div className="font-bold text-rose-900 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>অনুপস্থিত তথ্য:</span>
                        </div>
                        {sr.keyPointsMissing && sr.keyPointsMissing.length > 0 ? (
                          <ul className="space-y-0.5 text-rose-950 font-medium">
                            {sr.keyPointsMissing.map((pt, i) => (
                              <li key={i}>• {pt}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-700 font-bold">সকল মূল তথ্য বিদ্যমান! 👍</span>
                        )}
                      </div>
                    </div>

                    {/* User Answer vs Model Answer */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 block">আপনার দেওয়া উত্তর:</span>
                        <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                          {sr.userAnswer || '(কোনো উত্তর প্রদান করা হয়নি)'}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleModelAnswer(sr.questionId)}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer pt-1"
                      >
                        {isShowModel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{isShowModel ? 'সঠিক উত্তরের ব্যাখ্যা লুকান' : 'এডমিনের সঠিক উত্তরের ব্যাখ্যা দেখুন'}</span>
                      </button>

                      {isShowModel && (
                        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs sm:text-sm text-amber-950 font-medium space-y-1">
                          <span className="font-black text-amber-900 flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-amber-700" />
                            <span>এডমিনের আদর্শ উত্তর / ব্যাখ্যা:</span>
                          </span>
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {sr.modelAnswer}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition-colors cursor-pointer shadow-md"
              >
                রিটেন প্রশ্ন সেটে ফিরে যান
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
