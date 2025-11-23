export enum EmotionType {
  Stress = 'Stress',
  Sadness = 'Sadness',
  Fear = 'Fear',
  Anger = 'Anger',
  Happiness = 'Happiness',
  Neutral = 'Neutral',
  Anxiety = 'Anxiety'
}

export interface Recommendation {
  title: string;
  description: string;
  category: 'breathing' | 'relaxation' | 'motivation' | 'activity';
  durationMinutes?: number;
}

export interface AnalysisResult {
  primaryEmotion: EmotionType;
  stressScore: number; // 0-100
  emotionalSummary: string;
  recommendations: Recommendation[];
  timestamp: string; // ISO string
}

export interface MoodEntry extends AnalysisResult {
  id: string;
}

export interface ReminderSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  time: string; // "HH:mm" format
  lastSent?: string; // ISO string
}

export interface User {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  avatar?: string;
}

export type ViewState = 'home' | 'history' | 'health' | 'sos' | 'settings';

// New Health & Fitness Types

export interface HealthAnalysisResult {
  possibleCauses: string[];
  severity: 'low' | 'moderate' | 'high' | 'emergency';
  advice: string;
  dietaryRecommendations: string[]; // Foods to eat/avoid
  disclaimer: string;
}

export interface WorkoutPlan {
  goal: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: {
    name: string;
    sets: string;
    reps: string;
    notes?: string;
  }[];
  dietPlan: {
    meal: string;
    suggestion: string;
  }[];
}