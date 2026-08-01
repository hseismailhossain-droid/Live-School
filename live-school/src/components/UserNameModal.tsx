import React, { useState } from 'react';
import { User, Sparkles, Check, X, LogOut, ShieldCheck, Lock } from 'lucide-react';
import { UserSession } from '../types';

interface UserNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession | null;
  onSaveSession: (session: UserSession) => void;
  onAdminTriggered: () => void;
  onLogout?: () => void;
}

export const UserNameModal: React.FC<UserNameModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSaveSession,
  onAdminTriggered,
  onLogout,
}) => {
  const [nameInput, setNameInput] = useState(currentSession?.name || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isAdminTarget = nameInput.trim().toLowerCase() === 'admin@smartquiz.com';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();

    if (!trimmed) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম প্রদান করুন।');
      return;
    }

    const lower = trimmed.toLowerCase();

    // Check if user entered admin email as name
    if (lower === 'admin@smartquiz.com') {
      const passTrimmed = passwordInput.trim();
      if (!passTrimmed) {
        setErrorMsg('অনুগ্রহ করে এডমিন সিক্রেট পাসওয়ার্ড প্রদান করুন।');
        return;
      }

      if (passTrimmed !== 'admin@smartquiz.com') {
        setErrorMsg('ভুল পাসওয়ার্ড! সঠিক এডমিন পাসওয়ার্ড প্রদান করুন।');
        return;
      }

      // Password matched correctly! Grant Admin Access
      const adminSession: UserSession = {
        name: 'LIVE SCHOOL (Admin)',
        isAdmin: true,
      };
      onSaveSession(adminSession);
      onAdminTriggered();
      onClose();
      setPasswordInput('');
      setErrorMsg('');
      return;
    }

    // Standard Student Session
    const userSession: UserSession = {
      name: trimmed,
      isAdmin: false,
    };
    onSaveSession(userSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden">
        
        {/* Header accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="text-center mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner transition-colors ${
              isAdminTarget ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isAdminTarget ? <ShieldCheck className="w-7 h-7" /> : <User className="w-7 h-7" />}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {isAdminTarget 
                ? 'এডমিন এক্সেস ভেরিফিকেশন' 
                : currentSession 
                  ? 'আপনার নাম পরিবর্তন করুন' 
                  : 'আপনার নাম দিয়ে কুইজে অংশ নিন'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAdminTarget 
                ? 'এডমিন প্যানেলে প্রবেশের জন্য পাসওয়ার্ড প্রদান করুন।' 
                : 'পরীক্ষার ফলাফলে এবং লীডারবোর্ডে আপনার অর্জিত স্কোর প্রদর্শিত হবে।'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              আপনার নাম লিখুন:
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder="যেমন: সাকিব আহমেদ, মরিয়ম বেগম"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 font-medium text-sm transition-all"
              autoFocus
            />
          </div>

          {/* Dynamic Admin Password Field when admin key is entered */}
          {isAdminTarget && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>এডমিন সিক্রেট পাসওয়ার্ড টাইপ করুন:</span>
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 text-slate-900 font-bold text-sm bg-white"
                autoFocus
              />
              <p className="text-[11px] text-amber-700 font-medium">
                🔒 এডমিন প্যানেলে প্রবেশের জন্য সিক্রেট পাসওয়ার্ড লিখুন।
              </p>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Info Box */}
          {!isAdminTarget && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-200">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>ফলাফল ও টাইম ট্র্যাকিং:</strong> প্রতিটি কুইজের শেষে আপনার সময়, সঠিক ও ভুল উত্তরের ট্র্যাকিং লীডারবোর্ডে যুক্ত হবে।
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {currentSession && onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>লগ আউট</span>
              </button>
            )}

            <button
              type="submit"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer ${
                isAdminTarget
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <span>{isAdminTarget ? 'এডমিন হিসেবে লগইন করুন' : currentSession ? 'সংরক্ষণ করুন' : 'কুইজ শুরু করুন'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
