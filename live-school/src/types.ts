export interface Question {
  id: string;
  categoryId: string;
  levelId: string;
  questionText: string;
  options: [string, string, string, string]; // 4 options
  correctAnswerIndex: number; // 0, 1, 2, or 3
  explanation: string; // সঠিক উত্তরের বর্ণনা/ব্যাখ্যা
  points?: number; // Default 1
  examId?: string; // Required if created for a specific live exam
  questionType?: 'level' | 'live_exam'; // Indicates whether it's a level question or live exam question
  imageUrl?: string; // গণিত চিত্র, ত্রিভুজ বা ডায়াগ্রাম URL / Data URI
  explanationImageUrl?: string; // ব্যাখ্যার সাথে চিত্র / সমাধান ডায়াগ্রাম
}

export interface LevelInfo {
  id: string;
  levelNumber: number;
  name: string;
  nameBn: string;
  description: string;
  defaultTimeLimitMinutes: number;
  defaultNegativeMarking: number;
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  iconName: string;
  description: string;
  badgeColor: string;
  levels: LevelInfo[];
}

export interface LiveExam {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  levelId?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  durationMinutes: number;
  negativeMarking: number;
  passPercentage: number;
  questionCount: number;
  instructions: string;
  createdAt: string;
  status?: 'upcoming' | 'live' | 'ended';
}

export interface QuizAnswerRecord {
  questionId: string;
  questionText: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  imageUrl?: string;
  explanationImageUrl?: string;
}

export interface QuizResult {
  id: string;
  userName: string;
  categoryId: string;
  categoryName: string;
  levelId: string;
  levelName: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  negativeMarkRate: number;
  negativeMarksDeducted: number;
  finalScore: number;
  maxPossibleScore: number;
  percentage: number;
  timeSpentSeconds: number;
  timeSpentFormatted: string; // e.g. "০২ মিনিট ৪৫ সেকেন্ড"
  timestamp: string; // ISO date string
  answersDetail: QuizAnswerRecord[];
  examId?: string; // Optional if taken as part of a Live Exam
  examTitle?: string;
}

export interface WrittenSubQuestion {
  id: string;
  questionNum: number;
  questionText: string;
  modelAnswer: string;
  marks: number;
  hints?: string;
  imageUrl?: string; // প্রশ্ন চিত্র বা জ্যামিতিক ডায়াগ্রাম
  modelAnswerImageUrl?: string; // উত্তরের চিত্র বা সমাধান ডায়াগ্রাম
}

export interface WrittenQuestion {
  id: string;
  categoryId: string;
  categoryName?: string;
  levelNum?: number; // আনলিমিটেড লেভেল (১, ২, ৩... ১,০০০,০০০)
  setNum?: number; // আনলিমিটেড প্রশ্ন সেট নম্বর (১, ২, ৩... ১,০০০,০০০)
  setName?: string; // রিটেন প্রশ্ন সেটের নাম (যেমন: সেট ১, সেট ২)
  title: string;
  questions?: WrittenSubQuestion[]; // সেটের অন্তর্ভুক্ত সকল লিখিত প্রশ্নাবলী
  questionText?: string; // Backward compatibility
  modelAnswer?: string; // Backward compatibility
  marks?: number; // Backward compatibility
  timeLimitMinutes?: number; // সময়সীমা
  hints?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface WrittenEvaluation {
  obtainedMarks: number;
  matchPercentage: number;
  feedback: string;
  keyPointsFound: string[];
  keyPointsMissing: string[];
}

export interface WrittenSubResult {
  questionId: string;
  questionNum: number;
  questionText: string;
  userAnswer: string;
  modelAnswer: string;
  maxMarks: number;
  obtainedMarks: number;
  matchPercentage: number;
  feedback: string;
  keyPointsFound?: string[];
  keyPointsMissing?: string[];
  imageUrl?: string;
  modelAnswerImageUrl?: string;
}

export interface WrittenExamResult {
  id: string;
  userName: string;
  questionId: string;
  questionTitle: string;
  subResults?: WrittenSubResult[]; // সেটের প্রতি প্রশ্নের রেজাল্ট
  totalMaxMarks?: number;
  totalObtainedMarks?: number;
  overallMatchPercentage?: number;
  questionText?: string; // Single question fallback
  userAnswer?: string; // Single question fallback
  modelAnswer?: string; // Single question fallback
  maxMarks?: number;
  obtainedMarks?: number;
  matchPercentage?: number;
  feedback?: string;
  keyPointsFound?: string[];
  keyPointsMissing?: string[];
  timestamp: string;
}

export interface QuizSettings {
  negativeMarkPerWrong: number; // e.g. 0.25
  passPercentage: number; // e.g. 50
  timeLimitMinutes: number; // e.g. 10
  showExplanationImmediately: boolean;
  soundEnabled: boolean;
  googleSearchConsoleCode?: string;
  siteTitle?: string;
}

export interface UserSession {
  name: string;
  isAdmin: boolean;
}

export interface SocialLinks {
  facebookPage?: string;
  youtubeVideo?: string;
  telegramGroup?: string;
  whatsappNumber?: string;
  websiteUrl?: string;
}

// --- English Learning & Translation Types ---
export interface EnglishItem {
  id: string;
  itemNum: number;
  bengaliSentence: string;  // বাংলা প্রশ্ন
  englishSentence: string;  // সঠিক ইংরেজি উত্তর (ব্যাখ্যা)
  hints?: string;            // ভোকাবুলারি বা গ্রামার টিপস
  marks?: number;            // পূর্ণমান (ডিফল্ট ১০)
}

export interface EnglishQuestionSet {
  id: string;
  categoryId: string;
  categoryName?: string;
  levelNum?: number;
  setNum?: number;
  setName?: string;
  title: string;
  items: EnglishItem[];
  timeLimitMinutes?: number;
  createdAt: string;
}

export interface EnglishSubResult {
  itemId: string;
  itemNum: number;
  bengaliSentence: string;
  userEnglishAnswer: string;
  modelEnglishSentence: string;
  maxMarks: number;
  obtainedMarks: number;
  accuracyPercentage: number;
  feedback: string;
  matchedWords: string[];
  missingWords: string[];
}

export interface EnglishExamResult {
  id: string;
  userName: string;
  setId: string;
  setTitle: string;
  subResults: EnglishSubResult[];
  totalMaxMarks: number;
  totalObtainedMarks: number;
  overallAccuracy: number;
  timestamp: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  imageUrl?: string;
  linkUrl?: string;
  themeColor?: 'teal' | 'indigo' | 'amber' | 'rose' | 'emerald' | 'purple';
  isActive: boolean;
}
