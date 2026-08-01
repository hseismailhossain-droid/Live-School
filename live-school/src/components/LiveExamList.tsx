import React, { useState, useEffect } from 'react';
import { Radio, Calendar, Clock, AlertTriangle, CheckCircle, Trophy, Play, ArrowLeft } from 'lucide-react';
import { Category, LiveExam, Question, QuizResult } from '../types';
import { toBengaliNumeral } from '../utils/storage';

interface LiveExamListProps {
  exams: LiveExam[];
  categories: Category[];
  questions: Question[];
  results: QuizResult[];
  onStartExam: (exam: LiveExam) => void;
  onBack: () => void;
}

export const LiveExamList: React.FC<LiveExamListProps> = ({
  exams = [],
  categories = [],
  questions = [],
  results = [],
  onStartExam,
  onBack,
}) => {
  const safeExams = exams || [];
  const safeCategories = categories || [];
  const safeQuestions = questions || [];
  const safeResults = results || [];

  const [now, setNow] = useState(new Date());

  // Update clock every second for countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine Live Exam status based on current date & time
  const getExamStatus = (exam: LiveExam) => {
    const startDateTime = new Date(`${exam.startDate}T${exam.startTime}:00`);
    const endDateTime = new Date(`${exam.endDate}T${exam.endTime}:59`);

    if (now < startDateTime) return 'upcoming';
    if (now >= startDateTime && now <= endDateTime) return 'live';
    return 'ended';
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.nameBn || 'জব প্রস্তুতি';
  };

  // Format Date for display
  const formatDateBn = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      return `${toBengaliNumeral(parts[2])}/${toBengaliNumeral(parts[1])}/${toBengaliNumeral(parts[0])}`;
    }
    return dateStr;
  };

  // Calculate Countdown
  const getCountdownString = (targetDate: Date) => {
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return 'শুরু হয়েছে';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return `${toBengaliNumeral(hours)} ঘণ্টা ${toBengaliNumeral(mins)} মিনিট ${toBengaliNumeral(secs)} সেকেন্ড`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white rounded-3xl p-6 sm:p-8 border border-rose-900 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>মূল পেজে ফিরুন</span>
          </button>

          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-rose-500 animate-pulse shrink-0" />
            <h1 className="text-2xl font-black tracking-tight">
              🔴 লাইভ পরীক্ষা সেন্টার
            </h1>
          </div>
          <p className="text-xs text-rose-200 mt-1">
            নির্দিষ্ট তারিখ ও টাইমিং অনুযায়ী নির্ধারিত লাইভ পরীক্ষাগুলিতে অংশগ্রহণ করুন।
          </p>
        </div>

        <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 text-center shrink-0">
          <span className="text-[10px] text-rose-200 block uppercase font-bold">বর্তমান সময়</span>
          <span className="text-lg font-mono font-bold text-amber-300">
            {now.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Exam Cards Grid */}
      {safeExams.length > 0 ? (
        <div className="space-y-4">
          {safeExams.map((exam) => {
            const status = getExamStatus(exam);
            const catName = getCategoryName(exam.categoryId);
            const availableQCount = safeQuestions.filter((q) => q.categoryId === exam.categoryId).length;
            const startDateTime = new Date(`${exam.startDate}T${exam.startTime}:00`);

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-3xl p-6 border shadow-xs transition-all space-y-4 ${
                  status === 'live'
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {status === 'live' && (
                      <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        🔴 সরাসরি চলমান
                      </span>
                    )}

                    {status === 'upcoming' && (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1">
                        ⏳ আসন্ন পরীক্ষা
                      </span>
                    )}

                    {status === 'ended' && (
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1">
                        ✅ পরীক্ষা সম্পন্ন
                      </span>
                    )}

                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                      {catName}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>তারিখ: {formatDateBn(exam.startDate)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {exam.instructions || exam.description}
                  </p>
                </div>

                {/* Exam Meta Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">সময়সূচী</span>
                    <span className="font-bold text-slate-800">
                      {toBengaliNumeral(exam.startTime)} - {toBengaliNumeral(exam.endTime)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">পরীক্ষার সময়সীমা</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-600" />
                      {toBengaliNumeral(exam.durationMinutes)} মিনিট
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">নেগেটিভ মার্ক</span>
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      -{toBengaliNumeral(exam.negativeMarking)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">মোট প্রশ্ন</span>
                    <span className="font-bold text-emerald-700">
                      {toBengaliNumeral(Math.min(exam.questionCount, availableQCount || exam.questionCount))} টি
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {status === 'upcoming' && (
                    <div className="text-xs font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>পরীক্ষা শুরু হতে বাকি: {getCountdownString(startDateTime)}</span>
                    </div>
                  )}

                  {status === 'live' && (
                    <button
                      onClick={() => onStartExam(exam)}
                      className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>লাইভ পরীক্ষায় অংশগ্রহণ করুন</span>
                    </button>
                  )}

                  {status === 'ended' && (
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>এই পরীক্ষার নির্দিষ্ট সময় পার হয়েছে।</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 space-y-3 border border-slate-200">
          <Radio className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">কোনো লাইভ পরীক্ষা শিডিউল করা নেই</h3>
          <p className="text-xs text-slate-500">এডমিন প্যানেল থেকে নতুন লাইভ পরীক্ষা শিডিউল করা হলে এখানে দেখা যাবে।</p>
        </div>
      )}

    </div>
  );
};
