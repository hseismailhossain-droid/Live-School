import { Category, Question, QuizSettings } from '../types';

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  negativeMarkPerWrong: 0.25,
  passPercentage: 50,
  timeLimitMinutes: 10,
  showExplanationImmediately: true,
  soundEnabled: true,
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'job_prep',
    name: 'Live Job Preparation',
    nameBn: '🎯 লাইভ জব প্রস্তুতি',
    iconName: 'Briefcase',
    description: 'বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও সকল সরকারি-বেসরকারি চাকরির লেভেলভিত্তিক মডেল টেস্ট ও কুইজ প্রস্তুতি।',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    levels: [
      {
        id: 'job_prep-l1',
        levelNumber: 1,
        name: 'Level 1: Foundation',
        nameBn: 'লেভেল ১ (সহজ ও মৌলিক)',
        description: 'সাধারণ জ্ঞান, বাংলা ব্যাকরণ ও মৌলিক বিষয়াবলী',
        defaultTimeLimitMinutes: 10,
        defaultNegativeMarking: 0.25,
      },
      {
        id: 'job_prep-l2',
        levelNumber: 2,
        name: 'Level 2: Standard',
        nameBn: 'লেভেল ২ (মধ্যম মান)',
        description: 'বাংলাদেশ বিষয়াবলী, আন্তর্জাতিক, গণিত ও ইংরেজি',
        defaultTimeLimitMinutes: 12,
        defaultNegativeMarking: 0.25,
      },
      {
        id: 'job_prep-l3',
        levelNumber: 3,
        name: 'Level 3: Advanced',
        nameBn: 'লেভেল ৩ (উচ্চতর ও কঠিন)',
        description: 'বিসিএস ও ব্যাংক অফিসার কাঠিন্যের পূর্ণাঙ্গ মডেল টেস্ট',
        defaultTimeLimitMinutes: 15,
        defaultNegativeMarking: 0.50,
      },
      {
        id: 'job_prep-l4',
        levelNumber: 4,
        name: 'Level 4: Master',
        nameBn: 'লেভেল ৪ (মাষ্টার চ্যালেঞ্জ)',
        description: 'অগ্রগামী রিভিশন ও বিশেষ বিষয়ভিত্তিক সেট',
        defaultTimeLimitMinutes: 15,
        defaultNegativeMarking: 0.50,
      },
      {
        id: 'job_prep-l5',
        levelNumber: 5,
        name: 'Level 5: Special',
        nameBn: 'লেভেল ৫ (স্পেশাল কুইজ)',
        description: 'সর্বশেষ প্রশ্নের সাম্প্রতিক রিভিশন ও মডেল টেস্ট',
        defaultTimeLimitMinutes: 15,
        defaultNegativeMarking: 0.50,
      }
    ]
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  // --- Job Prep Level 1 ---
  {
    id: 'job-101',
    categoryId: 'job_prep',
    levelId: 'job_prep-l1',
    questionText: 'বাংলা সাহিত্যের প্রথম সাশ্রয়ী আধুনিক উপন্যাস কোনটি এবং এর রচয়িতা কে?',
    options: [
      'বিষাদ সিন্ধু - মীর মশাররফ হোসেন',
      'ফুলমণি ও করুণার বিবরণ - হানা ক্যাথরিন মুলেন্স',
      'দুর্গেশনন্দিনী - বঙ্কিমচন্দ্র চট্টোপাধ্যায়',
      'কপালকুণ্ডলা - বঙ্কিমচন্দ্র চট্টোপাধ্যায়'
    ],
    correctAnswerIndex: 2,
    explanation: '১৮৬৫ সালে প্রকাশিত বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের "দুর্গেশনন্দিনী" বাংলা সাহিত্যের প্রথম সার্থক আধুনিক উপন্যাস বলে স্বীকৃত।',
    points: 1
  },
  {
    id: 'job-102',
    categoryId: 'job_prep',
    levelId: 'job_prep-l1',
    questionText: 'বাংলাদেশের সংবিধানের প্রথম অনুচ্ছেদে কী উল্লেখ রয়েছে?',
    options: [
      'প্রজাতন্ত্রের রাষ্ট্রভাষা বাংলা',
      'বাংলাদেশ একটি একক ও স্বাধীন সার্বভৌম গণপ্রজাতন্ত্র',
      'রাষ্ট্র পরিচালনার মূলনীতিসমূহ',
      'মৌলিক অধিকারের নিশ্চয়তা'
    ],
    correctAnswerIndex: 1,
    explanation: 'বাংলাদেশ সংবিধানের অনুচ্ছেদ ১ অনুযায়ী: "বাংলাদেশ একটি একক, স্বাধীন ও সার্বভৌম গণপ্রজাতন্ত্র যাহা \'গণপ্রজাতন্ত্রী বাংলাদেশ\' নামে পরিচিত হইবে।"'
  },
  {
    id: 'job-103',
    categoryId: 'job_prep',
    levelId: 'job_prep-l1',
    questionText: 'চর্যাপদের সবচেয়ে বেশি পদ রচয়িতা কে?',
    options: [
      'লুইপা',
      'ভুসুকুপা',
      'কাণহপা',
      'শবরপা'
    ],
    correctAnswerIndex: 2,
    explanation: 'চর্যাপদের সর্বাধিক ১৩টি পদের রচয়িতা কাণহপা (বা কৃষ্ণপাদ)।'
  },
  {
    id: 'job-104',
    categoryId: 'job_prep',
    levelId: 'job_prep-l1',
    questionText: 'কাজী নজরুল ইসলামের বিদ্রোহী কবিতাটি কোন কাব্যের অন্তর্ভুক্ত?',
    options: [
      'বিষের বাঁশী',
      'অগ্নিবীণা',
      'প্রলয়শিখা',
      'সিন্ধু-হিন্দোল'
    ],
    correctAnswerIndex: 1,
    explanation: '১৯২২ সালে প্রকাশিত অগ্নিবীণা কাব্যগ্রন্থের দ্বিতীয় কবিতা হল "বিদ্রোহী"।'
  },
  {
    id: 'job-105',
    categoryId: 'job_prep',
    levelId: 'job_prep-l1',
    questionText: 'কম্পিউটারের মস্তিষ্ক বলা হয় কোন অংশকে?',
    options: [
      'RAM',
      'Hard Disk',
      'CPU (Central Processing Unit)',
      'Motherboard'
    ],
    correctAnswerIndex: 2,
    explanation: 'CPU বা Central Processing Unit কে কম্পিউটারের ব্রেইন বা মস্তিষ্ক বলা হয়।'
  },

  // --- Job Prep Level 2 ---
  {
    id: 'job-201',
    categoryId: 'job_prep',
    levelId: 'job_prep-l2',
    questionText: 'জাতিসংঘের বর্তমান সদস্য সংখ্যা কত এবং সর্বশেষ যুক্ত হওয়া দেশ কোনটি?',
    options: [
      '১৯২ - পূর্ব তিমুর',
      '১৯৩ - দক্ষিণ সুদান',
      '১৯৪ - ফিলিস্তিন',
      '১৯১ - সুইজারল্যান্ড'
    ],
    correctAnswerIndex: 1,
    explanation: 'জাতিসংঘের বর্তমান সদস্য দেশ ১৯৩টি। ২০১১ সালের ১৪ জুলাই ১৯৩তম সদস্য হিসেবে দক্ষিণ সুদান যোগদান করে।'
  },
  {
    id: 'job-202',
    categoryId: 'job_prep',
    levelId: 'job_prep-l2',
    questionText: 'জলবায়ু পরিবর্তনের প্রভাব মোকাবিলায় "Green Climate Fund" (GCF) এর সদর দপ্তর কোথায় অবস্থিত?',
    options: [
      'জেনেভা, সুইজারল্যান্ড',
      'ইনচিওন, দক্ষিণ কোরিয়া',
      'প্যারিস, ফ্রান্স',
      'বন, জার্মানি'
    ],
    correctAnswerIndex: 1,
    explanation: 'সবুজ জলবায়ু তহবিল বা GCF এর সদর দফতর দক্ষিণ কোরিয়ার ইনচিওন শহরের সংডো-তে অবস্থিত।'
  },
  {
    id: 'job-203',
    categoryId: 'job_prep',
    levelId: 'job_prep-l2',
    questionText: 'বাংলাদেশ ব্যাংক কত সালে প্রতিষ্ঠিত হয় এবং এটি কোন আদেশের মাধ্যমে প্রতিষ্ঠিত?',
    options: [
      '১৯৭১ - স্বাধীনতা সনদ',
      '১৯৭২ - বাংলাদেশ ব্যাংক অর্ডার ১৯৭২ (P.O. No. 127 of 1972)',
      '১৯৭৩ - ব্যাংক কোম্পানি আইন',
      '১৯৭৪ - অর্থ মন্ত্রণালয় আদেশ'
    ],
    correctAnswerIndex: 1,
    explanation: '১৯৭২ সালের ১৬ ডিসেম্বর বাংলাদেশ ব্যাংক অর্ডার ১৯৭২ কার্যকর করা হয়।'
  },
  {
    id: 'job-204',
    categoryId: 'job_prep',
    levelId: 'job_prep-l2',
    questionText: 'An amount of $5,000 is invested at 8% simple annual interest. What is the total interest earned in 3 years?',
    options: [
      '$1,000',
      '$1,200',
      '$1,500',
      '$1,800'
    ],
    correctAnswerIndex: 1,
    explanation: 'Simple Interest = P × r × t = 5000 × 0.08 × 3 = $1,200.'
  },

  // --- Job Prep Level 3 ---
  {
    id: 'job-301',
    categoryId: 'job_prep',
    levelId: 'job_prep-l3',
    questionText: 'একটি ঘড়িতে ৪টা বেজে ২০ মিনিট বাজলে ঘণ্টা ও মিনিটের কাঁটার মধ্যবর্তী কোণ কত ডিগ্রি হবে?',
    options: [
      '১০°',
      '১৫°',
      '২০°',
      '০°'
    ],
    correctAnswerIndex: 0,
    explanation: 'সূত্র: θ = | (১১ × M - ৬০ × H) / ২ | = | (১১ × ২০ - ৬০ × ৪) / ২ | = ১০°।'
  },
  {
    id: 'job-302',
    categoryId: 'job_prep',
    levelId: 'job_prep-l3',
    questionText: 'বাংলাদেশের জাতীয় আয় গণনায় অর্থনীতিকে প্রধানত কয়টি খাতে ভাগ করা হয়?',
    options: [
      '১৫ টি',
      '১৯ টি',
      '২১ টি',
      '২৩ টি'
    ],
    correctAnswerIndex: 1,
    explanation: 'বিবিএস (BBS) এর ভিত্তি বছর অনুযায়ী দেশের জিডিপি গণনায় অর্থনীতিকে ১৯টি প্রধান খাতে বিভক্ত করা হয়েছে।'
  }
];
