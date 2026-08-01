import React, { useState } from 'react';
import { 
  PenTool, Search, Award, Clock, ArrowRight, History, BookOpen, 
  CheckCircle2, Sparkles, Filter, ChevronDown, ChevronUp 
} from 'lucide-react';
import { WrittenQuestion, WrittenExamResult } from '../types';
import { toBengaliNumeral } from '../utils/storage';

interface WrittenExamListProps {
  questions: WrittenQuestion[];
  results: WrittenExamResult[];
  onStartWrittenExam: (q: WrittenQuestion) => void;
  onBackHome: () => void;
}

export const WrittenExamList: React.FC<WrittenExamListProps> = ({
  questions = [],
  results = [],
  onStartWrittenExam,
  onBackHome,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const safeQuestions = questions || [];
  const safeResults = results || [];

  // Extract unique levels and sets
  const availableLevels: number[] = (Array.from(new Set(safeQuestions.map((q) => q.levelNum || 1))) as number[]).sort((a, b) => a - b);
  const availableSets = Array.from(new Set(safeQuestions.map((q) => q.setName).filter(Boolean))) as string[];

  const filteredQuestions = safeQuestions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.questionText.toLowerCase().includes(search.toLowerCase()) ||
      (q.categoryName && q.categoryName.toLowerCase().includes(search.toLowerCase())) ||
      (q.setName && q.setName.toLowerCase().includes(search.toLowerCase()));

    const matchesLevel = selectedLevel === 'all' || (q.levelNum || 1) === selectedLevel;
    const matchesSet = selectedSet === 'all' || q.setName === selectedSet;

    return matchesSearch && matchesLevel && matchesSet;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-xl text-indigo-200 text-xs font-black">
              <PenTool className="w-3.5 h-3.5" />
              <span>স্মার্ট রিটেন পরীক্ষা পোর্টাল</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ✍️ লিখিত পরীক্ষা ও স্বয়ংক্রিয় মূল্যায়ন
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl">
              এখানে এডমিনের দেওয়া লিখিত প্রশ্নের উত্তর টাইপ করে জমা দিন। সম্পূর্ণ অফলাইন অ্যালগরিদম এডমিনের সঠিক উত্তরের ব্যাখ্যার সাথে মিলিয়ে ১০০% অফলাইনে তাৎক্ষণিক প্রাপ্ত নম্বর ও ফিডব্যাক প্রদান করবে।
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={onBackHome}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
            >
              ← প্রধান পাতায় ফিরে যান
            </button>
            <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] font-black rounded-xl">
              ⚡ ১০০% অফলাইন দ্রুততম মূল্যায়ন
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'available'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>সক্রিয় লিখিত প্রশ্নসমূহ ({toBengaliNumeral(questions.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>আমার লিখিত পরীক্ষার ফলাফল ({toBengaliNumeral(results.length)})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Available Written Questions */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          
          {/* Search & Level/Set Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="প্রশ্ন বা বিষয় দিয়ে খুঁজুন..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-xs font-bold text-slate-500 shrink-0">লেভেল:</span>
              <button
                onClick={() => setSelectedLevel('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedLevel === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                সব লেভেল
              </button>
              {availableLevels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedLevel === lvl
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  লেভেল {toBengaliNumeral(lvl)}
                </button>
              ))}
            </div>

            {/* Set Filter Dropdown */}
            {availableSets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 shrink-0">প্রশ্ন সেট:</span>
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">সব প্রশ্ন সেট ({availableSets.length})</option>
                  {availableSets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-bold text-sm">কোনো লিখিত প্রশ্ন পাওয়া যায়নি।</p>
              <p className="text-xs text-slate-400">ফিল্টার বা সার্চ পরিবর্তন করে দেখুন অথবা এডমিন প্যানেল থেকে নতুন রিটেন প্রশ্ন যোগ করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuestions.map((q) => {
                const subCount = q.questions && q.questions.length > 0 ? q.questions.length : 1;
                const totalMarks = q.questions && q.questions.length > 0
                  ? q.questions.reduce((acc, item) => acc + (item.marks || 10), 0)
                  : (q.marks || 10);

                return (
                  <div 
                    key={q.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-black rounded-lg border border-indigo-200">
                            {q.categoryName || 'লিখিত পরীক্ষা'}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-black rounded-lg border border-amber-300">
                            লেভেল {toBengaliNumeral(q.levelNum || 1)}
                          </span>
                          <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 text-[11px] font-black rounded-lg border border-purple-300">
                            সেট {toBengaliNumeral(q.setNum || 1)}
                          </span>
                          <span className="px-2.5 py-0.5 bg-sky-100 text-sky-900 text-[11px] font-black rounded-lg border border-sky-300">
                            {toBengaliNumeral(subCount)} টি প্রশ্ন
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <Award className="w-3.5 h-3.5" />
                          <span>মোট {toBengaliNumeral(totalMarks)} মার্কস</span>
                        </div>
                      </div>

                      {q.setName && (
                        <div className="text-[11px] font-bold text-indigo-900 bg-indigo-50/70 p-2 rounded-xl border border-indigo-100 flex items-center gap-1.5">
                          <span>📦 {q.setName}</span>
                        </div>
                      )}

                      <h3 className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {q.title || q.setName}
                      </h3>

                      {/* Sub questions list preview */}
                      {q.questions && q.questions.length > 0 ? (
                        <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          {q.questions.slice(0, 3).map((sq, sIdx) => (
                            <p key={sq.id || sIdx} className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                              • {sq.questionText}
                            </p>
                          ))}
                          {q.questions.length > 3 && (
                            <p className="text-[11px] font-bold text-indigo-600 pt-0.5">
                              + আরও {toBengaliNumeral(q.questions.length - 3)} টি প্রশ্ন আছে...
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {q.questionText}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>সময়সীমা: {toBengaliNumeral(q.timeLimitMinutes || 20)} মিনিট</span>
                      </div>

                      <button
                        onClick={() => onStartWrittenExam(q)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                      >
                        <span>✍️ সেটের পরীক্ষা দিন ({toBengaliNumeral(subCount)}টি প্রশ্ন)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: History & Submission Evaluation Records */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {safeResults.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-bold text-sm">এখনো কোনো লিখিত পরীক্ষা দেওয়া হয়নি।</p>
              <p className="text-xs text-slate-400">সক্রিয় ট্যাব থেকে প্রশ্ন নির্বাচন করে লিখিত উত্তর জমা দিন।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeResults.map((res) => {
                const isExpanded = selectedResultId === res.id;

                return (
                  <div key={res.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div 
                      onClick={() => setSelectedResultId(isExpanded ? null : res.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-black rounded-md">
                            {res.questionTitle}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(res.timestamp).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {res.questionText}
                        </h4>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-slate-500 font-bold block">প্রাপ্ত নম্বর</span>
                          <span className="text-base font-black text-emerald-600">
                            {toBengaliNumeral(res.obtainedMarks)} / {toBengaliNumeral(res.maxMarks)}
                          </span>
                        </div>

                        <div className="p-2 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4 text-xs">
                        
                        {/* Feedback */}
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                          <strong className="text-indigo-900 block font-black">মডেল উত্তর মূল্যায়ন ফিডব্যাক:</strong>
                          <p className="text-slate-800 font-medium">{res.feedback}</p>
                        </div>

                        {/* User Answer vs Model Answer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                            <span className="font-bold text-slate-700 block">আপনার উত্তর:</span>
                            <p className="text-slate-900 whitespace-pre-wrap">{res.userAnswer}</p>
                          </div>

                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                            <span className="font-bold text-amber-900 block">এডমিনের সঠিক উত্তরের ব্যাখ্যা:</span>
                            <p className="text-amber-950 whitespace-pre-wrap">{res.modelAnswer}</p>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
