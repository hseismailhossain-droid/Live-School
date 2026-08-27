import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw, 
  Award, Home, BookOpen, ChevronDown, ChevronUp, Share2, Maximize2 
} from 'lucide-react';
import { QuizResult } from '../types';
import { toBengaliNumeral } from '../utils/storage';
import { ImageViewModal } from './Common/ImageViewModal';

interface QuizResultViewProps {
  result: QuizResult;
  onRetry: () => void;
  onOpenLeaderboard: () => void;
  onGoHome: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  result,
  onRetry,
  onOpenLeaderboard,
  onGoHome,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [viewImageModal, setViewImageModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
  });

  const isPass = result.percentage >= 50;

  useEffect(() => {
    if (isPass) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore confetti errors if blocked
      }
    }
  }, [isPass]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Top Banner Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 border shadow-xl text-center space-y-4 ${
        isPass 
          ? 'bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white border-emerald-800' 
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white border-slate-800'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto shadow-inner border border-white/20">
          <Trophy className={`w-8 h-8 ${isPass ? 'text-amber-400' : 'text-rose-400'}`} />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/20 mb-2">
            {result.categoryName} • {result.levelName}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isPass ? 'অভিনন্দন! আপনি উত্তীর্ণ হয়েছেন 🎉' : 'চেষ্টা অব্যাহত রাখুন! আবার পরীক্ষা দিন 💪'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            পরীক্ষার্থী: <strong className="text-white">{result.userName}</strong>
          </p>
        </div>

        {/* Big Score Display */}
        <div className="inline-flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
          <div className="text-3xl sm:text-5xl font-black text-amber-400 tracking-tight">
            {toBengaliNumeral(result.finalScore)} <span className="text-lg sm:text-2xl font-semibold text-slate-300">/ {toBengaliNumeral(result.maxPossibleScore)}</span>
          </div>
          <span className="text-xs font-bold text-slate-300 mt-1">
            অর্জিত স্কোর ({toBengaliNumeral(result.percentage)}%)
          </span>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>আবার পরীক্ষা দিন</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>লীডারবোর্ড দেখুন</span>
          </button>

          <button
            onClick={onGoHome}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>হোম</span>
          </button>
        </div>
      </div>

      {/* Key Exam Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>সঠিক উত্তর</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {toBengaliNumeral(result.correctCount)} টি
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>ভুল উত্তর</span>
          </div>
          <div className="text-xl font-bold text-rose-600">
            {toBengaliNumeral(result.wrongCount)} টি
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>নেগেটিভ মার্ক কাটা</span>
          </div>
          <div className="text-xl font-bold text-amber-600">
            -{toBengaliNumeral(result.negativeMarksDeducted)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>সময় ব্যয়</span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {result.timeSpentFormatted}
          </div>
        </div>

      </div>

      {/* Answer Review Section with Explanations */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>প্রশ্নের উত্তর ও বিশদ ব্যাখ্যা (Explanation Review)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              নিচের প্রতিটি প্রশ্ন ক্লিক করে আপনার উত্তর ও বিস্তারিত ব্যাখ্যা মিলিয়ে নিন
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {result.answersDetail.map((item, idx) => {
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={item.questionId || idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50 hover:bg-white"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      item.isCorrect
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : item.selectedIndex === null
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {toBengaliNumeral(idx + 1)}
                    </span>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {item.questionText}
                      </h4>

                      {/* Question Diagram thumbnail */}
                      {item.imageUrl && (
                        <div className="mt-2 inline-flex items-center gap-2 p-1.5 bg-teal-50 border border-teal-200 rounded-xl">
                          <img
                            src={item.imageUrl}
                            alt="Question Diagram"
                            className="w-12 h-12 object-contain bg-white rounded-lg border border-teal-200 p-0.5"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewImageModal({
                                isOpen: true,
                                imageUrl: item.imageUrl || '',
                                title: `প্রশ্ন #${toBengaliNumeral(idx + 1)}-এর চিত্র`,
                              });
                            }}
                            className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-800 text-[11px] font-bold rounded-lg border border-teal-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>চিত্র বড় করে দেখুন</span>
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-semibold">
                        {item.isCorrect ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> সঠিক উত্তর (+১)
                          </span>
                        ) : item.selectedIndex === null ? (
                          <span className="text-slate-500">
                            উত্তর দেওয়া হয়নি (০)
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> ভুল উত্তর (-{toBengaliNumeral(result.negativeMarkRate)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 p-1 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Details: All Options & Explanation */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-200/60 bg-white space-y-4">
                    
                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                      {item.options.map((opt, oIdx) => {
                        const isCorrectOption = oIdx === item.correctIndex;
                        const isUserPicked = oIdx === item.selectedIndex;

                        let optClass = 'bg-slate-50 border-slate-200 text-slate-700';

                        if (isCorrectOption) {
                          optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isUserPicked && !isCorrectOption) {
                          optClass = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                          >
                            <span>{toBengaliNumeral(oIdx + 1)}. {opt}</span>
                            {isCorrectOption && (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                                সঠিক উত্তর
                              </span>
                            )}
                            {isUserPicked && !isCorrectOption && (
                              <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">
                                আপনার উত্তর
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                      <div className="font-bold text-emerald-800 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>সঠিক উত্তরের ব্যাখ্যা:</span>
                      </div>
                      <p className="leading-relaxed">
                        {item.explanation || 'কোনো অতিরিক্ত ব্যাখ্যা সংরক্ষিত নেই।'}
                      </p>

                      {/* Explanation Diagram */}
                      {item.explanationImageUrl && (
                        <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                          <img
                            src={item.explanationImageUrl}
                            alt="Explanation Diagram"
                            className="w-14 h-14 object-contain bg-white rounded-lg border border-slate-200 p-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => setViewImageModal({
                              isOpen: true,
                              imageUrl: item.explanationImageUrl || '',
                              title: `প্রশ্ন #${toBengaliNumeral(idx + 1)}-এর সমাধান চিত্র`,
                            })}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>ব্যাখ্যার সমাধান চিত্র বড় করে দেখুন</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
