import React, { useState } from 'react';
import { 
  BookOpen, Clock, ArrowRight, Award, Search, Languages, HelpCircle, Layers, CheckCircle2 
} from 'lucide-react';
import { Category, EnglishQuestionSet, EnglishExamResult } from '../types';
import { toBengaliNumeral } from '../utils/storage';

interface EnglishExamListProps {
  categories: Category[];
  englishSets: EnglishQuestionSet[];
  englishResults: EnglishExamResult[];
  onStartEnglishExam: (set: EnglishQuestionSet) => void;
  onGoHome: () => void;
}

export const EnglishExamList: React.FC<EnglishExamListProps> = ({
  categories = [],
  englishSets = [],
  englishResults = [],
  onStartEnglishExam,
  onGoHome,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const safeSets = englishSets || [];
  const filteredSets = safeSets.filter((s) => {
    if (selectedCategory !== 'all' && s.categoryId !== selectedCategory) return false;
    if (selectedLevel !== 'all' && s.levelNum !== parseInt(selectedLevel, 10)) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (s.title || '').toLowerCase().includes(q);
      const matchSetName = (s.setName || '').toLowerCase().includes(q);
      const matchItems = s.items.some((item) => 
        item.bengaliSentence.toLowerCase().includes(q) || 
        item.englishSentence.toLowerCase().includes(q)
      );
      return matchTitle || matchSetName || matchItems;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/30 text-blue-200 text-xs font-black rounded-lg border border-blue-400/30 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-blue-300" />
                <span>ইংরেজি শিক্ষা ও অনুবাদ চর্চা</span>
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-200 text-xs font-black rounded-lg border border-emerald-400/30">
                স্বয়ংক্রিয় অফলাইন অটো মার্কিং
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              বাংলা থেকে ইংরেজি অনুবাদ ও বাক্য গঠন চর্চা
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              বাংলা বাক্যের সঠিক ইংরেজি অনুবাদ করুন। এডমিন প্রদত্ত মডেল উত্তরের এলোমেলো শব্দগুচ্ছ (Scrambled Word Chips) ট্যাপ করে সাজান অথবা সরাসরি টাইপ করে অটো-মার্কিং ও সঠিক উচ্চারণ শুনুন।
            </p>
          </div>

          <button
            onClick={onGoHome}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/20 cursor-pointer shrink-0"
          >
            কুইজ ক্যাটাগরিতে ফিরে যান
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অনুবাদ প্রশ্ন বা কি-ওয়ার্ড খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-600 shrink-0">লেভেল অনুযায়ী:</span>
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedLevel === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              সকল লেভেল
            </button>

            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl.toString())}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedLevel === lvl.toString()
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                লেভেল {toBengaliNumeral(lvl)}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Question Sets List */}
      {filteredSets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Languages className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">কোনো ইংরেজি প্রশ্ন সেট পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500">অন্য ফিল্টার বা সার্চ টার্ম ব্যবহার করে আবার চেষ্টা করুন, অথবা এডমিন প্যানেল থেকে যোগ করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSets.map((set) => {
            const itemCount = set.items ? set.items.length : 0;
            const totalMarks = set.items ? set.items.reduce((acc, it) => acc + (it.marks || 10), 0) : 0;

            return (
              <div 
                key={set.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-black rounded-lg border border-blue-200">
                        {set.categoryName || 'ইংরেজি অনুবাদ'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-black rounded-lg border border-amber-300">
                        লেভেল {toBengaliNumeral(set.levelNum || 1)}
                      </span>
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 text-[11px] font-black rounded-lg border border-purple-300">
                        সেট {toBengaliNumeral(set.setNum || 1)}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[11px] font-black rounded-lg border border-emerald-300">
                        {toBengaliNumeral(itemCount)} টি বাক্য
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Award className="w-3.5 h-3.5" />
                      <span>পূর্ণমান: {toBengaliNumeral(totalMarks)}</span>
                    </div>
                  </div>

                  <h3 className="font-black text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {set.title || set.setName}
                  </h3>

                  {/* Preview sentences */}
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {set.items.slice(0, 3).map((item, idx) => (
                      <p key={item.id || idx} className="text-xs text-slate-700 font-medium line-clamp-1">
                        <strong className="text-blue-700">{toBengaliNumeral(idx + 1)}.</strong> {item.bengaliSentence}
                      </p>
                    ))}
                    {set.items.length > 3 && (
                      <p className="text-[11px] font-bold text-blue-600 pt-0.5">
                        + আরও {toBengaliNumeral(set.items.length - 3)} টি বাংলা বাক্য রয়েছে...
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>সময়: {toBengaliNumeral(set.timeLimitMinutes || 15)} মিনিট</span>
                  </div>

                  <button
                    onClick={() => onStartEnglishExam(set)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    <span>🔤 অনুবাদ পরীক্ষা দিন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
