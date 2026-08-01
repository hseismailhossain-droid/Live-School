import React, { useState } from 'react';
import { 
  Award, Trophy, Medal, Search, Clock, ArrowLeft, Filter, Download, Trash2, Calendar 
} from 'lucide-react';
import { QuizResult } from '../types';
import { toBengaliNumeral } from '../utils/storage';

interface LeaderboardViewProps {
  results: QuizResult[];
  onBackHome: () => void;
  isAdmin?: boolean;
  onClearLeaderboard?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  results = [],
  onBackHome,
  isAdmin = false,
  onClearLeaderboard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const safeResults = results || [];
  const filteredResults = safeResults.filter((r) => {
    const matchName = r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.levelName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategoryFilter === 'all' || r.categoryId === selectedCategoryFilter;
    return matchName && matchCat;
  });

  const exportToCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = ['র‍্যাংক,নাম,ক্যাটাগরি,লেভেল,স্কোর,মোট প্রশ্ন,সময়,তারিখ\n'];
    const rows = filteredResults.map((r, i) => 
      `"${i + 1}","${r.userName}","${r.categoryName}","${r.levelName}","${r.finalScore}","${r.maxPossibleScore}","${r.timeSpentFormatted}","${new Date(r.timestamp).toLocaleDateString()}"`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_quiz_leaderboard_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ফিরে যান</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>অংশগ্রহণকারীদের স্কোরবোর্ড ও ফলাফল</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            এখানে পরীক্ষার্থীদের অর্জিত মার্কস, লেভেল এবং সময় দেখা যাবে।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {results.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>রিপোর্ট এক্সপোর্ট (CSV)</span>
            </button>
          )}

          {isAdmin && onClearLeaderboard && (
            <button
              onClick={onClearLeaderboard}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>রিসেট করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="পরীক্ষার্থীর নাম বা লেভেলের নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">সকল ক্যাটাগরি</option>
            <option value="bcs">বিসিএস প্রস্তুতি</option>
            <option value="bank">ব্যাংক জব প্রস্তুতি</option>
            <option value="primary_ntrca">প্রাইমারি ও এনটিআরসিএ</option>
            <option value="it_computer">আইটি ও তথ্যপ্রযুক্তি</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Award className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-700 text-base">কোনো কুইজ রেকর্ড পাওয়া যায়নি</h3>
            <p className="text-xs">পরীক্ষায় অংশ নিলে স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">র‍্যাংক</th>
                  <th className="py-3.5 px-4">পরীক্ষার্থীর নাম</th>
                  <th className="py-3.5 px-4">পরীক্ষা ও লেভেলের নাম</th>
                  <th className="py-3.5 px-4 text-center">অর্জিত স্কোর</th>
                  <th className="py-3.5 px-4">কতো মিনিটে</th>
                  <th className="py-3.5 px-4 text-right">তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredResults.map((item, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Rank with Trophy */}
                      <td className="py-4 px-4 text-center">
                        {rank === 1 ? (
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-black flex items-center justify-center mx-auto shadow-xs border border-amber-300">
                            🥇
                          </div>
                        ) : rank === 2 ? (
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black flex items-center justify-center mx-auto border border-slate-300">
                            🥈
                          </div>
                        ) : rank === 3 ? (
                          <div className="w-7 h-7 rounded-full bg-amber-800/10 text-amber-900 font-black flex items-center justify-center mx-auto border border-amber-800/30">
                            🥉
                          </div>
                        ) : (
                          <span className="font-bold text-slate-500">
                            {toBengaliNumeral(rank)}
                          </span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {item.userName.charAt(0).toUpperCase()}
                          </div>
                          <span>{item.userName}</span>
                        </div>
                      </td>

                      {/* Category & Level */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.categoryName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.levelName}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-block px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-black border border-emerald-200">
                          {toBengaliNumeral(item.finalScore)} / {toBengaliNumeral(item.maxPossibleScore)}
                        </div>
                      </td>

                      {/* Time Spent */}
                      <td className="py-4 px-4 text-slate-700 text-xs">
                        <div className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.timeSpentFormatted}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-right text-xs text-slate-500">
                        {new Date(item.timestamp).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
