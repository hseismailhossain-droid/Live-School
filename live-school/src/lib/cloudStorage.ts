import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Category,
  LiveExam,
  Question,
  QuizResult,
  QuizSettings,
  WrittenQuestion,
  WrittenExamResult,
  EnglishQuestionSet,
  EnglishExamResult,
  SocialLinks,
  BannerSlide,
} from '../types';
import {
  getStoredQuestions,
  saveStoredQuestions,
  getStoredLiveExams,
  saveStoredLiveExams,
  getStoredCategories,
  saveStoredCategories,
  getStoredQuizSettings,
  saveStoredQuizSettings,
  getStoredLeaderboard,
  saveStoredLeaderboard,
  getStoredWrittenQuestions,
  saveStoredWrittenQuestions,
  getStoredWrittenResults,
  saveWrittenResult,
  getStoredEnglishQuestions,
  saveStoredEnglishQuestions,
  getStoredEnglishResults,
  saveEnglishResult,
  getStoredSocialLinks,
  saveStoredSocialLinks,
  getStoredBanners,
  saveStoredBanners,
} from '../utils/storage';

const APP_DATA_COLLECTION = 'app_data';

// Helper to sanitize payload and remove undefined values before Firestore write
function sanitizeForFirestore(data: any): any {
  return JSON.parse(JSON.stringify(data));
}

// Subscribe to real-time cloud updates for questions, exams, banners, etc.
export function subscribeToCloudData(onUpdate?: () => void) {
  try {
    const questionsDoc = doc(db, APP_DATA_COLLECTION, 'questions');
    const examsDoc = doc(db, APP_DATA_COLLECTION, 'live_exams');
    const categoriesDoc = doc(db, APP_DATA_COLLECTION, 'categories');
    const settingsDoc = doc(db, APP_DATA_COLLECTION, 'quiz_settings');
    const bannersDoc = doc(db, APP_DATA_COLLECTION, 'banners');
    const socialDoc = doc(db, APP_DATA_COLLECTION, 'social_links');
    const writtenDoc = doc(db, APP_DATA_COLLECTION, 'written_questions');
    const englishDoc = doc(db, APP_DATA_COLLECTION, 'english_questions');
    const leaderboardDoc = doc(db, APP_DATA_COLLECTION, 'leaderboard');

    const unsubs = [
      onSnapshot(questionsDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.items;
          if (Array.isArray(cloudData) && cloudData.length > 0) {
            saveStoredQuestions(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
      onSnapshot(examsDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.items;
          if (Array.isArray(cloudData)) {
            saveStoredLiveExams(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
      onSnapshot(categoriesDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.items;
          if (Array.isArray(cloudData) && cloudData.length > 0) {
            saveStoredCategories(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
      onSnapshot(settingsDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.data;
          if (cloudData) {
            saveStoredQuizSettings(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
      onSnapshot(bannersDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.items;
          if (Array.isArray(cloudData) && cloudData.length > 0) {
            saveStoredBanners(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
      onSnapshot(socialDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.data;
          if (cloudData) {
            saveStoredSocialLinks(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
      onSnapshot(writtenDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.items;
          if (Array.isArray(cloudData)) {
            saveStoredWrittenQuestions(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
      onSnapshot(englishDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.items;
          if (Array.isArray(cloudData)) {
            saveStoredEnglishQuestions(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
      onSnapshot(leaderboardDoc, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data()?.items;
          if (Array.isArray(cloudData)) {
            saveStoredLeaderboard(cloudData);
            if (onUpdate) onUpdate();
          }
        }
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  } catch (err) {
    console.error('Error in subscribeToCloudData', err);
    return () => {};
  }
}

// Initial Sync from Cloud on app startup (or seed to cloud if cloud is empty)
export async function syncAllWithCloud(): Promise<void> {
  try {
    // 1. Questions Sync
    const questionsDocRef = doc(db, APP_DATA_COLLECTION, 'questions');
    const qSnap = await getDoc(questionsDocRef);
    if (qSnap.exists()) {
      const items = qSnap.data()?.items;
      if (Array.isArray(items) && items.length > 0) {
        saveStoredQuestions(items);
      }
    } else {
      const localQs = getStoredQuestions();
      if (localQs.length > 0) {
        await setDoc(questionsDocRef, { items: sanitizeForFirestore(localQs), updatedAt: new Date().toISOString() });
      }
    }

    // 2. Live Exams Sync
    const examsDocRef = doc(db, APP_DATA_COLLECTION, 'live_exams');
    const eSnap = await getDoc(examsDocRef);
    if (eSnap.exists()) {
      const items = eSnap.data()?.items;
      if (Array.isArray(items)) {
        saveStoredLiveExams(items);
      }
    } else {
      const localExams = getStoredLiveExams();
      if (localExams.length > 0) {
        await setDoc(examsDocRef, { items: sanitizeForFirestore(localExams), updatedAt: new Date().toISOString() });
      }
    }

    // 3. Categories Sync
    const catDocRef = doc(db, APP_DATA_COLLECTION, 'categories');
    const catSnap = await getDoc(catDocRef);
    if (catSnap.exists()) {
      const items = catSnap.data()?.items;
      if (Array.isArray(items) && items.length > 0) {
        saveStoredCategories(items);
      }
    } else {
      const localCats = getStoredCategories();
      await setDoc(catDocRef, { items: sanitizeForFirestore(localCats), updatedAt: new Date().toISOString() });
    }

    // 4. Banners Sync
    const banDocRef = doc(db, APP_DATA_COLLECTION, 'banners');
    const banSnap = await getDoc(banDocRef);
    if (banSnap.exists()) {
      const items = banSnap.data()?.items;
      if (Array.isArray(items) && items.length > 0) {
        saveStoredBanners(items);
      }
    } else {
      const localBanners = getStoredBanners();
      await setDoc(banDocRef, { items: sanitizeForFirestore(localBanners), updatedAt: new Date().toISOString() });
    }

    // 5. Social Links Sync
    const socDocRef = doc(db, APP_DATA_COLLECTION, 'social_links');
    const socSnap = await getDoc(socDocRef);
    if (socSnap.exists()) {
      const data = socSnap.data()?.data;
      if (data) {
        saveStoredSocialLinks(data);
      }
    } else {
      const localSocial = getStoredSocialLinks();
      await setDoc(socDocRef, { data: sanitizeForFirestore(localSocial), updatedAt: new Date().toISOString() });
    }

    // 6. Settings Sync
    const setDocRef = doc(db, APP_DATA_COLLECTION, 'quiz_settings');
    const setSnap = await getDoc(setDocRef);
    if (setSnap.exists()) {
      const data = setSnap.data()?.data;
      if (data) {
        saveStoredQuizSettings(data);
      }
    } else {
      const localSettings = getStoredQuizSettings();
      await setDoc(setDocRef, { data: sanitizeForFirestore(localSettings), updatedAt: new Date().toISOString() });
    }

    // 7. Written Questions Sync
    const writDocRef = doc(db, APP_DATA_COLLECTION, 'written_questions');
    const writSnap = await getDoc(writDocRef);
    if (writSnap.exists()) {
      const items = writSnap.data()?.items;
      if (Array.isArray(items)) {
        saveStoredWrittenQuestions(items);
      }
    } else {
      const localWritten = getStoredWrittenQuestions();
      if (localWritten.length > 0) {
        await setDoc(writDocRef, { items: sanitizeForFirestore(localWritten), updatedAt: new Date().toISOString() });
      }
    }

    // 8. English Questions Sync
    const engDocRef = doc(db, APP_DATA_COLLECTION, 'english_questions');
    const engSnap = await getDoc(engDocRef);
    if (engSnap.exists()) {
      const items = engSnap.data()?.items;
      if (Array.isArray(items)) {
        saveStoredEnglishQuestions(items);
      }
    } else {
      const localEng = getStoredEnglishQuestions();
      if (localEng.length > 0) {
        await setDoc(engDocRef, { items: sanitizeForFirestore(localEng), updatedAt: new Date().toISOString() });
      }
    }
  } catch (err) {
    console.error('Error during initial cloud sync', err);
  }
}

// --- Cloud Save Functions to keep Firestore up to date immediately when Admin saves ---

export async function cloudSaveQuestions(questions: Question[]): Promise<void> {
  saveStoredQuestions(questions);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'questions');
    await setDoc(docRef, { items: sanitizeForFirestore(questions), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving questions to cloud', err);
  }
}

export async function cloudSaveLiveExams(exams: LiveExam[]): Promise<void> {
  saveStoredLiveExams(exams);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'live_exams');
    await setDoc(docRef, { items: sanitizeForFirestore(exams), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving live exams to cloud', err);
  }
}

export async function cloudSaveCategories(categories: Category[]): Promise<void> {
  saveStoredCategories(categories);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'categories');
    await setDoc(docRef, { items: sanitizeForFirestore(categories), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving categories to cloud', err);
  }
}

export async function cloudSaveQuizSettings(settings: QuizSettings): Promise<void> {
  saveStoredQuizSettings(settings);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'quiz_settings');
    await setDoc(docRef, { data: sanitizeForFirestore(settings), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving settings to cloud', err);
  }
}

export async function cloudSaveLeaderboardResult(result: QuizResult): Promise<QuizResult[]> {
  const current = getStoredLeaderboard();
  const updated = [result, ...current].slice(0, 100);
  saveStoredLeaderboard(updated);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'leaderboard');
    await setDoc(docRef, { items: sanitizeForFirestore(updated), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving leaderboard to cloud', err);
  }
  return updated;
}

export async function cloudSaveWrittenQuestions(questions: WrittenQuestion[]): Promise<void> {
  saveStoredWrittenQuestions(questions);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'written_questions');
    await setDoc(docRef, { items: sanitizeForFirestore(questions), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving written questions to cloud', err);
  }
}

export async function cloudSaveWrittenResult(result: WrittenExamResult): Promise<WrittenExamResult[]> {
  const updated = saveWrittenResult(result);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'written_results');
    await setDoc(docRef, { items: sanitizeForFirestore(updated), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving written result to cloud', err);
  }
  return updated;
}

export async function cloudSaveEnglishQuestions(questions: EnglishQuestionSet[]): Promise<void> {
  saveStoredEnglishQuestions(questions);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'english_questions');
    await setDoc(docRef, { items: sanitizeForFirestore(questions), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving English questions to cloud', err);
  }
}

export async function cloudSaveEnglishResult(result: EnglishExamResult): Promise<EnglishExamResult[]> {
  const updated = saveEnglishResult(result);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'english_results');
    await setDoc(docRef, { items: sanitizeForFirestore(updated), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving English result to cloud', err);
  }
  return updated;
}

export async function cloudSaveSocialLinks(links: SocialLinks): Promise<void> {
  saveStoredSocialLinks(links);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'social_links');
    await setDoc(docRef, { data: sanitizeForFirestore(links), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving social links to cloud', err);
  }
}

export async function cloudSaveBanners(banners: BannerSlide[]): Promise<void> {
  saveStoredBanners(banners);
  try {
    const docRef = doc(db, APP_DATA_COLLECTION, 'banners');
    await setDoc(docRef, { items: sanitizeForFirestore(banners), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving banners to cloud', err);
  }
}
