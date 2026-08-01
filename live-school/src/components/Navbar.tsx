import React from 'react';
import { Award, User, Volume2, VolumeX, BookOpenCheck, Settings, Radio, PenTool, Sparkles } from 'lucide-react';
import { UserSession, SocialLinks } from '../types';
import { SocialBar } from './SocialBar';

interface NavbarProps {
  userSession: UserSession | null;
  socialLinks?: SocialLinks;
  onOpenNameModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenAdmin: () => void;
  onGoHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeView: string;
  onGoToLiveExams?: () => void;
  onGoToWrittenExams?: () => void;
  onGoToEnglishExams?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userSession,
  socialLinks,
  onOpenNameModal,
  onOpenLeaderboard,
  onOpenAdmin,
  onGoHome,
  soundEnabled,
  onToggleSound,
  activeView,
  onGoToLiveExams,
  onGoToWrittenExams,
  onGoToEnglishExams,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <button 
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight leading-tight block">
              LIVE SCHOOL
            </span>
            <span className="text-xs font-medium text-emerald-600 block">
              অনলাইন কুইজ ও লার্নিং পোর্টাল
            </span>
          </div>
        </button>

        {/* Right Controls & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Social Links Bar */}
          {socialLinks && (
            <div className="hidden lg:block border-r border-slate-200 pr-2">
              <SocialBar socialLinks={socialLinks} variant="compact" />
            </div>
          )}
          
          {/* Live Exam Direct Button */}
          {onGoToLiveExams && (
            <button
              onClick={onGoToLiveExams}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeView === 'live_exams'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>লাইভ পরীক্ষা</span>
            </button>
          )}

          {/* Written Exam Direct Button */}
          {onGoToWrittenExams && (
            <button
              onClick={onGoToWrittenExams}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeView === 'written_exams'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">রিটেন পরীক্ষা</span>
            </button>
          )}

          {/* English Learning Direct Button */}
          {onGoToEnglishExams && (
            <button
              onClick={onGoToEnglishExams}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeView === 'english_exams' || activeView === 'english_runner'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ইংরেজি শিক্ষা</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeView === 'leaderboard'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'text-slate-700 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">লীডারবোর্ড</span>
          </button>

          {/* User Name Badge / Login Trigger */}
          {userSession ? (
            <div className="flex items-center gap-2">
              {userSession.isAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    activeView === 'admin'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                  }`}
                  title="এডমিন ড্যাশবোর্ড"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">এডমিন ড্যাশবোর্ড</span>
                </button>
              )}

              <button
                onClick={onOpenNameModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                title="নাম পরিবর্তন বা লগ আউট করুন"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                  {userSession.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {userSession.name}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenNameModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>নাম দিন</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
