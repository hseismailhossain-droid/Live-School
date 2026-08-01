import { Question } from '../types';

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
          validQuestions.push({
            id: `bulk_json_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
            categoryId: item.categoryId || defaultCategoryId,
            levelId: item.levelId || defaultLevelId,
            questionText: item.questionText.trim(),
            options: [
              item.options[0].trim(),
              item.options[1].trim(),
              item.options[2].trim(),
              item.options[3].trim(),
            ],
            correctAnswerIndex: typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : 0,
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
  const rawBlocks = trimmed.split(/(?=\n\s*(?:[০-৯0-9]+[\.\)]|প্রশ্ন\s*[০-৯0-9]+|Q[0-9]+[\.\)]))/gi);
  const blocks = rawBlocks.map(b => b.trim()).filter(Boolean);

  // If no numbered blocks found, fallback to splitting by double newlines
  const textBlocks = blocks.length > 0 ? blocks : trimmed.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  const parsedQuestions: Question[] = [];

  textBlocks.forEach((block, bIdx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    let qText = '';
    const options: string[] = [];
    let correctIdx = 0;
    let explanation = '';

    const optRegex = /^(?:[ক-ঘa-dA-D1-4][\.\)]|\[[ক-ঘa-dA-D1-4]\]|[\(\[]?[ক-ঘa-dA-D1-4][\)\]])\s*(.+)/i;
    const ansRegex = /^(?:উত্তর|সঠিক উত্তর|Ans|Answer|Correct Answer)\s*[:\-=]?\s*([ক-ঘa-dA-D1-4]|[১-৪1-4])/i;
    const expRegex = /^(?:ব্যাখ্যা|উত্তরের ব্যাখ্যা|Explanation|Exp)\s*[:\-=]?\s*(.+)/i;

    lines.forEach((line) => {
      // Match Answer
      const ansMatch = line.match(ansRegex);
      if (ansMatch) {
        const char = ansMatch[1].trim().toLowerCase();
        if (['ক', 'a', '1', '১'].includes(char)) correctIdx = 0;
        else if (['খ', 'b', '2', '২'].includes(char)) correctIdx = 1;
        else if (['গ', 'c', '3', '৩'].includes(char)) correctIdx = 2;
        else if (['ঘ', 'd', '4', '৪'].includes(char)) correctIdx = 3;
        return;
      }

      // Match Explanation
      const expMatch = line.match(expRegex);
      if (expMatch) {
        explanation = expMatch[1].trim();
        return;
      }

      // Match Option
      const optMatch = line.match(optRegex);
      if (optMatch && options.length < 4) {
        options.push(optMatch[1].trim());
        return;
      }

      // Question line
      if (options.length === 0) {
        const cleanLine = line.replace(/^(?:[০-৯0-9]+[\.\)]|প্রশ্ন\s*[০-৯0-9]+[:\-]?|Q[0-9]+[:\.]?)\s*/i, '');
        if (qText) qText += ' ' + cleanLine;
        else qText = cleanLine;
      }
    });

    if (qText && options.length >= 4) {
      parsedQuestions.push({
        id: `bulk_txt_${Date.now()}_${bIdx}_${Math.random().toString(36).substring(2, 6)}`,
        categoryId: defaultCategoryId,
        levelId: defaultLevelId,
        questionText: qText,
        options: [options[0], options[1], options[2], options[3]],
        correctAnswerIndex: correctIdx,
        explanation: explanation || 'কোনো অতিরিক্ত ব্যাখ্যা নেই।',
        points: 1,
      });
    }
  });

  return { questions: parsedQuestions };
}
