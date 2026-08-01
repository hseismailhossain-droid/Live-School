import React, { useState } from 'react';
import { 
  Building2, Landmark, GraduationCap, Laptop, BookOpen, Briefcase,
  Clock, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, Layers, Search, Radio, Filter
} from 'lucide-react';
import { Category, LevelInfo, Question, QuizSettings, SocialLinks, BannerSlide } from '../types';
import { toBengaliNumeral } from '../utils/storage';
import { SocialBar } from './SocialBar';
import { BannerSlider } from './BannerSlider';

interface CategoryLevelSelectorProps {
  categories: Category[];
  questions: Question[];
  settings: QuizSettings;
  onSelectLevel: (category: Category, level: LevelInfo) => void;
  userName?: string;
  onOpenNameModal: () => void;
  onGoToLiveExams?: () => void;
  socialLinks?: SocialLinks;
  banners?: BannerSlide[];
}

export const CategoryLevelSelector: React.FC<CategoryLevelSelectorProps> = ({
  categories = [],
  questions = [],
  settings,
  onSelectLevel,
  userName,
  onOpenNameModal,
  onGoToLiveExams,
  socialLinks,
  banners,
}) => {
  const safeCategories = categories || [];
  const safeQuestions = questions || [];
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(safeCategories[0]?.id || 'job_prep');
  const [levelSearch, setLevelSearch] = useState('');

  const activeCategory = safeCategories.find((c) => c.id === selectedCategoryId) || safeCategories[0];

  const getQuestionCount = (catId: string, levelId: string, levelNum?: number) => {
    return safeQuestions.filter((q) => {
      let qLevelNum = 1;
      if (q.levelId) {
        const match = q.levelId.match(/\d+/);
        if (match) qLevelNum = parseInt(match[0], 10);
      }
      return q.levelId === levelId || (levelNum !== undefined && qLevelNum === levelNum);
    }).length;
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className="w-6 h-6" />;
      case 'Building2': return <Building2 className="w-6 h-6" />;
      case 'Landmark': return <Landmark className="w-6 h-6" />;
      case 'GraduationCap': return <GraduationCap className="w-6 h-6" />;
      case 'Laptop': return <Laptop className="w-6 h-6" />;
      default: return <BookOpen className="w-6 h-6" />;
    }
  };

  // Filter levels for the active category
  const activeLevels = (activeCategory?.levels || []).filter((lvl) => {
    if (!levelSearch.trim()) return true;
    const query = levelSearch.trim().toLowerCase();
    return (
      (lvl.levelNumber != null ? String(lvl.levelNumber) : '').includes(query) ||
      (lvl.nameBn || '').toLowerCase().includes(query) ||
      (lvl.description || '').toLowerCase().includes(query)
    );
  }).sort((a, b) => a.levelNumber - b.levelNumber);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Side: Welcome & Action */}
          <div className="space-y-4 flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>LIVE SCHOOL - জব প্রিপারেশন ও কুইজ প্লাটফর্ম</span>
              </span>

              {onGoToLiveExams && (
                <button
                  onClick={onGoToLiveExams}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40 hover:bg-rose-500/30 transition-all cursor-pointer animate-pulse"
                >
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  <span>🔴 লাইভ পরীক্ষা সেন্টার</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug">
              {userName ? (
                <span>স্বাগতম, <span className="text-emerald-400">{userName}</span>! আজ কোন লেভেলে পরীক্ষা দেবেন?</span>
              ) : (
                <span>আপনার স্বপ্নের লাইভ জব প্রস্তুতির সর্বোচ্চ স্মার্ট প্লাটফর্ম</span>
              )}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              লাইভ জব প্রস্তুতির ১ থেকে ১ মিলিয়ন পর্যন্ত আনলিমিটেড লেভেলভিত্তিক স্পেশাল কুইজ ও টাইমড এক্সাম।
            </p>

            {!userName && (
              <div className="pt-2">
                <button
                  onClick={onOpenNameModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <span>আপনার নাম সেট করে কুইজে অংশ নিন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Embedded Banner Slider */}
          {banners && banners.length > 0 && (
            <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0">
              <BannerSlider 
                banners={banners} 
                onNavigateTo={onGoToLiveExams} 
                compact 
                className="border-emerald-500/30 shadow-2xl" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Categories Horizontal Selector Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>ক্যাটাগরি নির্বাচন করুন</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রধান বিষয় ও ক্যাটাগরি বেছে নিন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {safeCategories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            const totalCatQuestions = safeQuestions.filter(q => q.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-900 text-white border-emerald-700 ring-2 ring-emerald-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {getCategoryIcon(cat.iconName)}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {cat.nameBn}
                    </h3>
                    <span className={`text-xs block mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      মোট {toBengaliNumeral(cat.levels.length)} টি লেভেল
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {toBengaliNumeral(totalCatQuestions)} প্রশ্ন
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Levels Section */}
      {activeCategory && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${activeCategory.badgeColor}`}>
                {activeCategory.name}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {activeCategory.nameBn}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {activeCategory.description}
              </p>
            </div>

            {/* Level Quick Filter */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={levelSearch}
                onChange={(e) => setLevelSearch(e.target.value)}
                placeholder="লেভেল নম্বর বা নাম দিয়ে খুঁজুন (যেমন: ১, ২)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 font-medium"
              />
            </div>
          </div>

          {/* Level Cards Grid */}
          {activeLevels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeLevels.map((level) => {
                const questionCount = getQuestionCount(activeCategory.id, level.id, level.levelNumber);
                const timeLimit = level.defaultTimeLimitMinutes || settings.timeLimitMinutes;
                const negMark = level.defaultNegativeMarking || settings.negativeMarkPerWrong;

                return (
                  <div
                    key={level.id}
                    className="bg-slate-50/80 hover:bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-500 transition-all shadow-xs hover:shadow-lg flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                          লেভেল {toBengaliNumeral(level.levelNumber)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                          {toBengaliNumeral(questionCount)} টি প্রশ্ন
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {level.nameBn}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                        {level.description}
                      </p>

                      <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>সময়: {toBengaliNumeral(timeLimit)} মিনিট</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span>ভুল: -{toBengaliNumeral(negMark)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => onSelectLevel(activeCategory, level)}
                        disabled={questionCount === 0}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          questionCount > 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {questionCount > 0 ? (
                          <>
                            <span>কুইজ শুরু করুন</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <span>প্রশ্ন উপলব্ধ নেই</span>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <Filter className="w-8 h-8 text-slate-300 mx-auto" />
              <p>কোনো লেভেল খুঁজে পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      )}

      {/* Feature Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">তাৎক্ষণিক লাল/সবুজ সংকেত</h4>
            <p className="text-xs text-slate-600 mt-0.5">সঠিক উত্তর দিলে সবুজ, ভুল হলে লাল রঙের হাইলাইট ও সঠিক উত্তর দেখানো হয়।</p>
          </div>
        </div>

        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">বিশদ ব্যাখ্যাসহ ফলাফল</h4>
            <p className="text-xs text-slate-600 mt-0.5">প্রতিটি প্রশ্নের সাথে প্রফেশনাল ও নির্ভুল ব্যাখ্যা যুক্ত থাকবে।</p>
          </div>
        </div>

        <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">টাইম ও স্কোরবোর্ড ট্র্যাকিং</h4>
            <p className="text-xs text-slate-600 mt-0.5">কতো মিনিটে কতো স্কোর করেছেন তা প্রতিবার স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।</p>
          </div>
        </div>
      </div>

      {/* Official Social Media Bar */}
      {socialLinks && (
        <div className="pt-2">
          <SocialBar socialLinks={socialLinks} variant="full" />
        </div>
      )}

    </div>
  );
};
