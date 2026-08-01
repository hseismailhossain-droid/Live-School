import { WrittenQuestion, WrittenSubQuestion } from '../types';

/**
 * Parses raw bulk text into an array of WrittenQuestion set objects.
 * Groups questions belonging to the same Set header into a single set object with sub-questions.
 */
export function parseBulkWrittenQuestionsText(
  rawText: string,
  defaultCategoryName: string = 'বিসিএস ও ব্যাংক রিটেন',
  startLevelNum: number = 1
): WrittenQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n');
  const rawItems: Array<{
    categoryName: string;
    levelNum: number;
    setNum: number;
    setName: string;
    title: string;
    questionText: string;
    modelAnswer: string;
    marks: number;
    timeLimitMinutes: number;
    hints: string;
  }> = [];

  let currentSetHeader = 'সেট ১';
  let currentSetNum = 1;
  let currentLevelNum = startLevelNum;

  let currentTitle = '';
  let currentText = '';
  let currentAnswer = '';
  let currentMarks = 10;
  let currentTimeLimit = 15;
  let currentHints = '';

  const saveCurrentQuestion = () => {
    if (currentText.trim() && currentAnswer.trim()) {
      rawItems.push({
        categoryName: defaultCategoryName,
        levelNum: currentLevelNum,
        setNum: currentSetNum,
        setName: currentSetHeader,
        title: currentTitle.trim() || `প্রশ্ন ${rawItems.length + 1}`,
        questionText: currentText.trim(),
        modelAnswer: currentAnswer.trim(),
        marks: currentMarks > 0 ? currentMarks : 10,
        timeLimitMinutes: currentTimeLimit > 0 ? currentTimeLimit : 15,
        hints: currentHints.trim(),
      });
    }

    // Reset current question fields
    currentTitle = '';
    currentText = '';
    currentAnswer = '';
    currentMarks = 10;
    currentTimeLimit = 15;
    currentHints = '';
  };

  let activeMode: 'none' | 'question' | 'answer' | 'hints' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // Check separator
    if (line.startsWith('---') || line.startsWith('===') || line.startsWith('***')) {
      saveCurrentQuestion();
      activeMode = 'none';
      continue;
    }

    // Check Set/Level Header like [সেট ১ | লেভেল ১] or [Set 1 | Level 1]
    const setHeaderMatch = line.match(/^\[(.*?)\]$/);
    if (setHeaderMatch) {
      saveCurrentQuestion();
      activeMode = 'none';
      const headerStr = setHeaderMatch[1].trim();
      currentSetHeader = headerStr;

      // Extract set number if present (e.g. "সেট ১" or "Set 5")
      const setMatch = headerStr.match(/সেট\s*(\d+)|set\s*(\d+)/i);
      if (setMatch) {
        const sNum = parseInt(setMatch[1] || setMatch[2], 10);
        if (!isNaN(sNum)) {
          currentSetNum = sNum;
        }
      }

      // Extract level number if present
      const lvlMatch = headerStr.match(/লেভেল\s*(\d+)|level\s*(\d+)/i);
      if (lvlMatch) {
        const lvl = parseInt(lvlMatch[1] || lvlMatch[2], 10);
        if (!isNaN(lvl)) {
          currentLevelNum = lvl;
        }
      }
      continue;
    }

    // Check key prefixes
    if (line.match(/^(প্রশ্ন|Question|টপিক|Topic)\s*[\:|\-]/i)) {
      if (currentText || currentAnswer) {
        saveCurrentQuestion();
      }
      activeMode = 'question';
      const content = line.replace(/^(প্রশ্ন|Question|টপিক|Topic)\s*[\:|\-]/i, '').trim();
      if (!currentTitle) currentTitle = content.substring(0, 40);
      currentText = content;
      continue;
    }

    if (line.match(/^(ব্যাখ্যা|আদর্শ উত্তর|উত্তরের ব্যাখ্যা|Model Answer|Answer)\s*[\:|\-]/i)) {
      activeMode = 'answer';
      const content = line.replace(/^(ব্যাখ্যা|আদর্শ উত্তর|উত্তরের ব্যাখ্যা|Model Answer|Answer)\s*[\:|\-]/i, '').trim();
      currentAnswer = content;
      continue;
    }

    if (line.match(/^(মার্কস|Marks|নম্বর)\s*[\:|\-]/i)) {
      const markStr = line.replace(/^(মার্কস|Marks|নম্বর)\s*[\:|\-]/i, '').trim();
      const num = parseInt(markStr.replace(/[^\d]/g, ''), 10);
      if (!isNaN(num)) currentMarks = num;
      continue;
    }

    if (line.match(/^(সময়|Time|সময়সীমা)\s*[\:|\-]/i)) {
      const timeStr = line.replace(/^(সময়|Time|সময়সীমা)\s*[\:|\-]/i, '').trim();
      const num = parseInt(timeStr.replace(/[^\d]/g, ''), 10);
      if (!isNaN(num)) currentTimeLimit = num;
      continue;
    }

    if (line.match(/^(হিন্টস|Hints|পরামর্শ)\s*[\:|\-]/i)) {
      activeMode = 'hints';
      currentHints = line.replace(/^(হিন্টস|Hints|পরামর্শ)\s*[\:|\-]/i, '').trim();
      continue;
    }

    if (line.match(/^(শিরোনাম|Title)\s*[\:|\-]/i)) {
      currentTitle = line.replace(/^(শিরোনাম|Title)\s*[\:|\-]/i, '').trim();
      continue;
    }

    // Append to active mode
    if (activeMode === 'question') {
      currentText += (currentText ? '\n' : '') + line;
    } else if (activeMode === 'answer') {
      currentAnswer += (currentAnswer ? '\n' : '') + line;
    } else if (activeMode === 'hints') {
      currentHints += (currentHints ? ' ' : '') + line;
    } else {
      // Default to question if no prefix seen yet
      if (!currentText) {
        currentText = line;
        if (!currentTitle) currentTitle = line.substring(0, 40);
        activeMode = 'question';
      }
    }
  }

  // Save trailing item
  saveCurrentQuestion();

  // Group rawItems by levelNum + setNum + setName into WrittenQuestion sets
  const groupedSetsMap = new Map<string, WrittenQuestion>();

  for (const item of rawItems) {
    const groupKey = `${item.levelNum}_${item.setNum}_${item.setName}`;
    if (!groupedSetsMap.has(groupKey)) {
      groupedSetsMap.set(groupKey, {
        id: 'wq_set_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        categoryId: 'job_prep',
        categoryName: item.categoryName,
        levelNum: item.levelNum,
        setNum: item.setNum,
        setName: item.setName,
        title: `${item.setName} (লেভেল ${item.levelNum})`,
        timeLimitMinutes: item.timeLimitMinutes,
        questions: [],
        createdAt: new Date().toISOString(),
      });
    }

    const setObj = groupedSetsMap.get(groupKey)!;
    const subIdx = setObj.questions!.length + 1;
    const subQ: WrittenSubQuestion = {
      id: 'sq_' + subIdx + '_' + Math.random().toString(36).substring(2, 6),
      questionNum: subIdx,
      questionText: item.questionText,
      modelAnswer: item.modelAnswer,
      marks: item.marks,
      hints: item.hints,
    };
    setObj.questions!.push(subQ);
  }

  return Array.from(groupedSetsMap.values());
}
