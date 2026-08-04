import React, { useState } from 'react';
import { Radio, PlusCircle, Trash2, Calendar, Clock, AlertTriangle, Check, ShieldCheck, FileText, Sparkles, X, ListOrdered, HelpCircle } from 'lucide-react';
import { Category, LiveExam, Question } from '../../types';
import { toBengaliNumeral } from '../../utils/storage';
import { parseBulkQuestionsText } from '../../utils/bulkParser';

interface LiveExamManagerProps {
  categories: Category[];
  questions: Question[];
  exams: LiveExam[];
  onAddExam: (exam: LiveExam) => void;
  onDeleteExam: (examId: string) => void;
  onAddQuestion?: (q: Question) => void;
  onBulkAddQuestions?: (qs: Question[]) => void;
  onDeleteQuestion?: (qId: string) => void;
  onSwitchTab?: (tab: 'single' | 'bulk' | 'ai' | 'bank') => void;
}

export const LiveExamManager: React.FC<LiveExamManagerProps> = ({
  categories = [],
  questions = [],
  exams = [],
  onAddExam,
  onDeleteExam,
  onAddQuestion,
  onBulkAddQuestions,
  onDeleteQuestion,
  onSwitchTab,
}) => {
  const safeCategories = categories || [];
  const safeQuestions = questions || [];
  const safeExams = exams || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(safeCategories[0]?.id || 'job_prep');
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState('23:59');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [passPercentage, setPassPercentage] = useState(50);
  const [questionCount, setQuestionCount] = useState(10);
  const [instructions, setInstructions] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- Selected Exam Question Modal/Drawer State ---
  const [managingExam, setManagingExam] = useState<LiveExam | null>(null);
  const [examQTab, setExamQTab] = useState<'list' | 'single' | 'bulk' | 'ai'>('list');

  // Single Question for Live Exam Form State
  const [qText, setQText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [singleAddedMsg, setSingleAddedMsg] = useState('');

  // Bulk for Live Exam State
  const [bulkText, setBulkText] = useState('');
  const [bulkStatus, setBulkStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // AI for Live Exam State
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('অনুগ্রহ করে পরীক্ষার শিরোনাম লিখুন।');
      return;
    }

    const newExam: LiveExam = {
      id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      description: description.trim() || 'বিশেষ লাইভ পরীক্ষা',
      categoryId,
      startDate,
      startTime,
      endDate,
      endTime,
      durationMinutes: Number(durationMinutes),
      negativeMarking: Number(negativeMarking),
      passPercentage: Number(passPercentage),
      questionCount: Number(questionCount),
      instructions: instructions.trim() || 'সকল উত্তর সাবধানে নির্বাচন করুন। ভুল উত্তরের জন্য নেগেটিভ মার্ক প্রযোজ্য।',
      createdAt: new Date().toISOString(),
      status: 'upcoming',
    };

    onAddExam(newExam);

    // Reset Form
    setTitle('');
    setDescription('');
    setInstructions('');
    setSuccessMsg('নতুন লাইভ পরীক্ষা সফলভাবে শিডিউল করা হয়েছে! 🔴');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Add Single Question to specific Live Exam
  const handleAddSingleToExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingExam || !onAddQuestion) return;
    if (!qText.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim() || !opt4.trim()) {
      alert('প্রশ্ন এবং ৪টি বিকল্পই সঠিকভাবে নির্বাচন করুন।');
      return;
    }

    const newQ: Question = {
      id: 'q_live_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      categoryId: managingExam.categoryId,
      levelId: managingExam.id,
      examId: managingExam.id,
      questionType: 'live_exam',
      questionText: qText.trim(),
      options: [opt1.trim(), opt2.trim(), opt3.trim(), opt4.trim()],
      correctAnswerIndex: correctIdx,
      explanation: explanation.trim() || 'কোনো অতিরিক্ত ব্যাখ্যা দেওয়া হয়নি।',
      points: 1,
    };

    onAddQuestion(newQ);
    setQText('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setOpt4('');
    setExplanation('');
    setSingleAddedMsg('লাইভ পরীক্ষার জন্য ১টি প্রশ্ন যুক্ত হয়েছে! 🎉');
    setTimeout(() => setSingleAddedMsg(''), 3000);
  };

  // Bulk Add to Live Exam
  const handleBulkAddToExam = () => {
    if (!managingExam || !onBulkAddQuestions || !bulkText.trim()) return;
    const { questions: parsed, errorMsg } = parseBulkQuestionsText(
      bulkText,
      managingExam.categoryId,
      managingExam.id
    );

    if (errorMsg || parsed.length === 0) {
      setBulkStatus({ success: false, msg: errorMsg || 'প্রশ্ন পার্স করতে ব্যর্থ হয়েছে।' });
      return;
    }

    // Attach examId and questionType to all parsed questions
    const examQuestions = parsed.map((q) => ({
      ...q,
      examId: managingExam.id,
      questionType: 'live_exam' as const,
    }));

    onBulkAddQuestions(examQuestions);
    setBulkStatus({
      success: true,
      msg: `সফলভাবে ${toBengaliNumeral(examQuestions.length)} টি প্রশ্ন এই লাইভ পরীক্ষায় যোগ করা হয়েছে!`,
    });
    setBulkText('');
  };

  // Generate AI Questions for Live Exam
  const handleAiGenerateForExam = async () => {
    if (!managingExam || !onBulkAddQuestions || !aiTopic.trim()) {
      setAiError('টপিক বা বিষয় লিখুন।');
      return;
    }

    setIsAiGenerating(true);
    setAiError('');

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          categoryId: managingExam.categoryId,
          levelId: managingExam.id,
          count: aiCount,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('সার্ভার থেকে সঠিক রেসপন্স পাওয়া যায়নি। Vercel/Hosting এ GEMINI_API_KEY সেট করা আছে কিনা এবং /api/generate-questions এন্ডপয়েন্ট কাজ করছে কিনা চেক করুন।');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI প্রশ্ন তৈরি ব্যর্থ হয়েছে।');
      }

      const generated: Question[] = (data.questions || []).map((q: any) => ({
        ...q,
        examId: managingExam.id,
        questionType: 'live_exam' as const,
      }));

      onBulkAddQuestions(generated);
      alert(`মোট ${toBengaliNumeral(generated.length)} টি AI প্রশ্ন সরাসরি এই লাইভ পরীক্ষায় যুক্ত করা হয়েছে!`);
      setAiTopic('');
      setExamQTab('list');
    } catch (err: any) {
      setAiError(err.message || 'AI এপিআই এ সমস্যা দেখা দিয়েছে।');
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
            <span>লাইভ পরীক্ষা শিডিউল ও সরাসরি প্রশ্ন যোগ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            নির্দিষ্ট তারিখ, সময় ও প্রশ্ন সংখ্যা সেট করে লাইভ পরীক্ষা শিডিউল করুন এবং সরাসরি প্রশ্ন নির্বাচন ও আপলোড করুন।
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 text-xs font-bold rounded-2xl border border-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Notice Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl border border-rose-200 text-rose-950 space-y-2">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-rose-950">
              🔴 লাইভ পরীক্ষার প্রশ্ন ব্যবস্থা (Dedicated Live Questions):
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
              লাইভ পরীক্ষাগুলো সাধারণ লেভেল কুইজ থেকে সম্পূর্ণ আলাদা। প্রতিটা লাইভ পরীক্ষার নিচে <strong>"➕ প্রশ্ন ম্যানেজ করুন"</strong> বাটনে ক্লিক করে নির্দিষ্ট পরীক্ষার জন্য এক্সক্লুসিভ প্রশ্ন যুক্ত বা তৈরি করতে পারবেন।
            </p>
          </div>
        </div>
      </div>

      {/* Create Live Exam Form */}
      <form onSubmit={handleCreateExam} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-indigo-600" />
          <span>১. নতুন লাইভ পরীক্ষা শিডিউল করুন</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">পরীক্ষার নাম (Title):</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ৪০তম বিসিএস স্পেশাল মডেল টেস্ট - ২০২৬"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">বিষয় / ক্যাটাগরি:</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameBn}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">প্রয়োজনীয় প্রশ্নের সংখ্যা:</label>
            <input
              type="number"
              min="1"
              max="200"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">শুরু হবার তারিখ (Start Date):</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">শুরু হবার সময় (Start Time):</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">শেষ হবার তারিখ (End Date):</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">শেষ হবার সময় (End Time):</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">পরীক্ষার সময়সীমা (মিনিটে):</label>
            <input
              type="number"
              min="1"
              max="180"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ভুল উত্তরের নেগেটিভ মার্ক:</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={negativeMarking}
              onChange={(e) => setNegativeMarking(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">বিশেষ নির্দেশনা (Instructions):</label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="পরীক্ষার্থীদের জন্য পরীক্ষা বিষয়ক বিশেষ নির্দেশনা..."
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Radio className="w-4 h-4 text-white animate-pulse" />
          <span>লাইভ পরীক্ষা শিডিউল করুন</span>
        </button>
      </form>

      {/* Scheduled Exams List */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="font-bold text-slate-900 text-sm">
          ২. শিডিউলকৃত লাইভ পরীক্ষা ও সরাসরি প্রশ্ন প্রস্তুতকরণ ({toBengaliNumeral(exams.length)} টি):
        </h3>

        {safeExams.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
            এখনো কোনো লাইভ পরীক্ষা শিডিউল করা হয়নি। উপরে ফরম থেকে নতুন একটি লাইভ পরীক্ষা তৈরি করুন।
          </div>
        ) : (
          safeExams.map((ex) => {
            const examQs = safeQuestions.filter((q) => q.examId === ex.id || (q.questionType === 'live_exam' && q.levelId === ex.id));
            const isSelected = managingExam?.id === ex.id;

            return (
              <div
                key={ex.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  isSelected
                    ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-500/20 shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-rose-600 text-white font-black rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        🔴 লাইভ পরীক্ষা
                      </span>
                      <span className="font-black text-slate-900 text-base">{ex.title}</span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-1">
                      <span>📅 {ex.startDate} হতে {ex.endDate}</span>
                      <span>⏰ {toBengaliNumeral(ex.startTime)} - {toBengaliNumeral(ex.endTime)}</span>
                      <span>⏱️ {toBengaliNumeral(ex.durationMinutes)} মিনিট</span>
                      <span>⚠️ নেগেটিভ: -{toBengaliNumeral(ex.negativeMarking)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (isSelected) {
                          setManagingExam(null);
                        } else {
                          setManagingExam(ex);
                          setExamQTab('list');
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        isSelected
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isSelected ? 'প্রশ্ন ম্যানেজার বন্ধ করুন' : '➕ এই পরীক্ষার প্রশ্ন ম্যানেজ করুন'}</span>
                    </button>

                    <button
                      onClick={() => onDeleteExam(ex.id)}
                      className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                      title="লাইভ পরীক্ষা মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Count Status */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-700">
                    সংযুক্ত প্রশ্ন: <span className="text-rose-600 font-extrabold text-sm">{toBengaliNumeral(examQs.length)}</span> / {toBengaliNumeral(ex.questionCount)} টি
                  </span>
                  {examQs.length < ex.questionCount && (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 font-medium">
                      ⚠️ আরও {toBengaliNumeral(ex.questionCount - examQs.length)} টি প্রশ্ন দিলে সম্পূর্ণ হবে
                    </span>
                  )}
                  {examQs.length >= ex.questionCount && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-bold">
                      ✅ প্রশ্ন পূর্ণাঙ্গ তৈরি রয়েছে
                    </span>
                  )}
                </div>

                {/* Embedded Question Manager Drawer */}
                {isSelected && (
                  <div className="mt-4 p-5 bg-white rounded-2xl border border-rose-200 shadow-inner space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-rose-600" />
                        <h4 className="font-bold text-slate-900 text-sm">
                          [{ex.title}] - লাইভ প্রশ্ন প্যানেল
                        </h4>
                      </div>

                      {/* Manager Subtabs */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setExamQTab('list')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            examQTab === 'list' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          📋 প্রশ্ন তালিকা ({toBengaliNumeral(examQs.length)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamQTab('single')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            examQTab === 'single' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          ➕ একক প্রশ্ন
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamQTab('bulk')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            examQTab === 'bulk' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          📄 বাল্ক পেস্ট
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamQTab('ai')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            examQTab === 'ai' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          ✨ AI জেনারেটর
                        </button>
                      </div>
                    </div>

                    {/* SUBTAB 1: Attached Questions List */}
                    {examQTab === 'list' && (
                      <div className="space-y-3">
                        {examQs.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                            এই লাইভ পরীক্ষায় এখনো কোনো এক্সক্লুসিভ প্রশ্ন যোগ করা হয়নি। উপরের <strong>"একক প্রশ্ন"</strong>, <strong>"বাল্ক পেস্ট"</strong> বা <strong>"AI জেনারেটর"</strong> ব্যবহার করে প্রশ্ন যোগ করুন।
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {examQs.map((q, idx) => (
                              <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900">
                                    {toBengaliNumeral(idx + 1)}. {q.questionText}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className={oIdx === q.correctAnswerIndex ? 'font-bold text-emerald-700' : ''}>
                                        ({toBengaliNumeral(oIdx + 1)}) {opt} {oIdx === q.correctAnswerIndex ? '✓' : ''}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {onDeleteQuestion && (
                                  <button
                                    onClick={() => onDeleteQuestion(q.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer shrink-0"
                                    title="প্রশ্নটি মুছুন"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 2: Single Add */}
                    {examQTab === 'single' && (
                      <form onSubmit={handleAddSingleToExam} className="space-y-3">
                        {singleAddedMsg && (
                          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300">
                            {singleAddedMsg}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">প্রশ্ন:</label>
                          <input
                            type="text"
                            value={qText}
                            onChange={(e) => setQText(e.target.value)}
                            placeholder="লাইভ পরীক্ষার জন্য প্রশ্ন লিখুন..."
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">অপশন ১:</label>
                            <input
                              type="text"
                              value={opt1}
                              onChange={(e) => setOpt1(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">অপশন ২:</label>
                            <input
                              type="text"
                              value={opt2}
                              onChange={(e) => setOpt2(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">অপশন ৩:</label>
                            <input
                              type="text"
                              value={opt3}
                              onChange={(e) => setOpt3(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">অপশন ৪:</label>
                            <input
                              type="text"
                              value={opt4}
                              onChange={(e) => setOpt4(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">সঠিক উত্তর:</label>
                            <select
                              value={correctIdx}
                              onChange={(e) => setCorrectIdx(Number(e.target.value))}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
                            >
                              <option value={0}>অপশন ১</option>
                              <option value={1}>অপশন ২</option>
                              <option value={2}>অপশন ৩</option>
                              <option value={3}>অপশন ৪</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">উত্তর ব্যাখ্যা:</label>
                            <input
                              type="text"
                              value={explanation}
                              onChange={(e) => setExplanation(e.target.value)}
                              placeholder="সঠিক উত্তরের ব্যাখ্যা..."
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          + এই লাইভ পরীক্ষায় প্রশ্নটি সেভ করুন
                        </button>
                      </form>
                    )}

                    {/* SUBTAB 3: Bulk Paste */}
                    {examQTab === 'bulk' && (
                      <div className="space-y-3">
                        {bulkStatus && (
                          <div className={`p-3 text-xs font-bold rounded-xl border ${
                            bulkStatus.success ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {bulkStatus.msg}
                          </div>
                        )}

                        <p className="text-[11px] text-slate-600">
                          নিচে টেক্সট ফরম্যাটে একাধিক প্রশ্ন ও উত্তর পেস্ট করে সরাসরি এই লাইভ পরীক্ষায় যুক্ত করুন:
                        </p>

                        <textarea
                          rows={6}
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          placeholder={`১. বঙ্গবন্ধুর ঐতিহাসিক ৭ই মার্চের ভাষণ কোন ময়দানে দেওয়া হয়?
ক. সোহরাওয়ার্দী উদ্যান
খ. রমনা পার্ক
গ. ধানমন্ডি
ঘ. পল্টন ময়দান
উত্তর: ক
ব্যাখ্যা: রেসকোর্স ময়দান (বর্তমান সোহরাওয়ার্দী উদ্যান)।`}
                          className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                        />

                        <button
                          type="button"
                          onClick={handleBulkAddToExam}
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          📄 ইম্পোর্ট করে লাইভ পরীক্ষায় সেভ করুন
                        </button>
                      </div>
                    )}

                    {/* SUBTAB 4: AI Generator */}
                    {examQTab === 'ai' && (
                      <div className="space-y-3">
                        {aiError && (
                          <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-300">
                            {aiError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">AI টপিক / বিষয়:</label>
                            <input
                              type="text"
                              value={aiTopic}
                              onChange={(e) => setAiTopic(e.target.value)}
                              placeholder="যেমন: সাম্প্রতিক বিশ্ব ও বাংলাদেশ বিষয়াবলী, প্রাথমিক শিক্ষক নিয়োগ ম্যাথ"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">প্রশ্নের সংখ্যা:</label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={aiCount}
                              onChange={(e) => setAiCount(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAiGenerateForExam}
                          disabled={isAiGenerating}
                          className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-amber-200" />
                          <span>{isAiGenerating ? 'AI প্রশ্ন তৈরি করছে...' : '✨ AI দিয়ে লাইভ প্রশ্ন তৈরি ও সেভ করুন'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

