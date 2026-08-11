import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

async function generateWithGeminiFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  const models = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`Model ${model} failed in Express server, trying next...`, err);
      lastErr = err;
    }
  }

  throw lastErr || new Error('Gemini API calls failed on all available models.');
}

// API Endpoint for AI Question & Exam Set Generation (Gemini API)
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { 
      type = 'mcq', 
      topic, 
      categoryId = 'job_prep', 
      levelId = 'job_prep-l1', 
      levelNum = 1,
      setName = 'সেট ১',
      timeLimitMinutes = 15,
      count = 5 
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    let rawKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
    if (!rawKey) {
      return res.status(400).json({ 
        error: 'GEMINI_API_KEY পাওয়া যায়নি। অনুগ্রহ করে Environment Variables এ GEMINI_API_KEY যোগ করুন।' 
      });
    }

    if (rawKey.includes('...') || rawKey.endsWith('...')) {
      return res.status(400).json({ 
        error: 'অসম্পূর্ণ API Key! আপনার বসানো GEMINI_API_KEY-টির শেষে "..." রয়েছে। Google AI Studio থেকে ৩৯ অক্ষরের সম্পূর্ণ Key-টি কপি করে বসান।' 
      });
    }

    const ai = new GoogleGenAI({ apiKey: rawKey });

    // Mode 1 & 2: MCQ Questions (General Quiz & Live Exam)
    if (type === 'mcq' || type === 'live_exam') {
      const prompt = `You are an expert Bangladesh Job Exam question creator (BCS, Bank, Primary Teacher, Ministry, IT).
Create ${count} multiple choice questions in Bengali language on topic: "${topic}".

Format requirements:
Return ONLY a valid JSON array of objects. Do not include markdown code block backticks if possible, or format as standard clean JSON array.
Each object in the array must strictly have these fields:
- "questionText": string (the question in Bengali)
- "options": [string, string, string, string] (exactly 4 options in Bengali)
- "correctAnswerIndex": number (0, 1, 2, or 3)
- "explanation": string (detailed educational explanation in Bengali why this option is correct)

Example output JSON format:
[
  {
    "questionText": "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত কত?",
    "options": ["১০:৬", "৫:৩", "১০:৫", "উভয় ১ ও ২ (১০:৬ ও ৫:৩)"],
    "correctAnswerIndex": 3,
    "explanation": "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত ১০:৬ বা ৫:৩। উভয়টিই গাণিতিকভাবে সমান।"
  }
]`;

      const responseText = await generateWithGeminiFallback(ai, prompt);
      let parsedQuestions = [];
      try {
        parsedQuestions = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/\[[\s\S]*\]/);
        if (match) {
          parsedQuestions = JSON.parse(match[0]);
        } else {
          throw new Error('AI Response parsing failed');
        }
      }

      const formattedQuestions = parsedQuestions.map((q: any, idx: number) => ({
        id: `ai_mcq_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        categoryId: categoryId || 'job_prep',
        levelId: levelId || 'job_prep-l1',
        questionText: q.questionText || 'প্রশ্ন পাওয়া যায়নি',
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options 
          : ['অপশন ১', 'অপশন ২', 'অপশন ৩', 'অপশন ৪'],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
        explanation: q.explanation || 'কোনো ব্যাখ্যা দেওয়া হয়নি।',
        points: 1,
      }));

      return res.json({ success: true, type: 'mcq', questions: formattedQuestions });
    }

    // Mode 3: Written Exam Questions (লিখিত পরীক্ষা)
    if (type === 'written') {
      const prompt = `You are an expert Bangladesh Written Exam Paper creator (BCS Written, Bank Officer Written, Ministry Written Exams).
Create a complete Written Exam Set in Bengali language on the topic: "${topic}".
Generate exactly ${count} written descriptive questions with detailed model answers and key points.

Format requirements:
Return ONLY a valid JSON object. Do not include markdown code block backticks if possible.
The object must strictly match this structure:
{
  "title": "written exam title in Bengali based on ${topic}",
  "setName": "${setName || 'সেট ১'}",
  "timeLimitMinutes": ${timeLimitMinutes || 20},
  "questions": [
    {
      "questionNum": 1,
      "questionText": "the written question in Bengali",
      "modelAnswer": "comprehensive, accurate model answer in Bengali with bullet points, dates, and essential facts",
      "marks": 10,
      "hints": "important concepts or key guidelines candidate must include"
    }
  ]
}`;

      const responseText = await generateWithGeminiFallback(ai, prompt);
      let parsedObj: any = {};
      try {
        parsedObj = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedObj = JSON.parse(match[0]);
        } else {
          throw new Error('AI Written response parsing failed');
        }
      }

      const questionsList = Array.isArray(parsedObj.questions) ? parsedObj.questions : [];
      const formattedSubQs = questionsList.map((sq: any, idx: number) => ({
        id: `wq_sub_${Date.now()}_${idx}`,
        questionNum: idx + 1,
        questionText: sq.questionText || `লিখিত প্রশ্ন #${idx + 1}`,
        modelAnswer: sq.modelAnswer || 'মডেল উত্তর প্রস্তুত রাখা হয়নি।',
        marks: Number(sq.marks) || 10,
        hints: sq.hints || '',
      }));

      const formattedWrittenSet = {
        id: `ai_written_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        categoryId: categoryId || 'job_prep',
        levelNum: Number(levelNum) || 1,
        setName: parsedObj.setName || setName || 'সেট ১',
        title: parsedObj.title || `${topic} - লিখিত পরীক্ষা`,
        timeLimitMinutes: Number(parsedObj.timeLimitMinutes) || Number(timeLimitMinutes) || 20,
        questions: formattedSubQs,
        createdAt: new Date().toISOString(),
      };

      return res.json({ success: true, type: 'written', writtenSet: formattedWrittenSet });
    }

    // Mode 4: English Translation Practice Set (ইংরেজি অনুবাদ চর্চা)
    if (type === 'english') {
      const prompt = `You are an expert English Translation Instructor for Bangladesh Job Seekers (BCS, Bank, Newspaper Translation, Daily Conversation).
Create a complete English Practice Set based on the topic: "${topic}".
Generate exactly ${count} Bengali-to-English translation items.

Format requirements:
Return ONLY a valid JSON object. Do not include markdown code block backticks if possible.
The object must strictly match this structure:
{
  "title": "English practice set title in Bengali e.g. ${topic} - অনুবাদ চর্চা",
  "setName": "${setName || 'সেট ১'}",
  "timeLimitMinutes": ${timeLimitMinutes || 15},
  "items": [
    {
      "itemNum": 1,
      "bengaliSentence": "Bengali sentence to translate",
      "englishSentence": "Exact standard correct English translation",
      "hints": "Vocabulary breakdown, grammar notes, or phrasing tips in Bengali",
      "marks": 10
    }
  ]
}`;

      const responseText = await generateWithGeminiFallback(ai, prompt);
      let parsedObj: any = {};
      try {
        parsedObj = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedObj = JSON.parse(match[0]);
        } else {
          throw new Error('AI English response parsing failed');
        }
      }

      const itemsList = Array.isArray(parsedObj.items) ? parsedObj.items : [];
      const formattedItems = itemsList.map((it: any, idx: number) => ({
        id: `eng_item_${Date.now()}_${idx}`,
        itemNum: idx + 1,
        bengaliSentence: it.bengaliSentence || 'বাংলা বাক্য পাওয়া যায়নি',
        englishSentence: it.englishSentence || 'Correct English translation missing',
        hints: it.hints || '',
        marks: Number(it.marks) || 10,
      }));

      const formattedEnglishSet = {
        id: `ai_english_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        categoryId: categoryId || 'job_prep',
        levelNum: Number(levelNum) || 1,
        setName: parsedObj.setName || setName || 'সেট ১',
        title: parsedObj.title || `${topic} - ইংরেজি অনুবাদ চর্চা`,
        timeLimitMinutes: Number(parsedObj.timeLimitMinutes) || Number(timeLimitMinutes) || 15,
        items: formattedItems,
        createdAt: new Date().toISOString(),
      };

      return res.json({ success: true, type: 'english', englishSet: formattedEnglishSet });
    }

    return res.status(400).json({ error: 'Invalid generation type requested' });

  } catch (err: any) {
    console.error('Error generating questions via Gemini:', err);
    return res.status(500).json({ 
      error: err.message || 'প্রশ্ন তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' 
    });
  }
});

// API Endpoint for Written Answer Evaluation (Gemini API with Smart Fallback)
app.post('/api/evaluate-written', async (req, res) => {
  try {
    const { questionText, modelAnswer, userAnswer, maxMarks = 10 } = req.body;

    if (!questionText || !modelAnswer) {
      return res.status(400).json({ error: 'Question and model answer are required' });
    }

    if (!userAnswer || !userAnswer.trim()) {
      return res.json({
        success: true,
        evaluation: {
          obtainedMarks: 0,
          matchPercentage: 0,
          feedback: 'কোনো উত্তর দেওয়া হয়নি। অনুগ্রহ করে বিস্তারিত উত্তর লিখুন।',
          keyPointsFound: [],
          keyPointsMissing: ['সম্পূর্ণ উত্তর অনুপস্থিত।'],
        },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an expert exam paper examiner for Bangladesh Job Examinations (BCS, Bank, Ministry written exams).
Evaluate the candidate's written answer against the provided model answer/explanation.

Question: "${questionText}"
Max Marks: ${maxMarks}
Model Answer / Detailed Explanation: "${modelAnswer}"

Candidate's Submitted Answer:
"${userAnswer}"

Your Task:
Compare the candidate's answer with the model answer/explanation.
Check key concepts, facts, dates, points, accuracy, and completeness.
Determine the obtained mark out of ${maxMarks} (can be decimal e.g. 7.5, 8.0, 4.0, 0, etc.).
Calculate a match percentage (0 to 100).
Identify key points correctly included by the candidate.
Identify key points missing or inaccurate.
Provide clear constructive feedback in Bengali language.

Return ONLY a valid JSON object with no markdown block formatting:
{
  "obtainedMarks": number (between 0 and ${maxMarks}),
  "matchPercentage": number (0 to 100),
  "feedback": "detailed Bengali feedback string",
  "keyPointsFound": ["point 1 in Bengali", "point 2 in Bengali"],
  "keyPointsMissing": ["missing point 1 in Bengali", "missing point 2 in Bengali"]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const responseText = response.text || '';
        let evalData = null;
        try {
          evalData = JSON.parse(responseText);
        } catch (e) {
          const match = responseText.match(/\{[\s\S]*\}/);
          if (match) {
            evalData = JSON.parse(match[0]);
          }
        }

        if (evalData && typeof evalData.obtainedMarks === 'number') {
          return res.json({
            success: true,
            evaluation: {
              obtainedMarks: Math.min(maxMarks, Math.max(0, evalData.obtainedMarks)),
              matchPercentage: Math.min(100, Math.max(0, Math.round(evalData.matchPercentage || (evalData.obtainedMarks / maxMarks) * 100))),
              feedback: evalData.feedback || 'উত্তর মূল্যায়ন করা হয়েছে।',
              keyPointsFound: Array.isArray(evalData.keyPointsFound) ? evalData.keyPointsFound : [],
              keyPointsMissing: Array.isArray(evalData.keyPointsMissing) ? evalData.keyPointsMissing : [],
            },
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini evaluation failed, using intelligent fallback matcher:', geminiErr);
      }
    }

    // --- Smart Fallback Evaluator Algorithm (Bengali Keyword & Similarity) ---
    const cleanModel = modelAnswer.replace(/[^\u0980-\u09FFa-zA-Z0-9\s]/g, ' ').toLowerCase();
    const cleanUser = userAnswer.replace(/[^\u0980-\u09FFa-zA-Z0-9\s]/g, ' ').toLowerCase();

    // Extract significant words (length > 2)
    const modelWords = cleanModel.split(/\s+/).filter((w: string) => w.length > 2);
    const userWords = cleanUser.split(/\s+/).filter((w: string) => w.length > 2);

    const uniqueModelWords = Array.from(new Set(modelWords));
    const matchedWords = uniqueModelWords.filter((w: string) => cleanUser.includes(w));

    const wordMatchRatio = uniqueModelWords.length > 0 ? matchedWords.length / uniqueModelWords.length : 0;
    
    // Length ratio comparison (up to 1)
    const lengthRatio = Math.min(1, userWords.length / Math.max(1, modelWords.length * 0.6));

    // Combined Match Percentage
    const rawMatch = (wordMatchRatio * 0.75 + lengthRatio * 0.25) * 100;
    const matchPercentage = Math.min(100, Math.round(rawMatch));

    // Calculate Obtained Marks
    const rawScore = (matchPercentage / 100) * maxMarks;
    const obtainedMarks = parseFloat(rawScore.toFixed(1));

    // Found and Missing Key Points
    const keyPointsFound = matchedWords.slice(0, 5).map((w: string) => `মূল শব্দ/ধারণা অন্তর্ভুক্ত: "${w}"`);
    const keyPointsMissing = uniqueModelWords.filter((w: string) => !matchedWords.includes(w)).slice(0, 5).map((w: string) => `অনুপস্থিত কী-ওয়ার্ড: "${w}"`);

    let feedback = '';
    if (matchPercentage >= 80) {
      feedback = 'চমৎকার উত্তর! আপনার উত্তরে আদর্শ উত্তরের মূল তথ্য ও ব্যাখ্যাগুলো অত্যন্ত নিখুঁতভাবে ফুটে উঠেছে।';
    } else if (matchPercentage >= 50) {
      feedback = 'ভালো উত্তর! আপনি বেশ কয়েকটি গুরুত্বপূর্ণ বিষয় কভার করেছেন, তবে পূর্ণাঙ্গ নম্বর পেতে আরেকটু বিস্তারিত ও স্পষ্ট তথ্য থাকা প্রয়োজন।';
    } else if (matchPercentage >= 25) {
      feedback = 'আংশিক উত্তর মিলেছে। আদর্শ উত্তরের সাথে তুলনা করে প্রধান পয়েন্টগুলো রিভিশন দেওয়ার পরামর্শ দেওয়া হচ্ছে।';
    } else {
      feedback = 'উত্তরের সাথে আদর্শ ব্যাখ্যা ও তথ্যের মিল যথেষ্ট কম। অনুগ্রহ করে সঠিক উত্তরের ব্যাখ্যাটি মনোযোগ দিয়ে পড়ে আবার অনুশীলন করুন।';
    }

    return res.json({
      success: true,
      evaluation: {
        obtainedMarks,
        matchPercentage,
        feedback,
        keyPointsFound,
        keyPointsMissing,
      },
    });

  } catch (err: any) {
    console.error('Error evaluating written answer:', err);
    return res.status(500).json({ error: 'উত্তর মূল্যায়ন প্রক্রিয়ায় ত্রুটি হয়েছে।' });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
