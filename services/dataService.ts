import { db } from "./firebase";
import { collection, setDoc, query, orderBy, getDocs, doc, getDoc, writeBatch } from "firebase/firestore";
import { MoodEntry, ReminderSettings } from "../types";

// Helper for Mock Data
const getMockKey = (userId: string, type: string) => `mindguard_mock_${userId}_${type}`;

export const dataService = {
  // Save a single mood entry
  async saveMoodEntry(userId: string, entry: MoodEntry) {
    if (!db) {
      // MOCK FALLBACK
      const key = getMockKey(userId, 'history');
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      // Add new entry
      const updated = [entry, ...existing];
      localStorage.setItem(key, JSON.stringify(updated));
      return;
    }

    const historyRef = collection(db, "users", userId, "history");
    await setDoc(doc(historyRef, entry.id), entry);
  },

  // Retrieve all mood entries
  async getMoodHistory(userId: string): Promise<MoodEntry[]> {
    if (!db) {
      // MOCK FALLBACK
      const key = getMockKey(userId, 'history');
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return data;
    }

    const historyRef = collection(db, "users", userId, "history");
    const q = query(historyRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as MoodEntry);
  },

  // Save multiple entries at once
  async batchSaveMoodEntries(userId: string, entries: MoodEntry[]) {
    if (!db) {
       // MOCK FALLBACK
       const key = getMockKey(userId, 'history');
       // In mock, we just overwrite or merge
       const existing = JSON.parse(localStorage.getItem(key) || '[]');
       const updated = [...entries, ...existing]; // Simplified merge
       localStorage.setItem(key, JSON.stringify(updated));
       return;
    }

    const batch = writeBatch(db);
    const historyRef = collection(db, "users", userId, "history");
    
    entries.forEach(entry => {
      const docRef = doc(historyRef, entry.id);
      batch.set(docRef, entry);
    });
    
    await batch.commit();
  },

  // Save user preferences
  async saveSettings(userId: string, settings: ReminderSettings) {
    if (!db) {
      // MOCK FALLBACK
      const key = getMockKey(userId, 'settings');
      localStorage.setItem(key, JSON.stringify(settings));
      return;
    }

    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { settings }, { merge: true });
  },

  // Get user preferences
  async getSettings(userId: string): Promise<ReminderSettings | null> {
    if (!db) {
      // MOCK FALLBACK
      const key = getMockKey(userId, 'settings');
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }

    const userRef = doc(db, "users", userId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists() && snapshot.data().settings) {
      return snapshot.data().settings as ReminderSettings;
    }
    return null;
  }
};