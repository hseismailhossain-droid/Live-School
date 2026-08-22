import React, { useState } from 'react';
import { 
  PlusCircle, FileText, Sparkles, Database, Settings as SettingsIcon, 
  Trash2, ArrowLeft, Check, RefreshCw, Layers, ShieldCheck, LogOut, Radio, PenTool, Plus,
  Share2, Facebook, Youtube, Send, MessageSquare, Globe, Cloud, CheckCircle2
} from 'lucide-react';
import { Category, LiveExam, Question, QuizResult, QuizSettings, WrittenQuestion, WrittenExamResult, WrittenSubQuestion, EnglishQuestionSet, EnglishExamResult, SocialLinks, BannerSlide } from '../../types';
import { ensureCategoryLevel, toBengaliNumeral, getStoredSocialLinks, saveStoredSocialLinks, getStoredBanners, saveStoredBanners } from '../../utils/storage';
import { syncAllWithCloud, cloudSaveQuestions } from '../../lib/cloudStorage';
import { parseBulkQuestionsText } from '../../utils/bulkParser';
import { parseBulkWrittenQuestionsText } from '../../utils/writtenBulkParser';
import { generateQuestionsWithAI } from '../../utils/aiGenerator';
import { LiveExamManager } from './LiveExamManager';

interface AdminDashboardProps {
  categories: Category[];
  questions: Question[];
  settings: QuizSettings;
  results: QuizResult[];
  liveExams: LiveExam[];
  writtenQuestions?: WrittenQuestion[];
  writtenResults?: WrittenExamResult[];
  englishQuestions?: EnglishQuestionSet[];
  englishResults?: EnglishExamResult[];
  socialLinks?: SocialLinks;
  banners?: BannerSlide[];
  onAddQuestion: (q: Question) => void;
  onBulkAddQuestions: (qs: Question[]) => void;
  onDeleteQuestion: (qId: string) => void;
  onResetQuestions: () => void;
  onSaveSettings: (s: QuizSettings) => void;
  onSaveSocialLinks?: (links: SocialLinks) => void;
  onSaveBanners?: (banners: BannerSlide[]) => void;
  onClearResults: () => void;
  onCloseAdmin: () => void;
  onLogout?: () => void;
  onAddLiveExam: (exam: LiveExam) => void;
  onDeleteLiveExam: (examId: string) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onAddWrittenQuestion?: (wq: WrittenQuestion) => void;
  onDeleteWrittenQuestion?: (id: string) => void;
  onAddEnglishQuestion?: (eq: EnglishQuestionSet) => void;
  onDeleteEnglishQuestion?: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  categories,
  questions,
  settings,
  results,
  liveExams,
  writtenQuestions = [],
  writtenResults = [],
  englishQuestions = [],
  englishResults = [],
  socialLinks,
  banners,
  onAddQuestion,
  onBulkAddQuestions,
  onDeleteQuestion,
  onResetQuestions,
  onSaveSettings,
  onSaveSocialLinks,
  onSaveBanners,
  onClearResults,
  onCloseAdmin,
  onLogout,
  onAddLiveExam,
  onDeleteLiveExam,
  onUpdateCategories,
  onAddWrittenQuestion,
  onDeleteWrittenQuestion,
  onAddEnglishQuestion,
  onDeleteEnglishQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'live_exam' | 'written' | 'english' | 'ai' | 'bank' | 'settings' | 'social' | 'banners' | 'results'>('single');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState('');

  const handleForceCloudSync = async () => {
    setIsCloudSyncing(true);
    setCloudSyncMsg('ক্লাউড ডাটাবেজ সিঙ্ক হচ্ছে...');
    try {
      // Push any questions currently in memory to cloud
      if (questions.length > 0) {
        await cloudSaveQuestions(questions);
      }
      await syncAllWithCloud();
      setCloudSyncMsg('সব প্রশ্ন ক্লাউডে সফলভাবে সিঙ্ক হয়েছে! ✅');
      setTimeout(() => setCloudSyncMsg(''), 4000);
    } catch (e) {
      setCloudSyncMsg('সিঙ্কে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
      setTimeout(() => setCloudSyncMsg(''), 4000);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const safeCategories = categories || [];
  const safeQuestions = questions || [];
  const safeResults = results || [];
  const safeLiveExams = liveExams || [];
  const safeWrittenQuestions = writtenQuestions || [];
  const safeWrittenResults = writtenResults || [];
  const safeEnglishQuestions = englishQuestions || [];
  const safeEnglishResults = englishResults || [];

  // --- Social Links State ---
  const currentSocial = socialLinks || getStoredSocialLinks();
  const [socialForm, setSocialForm] = useState<SocialLinks>({
    facebookPage: currentSocial.facebookPage || '',
    youtubeVideo: currentSocial.youtubeVideo || '',
    telegramGroup: currentSocial.telegramGroup || '',
    whatsappNumber: currentSocial.whatsappNumber || '',
    websiteUrl: currentSocial.websiteUrl || '',
  });
  const [socialSuccess, setSocialSuccess] = useState(false);

  // --- Banner Manager State ---
  const initialBannersList = banners || getStoredBanners();
  const [bannerList, setBannerList] = useState<BannerSlide[]>(initialBannersList);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerBadge, setBannerBadge] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerTheme, setBannerTheme] = useState<'teal' | 'indigo' | 'amber' | 'rose' | 'emerald' | 'purple'>('teal');
  const [bannerSuccessMsg, setBannerSuccessMsg] = useState('');

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) return;

    const newBanner: BannerSlide = {
      id: 'b_' + Date.now(),
      title: bannerTitle.trim(),
      subtitle: bannerSubtitle.trim() || undefined,
      badgeText: bannerBadge.trim() || undefined,
      imageUrl: bannerImage.trim() || undefined,
      linkUrl: bannerLink.trim() || undefined,
      themeColor: bannerTheme,
      isActive: true,
    };

    const updated = [newBanner, ...bannerList];
    setBannerList(updated);
    if (onSaveBanners) {
      onSaveBanners(updated);
    } else {
      saveStoredBanners(updated);
    }

    setBannerTitle('');
    setBannerSubtitle('');
    setBannerBadge('');
    setBannerImage('');
    setBannerLink('');
    setBannerSuccessMsg('নতুন ব্যানার স্লাইডার সফলভাবে যোগ করা হয়েছে!');
    setTimeout(() => setBannerSuccessMsg(''), 3000);
  };

  const handleToggleBannerActive = (id: string) => {
    const updated = bannerList.map((b) => b.id === id ? { ...b, isActive: !b.isActive } : b);
    setBannerList(updated);
    if (onSaveBanners) {
      onSaveBanners(updated);
    } else {
      saveStoredBanners(updated);
    }
  };

  const handleDeleteBanner = (id: string) => {
    if (!confirm('আপনি কি এই ব্যানারটি মুছে ফেলতে চান?')) return;
    const updated = bannerList.filter((b) => b.id !== id);
    setBannerList(updated);
    if (onSaveBanners) {
      onSaveBanners(updated);
    } else {
      saveStoredBanners(updated);
    }
  };

  // --- English Question Creation State ---
  const [englishTitle, setEnglishTitle] = useState('');
  const [englishCategoryName, setEnglishCategoryName] = useState('দৈনন্দিন ইংরেজি ও অনুবাদ');
  const [englishLevelNum, setEnglishLevelNum] = useState<number>(1);
  const [englishSetNum, setEnglishSetNum] = useState<number>(1);
  const [englishSetName, setEnglishSetName] = useState('সেট ১: মৌলিক অনুবাদ চর্চা');
  const [englishTime, setEnglishTime] = useState<number>(15);
  const [englishSuccessMsg, setEnglishSuccessMsg] = useState('');

  const [englishItems, setEnglishItems] = useState<Array<{
    id: string;
    bengaliSentence: string;
    englishSentence: string;
    hints: string;
    marks: number;
  }>>([
    {
      id: 'eq_init_1',
      bengaliSentence: '',
      englishSentence: '',
      hints: '',
      marks: 10,
    }
  ]);

  const handleAddEnglishItemField = () => {
    setEnglishItems((prev) => [
      ...prev,
      {
        id: 'eq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        bengaliSentence: '',
        englishSentence: '',
        hints: '',
        marks: 10,
      }
    ]);
  };

  const handleRemoveEnglishItemField = (id: string) => {
    if (englishItems.length <= 1) {
      alert('সেটে অন্তত ১টি বাংলা-ইংরেজি অনুবাদ বাক্য থাকতে হবে।');
      return;
    }
    setEnglishItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleEnglishItemChange = (id: string, field: string, value: any) => {
    setEnglishItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleEnglishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!englishTitle.trim()) {
      alert('অনুগ্রহ করে ইংরেজি প্রশ্ন সেটের শিরোনাম প্রদান করুন।');
      return;
    }

    const validItems = englishItems.filter(
      (it) => it.bengaliSentence.trim().length > 0 && it.englishSentence.trim().length > 0
    );

    if (validItems.length === 0) {
      alert('অনুগ্রহ করে অন্তত ১টি সম্পূর্ণ প্রশ্ন (বাংলা বাক্য) এবং মডেল উত্তর (ইংরেজি বাক্য) ফিলআপ করুন।');
      return;
    }

    const newSet: EnglishQuestionSet = {
      id: 'eq_set_' + Date.now(),
      categoryId: 'job_prep',
      categoryName: englishCategoryName.trim() || 'দৈনন্দিন ইংরেজি ও অনুবাদ',
      levelNum: englishLevelNum || 1,
      setNum: englishSetNum || 1,
      setName: englishSetName.trim() || `সেট ${toBengaliNumeral(englishSetNum)}: ইংরেজি অনুবাদ`,
      title: englishTitle.trim(),
      timeLimitMinutes: englishTime || 15,
      createdAt: new Date().toISOString(),
      items: validItems.map((it, idx) => ({
        id: 'item_' + Date.now() + '_' + idx,
        itemNum: idx + 1,
        bengaliSentence: it.bengaliSentence.trim(),
        englishSentence: it.englishSentence.trim(),
        hints: it.hints.trim(),
        marks: Number(it.marks) || 10,
      })),
    };

    if (onAddEnglishQuestion) {
      onAddEnglishQuestion(newSet);
    }

    setEnglishSuccessMsg(`সফলভাবে "${newSet.title}" (লেভেল ${toBengaliNumeral(newSet.levelNum)}, সেট ${toBengaliNumeral(newSet.setNum)}) যুক্ত হয়েছে!`);
    
    // Reset form
    setEnglishTitle('');
    setEnglishItems([
      { id: 'eq_init_' + Date.now(), bengaliSentence: '', englishSentence: '', hints: '', marks: 10 }
    ]);

    setTimeout(() => setEnglishSuccessMsg(''), 5000);
  };

  // --- Written Question Creation State ---
  const [writtenAddMode, setWrittenAddMode] = useState<'single' | 'bulk'>('single');
  const [writtenTitle, setWrittenTitle] = useState('');
  const [writtenCategoryName, setWrittenCategoryName] = useState('বিসিএস ও ব্যাংক রিটেন');
  const [writtenLevelNum, setWrittenLevelNum] = useState<number>(1);
  const [writtenSetNum, setWrittenSetNum] = useState<number>(1);
  const [writtenSetName, setWrittenSetName] = useState('সেট ১: বিষয়ভিত্তিক বিশেষ প্রস্তুতি');
  const [writtenTime, setWrittenTime] = useState<number>(20);
  const [writtenBulkRawText, setWrittenBulkRawText] = useState('');
  const [writtenSuccessMsg, setWrittenSuccessMsg] = useState('');

  // Sub-questions inside the Written Exam Set
  const [writtenSubQuestions, setWrittenSubQuestions] = useState<Array<{
    id: string;
    questionText: string;
    modelAnswer: string;
    marks: number;
    hints: string;
  }>>([
    {
      id: 'sq_init_1',
      questionText: '',
      modelAnswer: '',
      marks: 10,
      hints: '',
    }
  ]);

  const handleAddSubQuestionField = () => {
    setWrittenSubQuestions((prev) => [
      ...prev,
      {
        id: 'sq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        questionText: '',
        modelAnswer: '',
        marks: 10,
        hints: '',
      }
    ]);
  };

  const handleRemoveSubQuestionField = (id: string) => {
    if (writtenSubQuestions.length <= 1) {
      alert('সেটে অন্তত ১টি প্রশ্ন অবশ্যই থাকতে হবে।');
      return;
    }
    setWrittenSubQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubQuestionChange = (id: string, field: string, value: any) => {
    setWrittenSubQuestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleWrittenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writtenTitle.trim()) {
      alert('অনুগ্রহ করে প্রশ্ন সেটের প্রধান শিরোনাম বা টপিক নাম প্রদান করুন।');
      return;
    }

    for (let i = 0; i < writtenSubQuestions.length; i++) {
      const q = writtenSubQuestions[i];
      if (!q.questionText.trim() || !q.modelAnswer.trim()) {
        alert(`প্রশ্ন নম্বর ${toBengaliNumeral(i + 1)}-এর লিখিত প্রশ্ন এবং সঠিক উত্তরের ব্যাখ্যার ঘর পূরণ করুন।`);
        return;
      }
    }

    const formattedSubQuestions: WrittenSubQuestion[] = writtenSubQuestions.map((q, idx) => ({
      id: 'sq_' + (idx + 1) + '_' + Math.random().toString(36).substring(2, 6),
      questionNum: idx + 1,
      questionText: q.questionText.trim(),
      modelAnswer: q.modelAnswer.trim(),
      marks: q.marks > 0 ? q.marks : 10,
      hints: q.hints.trim(),
    }));

    const firstQ = formattedSubQuestions[0];

    const newWq: WrittenQuestion = {
      id: 'wq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      categoryId: 'job_prep',
      categoryName: writtenCategoryName.trim() || 'লিখিত পরীক্ষা',
      levelNum: writtenLevelNum || 1,
      setNum: writtenSetNum || 1,
      setName: writtenSetName.trim() || `সেট ${writtenSetNum || 1}`,
      title: writtenTitle.trim(),
      questions: formattedSubQuestions,
      questionText: firstQ.questionText,
      modelAnswer: firstQ.modelAnswer,
      marks: firstQ.marks,
      timeLimitMinutes: writtenTime > 0 ? writtenTime : 20,
      hints: firstQ.hints,
      createdAt: new Date().toISOString(),
    };

    if (onAddWrittenQuestion) {
      onAddWrittenQuestion(newWq);
    }

    setWrittenSubQuestions([{ id: 'sq_' + Date.now(), questionText: '', modelAnswer: '', marks: 10, hints: '' }]);
    setWrittenSuccessMsg(`সেট ${toBengaliNumeral(writtenSetNum)} (${toBengaliNumeral(formattedSubQuestions.length)} টি প্রশ্নসহ) সফলভাবে যুক্ত হয়েছে! 🎉`);
    setTimeout(() => setWrittenSuccessMsg(''), 3500);
  };

  const handleWrittenBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writtenBulkRawText.trim()) {
      alert('অনুগ্রহ করে বাল্ক ইনপুট বক্সে প্রশ্নাবলী পেস্ট করুন।');
      return;
    }

    const parsed = parseBulkWrittenQuestionsText(
      writtenBulkRawText,
      writtenCategoryName,
      writtenLevelNum
    );

    if (parsed.length === 0) {
      alert('কোনো বৈধ লিখিত প্রশ্ন পাওয়া যায়নি। নির্দিষ্ট ফরম্যাট অনুসরণ করুন।');
      return;
    }

    if (onAddWrittenQuestion) {
      parsed.forEach((wq) => onAddWrittenQuestion(wq));
    }

    setWrittenBulkRawText('');
    setWrittenSuccessMsg(`একসাথে ${toBengaliNumeral(parsed.length)} টি রিটেন প্রশ্ন ও সেট সফলভাবে যুক্ত হয়েছে! 🎉`);
    setTimeout(() => setWrittenSuccessMsg(''), 3500);
  };

  // --- Single Question State ---
  const [singleTargetType, setSingleTargetType] = useState<'level' | 'live_exam'>('level');
  const [singleExamId, setSingleExamId] = useState<string>('');
  const [singleCategory, setSingleCategory] = useState<string>(categories[0]?.id || 'job_prep');
  const [singleLevelNum, setSingleLevelNum] = useState<number>(1);
  const [questionText, setQuestionText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctIdx, setCorrectIdx] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [singleSuccessMsg, setSingleSuccessMsg] = useState('');

  // --- Bulk Input State ---
  const [bulkTargetType, setBulkTargetType] = useState<'level' | 'live_exam'>('level');
  const [bulkExamId, setBulkExamId] = useState<string>('');
  const [bulkCategory, setBulkCategory] = useState<string>(categories[0]?.id || 'job_prep');
  const [bulkLevelNum, setBulkLevelNum] = useState<number>(1);
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkParsedQuestions, setBulkParsedQuestions] = useState<Question[]>([]);
  const [bulkStatus, setBulkStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // --- AI Generator State ---
  const [aiTargetType, setAiTargetType] = useState<'level' | 'live_exam' | 'written' | 'english'>('level');
  const [aiExamId, setAiExamId] = useState<string>('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCat, setAiCat] = useState('job_prep');
  const [aiLevelNum, setAiLevelNum] = useState(1);
  const [aiCount, setAiCount] = useState(5);
  const [aiSetName, setAiSetName] = useState('সেট ১');
  const [aiTimeLimitMinutes, setAiTimeLimitMinutes] = useState(15);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedList, setAiGeneratedList] = useState<Question[]>([]);
  const [aiGeneratedWrittenSet, setAiGeneratedWrittenSet] = useState<WrittenQuestion | null>(null);
  const [aiGeneratedEnglishSet, setAiGeneratedEnglishSet] = useState<EnglishQuestionSet | null>(null);
  const [aiError, setAiError] = useState('');

  // --- Bank Search State ---
  const [bankSearch, setBankSearch] = useState('');
  const [bankCatFilter, setBankCatFilter] = useState('all');
  const [bankTypeFilter, setBankTypeFilter] = useState<'all' | 'level' | 'live_exam'>('all');

  // --- Settings Form State ---
  const [negMarkInput, setNegMarkInput] = useState(settings.negativeMarkPerWrong);
  const [timeLimitInput, setTimeLimitInput] = useState(settings.timeLimitMinutes);
  const [passPctInput, setPassPctInput] = useState(settings.passPercentage);
  const [gscInput, setGscInput] = useState(settings.googleSearchConsoleCode || '');
  const [siteTitleInput, setSiteTitleInput] = useState(settings.siteTitle || 'LIVE SCHOOL - প্রফেশনাল অনলাইন কুইজ পোর্টাল');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // --- Confirm Delete Modal State ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Handle Single Add with Dynamic Level or Live Exam Support
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim() || !opt4.trim()) {
      alert('অনুগ্রহ করে প্রশ্ন এবং ৪টি অপশনই সঠিকভাবে প্রদান করুন।');
      return;
    }

    let targetCat = singleCategory;
    let targetLevelId = '';
    let qType: 'level' | 'live_exam' = 'level';
    let targetExamId: string | undefined = undefined;

    if (singleTargetType === 'live_exam') {
      const exam = liveExams.find(e => e.id === singleExamId) || liveExams[0];
      if (!exam) {
        alert('কোনো সক্রিয় লাইভ পরীক্ষা পাওয়া যায়নি। অনুগ্রহ করে প্রথমে লাইভ পরীক্ষা ট্যাবে একটি পরীক্ষা তৈরি করুন।');
        return;
      }
      targetCat = exam.categoryId;
      targetLevelId = exam.id;
      qType = 'live_exam';
      targetExamId = exam.id;
    } else {
      const { updatedCategories, levelId } = ensureCategoryLevel(categories, singleCategory, singleLevelNum);
      onUpdateCategories(updatedCategories);
      targetLevelId = levelId;
      qType = 'level';
    }

    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      categoryId: targetCat,
      levelId: targetLevelId,
      examId: targetExamId,
      questionType: qType,
      questionText: questionText.trim(),
      options: [opt1.trim(), opt2.trim(), opt3.trim(), opt4.trim()],
      correctAnswerIndex: correctIdx,
      explanation: explanation.trim() || 'কোনো অতিরিক্ত ব্যাখ্যা সংযুক্ত করা হয়নি।',
      points: 1,
    };

    onAddQuestion(newQ);

    // Reset Form
    setQuestionText('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setOpt4('');
    setExplanation('');
    
    if (qType === 'live_exam') {
      setSingleSuccessMsg(`লাইভ পরীক্ষায় প্রশ্নটি সফলভাবে যুক্ত করা হয়েছে! 🔴`);
    } else {
      setSingleSuccessMsg(`লেভেল ${toBengaliNumeral(singleLevelNum)}-এ প্রশ্নটি সফলভাবে যুক্ত করা হয়েছে! 🎉`);
    }
    setTimeout(() => setSingleSuccessMsg(''), 3000);
  };

  // Preview Bulk Questions
  const handlePreviewBulk = () => {
    if (!bulkRawText.trim()) return;

    let targetCat = bulkCategory;
    let targetLevelId = '';
    let qType: 'level' | 'live_exam' = 'level';
    let targetExamId: string | undefined = undefined;

    if (bulkTargetType === 'live_exam') {
      const exam = liveExams.find(e => e.id === bulkExamId) || liveExams[0];
      if (!exam) {
        setBulkStatus({ success: false, msg: 'কোনো সক্রিয় লাইভ পরীক্ষা পাওয়া যায়নি।' });
        return;
      }
      targetCat = exam.categoryId;
      targetLevelId = exam.id;
      qType = 'live_exam';
      targetExamId = exam.id;
    } else {
      const { updatedCategories, levelId } = ensureCategoryLevel(categories, bulkCategory, bulkLevelNum);
      onUpdateCategories(updatedCategories);
      targetLevelId = levelId;
      qType = 'level';
    }

    const { questions: parsed, errorMsg } = parseBulkQuestionsText(bulkRawText, targetCat, targetLevelId);
    if (errorMsg || parsed.length === 0) {
      setBulkStatus({ success: false, msg: errorMsg || 'কোনো বৈধ প্রশ্ন পাওয়া যায়নি। প্রশ্ন ও ৪টি অপশন সঠিক আছে কিনা চেক করুন।' });
      setBulkParsedQuestions([]);
    } else {
      const tagged = parsed.map(q => ({
        ...q,
        examId: targetExamId,
        questionType: qType,
      }));
      setBulkParsedQuestions(tagged);
      setBulkStatus({ success: true, msg: `মোট ${toBengaliNumeral(tagged.length)} টি প্রশ্ন পার্স করা হয়েছে! নিচে চেক করে সেভ বাটনে ক্লিক করুন।` });
    }
  };

  // Save Bulk Questions
  const handleSaveBulk = () => {
    if (bulkParsedQuestions.length === 0) return;
    onBulkAddQuestions(bulkParsedQuestions);
    setBulkStatus({
      success: true,
      msg: `সফলভাবে মোট ${toBengaliNumeral(bulkParsedQuestions.length)} টি প্রশ্ন ইম্পোর্ট করা হয়েছে!`
    });
    setBulkParsedQuestions([]);
    setBulkRawText('');
  };

  // Load Sample Plain Text Bulk
  const handleLoadSamplePlainText = () => {
    const sample = `১. চর্যাপদের সবচেয়ে বেশি পদ রচয়িতা কে?
ক. লুইপা
খ. ভুসুকুপা
গ. কাণহপা
ঘ. শবরপা
উত্তর: গ
ব্যাখ্যা: চর্যাপদের সর্বাধিক ১৩টি পদের রচয়িতা কাণহপা।

২. বাংলাদেশের জাতীয় সঙ্গীতের রচয়িতা কে?
ক. কাজী নজরুল ইসলাম
খ. রবীন্দ্রনাথ ঠাকুর
গ. জীবনানন্দ দাশ
ঘ. সুকান্ত ভট্টাচার্য
উত্তর: খ
ব্যাখ্যা: রবীন্দ্রনাথ ঠাকুর আমার সোনার বাংলা গানের প্রথম ১০ লাইন রচনা করেন।`;
    setBulkRawText(sample);
  };

  // Handle AI Generate Call
  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) {
      setAiError('অনুগ্রহ করে একটি বিষয় বা টপিকের নাম লিখুন।');
      return;
    }

    setIsAiGenerating(true);
    setAiError('');
    setAiGeneratedList([]);
    setAiGeneratedWrittenSet(null);
    setAiGeneratedEnglishSet(null);

    let targetCat = aiCat;
    let targetLevelId = '';
    let qType: 'level' | 'live_exam' = 'level';
    let targetExamId: string | undefined = undefined;

    if (aiTargetType === 'live_exam') {
      const exam = liveExams.find(e => e.id === aiExamId) || liveExams[0];
      if (!exam) {
        setAiError('কোনো সক্রিয় লাইভ পরীক্ষা পাওয়া যায়নি।');
        setIsAiGenerating(false);
        return;
      }
      targetCat = exam.categoryId;
      targetLevelId = exam.id;
      qType = 'live_exam';
      targetExamId = exam.id;
    } else {
      const { updatedCategories, levelId } = ensureCategoryLevel(categories, aiCat, aiLevelNum);
      onUpdateCategories(updatedCategories);
      targetLevelId = levelId;
      qType = 'level';
    }

    try {
      const data = await generateQuestionsWithAI({
        type: aiTargetType,
        topic: aiTopic,
        categoryId: targetCat,
        levelId: targetLevelId,
        levelNum: aiLevelNum,
        setName: aiSetName || 'সেট ১',
        timeLimitMinutes: aiTimeLimitMinutes || 15,
        count: aiCount,
      });

      if (data.type === 'mcq' || !data.type) {
        const listWithTags = (data.questions || []).map((q: Question) => ({
          ...q,
          examId: targetExamId,
          questionType: qType,
        }));
        setAiGeneratedList(listWithTags);
      } else if (data.type === 'written' && data.writtenSet) {
        setAiGeneratedWrittenSet(data.writtenSet);
      } else if (data.type === 'english' && data.englishSet) {
        setAiGeneratedEnglishSet(data.englishSet);
      } else {
        throw new Error('অপ্রত্যাশিত ডাটা রেসপন্স পাওয়া গেছে।');
      }
    } catch (err: any) {
      setAiError(err.message || 'নেটওয়ার্ক বা এপিআই সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveAiGenerated = () => {
    if (aiGeneratedList.length === 0) return;
    onBulkAddQuestions(aiGeneratedList);
    alert(`মোট ${toBengaliNumeral(aiGeneratedList.length)} টি AI প্রশ্ন সিস্টেমে যোগ করা হয়েছে!`);
    setAiGeneratedList([]);
    setAiTopic('');
  };

  const handleSaveAiWritten = () => {
    if (!aiGeneratedWrittenSet) return;
    if (onAddWrittenQuestion) {
      onAddWrittenQuestion(aiGeneratedWrittenSet);
      alert(`"${aiGeneratedWrittenSet.title}" লিখিত পরীক্ষা প্রশ্ন সেটটি সফলভাবে সেভ করা হয়েছে!`);
      setAiGeneratedWrittenSet(null);
      setAiTopic('');
    } else {
      alert('লিখিত প্রশ্ন সেভ করার ফাংশন পাওয়া যায়নি।');
    }
  };

  const handleSaveAiEnglish = () => {
    if (!aiGeneratedEnglishSet) return;
    if (onAddEnglishQuestion) {
      onAddEnglishQuestion(aiGeneratedEnglishSet);
      alert(`"${aiGeneratedEnglishSet.title}" ইংরেজি অনুবাদ চর্চা সেটটি সফলভাবে সেভ করা হয়েছে!`);
      setAiGeneratedEnglishSet(null);
      setAiTopic('');
    } else {
      alert('ইংরেজি অনুবাদ সেভ করার ফাংশন পাওয়া যায়নি।');
    }
  };

  // Save Settings
  const handleSaveSettingsForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      negativeMarkPerWrong: Number(negMarkInput),
      timeLimitMinutes: Number(timeLimitInput),
      passPercentage: Number(passPctInput),
      googleSearchConsoleCode: gscInput,
      siteTitle: siteTitleInput,
    });
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  // Filter questions for Bank Tab
  const filteredBankQuestions = safeQuestions.filter((q) => {
    const matchCat = bankCatFilter === 'all' || q.categoryId === bankCatFilter;
    const matchText = q.questionText.toLowerCase().includes(bankSearch.toLowerCase()) ||
                      q.explanation.toLowerCase().includes(bankSearch.toLowerCase());
    const matchType = bankTypeFilter === 'all'
      ? true
      : bankTypeFilter === 'live_exam'
        ? (q.questionType === 'live_exam' || !!q.examId)
        : (q.questionType !== 'live_exam' && !q.examId);
    return matchCat && matchText && matchType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onCloseAdmin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>মূল সাইটে ফিরুন</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>লগ আউট (এডমিন)</span>
              </button>
            )}

            <button
              onClick={handleForceCloudSync}
              disabled={isCloudSyncing}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-200 hover:text-white px-3 py-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/40 transition-all cursor-pointer shadow-xs"
              title="কম্পিউটার ও মোবাইলের ডাটা একসাথে সিঙ্ক করুন"
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-bounce text-amber-300' : 'text-sky-300'}`} />
              <span>{isCloudSyncing ? 'সিঙ্ক হচ্ছে...' : '☁️ লাইভ ক্লাউড সিঙ্ক'}</span>
            </button>
          </div>

          {cloudSyncMsg && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/30 border border-emerald-400/50 rounded-lg text-[11px] font-bold text-emerald-200 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{cloudSyncMsg}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <h1 className="text-2xl font-black tracking-tight">
              LIVE SCHOOL - এডমিন কন্ট্রোল সেন্টার
            </h1>
          </div>
          <p className="text-xs text-emerald-200 mt-1">
            ১ থেকে ১ মিলিয়ন আনলিমিটেড লেভেল কুইজ তৈরি, সহজ বাল্ক ইম্পোর্ট এবং লাইভ পরীক্ষা চালনা করুন।
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 bg-white/10 p-3.5 rounded-2xl border border-white/10 text-center">
          <div>
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">মোট প্রশ্ন</span>
            <span className="text-xl font-black text-amber-400">{toBengaliNumeral(questions.length)}</span>
          </div>
          <div className="border-x border-white/10 px-2">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">লাইভ পরীক্ষা</span>
            <span className="text-xl font-black text-rose-400">{toBengaliNumeral(liveExams.length)}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">নেগেটিভ মার্ক</span>
            <span className="text-xl font-black text-emerald-300">-{toBengaliNumeral(settings.negativeMarkPerWrong)}</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'single'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>সিঙ্গেল প্রশ্ন যোগ</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'bulk'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>সহজ বাল্ক ইম্পোর্ট</span>
        </button>

        <button
          onClick={() => setActiveTab('live_exam')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'live_exam'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
          }`}
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>🔴 লাইভ পরীক্ষা পরিচালন</span>
        </button>

        <button
          onClick={() => setActiveTab('written')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'written'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>✍️ রিটেন প্রশ্ন ও উত্তরের ব্যাখ্যা</span>
        </button>

        <button
          onClick={() => setActiveTab('english')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'english'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>🔤 ইংরেজি শিক্ষা (বাংলা ➔ ইংরেজি)</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>স্মার্ট AI প্রশ্ন জেনারেটর</span>
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>প্রশ্ন ব্যাংক ({toBengaliNumeral(questions.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>পরীক্ষার সেটিংস</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'social'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
          }`}
        >
          <Share2 className="w-4 h-4 text-indigo-600" />
          <span>📱 সোশ্যাল মিডিয়া লিঙ্ক</span>
        </button>

        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'banners'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>🖼️ হোম ব্যানার স্লাইডার</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'results'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>পরীক্ষার্থী রেজাল্ট ({toBengaliNumeral(results.length)})</span>
        </button>
      </div>

      {/* --- TAB 1: Single Question Entry --- */}
      {activeTab === 'single' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>একক প্রশ্ন ইনপুট ও সংরক্ষণ</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              যেকোনো লেভেলে (১ থেকে ১,০০০,০০০) সরাসরি প্রশ্ন, অপশন ও সঠিক উত্তর যুক্ত করুন।
            </p>
          </div>

          {singleSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{singleSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="space-y-5">
            {/* Question Target Type Segment Selector */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSingleTargetType('level')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  singleTargetType === 'level'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🎯 প্রাকটিস লেভেলের প্রশ্ন</span>
              </button>
              <button
                type="button"
                onClick={() => setSingleTargetType('live_exam')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  singleTargetType === 'live_exam'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🔴 লাইভ পরীক্ষার প্রশ্ন</span>
              </button>
            </div>

            {singleTargetType === 'level' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি:</label>
                  <select
                    value={singleCategory}
                    onChange={(e) => setSingleCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nameBn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    লেভেল নম্বর (১ থেকে ১,০০০,০০০):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={singleLevelNum}
                    onChange={(e) => setSingleLevelNum(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-emerald-700"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">টার্গেট লাইভ পরীক্ষা নির্বাচন করুন:</label>
                {liveExams.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
                    <span>কোনো লাইভ পরীক্ষা তৈরি করা নেই। আগে লাইভ পরীক্ষা তৈরি করুন।</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('live_exam')}
                      className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-[11px]"
                    >
                      + লাইভ পরীক্ষা তৈরি
                    </button>
                  </div>
                ) : (
                  <select
                    value={singleExamId || liveExams[0]?.id}
                    onChange={(e) => setSingleExamId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-rose-50/60 border border-rose-300 rounded-xl text-xs sm:text-sm font-bold text-rose-950"
                  >
                    {liveExams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        🔴 {ex.title} (তারিখ: {ex.startDate})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">প্রশ্ন (Question Text):</label>
              <textarea
                rows={2}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="যেমন: বাংলা সাহিত্যের প্রথম সাশ্রয়ী আধুনিক উপন্যাস কোনটি?"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/30"
                required
              />
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অপশন ১ (ক / A):</label>
                <input
                  type="text"
                  value={opt1}
                  onChange={(e) => setOpt1(e.target.value)}
                  placeholder="অপশন ১"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অপশন ২ (খ / B):</label>
                <input
                  type="text"
                  value={opt2}
                  onChange={(e) => setOpt2(e.target.value)}
                  placeholder="অপশন ২"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অপশন ৩ (গ / C):</label>
                <input
                  type="text"
                  value={opt3}
                  onChange={(e) => setOpt3(e.target.value)}
                  placeholder="অপশন ৩"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অপশন ৪ (ঘ / D):</label>
                <input
                  type="text"
                  value={opt4}
                  onChange={(e) => setOpt4(e.target.value)}
                  placeholder="অপশন ৪"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Correct Answer Index Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সঠিক উত্তর চিহ্নিত করুন:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCorrectIdx(idx)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      correctIdx === idx
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    অপশন {toBengaliNumeral(idx + 1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Explanation Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সঠিক উত্তরের ব্যাখ্যা (Explanation):
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="পরীক্ষার্থীদের সঠিক উত্তর বুঝতে সুবিধা হওয়ার জন্য বিস্তারিত বিবরণ লিখুন..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>প্রশ্ন সংরক্ষণ করুন</span>
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 2: Super Easy Bulk Question Entry --- */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>সহজ বাল্ক ইম্পোর্ট (বাংলা / ইংরেজি টেক্সট বা JSON)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                যেকোনো বাংলা ফরম্যাট বা JSON কপিপেস্ট করুন। সিস্টেম স্বয়ংক্রিয়ভাবে প্রশ্ন ও অপশন আলাদা করে ফেলবে।
              </p>
            </div>

            <button
              type="button"
              onClick={handleLoadSamplePlainText}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer shrink-0"
            >
              নমুনা বাংলা প্রশ্ন পেস্ট করুন
            </button>
          </div>

          {/* Bulk Target Type Segment Selector */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBulkTargetType('level')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                bulkTargetType === 'level'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🎯 প্রাকটিস লেভেলের প্রশ্ন ইম্পোর্ট</span>
            </button>
            <button
              type="button"
              onClick={() => setBulkTargetType('live_exam')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                bulkTargetType === 'live_exam'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🔴 লাইভ পরীক্ষার প্রশ্ন ইম্পোর্ট</span>
            </button>
          </div>

          {bulkTargetType === 'level' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি:</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nameBn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টার্গেট লেভেল নম্বর (১ থেকে ১,০০০,০০০):
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  value={bulkLevelNum}
                  onChange={(e) => setBulkLevelNum(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-emerald-700"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">টার্গেট লাইভ পরীক্ষা নির্বাচন করুন:</label>
              {liveExams.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
                  <span>কোনো লাইভ পরীক্ষা তৈরি করা নেই। আগে লাইভ পরীক্ষা তৈরি করুন।</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('live_exam')}
                    className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-[11px]"
                  >
                    + লাইভ পরীক্ষা তৈরি
                  </button>
                </div>
              ) : (
                <select
                  value={bulkExamId || liveExams[0]?.id}
                  onChange={(e) => setBulkExamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-rose-50/60 border border-rose-300 rounded-xl text-xs sm:text-sm font-bold text-rose-950"
                >
                  {liveExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      🔴 {ex.title} (তারিখ: {ex.startDate})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {bulkStatus && (
            <div className={`p-4 rounded-2xl text-xs font-bold border ${
              bulkStatus.success 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}>
              {bulkStatus.msg}
            </div>
          )}

          <div className="space-y-4">
            <textarea
              rows={10}
              value={bulkRawText}
              onChange={(e) => setBulkRawText(e.target.value)}
              placeholder={`এমএস ওয়ার্ড বা নোটপ্যাডের প্রশ্ন সরাসরি পেস্ট করুন:\n\n১. চর্যাপদের পদ রচয়িতা কে?\nক. লুইপা\nখ. ভুসুকুপা\nগ. কাণহপা\nঘ. শবরপা\nউত্তর: গ\nব্যাখ্যা: এখানে ব্যাখ্যা...`}
              className="w-full p-4 font-mono text-xs border border-slate-300 rounded-2xl bg-slate-900 text-emerald-400 leading-relaxed focus:outline-hidden"
            />

            <div className="flex gap-3">
              <button
                onClick={handlePreviewBulk}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>প্রশ্ন পার্স করে চেক করুন</span>
              </button>

              {bulkParsedQuestions.length > 0 && (
                <button
                  onClick={handleSaveBulk}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>সবগুলো প্রশ্ন ইম্পোর্ট নিশ্চিত করুন ({toBengaliNumeral(bulkParsedQuestions.length)} টি)</span>
                </button>
              )}
            </div>
          </div>

          {/* Parsed Questions Preview Cards */}
          {bulkParsedQuestions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>পার্সকৃত প্রশ্নের প্রিভিউ:</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full font-bold">
                      {toBengaliNumeral(bulkParsedQuestions.length)} টি প্রশ্ন
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    💡 কোনো প্রশ্নের সঠিক উত্তর পরিবর্তন করতে সংশ্লিষ্ট অপশনে ক্লিক করুন। সবুজ রঙের অপশনটি সঠিক উত্তর হিসেবে সেভ হবে।
                  </p>
                </div>
                <button
                  onClick={() => setBulkParsedQuestions([])}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  প্রিভিউ ক্লিয়ার করুন
                </button>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {bulkParsedQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 relative group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 text-sm">
                        {toBengaliNumeral(idx + 1)}. {q.questionText}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkParsedQuestions(prev => prev.filter((_, itemIdx) => itemIdx !== idx));
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="এই প্রশ্নটি বাদ দিন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          onClick={() => {
                            setBulkParsedQuestions(prev => prev.map((item, itemIdx) => 
                              itemIdx === idx ? { ...item, correctAnswerIndex: oIdx } : item
                            ));
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            oIdx === q.correctAnswerIndex
                              ? 'bg-emerald-100 border-emerald-500 font-bold text-emerald-950 ring-2 ring-emerald-400/50 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                          title="সঠিক উত্তর পরিবর্তন করতে ক্লিক করুন"
                        >
                          <span>{toBengaliNumeral(oIdx + 1)}. {opt}</span>
                          {oIdx === q.correctAnswerIndex && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-bold">
                              ✓ সঠিক
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-slate-600 italic bg-white/70 p-2 rounded-lg border border-slate-200/60">
                      <span className="font-semibold text-slate-700">ব্যাখ্যা:</span> {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* --- TAB 3: Live Exam Manager --- */}
      {activeTab === 'live_exam' && (
        <LiveExamManager
          categories={categories}
          questions={questions}
          exams={liveExams}
          onAddExam={onAddLiveExam}
          onDeleteExam={onDeleteLiveExam}
          onAddQuestion={onAddQuestion}
          onBulkAddQuestions={onBulkAddQuestions}
          onDeleteQuestion={onDeleteQuestion}
          onSwitchTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* --- TAB 3.5: Written Questions & Model Answer Management --- */}
      {activeTab === 'written' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <span>✍️ রিটেন প্রশ্ন ও উত্তরের ব্যাখ্যা ম্যানেজমেন্ট</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              এখানে এডমিন রিটেন প্রশ্ন, উত্তরের বিস্তারিত ব্যাখ্যা ও মার্কস সেট করবেন। ইউজার অ্যাপস থেকে উত্তর লিখলে সিস্টেম এই উত্তরের ব্যাখ্যার সাথে মিলিয়ে স্বয়ংক্রিয় মার্কস প্রদান করবে।
            </p>
          </div>

          {writtenSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{writtenSuccessMsg}</span>
            </div>
          )}

          {/* Add Mode Toggle */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200">
            <button
              type="button"
              onClick={() => setWrittenAddMode('single')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                writtenAddMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✍️ একক রিটেন প্রশ্ন যোগ
            </button>
            <button
              type="button"
              onClick={() => setWrittenAddMode('bulk')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                writtenAddMode === 'bulk'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📦 বাল্ক ও প্রশ্ন সেট আকারে যোগ
            </button>
          </div>

          {/* Add Written Question Set Form (Supports multiple questions manually!) */}
          {writtenAddMode === 'single' && (
            <form onSubmit={handleWrittenSubmit} className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-100">
                <h3 className="font-extrabold text-indigo-950 text-base flex items-center gap-2">
                  <span>✍️ ম্যানুয়ালি রিটেন প্রশ্ন সেট তৈরি করুন</span>
                </h3>
                <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg">
                  মোট প্রশ্ন: {toBengaliNumeral(writtenSubQuestions.length)} টি
                </span>
              </div>

              {/* Set Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">প্রশ্ন সেটের মূল শিরোনাম:</label>
                  <input
                    type="text"
                    value={writtenTitle}
                    onChange={(e) => setWrittenTitle(e.target.value)}
                    placeholder="যেমন: বঙ্গবন্ধুর ৭ই মার্চের ভাষণ ও বাংলাদেশের স্বাধীনতা"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি বা বিষয়:</label>
                  <input
                    type="text"
                    value={writtenCategoryName}
                    onChange={(e) => setWrittenCategoryName(e.target.value)}
                    placeholder="যেমন: বিসিএস ও ব্যাংক রিটেন"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">লেভেল নাম্বার (১-১,০০০,০০০):</label>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={writtenLevelNum}
                    onChange={(e) => setWrittenLevelNum(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-indigo-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">প্রশ্ন সেট নম্বর (১ - ১,০০০,০০০):</label>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={writtenSetNum}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setWrittenSetNum(val);
                      setWrittenSetName(`সেট ${val}: বিষয়ভিত্তিক প্র্যাকটিস`);
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-indigo-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">প্রশ্ন সেটের বিবরণ/টপিক:</label>
                  <input
                    type="text"
                    value={writtenSetName}
                    onChange={(e) => setWrittenSetName(e.target.value)}
                    placeholder="যেমন: সেট ১: ইতিহাস ও সাম্প্রতিক বাংলাদেশ"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">সেটের মোট সময়সীমা (মিনিট):</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={writtenTime}
                    onChange={(e) => setWrittenTime(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-indigo-700"
                    required
                  />
                </div>
              </div>

              {/* Sub-Questions Builder */}
              <div className="space-y-4 pt-3 border-t border-indigo-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>এই সেটের অন্তর্ভুক্ত প্রশ্নসমূহ ({toBengaliNumeral(writtenSubQuestions.length)} টি):</span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddSubQuestionField}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ এই সেটে আরও ১টি প্রশ্ন যোগ করুন</span>
                  </button>
                </div>

                {writtenSubQuestions.map((sq, idx) => (
                  <div key={sq.id} className="p-5 bg-white border border-indigo-150 rounded-2xl space-y-3 shadow-sm relative">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-900 text-xs font-black rounded-lg">
                        প্রশ্ন নম্বর {toBengaliNumeral(idx + 1)}
                      </span>

                      {writtenSubQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubQuestionField(sq.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>মুছে ফেলুন</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          লিখিত প্রশ্নটি লিখুন:
                        </label>
                        <textarea
                          rows={2}
                          value={sq.questionText}
                          onChange={(e) => handleSubQuestionChange(sq.id, 'questionText', e.target.value)}
                          placeholder={`প্রশ্ন ${toBengaliNumeral(idx + 1)}: এখানে আপনার লিখিত প্রশ্ন টাইপ করুন...`}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          এই প্রশ্নের পূর্ণমান:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={sq.marks}
                          onChange={(e) => handleSubQuestionChange(sq.id, 'marks', Number(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-700 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        এডমিনের সঠিক উত্তরের ব্যাখ্যা (Model Answer):
                      </label>
                      <textarea
                        rows={3}
                        value={sq.modelAnswer}
                        onChange={(e) => handleSubQuestionChange(sq.id, 'modelAnswer', e.target.value)}
                        placeholder="এখানে প্রশ্নটির সঠিক উত্তরের পয়েন্ট বা আদর্শ উত্তর লিখুন (যা থেকে অফলাইনে অটো-মূল্যায়ন হবে)..."
                        className="w-full p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs font-medium text-amber-950 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        হিন্টস/পরামর্শ (ঐচ্ছিক):
                      </label>
                      <input
                        type="text"
                        value={sq.hints}
                        onChange={(e) => handleSubQuestionChange(sq.id, 'hints', e.target.value)}
                        placeholder="যেমন: অনুচ্ছেদটি পয়েন্ট আকারে লিখলে ভালো মার্কস পাওয়া যাবে"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSubQuestionField}
                  className="w-full py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-2xl text-xs font-black border-2 border-dashed border-indigo-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-700" />
                  <span>+ সেটে আরও একটি প্রশ্ন যোগ করুন ({toBengaliNumeral(writtenSubQuestions.length + 1)} নম্বর প্রশ্ন)</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm transition-all cursor-pointer shadow-lg shadow-indigo-600/30 active:scale-98"
              >
                + সমগ্র রিটেন প্রশ্ন সেট সেভ করুন ({toBengaliNumeral(writtenSubQuestions.length)} টি প্রশ্নসহ)
              </button>
            </form>
          )}

          {/* Add Bulk Written Question Form */}
          {writtenAddMode === 'bulk' && (
            <form onSubmit={handleWrittenBulkSubmit} className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-5">
              <h3 className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                <span>📦 একসাথে একাধিক লিখিত প্রশ্ন ও সেট যোগ করুন (Bulk Set System)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ডিফল্ট ক্যাটাগরি বা বিষয়:</label>
                  <input
                    type="text"
                    value={writtenCategoryName}
                    onChange={(e) => setWrittenCategoryName(e.target.value)}
                    placeholder="যেমন: বিসিএস ও ব্যাংক রিটেন"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ডিফল্ট লেভেল নাম্বার:</label>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={writtenLevelNum}
                    onChange={(e) => setWrittenLevelNum(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-indigo-700"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-indigo-200 text-xs space-y-2 text-slate-700">
                <span className="font-bold text-indigo-900 block">💡 বাল্ক টেক্সট এরিয়া ইনপুট ফরম্যাট গাইড:</span>
                <p>নিচের ফরম্যাটে প্রশ্ন, উত্তরের ব্যাখ্যা এবং প্রয়োজনে প্রশ্ন সেটের নাম পেস্ট করুন:</p>
                <pre className="p-3 bg-slate-900 text-amber-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`[সেট ১ | লেভেল ১]
প্রশ্ন: বঙ্গবন্ধুর ৭ই মার্চের ভাষণ ও ইউনেস্কো স্বীকৃতি সম্পর্কে বলুন।
ব্যাখ্যা: ১৯৭১ সালের ৭ই মার্চ সোহরাওয়ার্দী উদ্যানে বঙ্গবন্ধু স্বাধীনতার ঐতিহাসিক ঘোষণা দেন...
মার্কস: ১০

প্রশ্ন: স্মার্ট বাংলাদেশ ২০৪১ এর ৪টি মূল স্তম্ভ আলোচনা করুন।
ব্যাখ্যা: ৪টি স্তম্ভ হল: স্মার্ট সিটিজেন, স্মার্ট গভর্মেন্ট, স্মার্ট সোসাইটি ও স্মার্ট ইকোনমি...
মার্কস: ১০
---
[সেট ২ | লেভেল ২]
প্রশ্ন: মুদ্রাস্ফীতি ও রেপো রেটের প্রভাব ব্যাখ্যা করুন।
ব্যাখ্যা: মুদ্রাস্ফীতি নিয়ন্ত্রণে বাংলাদেশ ব্যাংক নীতি সুদের হার বৃদ্ধি করে...
মার্কস: ১৫`}
                </pre>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">বাল্ক লিখিত প্রশ্নাবলী টেক্সট এরিয়া:</label>
                <textarea
                  rows={10}
                  value={writtenBulkRawText}
                  onChange={(e) => setWrittenBulkRawText(e.target.value)}
                  placeholder="উপরে উল্লেখিত নিয়ম অনুযায়ী আপনার লিখিত প্রশ্ন ও উত্তর ব্যাখ্যার সেট পেস্ট করুন..."
                  className="w-full p-4 bg-white border border-slate-300 rounded-2xl text-xs font-mono font-semibold text-slate-900 leading-relaxed focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-98"
              >
                + বাল্ক রিটেন প্রশ্নসমূহ একসাথে সেভ করুন
              </button>
            </form>
          )}

          {/* List of Created Written Questions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">
              বিদ্যমান রিটেন প্রশ্নসমূহ ({toBengaliNumeral(writtenQuestions.length)})
            </h3>

            {writtenQuestions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl">
                কোনো লিখিত প্রশ্ন যুক্ত করা নেই। উপরে ফর্ম থেকে নতুন লিখিত প্রশ্ন যোগ করুন।
              </p>
            ) : (
              <div className="space-y-3">
                {writtenQuestions.map((wq) => (
                  <div key={wq.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-md">
                            {wq.categoryName || 'রিটেন'}
                          </span>
                          <span className="text-xs font-black text-amber-700">
                            পূর্ণমান: {toBengaliNumeral(wq.marks)} মার্কস ({toBengaliNumeral(wq.timeLimitMinutes || 10)} মিনিট)
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{wq.title}</h4>
                      </div>

                      {onDeleteWrittenQuestion && (
                        <button
                          onClick={() => onDeleteWrittenQuestion(wq.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="প্রশ্ন মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                      <strong>প্রশ্ন:</strong> {wq.questionText}
                    </p>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                      <strong>উত্তরের আদর্শ ব্যাখ্যা (Model Answer):</strong>
                      <p className="whitespace-pre-wrap">{wq.modelAnswer}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Written Exam Results Log */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">
              ইউজারদের লিখিত উত্তর ও AI মূল্যায়ন লগ ({toBengaliNumeral(writtenResults.length)})
            </h3>

            {writtenResults.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl">
                এখনো কোনো ইউজার লিখিত উত্তর জমা দেয়নি।
              </p>
            ) : (
              <div className="space-y-3">
                {writtenResults.map((res) => (
                  <div key={res.id} className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900">
                        পরীক্ষার্থী: {res.userName} | তারিখ: {new Date(res.timestamp).toLocaleString('bn-BD')}
                      </span>
                      <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        প্রাপ্ত মার্কস: {toBengaliNumeral(res.obtainedMarks)} / {toBengaliNumeral(res.maxMarks)} ({toBengaliNumeral(res.matchPercentage)}% মিল)
                      </span>
                    </div>

                    <p className="font-semibold text-slate-800">
                      <strong>প্রশ্ন:</strong> {res.questionText}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">ইউজারের উত্তর:</span>
                        <p className="whitespace-pre-wrap text-slate-800">{res.userAnswer}</p>
                      </div>

                      <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                        <span className="font-bold text-indigo-900 block mb-1">মূল্যায়ন ফিডব্যাক:</span>
                        <p className="text-indigo-950">{res.feedback}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB: English Translation Practice Management --- */}
      {activeTab === 'english' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>🔤 ইংরেজি শিক্ষা - বাংলা প্রশ্ন ও ইংরেজি উত্তর সেট ম্যানেজমেন্ট</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              প্রশ্নের জায়গায় বাংলা বাক্য এবং ব্যাখ্যার জায়গায় সঠিক ইংরেজি মডেল উত্তর প্রদান করুন। ইউজার অ্যাপসে এই মডেল উত্তরের শব্দগুলো এলোমেলোভাবে (Scrambled Word Chips) থাকবে এবং ইউজার সাজিয়ে অটো-মার্কিং পাবে।
            </p>
          </div>

          {englishSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{englishSuccessMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEnglishSubmit} className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-5">
            <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
              <span>✍️ নতুন ইংরেজি অনুবাদ প্রশ্ন সেট তৈরি করুন</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রশ্ন সেটের প্রধান শিরোনাম / টপিক নাম:
                </label>
                <input
                  type="text"
                  value={englishTitle}
                  onChange={(e) => setEnglishTitle(e.target.value)}
                  placeholder="যেমন: সেট ১: দৈনন্দিন ১০টি গুরুত্বপূর্ণ ইংরেজি অনুবাদ চর্চা"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি বা বিষয় নাম:</label>
                <input
                  type="text"
                  value={englishCategoryName}
                  onChange={(e) => setEnglishCategoryName(e.target.value)}
                  placeholder="যেমন: দৈনন্দিন ইংরেজি ও অনুবাদ"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">সময়সীমা (মিনিট):</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={englishTime}
                  onChange={(e) => setEnglishTime(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-blue-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">লেভেল নাম্বার (১, ২, ৩... ১,০০০,০০০):</label>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  value={englishLevelNum}
                  onChange={(e) => setEnglishLevelNum(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-blue-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">প্রশ্ন সেট নাম্বার (১, ২, ৩... ১,০০০,০০০):</label>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  value={englishSetNum}
                  onChange={(e) => setEnglishSetNum(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-blue-700"
                  required
                />
              </div>
            </div>

            {/* List of Bengali - English Items */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-1">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>সেটের অন্তর্ভুক্ত বাংলা-ইংরেজি বাক্যসমূহ ({toBengaliNumeral(englishItems.length)} টি):</span>
                </h4>

                <button
                  type="button"
                  onClick={handleAddEnglishItemField}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ এই সেটে আরও ১টি অনুবাদ প্রশ্ন যোগ করুন</span>
                </button>
              </div>

              {englishItems.map((item, idx) => (
                <div key={item.id} className="p-5 bg-white border border-blue-200 rounded-2xl space-y-3 shadow-sm relative">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="px-3 py-1 bg-blue-100 text-blue-900 text-xs font-black rounded-lg">
                      বাক্য নম্বর {toBengaliNumeral(idx + 1)}
                    </span>

                    {englishItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEnglishItemField(item.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছে ফেলুন</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        ১. প্রশ্ন (বাংলা বাক্য):
                      </label>
                      <input
                        type="text"
                        value={item.bengaliSentence}
                        onChange={(e) => handleEnglishItemChange(item.id, 'bengaliSentence', e.target.value)}
                        placeholder={`যেমন: আমি প্রতিদিন সকালে পার্কে হাটি।`}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        পূর্ণমান:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.marks}
                        onChange={(e) => handleEnglishItemChange(item.id, 'marks', Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-blue-700 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      ২. ব্যাখ্যার জায়গায় সঠিক মডেল উত্তর (ইংরেজি বাক্য):
                    </label>
                    <input
                      type="text"
                      value={item.englishSentence}
                      onChange={(e) => handleEnglishItemChange(item.id, 'englishSentence', e.target.value)}
                      placeholder="যেমন: I walk in the park every morning."
                      className="w-full px-3 py-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold text-emerald-950 focus:bg-white"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      💡 ইউজার অ্যাপসে এই মডেল ইংরেজি বাক্যের প্রতিটি শব্দ এলোমেলোভাবে (Scrambled Word Chips) প্রদর্শিত হবে।
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ৩. ভোকাবুলারি বা গ্রামার টিপস/হিন্টস (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={item.hints}
                      onChange={(e) => handleEnglishItemChange(item.id, 'hints', e.target.value)}
                      placeholder="যেমন: walk = হাঁটা, park = পার্ক, morning = সকাল"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddEnglishItemField}
                className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-2xl text-xs font-black border-2 border-dashed border-blue-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-700" />
                <span>+ সেটে আরও একটি অনুবাদ বাক্য যোগ করুন ({toBengaliNumeral(englishItems.length + 1)} নম্বর প্রশ্ন)</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm transition-all cursor-pointer shadow-lg shadow-blue-600/30 active:scale-98"
            >
              + সমগ্র ইংরেজি অনুবাদ সেট সেভ করুন ({toBengaliNumeral(englishItems.length)} টি বাক্যসহ)
            </button>
          </form>

          {/* List of Created English Questions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">
              বিদ্যমান ইংরেজি অনুবাদ প্রশ্ন সেটসমূহ ({toBengaliNumeral(englishQuestions.length)})
            </h3>

            {englishQuestions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl">
                কোনো ইংরেজি অনুবাদ সেট যুক্ত করা নেই। উপরে ফর্ম থেকে নতুন সেট যোগ করুন।
              </p>
            ) : (
              <div className="space-y-4">
                {englishQuestions.map((eq) => (
                  <div key={eq.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md">
                            {eq.categoryName || 'ইংরেজি অনুবাদ'}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md">
                            লেভেল {toBengaliNumeral(eq.levelNum || 1)}
                          </span>
                          <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 text-[10px] font-black rounded-md">
                            সেট {toBengaliNumeral(eq.setNum || 1)}
                          </span>
                          <span className="text-xs font-black text-emerald-700">
                            {toBengaliNumeral(eq.items?.length || 0)} টি বাক্য ({toBengaliNumeral(eq.timeLimitMinutes || 15)} মিনিট)
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{eq.title}</h4>
                      </div>

                      {onDeleteEnglishQuestion && (
                        <button
                          onClick={() => onDeleteEnglishQuestion(eq.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="সেট মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {eq.items?.map((item, idx) => (
                        <div key={item.id || idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                          <p className="font-bold text-slate-900">
                            <span className="text-blue-600">{toBengaliNumeral(idx + 1)}. প্রশ্ন (বাংলা):</span> {item.bengaliSentence}
                          </p>
                          <p className="font-semibold text-emerald-700">
                            <span>ব্যাখ্যা/মডেল উত্তর (ইংরেজি):</span> "{item.englishSentence}"
                          </p>
                          {item.hints && (
                            <p className="text-[11px] text-amber-800 italic">
                              হিন্টস: {item.hints}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User English Exam Results Log */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">
              ইউজারদের ইংরেজি অনুবাদ মূল্যায়ন লগ ({toBengaliNumeral(englishResults.length)})
            </h3>

            {englishResults.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl">
                এখনো কোনো ইউজার ইংরেজি অনুবাদ জমা দেয়নি।
              </p>
            ) : (
              <div className="space-y-3">
                {englishResults.map((res) => (
                  <div key={res.id} className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900">
                        পরীক্ষার্থী: {res.userName} | তারিখ: {new Date(res.timestamp).toLocaleString('bn-BD')}
                      </span>
                      <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        নম্বর: {toBengaliNumeral(res.totalObtainedMarks)} / {toBengaliNumeral(res.totalMaxMarks)} ({toBengaliNumeral(res.overallAccuracy)}% সঠিকতা)
                      </span>
                    </div>

                    <p className="font-bold text-slate-800">
                      সেট: {res.setTitle}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 4: Smart AI Question Generator --- */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
              <span>স্মার্ট AI প্রশ্ন ও সেট জেনারেটর (Gemini Powered)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              যেকোনো বিষয় বা টপিকের নাম লিখুন, Gemini AI স্বয়ংক্রিয়ভাবে MCQ, লিখিত পরীক্ষা, ইংরেজি অনুবাদ চর্চা ও লাইভ পরীক্ষার প্রশ্ন প্রস্তুত করে দেবে।
            </p>
          </div>

          <div className="bg-teal-50/60 p-4 sm:p-5 rounded-2xl border border-teal-100 space-y-5">
            {/* AI Target Type 4-Segment Selector */}
            <div className="bg-white p-1.5 rounded-2xl grid grid-cols-2 lg:grid-cols-4 gap-1.5 border border-teal-200 shadow-xs">
              <button
                type="button"
                onClick={() => setAiTargetType('level')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  aiTargetType === 'level'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>🎯 প্রাকটিস MCQ</span>
              </button>

              <button
                type="button"
                onClick={() => setAiTargetType('live_exam')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  aiTargetType === 'live_exam'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>🔴 লাইভ পরীক্ষা MCQ</span>
              </button>

              <button
                type="button"
                onClick={() => setAiTargetType('written')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  aiTargetType === 'written'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>✍️ লিখিত পরীক্ষা</span>
              </button>

              <button
                type="button"
                onClick={() => setAiTargetType('english')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  aiTargetType === 'english'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>🇬🇧 ইংরেজি অনুবাদ চর্চা</span>
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {aiTargetType === 'written' 
                    ? 'লিখিত পরীক্ষার বিষয় বা টপিক:' 
                    : aiTargetType === 'english'
                    ? 'ইংরেজি অনুবাদ চর্চার বিষয়/প্যাসেজ টপিক:'
                    : 'টপিক বা বিষয়ের নাম লিখুন:'}
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder={
                    aiTargetType === 'written'
                      ? 'যেমন: বাংলাদেশের অর্থনৈতিক সমীক্ষা, ডিজিটাল নিরাপত্তা আইটি, আন্তর্জাতিক সংস্থা'
                      : aiTargetType === 'english'
                      ? 'যেমন: সংবাদপত্র সম্পাদকীয় অনুবাদ, দৈনন্দিন কথোপকথন, টেন্স ও পজিশন'
                      : 'যেমন: বাংলাদেশের মুক্তিযুদ্ধ, ব্যাংকিং ম্যাথ শর্টকাট, আইটি সিকিউরিটি'
                  }
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {aiTargetType === 'written' 
                    ? 'লিখিত প্রশ্নের সংখ্যা:' 
                    : aiTargetType === 'english'
                    ? 'অনুবাদ বাক্যের সংখ্যা:'
                    : 'প্রশ্নের সংখ্যা:'}
                </label>
                <div className="space-y-1.5">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={aiCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAiCount(isNaN(val) ? 1 : Math.max(1, Math.min(100, val)));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium">কুইক:</span>
                    {[3, 5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAiCount(num)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          aiCount === num
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num} টি
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode Specific Additional Options */}
            {aiTargetType === 'level' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">টার্গেট ক্যাটাগরি:</label>
                  <select
                    value={aiCat}
                    onChange={(e) => setAiCat(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameBn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    টার্গেট লেভেল নম্বর (১ থেকে ১,০০০,০০০):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={aiLevelNum}
                    onChange={(e) => setAiLevelNum(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-emerald-700"
                  />
                </div>
              </div>
            )}

            {aiTargetType === 'live_exam' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">টার্গেট লাইভ পরীক্ষা নির্বাচন করুন:</label>
                {liveExams.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
                    <span>কোনো লাইভ পরীক্ষা তৈরি করা নেই। আগে লাইভ পরীক্ষা তৈরি করুন।</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('live_exam')}
                      className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-[11px]"
                    >
                      + লাইভ পরীক্ষা তৈরি
                    </button>
                  </div>
                ) : (
                  <select
                    value={aiExamId || liveExams[0]?.id}
                    onChange={(e) => setAiExamId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-rose-50/60 border border-rose-300 rounded-xl text-xs sm:text-sm font-bold text-rose-950"
                  >
                    {liveExams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        🔴 {ex.title} (তারিখ: {ex.startDate})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {(aiTargetType === 'written' || aiTargetType === 'english') && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-3.5 rounded-xl border border-teal-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি:</label>
                  <select
                    value={aiCat}
                    onChange={(e) => setAiCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameBn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">লেভেল নাম্বার:</label>
                  <input
                    type="number"
                    min="1"
                    value={aiLevelNum}
                    onChange={(e) => setAiLevelNum(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">সেট নেম / সেট নম্বর:</label>
                  <input
                    type="text"
                    value={aiSetName}
                    onChange={(e) => setAiSetName(e.target.value)}
                    placeholder="যেমন: সেট ১"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">সময়সীমা (মিনিট):</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={aiTimeLimitMinutes}
                    onChange={(e) => setAiTimeLimitMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-blue-800"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateAi}
              disabled={isAiGenerating}
              className={`px-6 py-3.5 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                aiTargetType === 'written'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : aiTargetType === 'english'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : aiTargetType === 'live_exam'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isAiGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI দ্বারা জেনারেট হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {aiTargetType === 'written'
                      ? 'AI দিয়ে লিখিত পরীক্ষা তৈরি করুন'
                      : aiTargetType === 'english'
                      ? 'AI দিয়ে ইংরেজি অনুবাদ সেট তৈরি করুন'
                      : 'AI দিয়ে প্রশ্ন তৈরি করুন'}
                  </span>
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl">
              {aiError}
            </div>
          )}

          {/* Generated MCQ Questions Preview */}
          {aiGeneratedList.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  AI জেনারেটেড MCQ প্রশ্নাবলি ({toBengaliNumeral(aiGeneratedList.length)} টি):
                </h3>
                <button
                  onClick={handleSaveAiGenerated}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>সবগুলো MCQ সেভ করুন</span>
                </button>
              </div>

              <div className="space-y-3">
                {aiGeneratedList.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-slate-900">
                      {toBengaliNumeral(idx + 1)}. {q.questionText}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border ${
                            oIdx === q.correctAnswerIndex
                              ? 'bg-emerald-100 border-emerald-400 font-bold text-emerald-900'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          {toBengaliNumeral(oIdx + 1)}. {opt}
                        </div>
                      ))}
                    </div>
                    <div className="text-slate-600 italic pt-1 border-t border-slate-200/60">
                      ব্যাখ্যা: {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Written Exam Set Preview */}
          {aiGeneratedWrittenSet && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-md">
                        ✍️ AI জেনারেটেড লিখিত পরীক্ষা সেট
                      </span>
                      <span className="px-2.5 py-0.5 bg-white text-slate-700 text-[10px] font-bold rounded-md border border-slate-200">
                        {aiGeneratedWrittenSet.setName}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {aiGeneratedWrittenSet.title}
                    </h3>
                  </div>

                  <button
                    onClick={handleSaveAiWritten}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>সেভ করুন (লিখিত পরীক্ষা সেটে যুক্ত করুন)</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {aiGeneratedWrittenSet.questions?.map((sq, idx) => (
                    <div key={sq.id || idx} className="p-4 bg-white border border-amber-200 rounded-xl text-xs space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-amber-900 font-extrabold border-b border-slate-100 pb-1.5">
                        <span>প্রশ্ন #{toBengaliNumeral(sq.questionNum || idx + 1)}: {sq.questionText}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-black text-[11px]">
                          পূর্ণমান: {toBengaliNumeral(sq.marks || 10)}
                        </span>
                      </div>
                      <div className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-emerald-800 block mb-1">নমুনা মডেল উত্তর / বিবরণ:</span>
                        <p className="whitespace-pre-line text-xs">{sq.modelAnswer}</p>
                      </div>
                      {sq.hints && (
                        <div className="text-amber-800 italic text-[11px]">
                          💡 নির্দেশক/হিন্টস: {sq.hints}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generated English Translation Practice Set Preview */}
          {aiGeneratedEnglishSet && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-blue-200 text-blue-900 text-[10px] font-black rounded-md">
                        🇬🇧 AI জেনারেটেড ইংরেজি অনুবাদ চর্চা
                      </span>
                      <span className="px-2.5 py-0.5 bg-white text-slate-700 text-[10px] font-bold rounded-md border border-slate-200">
                        {aiGeneratedEnglishSet.setName}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {aiGeneratedEnglishSet.title}
                    </h3>
                  </div>

                  <button
                    onClick={handleSaveAiEnglish}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>সেভ করুন (ইংরেজি অনুবাদ সেটে যুক্ত করুন)</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {aiGeneratedEnglishSet.items?.map((it, idx) => (
                    <div key={it.id || idx} className="p-4 bg-white border border-blue-200 rounded-xl text-xs space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-blue-900 font-extrabold border-b border-slate-100 pb-1.5">
                        <span>বাক্য #{toBengaliNumeral(it.itemNum || idx + 1)} (বাংলা): {it.bengaliSentence}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md font-black text-[11px]">
                          পূর্ণমান: {toBengaliNumeral(it.marks || 10)}
                        </span>
                      </div>
                      <div className="text-emerald-900 font-bold bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                        <span>সঠিক মডেল অনুবাদ (ইংরেজি): </span>
                        <span className="text-emerald-950 font-black">"{it.englishSentence}"</span>
                      </div>
                      {it.hints && (
                        <div className="text-slate-600 italic text-[11px]">
                          💡 ভোকাবুলারি/গ্রামার টিপস: {it.hints}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* --- TAB 5: Question Bank Manager --- */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>প্রশ্ন ব্যাংক ব্যবস্থাপনা ({toBengaliNumeral(questions.length)} টি প্রশ্ন)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                সংরক্ষিত যেকোনো প্রশ্ন পর্যালোচনা, ফিল্টার বা মুছে ফেলুন।
              </p>
            </div>

            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'ডিফল্ট প্রশ্ন ব্যাংকে রিসেট',
                  message: 'আপনি কি নিশ্চিত যে সমস্ত প্রশ্ন কাস্টম পরিবর্তন মুছে ফেলে প্রাথমিক ডিফল্ট প্রশ্নমালার সেটে ফিরে যেতে চান?',
                  confirmText: 'হ্যাঁ, রিসেট করুন',
                  onConfirm: () => {
                    onResetQuestions();
                  }
                });
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer shrink-0"
            >
              ডিফল্ট প্রশ্নে রিসেট করুন
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              placeholder="প্রশ্ন বা ব্যাখ্যা দিয়ে খুঁজুন..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
            />

            <select
              value={bankTypeFilter}
              onChange={(e) => setBankTypeFilter(e.target.value as 'all' | 'level' | 'live_exam')}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
            >
              <option value="all">সকল প্রশ্নের ধরন</option>
              <option value="level">🎯 প্রাকটিস লেভেলের প্রশ্ন</option>
              <option value="live_exam">🔴 লাইভ পরীক্ষার প্রশ্ন</option>
            </select>

            <select
              value={bankCatFilter}
              onChange={(e) => setBankCatFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameBn}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filteredBankQuestions.map((q, idx) => {
              const isLive = q.questionType === 'live_exam' || !!q.examId;
              const liveExamObj = isLive ? liveExams.find(ex => ex.id === q.examId) : null;

              return (
                <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isLive ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-extrabold rounded-md text-[10px]">
                            🔴 লাইভ পরীক্ষা {liveExamObj ? `(${liveExamObj.title})` : ''}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-md text-[10px]">
                            🎯 লেভেল প্রশ্ন ({q.levelId ? `লেভেল ${toBengaliNumeral(String(q.levelId).replace('lvl_', ''))}` : 'সাধারণ'})
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        {toBengaliNumeral(idx + 1)}. {q.questionText}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteQuestion(q.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="প্রশ্ন মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border ${
                          oIdx === q.correctAnswerIndex
                            ? 'bg-emerald-100 border-emerald-400 font-bold text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {toBengaliNumeral(oIdx + 1)}. {opt}
                      </div>
                    ))}
                  </div>

                  <div className="text-slate-600 pt-1 border-t border-slate-200/60">
                    <strong>ব্যাখ্যা:</strong> {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 6: Exam Settings & SEO --- */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-emerald-600" />
              <span>কুইজ, পরীক্ষা ও ওয়েবসাইট এসইও সেটিংস</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              পরীক্ষার রুলস (নেগেটিভ মার্কিং, টাইমার), ওয়েবসাইট টাইটেল এবং গুগল সার্চ কনসোল ভেরিফিকেশন কোড সেট করুন।
            </p>
          </div>

          {settingsSuccess && (
            <div className="p-4 bg-emerald-50 text-emerald-900 text-xs font-bold rounded-2xl border border-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>সেটিংস ও এসইও ইনফরমেশন সফলভাবে সংরক্ষণ করা হয়েছে!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettingsForm} className="space-y-5 max-w-2xl">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>পরীক্ষার রুলস ও নেগেটিভ মার্কিং</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ভুল উত্তরে নেগেটিভ মার্ক:
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={negMarkInput}
                    onChange={(e) => setNegMarkInput(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    যেমন: 0.25 (প্রতি ভুলের জন্য)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ডিফল্ট সময়সীমা (মিনিট):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={timeLimitInput}
                    onChange={(e) => setTimeLimitInput(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাস পার্সেন্টেজ (% Target):
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={passPctInput}
                    onChange={(e) => setPassPctInput(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Google Search Console & SEO Section */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-4">
              <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-600" />
                <span>গুগল সার্চ কনসোল ও ওয়েবসাইট টাইটেল (SEO Connect)</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ওয়েবসাইট টাইটেল (Website Browser Title):
                </label>
                <input
                  type="text"
                  value={siteTitleInput}
                  onChange={(e) => setSiteTitleInput(e.target.value)}
                  placeholder="যেমন: LIVE SCHOOL - প্রফেশনাল অনলাইন শিক্ষা ও কুইজ পোর্টাল"
                  className="w-full px-4 py-2.5 bg-white border border-sky-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  গুগল সার্চ কনসোল ভেরিফিকেশন কোড / মেটা ট্যাগ (Google Search Console Meta Verification Code):
                </label>
                <input
                  type="text"
                  value={gscInput}
                  onChange={(e) => setGscInput(e.target.value)}
                  placeholder={`যেমন: google-site-verification=... বা <meta name="google-site-verification" content="..." />`}
                  className="w-full px-4 py-2.5 bg-white border border-sky-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900"
                />
                <p className="text-[11px] text-sky-800 mt-1 font-medium">
                  💡 গুগল সার্চ কনসোল (Google Search Console) থেকে প্রাপ্ত HTML Tag বা Verification string এখানে পেস্ট করে সেভ করুন। এটি স্বয়ংক্রিয়ভাবে ওয়েবসাইটের &lt;head&gt;-এ যুক্ত হয়ে গুগল ইণ্ডেক্স নিশ্চিত করবে।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>সেটিংস ও এসইও তথ্য আপডেট করুন</span>
              </button>
            </div>
          </form>

          {/* LocalStorage & Vercel / GitHub Deployment Info Box */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>গিটহাব (GitHub) ও ভার্সেল (Vercel) ডিপ্লয়মেন্ট নোট:</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার তৈরি করা সকল প্রশ্ন, লিখিত পরীক্ষা, লাইভ এক্সাম, লেভেল ক্যাটাগরি, সোশ্যাল লিঙ্ক এবং শিক্ষার্থীদের রেজাল্ট ডাটা সম্পূর্ণভাবে আপনার ব্রাউজারের <strong>LocalStorage</strong>-এ সংরক্ষিত থাকে। Vercel বা GitHub এ ডাইরেক্ট ডিপ্লয় করলেও কোন ডাটাবেজ ব্যাকএন্ড না থাকায় ডাটা কখনোই নষ্ট হবে না।
            </p>
          </div>
        </div>
      )}

      {/* --- TAB: Social Media Links --- */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <span>সোশ্যাল মিডিয়া লিঙ্ক ব্যবস্থাপনা</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              শিক্ষার্থীদের যোগাযোগের জন্য ফেসবুক পেইজ, ইউটিউব ভিডিও/চ্যানেল, টেলিগ্রাম, হোয়াটসঅ্যাপ ও ওয়েবসাইট লিঙ্ক সেট করুন।
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (onSaveSocialLinks) {
              onSaveSocialLinks(socialForm);
            } else {
              saveStoredSocialLinks(socialForm);
            }
            setSocialSuccess(true);
            setTimeout(() => setSocialSuccess(false), 3000);
          }} className="space-y-5">
            
            {/* Facebook Page / Group Link */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2">
              <label className="block text-xs font-bold text-blue-900 flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" />
                <span>📘 ফেসবুক পেইজ / গ্রুপ লিঙ্ক (Facebook Page/Group):</span>
              </label>
              <input
                type="url"
                value={socialForm.facebookPage || ''}
                onChange={(e) => setSocialForm({ ...socialForm, facebookPage: e.target.value })}
                placeholder="যেমন: https://facebook.com/yourpage"
                className="w-full px-4 py-2.5 rounded-xl border border-blue-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 font-medium text-sm bg-white"
              />
            </div>

            {/* YouTube Video / Channel Link */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2">
              <label className="block text-xs font-bold text-rose-900 flex items-center gap-2">
                <Youtube className="w-4 h-4 text-rose-600" />
                <span>📺 ইউটিউব চ্যানেল / ভিডিও লিঙ্ক (YouTube Video/Channel):</span>
              </label>
              <input
                type="url"
                value={socialForm.youtubeVideo || ''}
                onChange={(e) => setSocialForm({ ...socialForm, youtubeVideo: e.target.value })}
                placeholder="যেমন: https://youtube.com/@yourchannel বা https://youtu.be/..."
                className="w-full px-4 py-2.5 rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 text-slate-900 font-medium text-sm bg-white"
              />
            </div>

            {/* Telegram Channel / Group Link */}
            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-2">
              <label className="block text-xs font-bold text-sky-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600" />
                <span>✈️ টেলিগ্রাম চ্যানেল / গ্রুপ লিঙ্ক (Telegram Group/Channel):</span>
              </label>
              <input
                type="url"
                value={socialForm.telegramGroup || ''}
                onChange={(e) => setSocialForm({ ...socialForm, telegramGroup: e.target.value })}
                placeholder="যেমন: https://t.me/yourchannel"
                className="w-full px-4 py-2.5 rounded-xl border border-sky-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 text-slate-900 font-medium text-sm bg-white"
              />
            </div>

            {/* WhatsApp Link / Number */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
              <label className="block text-xs font-bold text-emerald-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>💬 হোয়াটসঅ্যাপ সাপোর্ট / গ্রুপ লিঙ্ক (WhatsApp Group/Contact):</span>
              </label>
              <input
                type="text"
                value={socialForm.whatsappNumber || ''}
                onChange={(e) => setSocialForm({ ...socialForm, whatsappNumber: e.target.value })}
                placeholder="যেমন: https://wa.me/8801700000000 বা https://chat.whatsapp.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 text-slate-900 font-medium text-sm bg-white"
              />
            </div>

            {/* Official Website Link */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2">
              <label className="block text-xs font-bold text-indigo-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>🌐 অফিসিয়াল ওয়েবসাইট লিঙ্ক (Official Website):</span>
              </label>
              <input
                type="url"
                value={socialForm.websiteUrl || ''}
                onChange={(e) => setSocialForm({ ...socialForm, websiteUrl: e.target.value })}
                placeholder="যেমন: https://smartquiz.com"
                className="w-full px-4 py-2.5 rounded-xl border border-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-slate-900 font-medium text-sm bg-white"
              />
            </div>

            {socialSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>সফলভাবে সোশ্যাল মিডিয়া লিঙ্কসমূহ সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>সোশ্যাল মিডিয়া লিঙ্কসমূহ সংরক্ষণ করুন</span>
            </button>
          </form>

          {/* Live Preview Box */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              📱 সাইটে যেভাবে সোশ্যাল বাটন দেখাবে (লাইভ প্রিভিউ):
            </h3>
            <div className="flex flex-wrap items-center gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {socialForm.facebookPage && (
                <a
                  href={socialForm.facebookPage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  <span>ফেসবুক পেজ</span>
                </a>
              )}
              {socialForm.youtubeVideo && (
                <a
                  href={socialForm.youtubeVideo}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-rose-700 transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  <span>ইউটিউব ভিডিও/চ্যানেল</span>
                </a>
              )}
              {socialForm.telegramGroup && (
                <a
                  href={socialForm.telegramGroup}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-500 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-sky-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>টেলিগ্রাম গ্রুপ</span>
                </a>
              )}
              {socialForm.whatsappNumber && (
                <a
                  href={socialForm.whatsappNumber.startsWith('http') ? socialForm.whatsappNumber : `https://wa.me/${socialForm.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>হোয়াটসঅ্যাপ</span>
                </a>
              )}
              {socialForm.websiteUrl && (
                <a
                  href={socialForm.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>ওয়েবসাইট</span>
                </a>
              )}
              {!socialForm.facebookPage && !socialForm.youtubeVideo && !socialForm.telegramGroup && !socialForm.whatsappNumber && !socialForm.websiteUrl && (
                <p className="text-xs text-slate-400 italic">কোনো লিঙ্ক দেওয়া নেই। লিঙ্ক দিলে এখানে সোশ্যাল বাটন ফুটে উঠবে।</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: Banner Slider Manager --- */}
      {activeTab === 'banners' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>হোমপেজ ব্যানার ও স্লাইডার ম্যানেজার</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              মূল হোমপেজের উপরে প্রদর্শিত ব্যানার স্লাইডার নিয়ন্ত্রণ করুন। টেক্সট বা ছবি দিয়ে কাস্টম ব্যানার স্লাইড তৈরি করা যাবে।
            </p>
          </div>

          {/* Create Banner Form */}
          <form onSubmit={handleAddBanner} className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-4">
            <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-700" />
              <span>নতুন ব্যানার স্লাইড যোগ করুন</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ব্যানার শিরোনাম (Title) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="যেমন: বিসিএস ও ব্যাংক জব প্রিপারেশন ২০২৬"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  উপশিরোনাম / বিবরণ (Subtitle) [ঐচ্ছিক]:
                </label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="যেমন: বিষয়ভিত্তিক অনুশীলন, লাইভ টেস্ট ও মডেল অ্যানসার সহ প্রিপারেশন নিন।"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ব্যাজ টেক্সট (Badge) [ঐচ্ছিক]:
                </label>
                <input
                  type="text"
                  value={bannerBadge}
                  onChange={(e) => setBannerBadge(e.target.value)}
                  placeholder="যেমন: 🔥 হট অফার, 🔴 লাইভ এক্সাম"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  থিম কালার (রঙের গ্রেডিয়েন্ট):
                </label>
                <select
                  value={bannerTheme}
                  onChange={(e: any) => setBannerTheme(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="teal">Teal Emerald (সবুজ-টিয়াল)</option>
                  <option value="indigo">Indigo Blue (গাঢ় নীল)</option>
                  <option value="amber">Amber Orange (কমলা-হলুদ)</option>
                  <option value="rose">Rose Red (গোলাপী-লাল)</option>
                  <option value="emerald">Emerald Green (মার্কেটিং সবুজ)</option>
                  <option value="purple">Royal Purple (বেগুনি)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ইমেজ URL (ছবির ওয়েবলিংক) [ঐচ্ছিক]:
                </label>
                <input
                  type="url"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="যেমন: https://example.com/banner.jpg"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টার্গেট বাটন/ওয়েব লিঙ্ক (Link URL) [ঐচ্ছিক]:
                </label>
                <input
                  type="url"
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  placeholder="যেমন: https://facebook.com/yourpage"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>ব্যানার স্লাইড যুক্ত করুন</span>
            </button>

            {bannerSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{bannerSuccessMsg}</span>
              </div>
            )}
          </form>

          {/* Current Banner List */}
          <div className="space-y-4 pt-2">
            <h3 className="font-extrabold text-slate-900 text-sm">
              বর্তমান ব্যানার স্লাইডসমূহ ({toBengaliNumeral(bannerList.length)}টি):
            </h3>

            {bannerList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">কোনো ব্যানার স্লাইড নেই। নতুন স্লাইড যোগ করুন।</p>
            ) : (
              <div className="space-y-3">
                {bannerList.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      banner.isActive
                        ? 'bg-white border-slate-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          #{toBengaliNumeral(index + 1)}
                        </span>
                        {banner.badgeText && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            {banner.badgeText}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            banner.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {banner.isActive ? '🟢 সচল' : '⚪ অসচল'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm">{banner.title}</h4>
                      {banner.subtitle && (
                        <p className="text-xs text-slate-600 font-medium">{banner.subtitle}</p>
                      )}

                      {banner.imageUrl && (
                        <p className="text-[11px] text-blue-600 truncate font-mono">
                          🖼️ চিত্র: {banner.imageUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBannerActive(banner.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          banner.isActive
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {banner.isActive ? 'অসচল করুন' : 'সচল করুন'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 7: Leaderboard / User Exam Results Manager --- */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>পরীক্ষার্থীদের সম্পন্ন পরীক্ষার সার্বিক রেজাল্ট রেকর্ড</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                MCQ কুইজ, লিখিত পরীক্ষা এবং ইংরেজি চর্চার সম্পন্ন পরীক্ষার মার্কস ও সময়কাল।
              </p>
            </div>

            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'সমস্ত রেজাল্ট মুছে ফেলার নিশ্চিতকরণ (Clear All Results)',
                  message: 'আপনি কি নিশ্চিত যে MCQ কুইজ, লাইভ এক্সাম, লিখিত পরীক্ষা এবং ইংরেজি চর্চার সমস্ত অর্জিত রেজাল্ট ও ইতিহাস স্থায়ীভাবে মুছে ফেলতে চান? এই পরিবর্তনটি আর ফিরিয়ে আনা সম্ভব হবে না।',
                  confirmText: 'হ্যাঁ, নিশ্চিত মুছে ফেলুন',
                  onConfirm: () => {
                    onClearResults();
                  }
                });
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>সমস্ত রেজাল্ট ক্লিয়ার করুন</span>
            </button>
          </div>

          {/* Results Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">MCQ কুইজ রেকর্ড</span>
                <span className="text-2xl font-extrabold text-emerald-950">{toBengaliNumeral(results.length)}টি</span>
              </div>
              <Check className="w-6 h-6 text-emerald-600 opacity-80" />
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-800 uppercase block">লিখিত পরীক্ষা রেকর্ড</span>
                <span className="text-2xl font-extrabold text-indigo-950">{toBengaliNumeral(writtenResults.length)}টি</span>
              </div>
              <PenTool className="w-6 h-6 text-indigo-600 opacity-80" />
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-800 uppercase block">ইংরেজি অনুবাদ রেকর্ড</span>
                <span className="text-2xl font-extrabold text-purple-950">{toBengaliNumeral(englishResults.length)}টি</span>
              </div>
              <Sparkles className="w-6 h-6 text-purple-600 opacity-80" />
            </div>
          </div>

          {/* MCQ Results Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>১. MCQ কুইজ ও লাইভ পরীক্ষা ফলাফল ({toBengaliNumeral(results.length)})</span>
            </h3>

            {results.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3">কোনো MCQ পরীক্ষার রেকর্ড নেই।</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">ইউজার নাম</th>
                      <th className="p-3">পরীক্ষা ও লেভেল</th>
                      <th className="p-3">স্কোর</th>
                      <th className="p-3">সময়</th>
                      <th className="p-3">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-500">{toBengaliNumeral(i + 1)}</td>
                        <td className="p-3 font-bold text-slate-900">{r.userName}</td>
                        <td className="p-3">{r.categoryName} ({r.levelName})</td>
                        <td className="p-3 font-bold text-emerald-700">{toBengaliNumeral(r.finalScore)} / {toBengaliNumeral(r.maxPossibleScore)}</td>
                        <td className="p-3 text-slate-600">{r.timeSpentFormatted}</td>
                        <td className="p-3 text-slate-500 text-xs">{new Date(r.timestamp).toLocaleString('bn-BD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Written Exam Results Table */}
          {writtenResults.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>২. লিখিত পরীক্ষা ফলাফল ({toBengaliNumeral(writtenResults.length)})</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">পরীক্ষার্থী</th>
                      <th className="p-3">পরীক্ষার বিষয়</th>
                      <th className="p-3">প্রাপ্ত মার্কস</th>
                      <th className="p-3">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {writtenResults.map((wr, i) => (
                      <tr key={wr.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-500">{toBengaliNumeral(i + 1)}</td>
                        <td className="p-3 font-bold text-slate-900">{wr.userName}</td>
                        <td className="p-3 font-medium text-slate-700">{wr.questionTitle}</td>
                        <td className="p-3 font-bold text-indigo-700">
                          {toBengaliNumeral(wr.totalObtainedMarks ?? wr.obtainedMarks ?? 0)} / {toBengaliNumeral(wr.totalMaxMarks ?? wr.maxMarks ?? 10)}
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{new Date(wr.timestamp).toLocaleString('bn-BD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* English Exam Results Table */}
          {englishResults.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>৩. ইংরেজি অনুবাদ চর্চা ফলাফল ({toBengaliNumeral(englishResults.length)})</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">পরীক্ষার্থী</th>
                      <th className="p-3">সেটের নাম</th>
                      <th className="p-3">অর্জিত নম্বর</th>
                      <th className="p-3">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {englishResults.map((er, i) => (
                      <tr key={er.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-500">{toBengaliNumeral(i + 1)}</td>
                        <td className="p-3 font-bold text-slate-900">{er.userName}</td>
                        <td className="p-3 font-medium text-slate-700">{er.setName}</td>
                        <td className="p-3 font-bold text-purple-700">
                          {toBengaliNumeral(er.obtainedMarks)} / {toBengaliNumeral(er.totalMarks)}
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{new Date(er.timestamp).toLocaleString('bn-BD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- In-App Custom Confirm Delete Modal --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100/80 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">{confirmModal.title}</h3>
                <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider mt-0.5">নিশ্চিতকরণ আবশ্যক</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{confirmModal.confirmText || 'হ্যাঁ, মুছে ফেলুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
