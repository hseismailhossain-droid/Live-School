import { WrittenEvaluation } from '../types';

/**
 * Completely Offline Written Answer Evaluator for Bengali & English written exams.
 * Analyzes candidate answers against admin model answers locally in browser.
 */
export function evaluateWrittenAnswerOffline(
  questionText: string,
  modelAnswer: string,
  userAnswer: string,
  maxMarks: number = 10
): WrittenEvaluation {
  if (!userAnswer || !userAnswer.trim()) {
    return {
      obtainedMarks: 0,
      matchPercentage: 0,
      feedback: 'কোনো উত্তর প্রদান করা হয়নি। অনুগ্রহ করে বিস্তারিত লিখিত উত্তর ইনপুট করুন।',
      keyPointsFound: [],
      keyPointsMissing: ['সম্পূর্ণ উত্তর অনুপস্থিত।'],
    };
  }

  // Normalize text for Bengali and English
  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/[^\u0980-\u09FFa-zA-Z0-9\s]/g, ' ') // keep Bengali, English & digits
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  const cleanModel = normalizeText(modelAnswer);
  const cleanUser = normalizeText(userAnswer);

  // Stopwords list for Bengali to ignore common words like এবং, কিন্তু, এর, দিয়ে etc.
  const bgStopwords = new Set([
    'এবং', 'কিন্তু', 'বা', 'অথবা', 'অতএব', 'সুতরাং', 'তবে', 'তাই', 'জন্য', 'থেকে', 'চেয়ে', 'দ্বারা', 
    'দিয়ে', 'হতে', 'ছিল', 'হবে', 'হয়', 'করে', 'করা', 'করেছে', 'বলেন', 'বলা', 'যেমন', 'একটি', 'এই', 
    'সেই', 'তার', 'তাদের', 'এর', 'কে', 'রে', 'তে', 'এ', 'আমার', 'আমাদের', 'আপনার', 'আপনারা', 'is', 'are', 'the', 'and', 'or', 'to', 'in', 'of', 'for', 'with', 'on', 'at'
  ]);

  // Extract model answer words and filter out stopwords and very short words
  const modelWords = cleanModel
    .split(' ')
    .filter((w) => w.length > 1 && !bgStopwords.has(w));

  const userWords = cleanUser
    .split(' ')
    .filter((w) => w.length > 1 && !bgStopwords.has(w));

  const uniqueModelWords = Array.from(new Set(modelWords));
  const uniqueUserWords = Array.from(new Set(userWords));

  // 1. Exact & Partial Word Matching
  const matchedWords: string[] = [];
  const missingWords: string[] = [];

  for (const mWord of uniqueModelWords) {
    if (cleanUser.includes(mWord)) {
      matchedWords.push(mWord);
    } else {
      // Try stem/substring match (e.g. "স্বাধীনতার" vs "স্বাধীনতা")
      const matchedPartial = uniqueUserWords.some(
        (uWord) => (mWord.length > 3 && uWord.length > 3 && (mWord.includes(uWord) || uWord.includes(mWord)))
      );
      if (matchedPartial) {
        matchedWords.push(mWord);
      } else {
        missingWords.push(mWord);
      }
    }
  }

  // Calculate word match ratio (0.0 to 1.0)
  const wordMatchRatio = uniqueModelWords.length > 0 ? matchedWords.length / uniqueModelWords.length : 0;

  // 2. Length & Detail Depth Ratio
  // An adequate answer should generally have at least 50% of the word volume of the model answer
  const modelWordCount = modelWords.length;
  const userWordCount = userWords.length;
  const lengthRatio = Math.min(1.0, userWordCount / Math.max(1, modelWordCount * 0.5));

  // 3. Extract Key Phrase Clusters / N-grams (sentences or clauses)
  const modelSentences = modelAnswer
    .split(/[।!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const keyPointsFound: string[] = [];
  const keyPointsMissing: string[] = [];

  modelSentences.forEach((sentence, idx) => {
    const sWords = normalizeText(sentence)
      .split(' ')
      .filter((w) => w.length > 2 && !bgStopwords.has(w));

    if (sWords.length === 0) return;

    // Check how many words of this sentence exist in user answer
    const hits = sWords.filter((w) => cleanUser.includes(w)).length;
    const sentenceScore = hits / sWords.length;

    // Short label for the sentence
    const phraseLabel = sentence.length > 40 ? sentence.substring(0, 38) + '...' : sentence;

    if (sentenceScore >= 0.35) {
      keyPointsFound.push(`গুরুত্বপূর্ণ অংশ অন্তর্ভুক্ত: "${phraseLabel}"`);
    } else {
      keyPointsMissing.push(`অনুপস্থিত ব্যাখ্যা: "${phraseLabel}"`);
    }
  });

  // Combined Weighting Algorithm:
  // 65% Word Accuracy + 25% Key Sentence Coverage + 10% Depth/Length
  const sentenceCoverageRatio = modelSentences.length > 0 ? (keyPointsFound.length / modelSentences.length) : wordMatchRatio;
  
  const rawScorePct = (wordMatchRatio * 0.65) + (sentenceCoverageRatio * 0.25) + (lengthRatio * 0.10);
  const matchPercentage = Math.min(100, Math.max(0, Math.round(rawScorePct * 100)));

  // Calculate Obtained Marks
  const obtainedScore = (matchPercentage / 100) * maxMarks;
  // Round to nearest 0.5 (e.g., 7.5, 8.0, 8.5)
  const obtainedMarks = Math.min(maxMarks, Math.max(0, Math.round(obtainedScore * 2) / 2));

  // Construct Bengali Feedback
  let feedback = '';
  if (matchPercentage >= 85) {
    feedback = 'অসাধারণ উত্তর! আপনার উত্তরে এডমিনের দেওয়া সঠিক উত্তরের ব্যাখ্যার মূল তথ্য, সাল ও গুরুত্বপূর্ণ শব্দগুলো চমৎকারভাবে ফুটে উঠেছে।';
  } else if (matchPercentage >= 70) {
    feedback = 'খুব ভালো উত্তর! আপনি আদর্শ উত্তরের অধিকাংশ প্রধান পয়েন্ট কভার করেছেন। ১০/১০ পেতে আরও স্পষ্ট ও বিস্তারিত বাক্য ব্যবহার করুন।';
  } else if (matchPercentage >= 50) {
    feedback = 'মাঝারি উত্তর। বেশ কিছু প্রয়োজনীয় তথ্য ও মূল পয়েন্ট বাদ পড়েছে। আদর্শ ব্যাখ্যার সাথে নিজের দেওয়া উত্তর মিলিয়ে রিভিশন দিন।';
  } else if (matchPercentage >= 25) {
    feedback = 'আংশিক উত্তর মিলেছে। উত্তরের গভীরতা ও প্রয়োজনীয় মূল তথ্য কম রয়েছে। অনুগ্রহ করে সঠিক উত্তরের ব্যাখ্যাটি পড়ে আবার অনুশীলন করুন।';
  } else {
    feedback = 'উত্তরের সাথে এডমিনের সঠিক উত্তরের ব্যাখ্যার মিল বেশ কম। পয়েন্ট আকারে ও প্রাসঙ্গিক মূল তথ্যসহ রিটেন লেখার ব্যাকরণ অনুসরণ করার পরামর্শ দেওয়া হচ্ছে।';
  }

  return {
    obtainedMarks,
    matchPercentage,
    feedback,
    keyPointsFound: keyPointsFound.slice(0, 5),
    keyPointsMissing: keyPointsMissing.slice(0, 5),
  };
}
