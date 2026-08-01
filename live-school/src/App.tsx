import React, { useState, useEffect } from 'react';
import { 
  Category, LevelInfo, LiveExam, Question, QuizResult, QuizSettings, UserSession, WrittenQuestion, WrittenExamResult, EnglishQuestionSet, EnglishExamResult, SocialLinks, BannerSlide 
} from './types';
import { 
  getStoredQuestions, saveStoredQuestions, resetQuestionsToDefault,
  getStoredQuizSettings, saveStoredQuizSettings,
  getStoredLeaderboard, saveQuizResultToLeaderboard, clearStoredLeaderboard,
  getStoredUserSession, saveStoredUserSession,
  getStoredCategories, saveStoredCategories,
  getStoredLiveExams, saveStoredLiveExams,
  getStoredWrittenQuestions, saveStoredWrittenQuestions,
  getStoredWrittenResults, saveWrittenResult, clearStoredWrittenResults,
  getStoredEnglishQuestions, saveStoredEnglishQuestions,
  getStoredEnglishResults, saveEnglishResult, clearStoredEnglishResults,
  getStoredSocialLinks, saveStoredSocialLinks,
  getStoredBanners, saveStoredBanners
} from './utils/storage';

import { Navbar } from './components/Navbar';
import { UserNameModal } from './components/UserNameModal';
import { CategoryLevelSelector } from './components/CategoryLevelSelector';
import { QuizRunner } from './components/QuizRunner';
import { QuizResultView } from './components/QuizResultView';
import { LeaderboardView } from './components/LeaderboardView';
import { LiveExamList } from './components/LiveExamList';
import { WrittenExamList } from './components/WrittenExamList';
import { WrittenExamRunner } from './components/WrittenExamRunner';
import { EnglishExamList } from './components/EnglishExamList';
import { EnglishExamRunner } from './components/EnglishExamRunner';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { BannerSlider } from './components/BannerSlider';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<QuizSettings>(getStoredQuizSettings());
  const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [liveExams, setLiveExams] = useState<LiveExam[]>([]);
  const [writtenQuestions, setWrittenQuestions] = useState<WrittenQuestion[]>([]);
  const [writtenResults, setWrittenResults] = useState<WrittenExamResult[]>([]);
  const [englishQuestions, setEnglishQuestions] = useState<EnglishQuestionSet[]>([]);
  const [englishResults, setEnglishResults] = useState<EnglishExamResult[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(getStoredSocialLinks());
  const [banners, setBanners] = useState<BannerSlide[]>(getStoredBanners());

  // App Navigation State
  const [activeView, setActiveView] = useState<'home' | 'quiz' | 'result' | 'leaderboard' | 'live_exams' | 'written_exams' | 'written_runner' | 'english_exams' | 'english_runner' | 'admin'>('home');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // Active Quiz Parameters
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeLevel, setActiveLevel] = useState<LevelInfo | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [lastQuizResult, setLastQuizResult] = useState<QuizResult | null>(null);
  const [activeWrittenQuestion, setActiveWrittenQuestion] = useState<WrittenQuestion | null>(null);
  const [activeEnglishSet, setActiveEnglishSet] = useState<EnglishQuestionSet | null>(null);

  // Load Initial Storage Data
  useEffect(() => {
    setCategories(getStoredCategories());
    setQuestions(getStoredQuestions());
    setLeaderboard(getStoredLeaderboard());
    setLiveExams(getStoredLiveExams());
    setWrittenQuestions(getStoredWrittenQuestions());
    setWrittenResults(getStoredWrittenResults());
    setEnglishQuestions(getStoredEnglishQuestions());
    setEnglishResults(getStoredEnglishResults());
    setSocialLinks(getStoredSocialLinks());
    setBanners(getStoredBanners());
    const savedSession = getStoredUserSession();
    if (savedSession) {
      setUserSession(savedSession);
    }
  }, []);

  const handleSaveSocialLinks = (links: SocialLinks) => {
    setSocialLinks(links);
    saveStoredSocialLinks(links);
  };

  const handleSaveBanners = (updatedBanners: BannerSlide[]) => {
    setBanners(updatedBanners);
    saveStoredBanners(updatedBanners);
  };

  // Save User Session Handler
  const handleSaveSession = (session: UserSession) => {
    setUserSession(session);
    saveStoredUserSession(session);
  };

  // Logout Handler
  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('smartquiz_user_session_v1');
    if (activeView === 'admin') {
      setActiveView('home');
    }
  };

  // Trigger Quiz Start
  const handleSelectLevel = (category: Category, level: LevelInfo) => {
    if (!userSession || !userSession.name) {
      setActiveCategory(category);
      setActiveLevel(level);
      setIsNameModalOpen(true);
      return;
    }

    const levelQuestions = questions.filter((q) => {
      // Exclude questions specifically reserved for live exams
      if (q.questionType === 'live_exam' || q.examId) return false;
      let qLevelNum = 1;
      if (q.levelId) {
        const match = q.levelId.match(/\d+/);
        if (match) qLevelNum = parseInt(match[0], 10);
      }
      return q.levelId === level.id || qLevelNum === level.levelNumber;
    });

    if (levelQuestions.length === 0) {
      alert('এই লেভেলে কোনো প্রশ্ন পাওয়া যায়নি। এডমিন প্যানেল থেকে লেভেলের প্রশ্ন যোগ করুন।');
      return;
    }

    setActiveCategory(category);
    setActiveLevel(level);
    setActiveQuestions(levelQuestions);
    setActiveView('quiz');
  };

  // Start Live Exam
  const handleStartLiveExam = (exam: LiveExam) => {
    if (!userSession || !userSession.name) {
      setIsNameModalOpen(true);
      return;
    }

    // 1. Try questions created specifically for this examId
    let examQs = questions.filter((q) => q.examId === exam.id);

    // 2. If none, try general live exam questions for this category
    if (examQs.length === 0) {
      examQs = questions.filter((q) => q.questionType === 'live_exam' && q.categoryId === exam.categoryId);
    }

    // 3. Fallback to general category questions if no exam questions exist yet
    if (examQs.length === 0) {
      examQs = questions.filter((q) => q.categoryId === exam.categoryId);
    }

    if (examQs.length === 0) {
      examQs = questions; // Final fallback
    }

    // Shuffle and pick requested question count
    const shuffled = [...examQs].sort(() => 0.5 - Math.random()).slice(0, exam.questionCount);

    const dummyCategory: Category = {
      id: exam.categoryId,
      name: exam.title,
      nameBn: exam.title,
      iconName: 'Radio',
      description: exam.instructions || exam.description,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      levels: []
    };

    const dummyLevel: LevelInfo = {
      id: exam.id,
      levelNumber: 1,
      name: 'Live Exam',
      nameBn: '🔴 লাইভ পরীক্ষা',
      description: exam.description,
      defaultTimeLimitMinutes: exam.durationMinutes,
      defaultNegativeMarking: exam.negativeMarking
    };

    setActiveCategory(dummyCategory);
    setActiveLevel(dummyLevel);
    setActiveQuestions(shuffled);
    setActiveView('quiz');
  };

  // Complete Quiz Handler
  const handleFinishQuiz = (result: QuizResult) => {
    setLastQuizResult(result);
    const updatedLeaderboard = saveQuizResultToLeaderboard(result);
    setLeaderboard(updatedLeaderboard);
    setActiveView('result');
  };

  // Retry Quiz
  const handleRetryQuiz = () => {
    if (activeCategory && activeLevel) {
      handleSelectLevel(activeCategory, activeLevel);
    } else {
      setActiveView('home');
    }
  };

  // --- Admin Data Handlers ---
  const normalizeQuestion = (q: Question): Question => {
    let levelNum = 1;
    if (q.levelId) {
      const match = q.levelId.match(/\d+/);
      if (match) levelNum = parseInt(match[0], 10);
    }
    return {
      ...q,
      categoryId: 'job_prep',
      levelId: `job_prep-l${levelNum}`,
    };
  };

  const handleAddQuestion = (newQuestion: Question) => {
    const normalized = normalizeQuestion(newQuestion);
    const updated = [normalized, ...questions];
    setQuestions(updated);
    saveStoredQuestions(updated);
  };

  const handleBulkAddQuestions = (newQuestions: Question[]) => {
    const normalizedList = newQuestions.map(normalizeQuestion);
    const updated = [...normalizedList, ...questions];
    setQuestions(updated);
    saveStoredQuestions(updated);
  };

  const handleDeleteQuestion = (qId: string) => {
    const updated = questions.filter((q) => q.id !== qId);
    setQuestions(updated);
    saveStoredQuestions(updated);
  };

  const handleResetQuestions = () => {
    const defaultQs = resetQuestionsToDefault();
    setQuestions(defaultQs);
  };

  const handleSaveSettings = (newSettings: QuizSettings) => {
    setSettings(newSettings);
    saveStoredQuizSettings(newSettings);
  };

  // SEO & Google Search Console Meta Tag Injection Effect
  useEffect(() => {
    if (settings.siteTitle) {
      document.title = settings.siteTitle;
    }
    if (settings.googleSearchConsoleCode) {
      let metaTag = document.querySelector('meta[name="google-site-verification"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'google-site-verification');
        document.head.appendChild(metaTag);
      }
      let cleanCode = settings.googleSearchConsoleCode.trim();
      const match = cleanCode.match(/content=["']([^"']+)["']/i);
      if (match && match[1]) {
        cleanCode = match[1];
      }
      metaTag.setAttribute('content', cleanCode);
    }
  }, [settings]);

  const handleClearLeaderboard = () => {
    clearStoredLeaderboard();
    clearStoredWrittenResults();
    clearStoredEnglishResults();
    setLeaderboard([]);
    setWrittenResults([]);
    setEnglishResults([]);
  };

  const handleAddLiveExam = (exam: LiveExam) => {
    const updated = [exam, ...liveExams];
    setLiveExams(updated);
    saveStoredLiveExams(updated);
  };

  const handleDeleteLiveExam = (examId: string) => {
    const updated = liveExams.filter((e) => e.id !== examId);
    setLiveExams(updated);
    saveStoredLiveExams(updated);
  };

  const handleUpdateCategories = (updatedCats: Category[]) => {
    setCategories(updatedCats);
    saveStoredCategories(updatedCats);
  };

  // --- Written Exam Handlers ---
  const handleAddWrittenQuestion = (wq: WrittenQuestion) => {
    const updated = [wq, ...writtenQuestions];
    setWrittenQuestions(updated);
    saveStoredWrittenQuestions(updated);
  };

  const handleDeleteWrittenQuestion = (id: string) => {
    const updated = writtenQuestions.filter((q) => q.id !== id);
    setWrittenQuestions(updated);
    saveStoredWrittenQuestions(updated);
  };

  const handleStartWrittenExam = (q: WrittenQuestion) => {
    if (!userSession || !userSession.name) {
      setIsNameModalOpen(true);
      return;
    }
    setActiveWrittenQuestion(q);
    setActiveView('written_runner');
  };

  const handleFinishWrittenExam = (result: WrittenExamResult) => {
    const updatedResults = saveWrittenResult(result);
    setWrittenResults(updatedResults);
  };

  // --- English Translation Handlers ---
  const handleAddEnglishQuestion = (eq: EnglishQuestionSet) => {
    const updated = [eq, ...englishQuestions];
    setEnglishQuestions(updated);
    saveStoredEnglishQuestions(updated);
  };

  const handleDeleteEnglishQuestion = (id: string) => {
    const updated = englishQuestions.filter((q) => q.id !== id);
    setEnglishQuestions(updated);
    saveStoredEnglishQuestions(updated);
  };

  const handleStartEnglishExam = (set: EnglishQuestionSet) => {
    if (!userSession || !userSession.name) {
      setIsNameModalOpen(true);
      return;
    }
    setActiveEnglishSet(set);
    setActiveView('english_runner');
  };

  const handleFinishEnglishExam = (result: EnglishExamResult) => {
    const updatedResults = saveEnglishResult(result);
    setEnglishResults(updatedResults);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Hind_Siliguri',sans-serif] text-slate-800 relative overflow-x-hidden">
      
      {/* Background Reader Watermark Illustration */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.06] sm:opacity-[0.08] select-none overflow-hidden">
        <img 
          src="/src/assets/images/reader_watermark_v2_1785561661311.jpg" 
          alt="Reader Watermark" 
          className="w-[500px] sm:w-[700px] md:w-[850px] object-contain mix-blend-multiply filter contrast-125"
        />
      </div>

      {/* Top Header Navbar */}
      <div className="relative z-10">
        <Navbar
          userSession={userSession}
          socialLinks={socialLinks}
          onOpenNameModal={() => setIsNameModalOpen(true)}
          onOpenLeaderboard={() => setActiveView('leaderboard')}
          onOpenAdmin={() => {
            if (userSession?.isAdmin) {
              setActiveView('admin');
            } else {
              setIsNameModalOpen(true);
            }
          }}
          onGoHome={() => setActiveView('home')}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => handleSaveSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
          activeView={activeView}
          onGoToLiveExams={() => setActiveView('live_exams')}
          onGoToWrittenExams={() => setActiveView('written_exams')}
          onGoToEnglishExams={() => setActiveView('english_exams')}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 relative z-10">
        
        {/* VIEW 1: Home - Category & Level Selector */}
        {activeView === 'home' && (
          <CategoryLevelSelector
            categories={categories.length > 0 ? categories : getStoredCategories()}
            questions={questions}
            settings={settings}
            onSelectLevel={handleSelectLevel}
            userName={userSession?.name}
            onOpenNameModal={() => setIsNameModalOpen(true)}
            onGoToLiveExams={() => setActiveView('live_exams')}
            socialLinks={socialLinks}
            banners={banners}
          />
        )}

        {/* VIEW 2: Live Exams List View */}
        {activeView === 'live_exams' && (
          <LiveExamList
            exams={liveExams}
            categories={categories.length > 0 ? categories : getStoredCategories()}
            questions={questions}
            results={leaderboard}
            onStartExam={handleStartLiveExam}
            onBack={() => setActiveView('home')}
          />
        )}

        {/* VIEW 2.5: Written Exams List View */}
        {activeView === 'written_exams' && (
          <WrittenExamList
            questions={writtenQuestions}
            results={writtenResults}
            onStartWrittenExam={handleStartWrittenExam}
            onBackHome={() => setActiveView('home')}
          />
        )}

        {/* VIEW 2.6: Active Written Exam Runner */}
        {activeView === 'written_runner' && activeWrittenQuestion && (
          <WrittenExamRunner
            question={activeWrittenQuestion}
            userName={userSession?.name || 'LIVE SCHOOL'}
            onFinishWritten={handleFinishWrittenExam}
            onCancel={() => setActiveView('written_exams')}
          />
        )}

        {/* VIEW 2.7: English Translation Practice List View */}
        {activeView === 'english_exams' && (
          <EnglishExamList
            categories={categories.length > 0 ? categories : getStoredCategories()}
            englishSets={englishQuestions}
            englishResults={englishResults}
            onStartEnglishExam={handleStartEnglishExam}
            onGoHome={() => setActiveView('home')}
          />
        )}

        {/* VIEW 2.8: English Translation Practice Runner */}
        {activeView === 'english_runner' && activeEnglishSet && (
          <EnglishExamRunner
            set={activeEnglishSet}
            userName={userSession?.name || 'LIVE SCHOOL'}
            onFinishEnglish={handleFinishEnglishExam}
            onCancel={() => setActiveView('english_exams')}
          />
        )}

        {/* VIEW 3: Active Quiz Runner */}
        {activeView === 'quiz' && activeCategory && activeLevel && (
          <QuizRunner
            category={activeCategory}
            level={activeLevel}
            questions={activeQuestions}
            userName={userSession?.name || 'LIVE SCHOOL'}
            settings={settings}
            soundEnabled={settings.soundEnabled}
            onFinishQuiz={handleFinishQuiz}
            onCancelQuiz={() => setActiveView('home')}
          />
        )}

        {/* VIEW 4: Quiz Result View */}
        {activeView === 'result' && lastQuizResult && (
          <QuizResultView
            result={lastQuizResult}
            onRetry={handleRetryQuiz}
            onOpenLeaderboard={() => setActiveView('leaderboard')}
            onGoHome={() => setActiveView('home')}
          />
        )}

        {/* VIEW 5: Public Leaderboard / Participant Records */}
        {activeView === 'leaderboard' && (
          <LeaderboardView
            results={leaderboard}
            onBackHome={() => setActiveView('home')}
            isAdmin={userSession?.isAdmin}
            onClearLeaderboard={handleClearLeaderboard}
          />
        )}

        {/* VIEW 6: Secret Admin Dashboard */}
        {activeView === 'admin' && (
          <AdminDashboard
            categories={categories.length > 0 ? categories : getStoredCategories()}
            questions={questions}
            settings={settings}
            results={leaderboard}
            liveExams={liveExams}
            writtenQuestions={writtenQuestions}
            writtenResults={writtenResults}
            englishQuestions={englishQuestions}
            englishResults={englishResults}
            socialLinks={socialLinks}
            banners={banners}
            onSaveSocialLinks={handleSaveSocialLinks}
            onSaveBanners={handleSaveBanners}
            onAddQuestion={handleAddQuestion}
            onBulkAddQuestions={handleBulkAddQuestions}
            onDeleteQuestion={handleDeleteQuestion}
            onResetQuestions={handleResetQuestions}
            onSaveSettings={handleSaveSettings}
            onClearResults={handleClearLeaderboard}
            onCloseAdmin={() => setActiveView('home')}
            onLogout={handleLogout}
            onAddLiveExam={handleAddLiveExam}
            onDeleteLiveExam={handleDeleteLiveExam}
            onUpdateCategories={handleUpdateCategories}
            onAddWrittenQuestion={handleAddWrittenQuestion}
            onDeleteWrittenQuestion={handleDeleteWrittenQuestion}
            onAddEnglishQuestion={handleAddEnglishQuestion}
            onDeleteEnglishQuestion={handleDeleteEnglishQuestion}
          />
        )}

      </main>

      {/* Guest Name & Admin Access Modal */}
      <UserNameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        currentSession={userSession}
        onSaveSession={handleSaveSession}
        onAdminTriggered={() => setActiveView('admin')}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} LIVE SCHOOL - প্রফেশনাল অনলাইন কুইজ ও লার্নিং পোর্টাল।</p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveView('english_exams')}
              className="hover:text-blue-600 transition-colors cursor-pointer font-bold flex items-center gap-1"
            >
              <span>🔤 ইংরেজি শিক্ষা</span>
            </button>
            <button 
              onClick={() => setActiveView('written_exams')}
              className="hover:text-indigo-600 transition-colors cursor-pointer font-bold flex items-center gap-1"
            >
              <span>✍️ রিটেন পরীক্ষা</span>
            </button>
            <button 
              onClick={() => setActiveView('live_exams')}
              className="hover:text-rose-600 transition-colors cursor-pointer font-bold flex items-center gap-1"
            >
              <span>🔴 লাইভ পরীক্ষা</span>
            </button>
            <button 
              onClick={() => setActiveView('leaderboard')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              লীডারবোর্ড
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
