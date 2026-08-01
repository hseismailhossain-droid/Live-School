import { Category, LiveExam, Question, QuizResult, QuizSettings, UserSession, WrittenQuestion, WrittenExamResult, EnglishQuestionSet, EnglishExamResult, SocialLinks, BannerSlide } from '../types';
import { DEFAULT_QUIZ_SETTINGS, INITIAL_CATEGORIES, INITIAL_QUESTIONS } from '../data/initialData';

const STORAGE_KEYS = {
  QUESTIONS: 'smartquiz_questions_v1',
  SETTINGS: 'smartquiz_settings_v1',
  LEADERBOARD: 'smartquiz_leaderboard_v1',
  USER_SESSION: 'smartquiz_user_session_v1',
  LIVE_EXAMS: 'smartquiz_live_exams_v1',
  CATEGORIES: 'smartquiz_categories_v1',
  WRITTEN_QUESTIONS: 'smartquiz_written_questions_v1',
  WRITTEN_RESULTS: 'smartquiz_written_results_v1',
  ENGLISH_QUESTIONS: 'smartquiz_english_questions_v1',
  ENGLISH_RESULTS: 'smartquiz_english_results_v1',
  SOCIAL_LINKS: 'smartquiz_social_links_v1',
  BANNERS: 'smartquiz_banners_v1',
};

// --- Categories Storage & Level Helpers ---
export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    let cats: Category[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cats = parsed;
      }
    }
    
    // Ensure we only have job_prep and it has the updated nameBn
    let jobPrepCat = cats.find((c) => c.id === 'job_prep');
    
    // Merge levels if bcs exists or if jobPrepCat is missing
    const bcsCat = cats.find((c) => c.id === 'bcs');
    const existingLevels = jobPrepCat?.levels || INITIAL_CATEGORIES[0].levels;
    if (bcsCat && bcsCat.levels) {
      bcsCat.levels.forEach((lvl) => {
        if (!existingLevels.some((l) => l.id === lvl.id || l.levelNumber === lvl.levelNumber)) {
          existingLevels.push(lvl);
        }
      });
    }

    const singleCategory: Category = {
      id: 'job_prep',
      name: 'Live Job Preparation',
      nameBn: '🎯 লাইভ জব প্রস্তুতি',
      iconName: 'Briefcase',
      description: 'বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও সকল সরকারি-বেসরকারি চাকরির লেভেলভিত্তিক মডেল টেস্ট ও কুইজ প্রস্তুতি।',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      levels: existingLevels,
    };

    saveStoredCategories([singleCategory]);
    return [singleCategory];
  } catch (err) {
    saveStoredCategories(INITIAL_CATEGORIES);
    return INITIAL_CATEGORIES;
  }
}

export function saveStoredCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories', err);
  }
}

// Automatically ensure a level number exists in a category
export function ensureCategoryLevel(
  categories: Category[],
  categoryId: string,
  levelNum: number
): { updatedCategories: Category[]; levelId: string } {
  const catsCopy = JSON.parse(JSON.stringify(categories)) as Category[];
  let targetCat = catsCopy.find((c) => c.id === categoryId);

  if (!targetCat) {
    // Default to first category or create job_prep
    targetCat = catsCopy[0] || {
      id: 'job_prep',
      name: 'Live Job Preparation',
      nameBn: '🎯 লাইভ জব প্রস্তুতি',
      iconName: 'Briefcase',
      description: 'সরকারি ও বেসরকারি চাকরির পূর্ণাঙ্গ প্রস্তুতি কুইজ।',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      levels: [],
    };
    if (!catsCopy.find((c) => c.id === targetCat!.id)) {
      catsCopy.push(targetCat);
    }
  }

  const levelId = `${targetCat.id}-l${levelNum}`;
  let existingLevel = targetCat.levels.find((l) => l.levelNumber === levelNum || l.id === levelId);

  if (!existingLevel) {
    const newLvl = {
      id: levelId,
      levelNumber: levelNum,
      name: `Level ${levelNum}`,
      nameBn: `লেভেল ${toBengaliNumeral(levelNum)}`,
      description: `লেভেল ${toBengaliNumeral(levelNum)} মডেল টেস্ট ও কুইজ প্রশ্ন সেট`,
      defaultTimeLimitMinutes: 10,
      defaultNegativeMarking: 0.25,
    };
    targetCat.levels.push(newLvl);
    // Sort levels by levelNumber
    targetCat.levels.sort((a, b) => a.levelNumber - b.levelNumber);
  }

  saveStoredCategories(catsCopy);
  return { updatedCategories: catsCopy, levelId };
}

// --- Questions Storage ---
export function getStoredQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    let qs: Question[] = [];
    if (!raw) {
      qs = INITIAL_QUESTIONS;
    } else {
      const parsed = JSON.parse(raw);
      qs = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_QUESTIONS;
    }

    // Normalize categoryId and levelId so admin questions always match level filters
    const sanitized = qs.map((q) => {
      let levelNum = 1;
      if (q.levelId) {
        const numMatch = q.levelId.match(/\d+/);
        if (numMatch) {
          levelNum = parseInt(numMatch[0], 10);
        }
      }
      return {
        ...q,
        categoryId: 'job_prep',
        levelId: `job_prep-l${levelNum}`,
      };
    });

    saveStoredQuestions(sanitized);
    return sanitized;
  } catch (err) {
    console.error('Error reading stored questions', err);
    return INITIAL_QUESTIONS.map(q => ({
      ...q,
      categoryId: 'job_prep',
      levelId: q.levelId ? `job_prep-l${q.levelId.match(/\d+/)?.[0] || 1}` : 'job_prep-l1',
    }));
  }
}

export function saveStoredQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.error('Error saving questions', err);
  }
}

export function resetQuestionsToDefault(): Question[] {
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
  return INITIAL_QUESTIONS;
}

// --- Live Exam Storage ---
export function getStoredLiveExams(): LiveExam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIVE_EXAMS);
    if (!raw) return getInitialSampleLiveExams();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialSampleLiveExams();
  } catch (err) {
    return getInitialSampleLiveExams();
  }
}

export function saveStoredLiveExams(exams: LiveExam[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LIVE_EXAMS, JSON.stringify(exams));
  } catch (err) {
    console.error('Error saving live exams', err);
  }
}

export function getInitialSampleLiveExams(): LiveExam[] {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const samples: LiveExam[] = [
    {
      id: 'exam_live_101',
      title: 'বিশেষ জব প্রস্তুতি মডেল টেস্ট - ২০২৬',
      description: 'সরকারি চাকরি ও বিসিএস প্রিলিমিনারি পরীক্ষার স্পেশাল লাইভ কুইজ',
      categoryId: 'job_prep',
      levelId: 'job_prep-l1',
      startDate: todayStr,
      startTime: '08:00',
      endDate: todayStr,
      endTime: '23:59',
      durationMinutes: 10,
      negativeMarking: 0.25,
      passPercentage: 50,
      questionCount: 10,
      instructions: 'পরীক্ষা শুরুর পর প্রতিটি ভুল উত্তরের জন্য ০.২৫ মার্কস কাটা যাবে। সম্পূর্ণ টাইমারের মধ্যে সাবমিট করুন।',
      createdAt: new Date().toISOString(),
    }
  ];
  return samples;
}

// --- Quiz Settings Storage ---
export function getStoredQuizSettings(): QuizSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_QUIZ_SETTINGS));
      return DEFAULT_QUIZ_SETTINGS;
    }
    return { ...DEFAULT_QUIZ_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_QUIZ_SETTINGS;
  }
}

export function saveStoredQuizSettings(settings: QuizSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings', err);
  }
}

// --- Leaderboard Storage ---
export function getStoredLeaderboard(): QuizResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function saveQuizResultToLeaderboard(result: QuizResult): QuizResult[] {
  try {
    const current = getStoredLeaderboard();
    const updated = [result, ...current];
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving quiz result', err);
    return [];
  }
}

export function clearStoredLeaderboard(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD);
  } catch (err) {
    console.error('Error clearing leaderboard', err);
  }
}

// --- User Session Storage ---
export function getStoredUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && typeof session.name === 'string') {
      if (session.name.includes('admin@') || session.name.includes('smartquiz') || session.name.includes('এডমিন পোর্টাল')) {
        session.name = 'LIVE SCHOOL';
      }
    }
    return session;
  } catch (err) {
    return null;
  }
}

export function saveStoredUserSession(session: UserSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Error saving session', err);
  }
}

// --- Audio Sound Chime Generator (Web Audio API) ---
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSoundEffect(type: 'correct' | 'wrong' | 'complete') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'complete') {
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, index) => {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(f, now + index * 0.12);
        subGain.gain.setValueAtTime(0.15, now + index * 0.12);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.3);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now + index * 0.12);
        subOsc.stop(now + index * 0.12 + 0.3);
      });
    }
  } catch (e) {
    // Ignored
  }
}

// Bengali Number Formatting Utility
export function toBengaliNumeral(num: number | string | null | undefined): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  const enToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.'
  };
  return str.replace(/[0-9]/g, (digit) => enToBn[digit] || digit);
}

export function ensureWrittenSubQuestions(wq: WrittenQuestion): WrittenQuestion {
  if (wq.questions && wq.questions.length > 0) {
    return wq;
  }
  return {
    ...wq,
    questions: [
      {
        id: wq.id + '_sq1',
        questionNum: 1,
        questionText: wq.questionText || wq.title,
        modelAnswer: wq.modelAnswer || '',
        marks: wq.marks || 10,
        hints: wq.hints || '',
      },
    ],
  };
}

// --- Written Questions & Results Storage ---
export function getInitialSampleWrittenQuestions(): WrittenQuestion[] {
  return [
    {
      id: 'wq_101',
      categoryId: 'job_prep',
      categoryName: 'বিসিএস ও ব্যাংক রিটেন',
      levelNum: 1,
      setNum: 1,
      setName: 'সেট ১: বিষয়ভিত্তিক ইতিহাস ও বাংলাদেশ',
      title: 'সেট ১: বাংলাদেশ ও মুক্তিসংগ্রাম বিশেষ প্রশ্ন সেট',
      timeLimitMinutes: 25,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'sq_101_1',
          questionNum: 1,
          questionText: '১. (ক) বাংলাদেশের ঐতিহাসিক ৭ই মার্চের ভাষণের রাজনৈতিক গুরুত্ব ও ইউনেস্কোর আন্তর্জাতিক দলিল হিসেবে স্বীকৃতির তাৎপর্য সংক্ষেপে আলোচনা করুন।',
          modelAnswer: '১৯৭১ সালের ৭ই মার্চ তৎকালীন ঢাকা রেসকোর্স ময়দানে জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমান এক ঐতিহাসিক ভাষণ প্রদান করেন। ১৮ মিনিটের এই ভাষণে তিনি বাঙালি জাতিকে স্বাধীনতার চূড়ান্ত দিকনির্দেশনা প্রদান করেন এবং বলেন "এবারের সংগ্রাম আমাদের মুক্তির সংগ্রাম, এবারের সংগ্রাম স্বাধীনতার সংগ্রাম"। রাজনৈতিকভাবে এই ভাষণ পুরো বাঙালি জাতিকে স্বাধিকার আন্দোলনে ঐক্যবদ্ধ করে। ২০১৭ সালের ৩০ অক্টোবর ইউনেস্কো এই ভাষণটিকে "মেমোরি অফ দ্য ওয়ার্ল্ড ডকুমেন্টারি হেরিটেজ" হিসেবে স্বীকৃতি দেয়।',
          marks: 10,
          hints: 'রেসকোর্স ময়দান, ৭ই মার্চ ১৯৭১, ইউনেস্কো স্বীকৃতি ২০১৭, মুক্তির সংগ্রাম ও স্বাধীনতার সংগ্রাম পয়েন্টগুলো রাখুন।',
        },
        {
          id: 'sq_101_2',
          questionNum: 2,
          questionText: '২. (খ) ১৯৬৬ সালের ঐতিহাসিক ৬ দফা দাবিকে কেন "বাঙালির সনদের খেতাব (ম্যাগনা কার্টা)" বলা হয়? সংক্ষেপে বিশ্লেষণ করুন।',
          modelAnswer: '১৯৬৬ সালের ৫-৬ ফেব্রুয়ারি লাহোরে অনুষ্ঠিত বিরোধী দলগুলোর সম্মেলনে বঙ্গবন্ধু শেখ মুজিবুর রহমান ঐতিহাসিক ৬ দফা দাবি পেশ করেন। এটি ছিল তৎকালীন পূর্ব পাকিস্তানের (বর্তমান বাংলাদেশ) সাহিত্য শাসন ও স্বাধিকারের মূল ভিত্তি। এতে পৃথক মুদ্রা ব্যবস্থা, নিজস্ব শুল্কনীতি, ব্যাংক ব্যবস্থার দাবি করা হয়েছিল। বাঙালির সামাজিক, অর্থনৈতিক ও রাজনৈতিক মুক্তির দিশারী হওয়ায় এটিকে "বাঙালির সনদের খেতাব বা সনদ (ম্যাগনা কার্টা)" বলা হয়।',
          marks: 10,
          hints: '১৯৬৬ সালের ৫-৬ ফেব্রুয়ারি, স্বায়ত্তশাসন, পৃথক মুদ্রানীতি ও ম্যাগনা কার্টা শব্দগুলো উল্লেখ করুন।',
        },
      ],
    },
    {
      id: 'wq_102',
      categoryId: 'job_prep',
      categoryName: 'স্মার্ট বাংলাদেশ ও তথ্যপ্রযুক্তি',
      levelNum: 2,
      setNum: 2,
      setName: 'সেট ২: আধুনিক তথ্যপ্রযুক্তি ও অর্থনীতি',
      title: 'সেট ২: স্মার্ট বাংলাদেশ ও ৪র্থ শিল্পবিপ্লব সেট',
      timeLimitMinutes: 20,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'sq_102_1',
          questionNum: 1,
          questionText: '১. (ক) "স্মার্ট বাংলাদেশ ২০৪১" অর্জনের ৪টি মূল স্তম্ভ কী কী? প্রতিটি স্তম্ভের সংক্ষেপ বিবরণ দিন।',
          modelAnswer: 'স্মার্ট বাংলাদেশ ২০৪১ অর্জনের ৪টি প্রধান স্তম্ভ হলো: ১. স্মার্ট সিটিজেন (Smart Citizen) - তথ্যপ্রযুক্তিতে দক্ষ ও নাগরিক সচেতন সুনাগরিক গড়ে তোলা। ২. স্মার্ট গভর্মেন্ট (Smart Government) - সরকারি সকল সেবা ডিজিটাল ও ক্যাশলেস করা। ৩. স্মার্ট সোসাইটি (Smart Society) - অন্তর্ভুক্তিমূলক ও আধুনিক ক্যাশলেস সমাজ। ৪. স্মার্ট ইকোনমি (Smart Economy) - জ্ঞানভিত্তিক অর্থনীতি ও আইটি রফতানি বৃদ্ধি।',
          marks: 10,
          hints: 'স্মার্ট সিটিজেন, স্মার্ট গভর্মেন্ট, স্মার্ট সোসাইটি ও স্মার্ট ইকোনমি স্পষ্ট করে লিখুন।',
        },
        {
          id: 'sq_102_2',
          questionNum: 2,
          questionText: '২. (খ) ৪র্থ শিল্পবিপ্লবে (4IR) কৃত্রিম বুদ্ধিমত্তা (AI) ও অটোমেশনের ইতিবাচক ও নেতিবাচক প্রভাব বিশ্লেষণ করুন।',
          modelAnswer: '৪র্থ শিল্পবিপ্লবে কৃত্রিম বুদ্ধিমত্তা (AI) ও অটোমেশনের ইতিবাচক প্রভাবের মধ্যে রয়েছে উৎপাদনশীলতা বৃদ্ধি, চিকিৎসা ও প্রযুক্তিতে বৈপ্লবিক পরিবর্তন, সময় ও শ্রম সাশ্রয়। অন্যদিকে নেতিবাচক প্রভাবের মধ্যে রয়েছে প্রথাগত নিম্ন-দক্ষ কাজের বিলুপ্তি, সাইবার নিরাপত্তা ঝুঁকি ও বৈষম্য বৃদ্ধি। তাই দক্ষ মানবসম্পদ ও উপযুক্ত নীতি প্রণয়ন জরুরি।',
          marks: 10,
          hints: 'উৎপাদনশীলতা বৃদ্ধি, কর্মসংস্থান ঝুঁকি ও দক্ষ মানবসম্পদ শব্দগুলো সংক্ষেপে তুলে ধরুন।',
        },
      ],
    },
    {
      id: 'wq_103',
      categoryId: 'job_prep',
      categoryName: 'ব্যাংক ও বিষয়ভিত্তিক হিসাববিজ্ঞান',
      levelNum: 3,
      setNum: 3,
      setName: 'সেট ৩: ব্যাংকিং ও আর্থিক খাত',
      title: 'সেট ৩: ব্যাংকিং ও আর্থিক খাত বিশেষ সেট',
      timeLimitMinutes: 20,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'sq_103_1',
          questionNum: 1,
          questionText: '১. (ক) মুদ্রাস্ফীতি কী? মুদ্রাস্ফীতি নিয়ন্ত্রণে বাংলাদেশ ব্যাংকের রেপো রেট (Repo Rate) ও নীতি সুদের হারের ভূমিকা আলোচনা করুন।',
          modelAnswer: 'মুদ্রাস্ফীতি (Inflation) হলো নির্দিষ্ট সময়ে পণ্য ও সেবার সাধারণ মূল্যস্তর বৃদ্ধি ও অর্থের ক্রয়ক্ষমতা হ্রাস। বাংলাদেশ ব্যাংক সংকুচিত মুদ্রানীতির অংশ হিসেবে রেপো রেট বা নীতি সুদের হার বৃদ্ধি করে। এতে ব্যাংকগুলোর ঋণ গ্রহণের ব্যয় বাড়ে, ঋণের সুদের হার বাড়ে, বাজারে টাকার সরবরাহ কমে এবং মুদ্রাস্ফীতি নিয়ন্ত্রণে আসে।',
          marks: 10,
          hints: 'সুদের হার বৃদ্ধি, বাজারে কাঁচা টাকার যোগান হ্রাস ও চাহিদা নিয়ন্ত্রণের পয়েন্ট ব্যাখ্যা করুন।',
        },
      ],
    }
  ];
}

export function getStoredWrittenQuestions(): WrittenQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WRITTEN_QUESTIONS);
    if (!raw) {
      const initial = getInitialSampleWrittenQuestions();
      localStorage.setItem(STORAGE_KEYS.WRITTEN_QUESTIONS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(ensureWrittenSubQuestions);
    }
    return getInitialSampleWrittenQuestions();
  } catch (err) {
    return getInitialSampleWrittenQuestions();
  }
}

export function saveStoredWrittenQuestions(questions: WrittenQuestion[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WRITTEN_QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.error('Error saving written questions', err);
  }
}

export function getStoredWrittenResults(): WrittenExamResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WRITTEN_RESULTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function saveWrittenResult(result: WrittenExamResult): WrittenExamResult[] {
  try {
    const current = getStoredWrittenResults();
    const updated = [result, ...current];
    localStorage.setItem(STORAGE_KEYS.WRITTEN_RESULTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving written result', err);
    return [];
  }
}

export function clearStoredWrittenResults(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WRITTEN_RESULTS);
  } catch (err) {
    console.error('Error clearing written results', err);
  }
}

// --- English Question Sets Storage ---
export function getInitialSampleEnglishQuestions(): EnglishQuestionSet[] {
  return [
    {
      id: 'eq_101',
      categoryId: 'job_prep',
      categoryName: 'দৈনন্দিন ইংরেজি ও অনুবাদ',
      levelNum: 1,
      setNum: 1,
      setName: 'সেট ১: মৌলিক বাক্য গঠন ও অনুবাদ চর্চা',
      title: 'সেট ১: দৈনন্দিন জীবনের ১০টি গুরুত্বপূর্ণ ইংরেজি অনুবাদ',
      timeLimitMinutes: 15,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'eq_item_101_1',
          itemNum: 1,
          bengaliSentence: 'আমি প্রতিদিন সকালে পার্কে হাঁটি।',
          englishSentence: 'I walk in the park every morning.',
          hints: 'walk = হাঁটা, park = পার্ক, morning = সকাল',
          marks: 10,
        },
        {
          id: 'eq_item_101_2',
          itemNum: 2,
          bengaliSentence: 'সততাই সর্বোত্তম পন্থা।',
          englishSentence: 'Honesty is the best policy.',
          hints: 'Honesty = সততা, best = সর্বোত্তম, policy = পন্থা',
          marks: 10,
        },
        {
          id: 'eq_item_101_3',
          itemNum: 3,
          bengaliSentence: 'সে একজন সৎ ও পরিশ্রমী ছাত্র।',
          englishSentence: 'He is an honest and industrious student.',
          hints: 'honest = সৎ, industrious = পরিশ্রমী',
          marks: 10,
        },
        {
          id: 'eq_item_101_4',
          itemNum: 4,
          bengaliSentence: 'আমাদের দেশে অনেক সুন্দর নদী আছে।',
          englishSentence: 'There are many beautiful rivers in our country.',
          hints: 'beautiful = সুন্দর, rivers = নদীসমূহ, country = দেশ',
          marks: 10,
        }
      ]
    },
    {
      id: 'eq_102',
      categoryId: 'job_prep',
      categoryName: 'বিসিএস ও ব্যাংক ইংরেজি অনুবাদ',
      levelNum: 2,
      setNum: 2,
      setName: 'সেট ২: চাকরি পরীক্ষার কমন ইংরেজি অনুবাদ',
      title: 'সেট ২: বিসিএস ও ব্যাংক প্রিলিমিনারি গুরুত্বপূর্ণ অনুবাদ',
      timeLimitMinutes: 20,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'eq_item_102_1',
          itemNum: 1,
          bengaliSentence: 'ঢাকা বুড়িগঙ্গা নদীর তীরে অবস্থিত।',
          englishSentence: 'Dhaka stands on the bank of the Buriganga.',
          hints: 'stands on the bank = নদীর তীরে অবস্থিত',
          marks: 10,
        },
        {
          id: 'eq_item_102_2',
          itemNum: 2,
          bengaliSentence: 'সে গতকাল ঢাকা ত্যাগ করেছে।',
          englishSentence: 'He left Dhaka yesterday.',
          hints: 'left = ত্যাগ করেছে, yesterday = গতকাল',
          marks: 10,
        },
        {
          id: 'eq_item_102_3',
          itemNum: 3,
          bengaliSentence: 'ধৈর্য ধারণ করো, ভালো দিন আসছে।',
          englishSentence: 'Have patience, good days are coming.',
          hints: 'patience = ধৈর্য',
          marks: 10,
        }
      ]
    }
  ];
}

export function getStoredEnglishQuestions(): EnglishQuestionSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENGLISH_QUESTIONS);
    if (!raw) {
      const initial = getInitialSampleEnglishQuestions();
      localStorage.setItem(STORAGE_KEYS.ENGLISH_QUESTIONS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getInitialSampleEnglishQuestions();
  } catch (err) {
    return getInitialSampleEnglishQuestions();
  }
}

export function saveStoredEnglishQuestions(questions: EnglishQuestionSet[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ENGLISH_QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.error('Error saving English question sets', err);
  }
}

export function getStoredEnglishResults(): EnglishExamResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENGLISH_RESULTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function saveEnglishResult(result: EnglishExamResult): EnglishExamResult[] {
  try {
    const current = getStoredEnglishResults();
    const updated = [result, ...current];
    localStorage.setItem(STORAGE_KEYS.ENGLISH_RESULTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving English result', err);
    return [];
  }
}

export function clearStoredEnglishResults(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ENGLISH_RESULTS);
  } catch (err) {
    console.error('Error clearing English results', err);
  }
}

// --- Social Links Storage ---
export function getStoredSocialLinks(): SocialLinks {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOCIAL_LINKS);
    if (!raw) {
      return {
        facebookPage: 'https://facebook.com',
        youtubeVideo: 'https://youtube.com',
        telegramGroup: '',
        whatsappNumber: '',
        websiteUrl: '',
      };
    }
    const parsed = JSON.parse(raw);
    return {
      facebookPage: parsed.facebookPage || '',
      youtubeVideo: parsed.youtubeVideo || '',
      telegramGroup: parsed.telegramGroup || '',
      whatsappNumber: parsed.whatsappNumber || '',
      websiteUrl: parsed.websiteUrl || '',
    };
  } catch (err) {
    return {
      facebookPage: 'https://facebook.com',
      youtubeVideo: 'https://youtube.com',
      telegramGroup: '',
      whatsappNumber: '',
      websiteUrl: '',
    };
  }
}

export function saveStoredSocialLinks(links: SocialLinks): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SOCIAL_LINKS, JSON.stringify(links));
  } catch (err) {
    console.error('Error saving social links', err);
  }
}

// --- Banners Storage ---
export const INITIAL_BANNERS: BannerSlide[] = [
  {
    id: 'b1',
    title: 'বিসিএস ও ব্যাংক জব স্পেশাল প্রিপারেশন ২০২৬',
    subtitle: 'স্মার্ট AI সাপোর্ট সহ মডেল টেস্ট, বিষয়ভিত্তিক অনুশীলন ও রিয়েল-টাইম মেধা তালিকা।',
    badgeText: '🔥 জনপ্রিয় ও হট',
    themeColor: 'teal',
    isActive: true,
  },
  {
    id: 'b2',
    title: 'লাইভ মডেল টেস্ট ও লিখিত পরীক্ষা স্পেশাল',
    subtitle: 'সময়সীমাবদ্ধ সরাসরি পরীক্ষা দিন এবং AI দিয়ে লিখিত খাতা মূল্যায়ন পান।',
    badgeText: '🔴 লাইভ এক্সাম',
    themeColor: 'rose',
    isActive: true,
  },
  {
    id: 'b3',
    title: 'ইংরেজি অনুবাদ ও ভোকাবুলারি মাস্টার সেট',
    subtitle: 'দৈনিক বাংলা থেকে ইংরেজি অনুবাদ চর্চা করুন ও মডেল অ্যানসার শিখুন।',
    badgeText: '🇬🇧 ইংরেজি স্পেশাল',
    themeColor: 'indigo',
    isActive: true,
  },
];

export function getStoredBanners(): BannerSlide[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BANNERS);
    if (!raw) return INITIAL_BANNERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_BANNERS;
  } catch (err) {
    return INITIAL_BANNERS;
  }
}

export function saveStoredBanners(banners: BannerSlide[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(banners));
  } catch (err) {
    console.error('Error saving banners', err);
  }
}

