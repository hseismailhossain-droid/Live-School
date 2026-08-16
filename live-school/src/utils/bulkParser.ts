import { Question } from '../types';

/**
 * Maps raw answer string (letter, numeral, option text, or phrase) to option index 0..3
 */
export function resolveAnswerIndex(
  rawAnswerStr: string,
  options: string[]
): number {
  if (!rawAnswerStr) return 0;
  const str = rawAnswerStr.trim();
  if (!str) return 0;

  // 1. Clean brackets, parentheses, colons, spaces, quotes
  const cleanStr = str
    .replace(/^(?:অপশন|বিকল্প|option)\s*/i, '')
    .replace(/^[\(\[\{<"'\`\*\✓\✔\s]+|[\)\]\}>"'\`\*\✓\✔\.\,\;\:\s]+$/g, '')
    .trim();

  const lower = cleanStr.toLowerCase();

  // ক / a / A / 1 / ১
  if (
    lower === 'ক' ||
    lower === 'a' ||
    lower === '1' ||
    lower === '১' ||
    /^(?:option|অপশন|বিকল্প)\s*(?:a|1|১|ক)$/i.test(lower)
  ) {
    return 0;
  }

  // খ / b / B / 2 / ২
  if (
    lower === 'খ' ||
    lower === 'b' ||
    lower === '2' ||
    lower === '২' ||
    /^(?:option|অপশন|বিকল্প)\s*(?:b|2|২|খ)$/i.test(lower)
  ) {
    return 1;
  }

  // গ / c / C / 3 / ৩
  if (
    lower === 'গ' ||
    lower === 'c' ||
    lower === '3' ||
    lower === '৩' ||
    /^(?:option|অপশন|বিকল্প)\s*(?:c|3|৩|গ)$/i.test(lower)
  ) {
    return 2;
  }

  // ঘ / d / D / 4 / ৪
  if (
    lower === 'ঘ' ||
    lower === 'd' ||
    lower === '4' ||
    lower === '৪' ||
    /^(?:option|অপশন|বিকল্প)\s*(?:d|4|৪|ঘ)$/i.test(lower)
  ) {
    return 3;
  }

  // 2. Check if it starts with an option identifier (e.g. "খ. ঢাকা" or "(গ) রাজশাহী" or "B) Dhaka")
  const startLetterMatch = str.match(/^[\(\[]?\s*([ক-ঘa-dA-D1-4১-৪])\s*[\)\]\.\:\-]/i);
  if (startLetterMatch) {
    const char = startLetterMatch[1].toLowerCase();
    if (['ক', 'a', '1', '১'].includes(char)) return 0;
    if (['খ', 'b', '2', '২'].includes(char)) return 1;
    if (['গ', 'c', '3', '৩'].includes(char)) return 2;
    if (['ঘ', 'd', '4', '৪'].includes(char)) return 3;
  }

  // 3. Match against options text directly (e.g. if answer is "ঢাকা" and option 2 is "ঢাকা")
  if (options && options.length > 0) {
    const normalize = (s: string) =>
      s
        .replace(/^[\*\✓\✔\s]*[\(\[]?\s*[ক-ঘa-dA-D1-4১-৪]\s*[\)\]\.\:\-]\s*/, '')
        .replace(/[\(\[\{].*?[\)\]\}]/g, '') // remove inline notes
        .replace(/[\s\.,:;\-_=–—'"\/\\!?|]+/g, '')
        .toLowerCase()
        .trim();

    const targetNorm = normalize(str);

    if (targetNorm) {
      for (let i = 0; i < options.length; i++) {
        const optNorm = normalize(options[i]);
        if (optNorm && (optNorm === targetNorm || optNorm === targetNorm.slice(0, optNorm.length))) {
          return i;
        }
      }
    }
  }

  return 0;
}

/**
 * Extracts multiple options from a line if multiple options are placed together
 * (e.g., "ক. অপশন ১  খ. অপশন ২  গ. অপশন ৩  ঘ. অপশন ৪")
 */
function extractOptionsFromLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  // Match all option headers in the line
  const optHeaderRegex = /(?:^|\s{2,}|\t|\s+)(?:[\(\[]?\s*([ক-ঘa-dA-D1-4১-৪])\s*[\)\]\.\:\-]|\[([ক-ঘa-dA-D1-4১-৪])\]|\(([ক-ঘa-dA-D1-4১-৪])\))\s*/g;
  
  const matches = [...trimmed.matchAll(optHeaderRegex)];
  if (matches.length > 1) {
    const results: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const startIdx = matches[i].index! + matches[i][0].length;
      const endIdx = i + 1 < matches.length ? matches[i + 1].index! : trimmed.length;
      const optText = trimmed.substring(startIdx, endIdx).trim();
      if (optText) {
        results.push(optText);
      }
    }
    return results;
  }

  // Single option on this line
  const singleMatch = trimmed.match(
    /^(?:[\*\✓\✔\s]*[\(\[]?\s*[ক-ঘa-dA-D1-4১-৪]\s*[\)\]\.\:\-]|\[[ক-ঘa-dA-D1-4১-৪]\]|\([ক-ঘa-dA-D1-4১-৪]\))\s*(.+)/i
  );
  if (singleMatch) {
    return [singleMatch[1].trim()];
  }

  return [];
}

/**
 * Checks if option text has inline answer marker (*, ✓, [x], (সঠিক উত্তর), etc.)
 */
function checkInlineAnswer(optRaw: string): { text: string; isCorrect: boolean } {
  let text = optRaw.trim();
  let isCorrect = false;

  // Check prefix marks like *ক, [x] খ, ✓ গ
  if (/^[\*\✓\✔]|\[[xX✓✔√]\]/.test(text)) {
    isCorrect = true;
    text = text.replace(/^[\*\✓\✔\s]+|\[[xX✓✔√]\]\s*/g, '').trim();
  }

  // Check suffix marks like (সঠিক), (Ans), (Answer), *, [✓]
  if (/[\*\✓\✔]$|\[[xX✓✔√]\]$|\((?:সঠিক|সঠিক\s*উত্তর|ans|answer|correct|true|right)\)/i.test(text)) {
    isCorrect = true;
    text = text
      .replace(/[\*\✓\✔\s]+$|\[[xX✓✔√]\]$|\((?:সঠিক|সঠিক\s*উত্তর|ans|answer|correct|true|right)\)/gi, '')
      .trim();
  }

  return { text, isCorrect };
}

/**
 * Smart Bulk Question Parser that parses both JSON and human text format (Bengali/English)
 */
export function parseBulkQuestionsText(
  rawText: string,
  defaultCategoryId: string,
  defaultLevelId: string
): { questions: Question[]; errorMsg?: string } {
  const trimmed = rawText.trim();
  if (!trimmed) return { questions: [] };

  // 1. Try JSON Array parsing
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const validQuestions: Question[] = [];

      list.forEach((item, index) => {
        if (item.questionText && Array.isArray(item.options) && item.options.length >= 4) {
          const opts: [string, string, string, string] = [
            String(item.options[0] || '').trim(),
            String(item.options[1] || '').trim(),
            String(item.options[2] || '').trim(),
            String(item.options[3] || '').trim(),
          ];

          let cIdx = 0;
          if (typeof item.correctAnswerIndex === 'number' && item.correctAnswerIndex >= 0 && item.correctAnswerIndex <= 3) {
            cIdx = item.correctAnswerIndex;
          } else if (typeof item.correctAnswerIndex === 'string') {
            cIdx = resolveAnswerIndex(item.correctAnswerIndex, opts);
          } else {
            const rawAns = item.correctAnswer || item.answer || item.ans || item.correct_answer || item.correctOption || '';
            cIdx = resolveAnswerIndex(String(rawAns), opts);
          }

          validQuestions.push({
            id: `bulk_json_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
            categoryId: item.categoryId || defaultCategoryId,
            levelId: item.levelId || defaultLevelId,
            questionText: String(item.questionText).trim(),
            options: opts,
            correctAnswerIndex: cIdx,
            explanation: item.explanation || 'কোনো অতিরিক্ত ব্যাখ্যা নেই।',
            points: 1,
          });
        }
      });

      if (validQuestions.length > 0) {
        return { questions: validQuestions };
      }
    } catch (e) {
      // Fallback to text parser below
    }
  }

  // 2. Smart Plain Text Parser
  // Split text into question blocks based on question number prefixes like "১.", "1.", "প্রশ্ন ১:", "Q1."
  const rawBlocks = trimmed.split(/(?=\n\s*(?:[০-৯0-9]+[\.\)]|প্রশ্ন\s*[:\-]?[০-৯0-9]+|Q[0-9]+[\.\):\-]))/gi);
  const blocks = rawBlocks.map(b => b.trim()).filter(Boolean);

  // If no numbered blocks found, fallback to splitting by double newlines
  const textBlocks = blocks.length > 0 ? blocks : trimmed.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  const parsedQuestions: Question[] = [];

  // Answer line regex covering Bengali and English formats
  const ansPrefixRegex = /^(?:উত্তর|উত্তরঃ|উঃ|উ:|উ|সঠিক\s*উত্তর|সঠিক\s*উত্তরঃ|সঠিক|সঠিকঃ|সঠিক\s*অপশন|সঠিক\s*অপশনঃ|সঠিক\s*বিকল্প|Ans|Answer|Correct\s*Answer|Correct\s*Ans|Correct|Right\s*Answer|Solution|Key)\s*[:\-=–—ঃ]?\s*(.+)/i;
  
  // Explanation line regex
  const expPrefixRegex = /^(?:ব্যাখ্যা|উত্তরের\s*ব্যাখ্যা|ব্যাখ্যাঃ|উত্তরের\s*ব্যাখ্যাঃ|Explanation|Exp)\s*[:\-=–—ঃ]?\s*(.+)/i;

  textBlocks.forEach((block, bIdx) => {
    const rawLines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (rawLines.length < 2) return;

    let qText = '';
    const rawOptions: string[] = [];
    let detectedAnsStr = '';
    let inlineAnswerIndex = -1;
    let explanation = '';

    rawLines.forEach((line) => {
      // 1. Check Answer line
      const ansMatch = line.match(ansPrefixRegex);
      if (ansMatch) {
        detectedAnsStr = ansMatch[1].trim();
        return;
      }

      // 2. Check Explanation line
      const expMatch = line.match(expPrefixRegex);
      if (expMatch) {
        explanation = expMatch[1].trim();
        return;
      }

      // 3. Check Option lines (could be 1 or multiple options on the same line)
      const extracted = extractOptionsFromLine(line);
      if (extracted.length > 0) {
        extracted.forEach((optText) => {
          if (rawOptions.length < 4) {
            const { text: cleanText, isCorrect } = checkInlineAnswer(optText);
            if (isCorrect && inlineAnswerIndex === -1) {
              inlineAnswerIndex = rawOptions.length;
            }
            rawOptions.push(cleanText);
          }
        });
        return;
      }

      // 4. Question Text line (lines before any options are encountered)
      if (rawOptions.length === 0) {
        // Clean leading question number/label like "১.", "1.", "প্রশ্ন ১:", "Q1."
        const cleanLine = line.replace(
          /^(?:[০-৯0-9]+[\.\)]|প্রশ্ন\s*[:\-]?[০-৯0-9]+[:\.\-]?|Q[0-9]+[:\.\-]?)\s*/i,
          ''
        );
        if (qText) {
          qText += ' ' + cleanLine;
        } else {
          qText = cleanLine;
        }
      }
    });

    if (qText && rawOptions.length >= 4) {
      const finalOptions: [string, string, string, string] = [
        rawOptions[0].trim(),
        rawOptions[1].trim(),
        rawOptions[2].trim(),
        rawOptions[3].trim(),
      ];

      // Determine correct answer index
      let finalCorrectIdx = 0;
      if (detectedAnsStr) {
        finalCorrectIdx = resolveAnswerIndex(detectedAnsStr, finalOptions);
      } else if (inlineAnswerIndex >= 0 && inlineAnswerIndex < 4) {
        finalCorrectIdx = inlineAnswerIndex;
      }

      parsedQuestions.push({
        id: `bulk_txt_${Date.now()}_${bIdx}_${Math.random().toString(36).substring(2, 6)}`,
        categoryId: defaultCategoryId,
        levelId: defaultLevelId,
        questionText: qText.trim(),
        options: finalOptions,
        correctAnswerIndex: finalCorrectIdx,
        explanation: explanation || 'কোনো অতিরিক্ত ব্যাখ্যা নেই।',
        points: 1,
      });
    }
  });

  return { questions: parsedQuestions };
}
