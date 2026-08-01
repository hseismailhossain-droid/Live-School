/**
 * Smart Offline English Translation & Sentence Builder Evaluator
 */

export interface EnglishEvalResult {
  obtainedMarks: number;
  accuracyPercentage: number;
  feedback: string;
  matchedWords: string[];
  missingWords: string[];
}

export function evaluateEnglishTranslationOffline(
  bengaliQuestion: string,
  modelEnglishSentence: string,
  userEnglishAnswer: string,
  maxMarks: number = 10
): EnglishEvalResult {
  const normUser = normalizeEnglishText(userEnglishAnswer);
  const normModel = normalizeEnglishText(modelEnglishSentence);

  if (!normUser) {
    return {
      obtainedMarks: 0,
      accuracyPercentage: 0,
      feedback: 'কোনো ইংরেজি উত্তর দেওয়া হয়নি।',
      matchedWords: [],
      missingWords: extractWords(modelEnglishSentence),
    };
  }

  const modelWords = normModel.split(/\s+/).filter(Boolean);
  const userWords = normUser.split(/\s+/).filter(Boolean);

  // Exact match check
  if (normUser === normModel) {
    return {
      obtainedMarks: maxMarks,
      accuracyPercentage: 100,
      feedback: 'অসাধারণ! সম্পূর্ণ ১০০% সঠিক ও নির্ভুল ইংরেজি বাক্য গঠন। 🎉',
      matchedWords: modelWords,
      missingWords: [],
    };
  }

  // Word overlap and order analysis
  const matchedWords: string[] = [];
  const missingWords: string[] = [];
  const modelWordCount = modelWords.length;

  const tempUserWords = [...userWords];
  for (const mWord of modelWords) {
    const idx = tempUserWords.indexOf(mWord);
    if (idx !== -1) {
      matchedWords.push(mWord);
      tempUserWords.splice(idx, 1);
    } else {
      missingWords.push(mWord);
    }
  }

  // Word presence match ratio
  const wordMatchRatio = modelWordCount > 0 ? matchedWords.length / modelWordCount : 0;

  // Sequence / Levenshtein distance factor
  const simRatio = computeSimilarityRatio(normUser, normModel);

  // Combined accuracy score
  let accuracyPct = Math.round((wordMatchRatio * 0.4 + simRatio * 0.6) * 100);
  if (accuracyPct > 100) accuracyPct = 100;
  if (accuracyPct < 0) accuracyPct = 0;

  const obtainedMarks = Math.round(((accuracyPct / 100) * maxMarks) * 10) / 10;

  let feedback = '';
  if (accuracyPct >= 90) {
    feedback = 'চমৎকার! সামান্য বানান বা যতিচিহ্ন ছাড়া বাক্য গঠন একদম সঠিক।';
  } else if (accuracyPct >= 75) {
    feedback = 'খুব ভালো চেষ্টা! ব্যাকরণ ও ইংরেজি বাক্যের অর্থ প্রায় পুরোপুরি ঠিক আছে।';
  } else if (accuracyPct >= 50) {
    feedback = 'মোটামুটি উত্তর হয়েছে। কিছু প্রয়োজনীয় শব্দ মিস হয়েছে বা পজিশন এলোমেলো রয়েছে।';
  } else {
    feedback = 'আরও অনুশীলনের প্রয়োজন। সঠিক মডেল ইংরেজি বাক্যটি মনোযোগ দিয়ে লক্ষ্য করুন।';
  }

  return {
    obtainedMarks,
    accuracyPercentage: accuracyPct,
    feedback,
    matchedWords,
    missingWords,
  };
}

function normalizeEnglishText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWords(str: string): string[] {
  return normalizeEnglishText(str).split(/\s+/).filter(Boolean);
}

function computeSimilarityRatio(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Speech synthesis helper to pronounce English sentences
 */
export function speakEnglishSentence(text: string): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } else {
    alert('আপনার ডিভাইসে অডিও স্পিচ সুবিধা উপলব্ধ নেই।');
  }
}
