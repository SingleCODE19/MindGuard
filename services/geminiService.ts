import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, EmotionType, HealthAnalysisResult, WorkoutPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    primaryEmotion: {
      type: Type.STRING,
      enum: [
        EmotionType.Stress,
        EmotionType.Sadness,
        EmotionType.Fear,
        EmotionType.Anger,
        EmotionType.Happiness,
        EmotionType.Neutral,
        EmotionType.Anxiety
      ],
      description: "The dominant emotion detected in the user's input."
    },
    stressScore: {
      type: Type.INTEGER,
      description: "A calculated mental stress score from 0 (completely calm) to 100 (severe distress)."
    },
    emotionalSummary: {
      type: Type.STRING,
      description: "A brief, empathetic summary of the user's state based on their input (max 2 sentences)."
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { 
            type: Type.STRING, 
            enum: ['breathing', 'relaxation', 'motivation', 'activity'] 
          },
          durationMinutes: { type: Type.INTEGER }
        },
        required: ['title', 'description', 'category']
      }
    }
  },
  required: ['primaryEmotion', 'stressScore', 'emotionalSummary', 'recommendations']
};

export const analyzeMood = async (textInput: string, audioBase64?: string, mimeType?: string): Promise<AnalysisResult> => {
  try {
    const parts: any[] = [];

    if (audioBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: audioBase64,
          mimeType: mimeType
        }
      });
      parts.push({
        text: "Analyze the tone, pitch, and content of this audio voice recording to determine the user's emotional state."
      });
    }

    if (textInput) {
      parts.push({
        text: `User text input: "${textInput}". Analyze this text for emotional context.`
      });
    }
    
    // Fallback if empty
    if (parts.length === 0) {
      throw new Error("No input provided");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: `You are MindGuard, an empathetic AI mental health companion. 
        Analyze the user's input (text and/or voice) to detect their emotional state.
        Be supportive, non-judgmental, and calm. 
        If the input indicates severe crisis or self-harm, categorize as 'Fear' or 'Sadness' but provide a high stress score (90-100) so the app can trigger SOS protocols.
        Provide 3 actionable, short-term recommendations suitable for their current state.`,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");

    const data = JSON.parse(resultText);
    
    return {
      ...data,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a safe fallback in case of API failure to prevent app crash
    return {
      primaryEmotion: EmotionType.Neutral,
      stressScore: 0,
      emotionalSummary: "We couldn't analyze your input at this moment. Please try again.",
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }
};

// --- Health Symptom Analysis ---
const healthSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    possibleCauses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 potential causes for the symptoms."
    },
    severity: {
      type: Type.STRING,
      enum: ['low', 'moderate', 'high', 'emergency'],
      description: "Estimated severity level."
    },
    advice: {
      type: Type.STRING,
      description: "Actionable health advice or self-care steps."
    },
    dietaryRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of foods to eat (beneficial) or avoid based on the symptoms."
    },
    disclaimer: {
      type: Type.STRING,
      description: "Standard medical disclaimer."
    }
  },
  required: ['possibleCauses', 'severity', 'advice', 'dietaryRecommendations', 'disclaimer']
};

export const analyzeSymptoms = async (symptoms: string): Promise<HealthAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze these symptoms: "${symptoms}"`,
      config: {
        systemInstruction: `You are a helpful AI health assistant. 
        Analyze the user's described symptoms. 
        Provide potential causes (non-diagnostic), practical self-care advice, and a severity assessment.
        Crucially, include DIETARY recommendations: specific foods that might help alleviate the symptoms or foods to avoid.
        ALWAYS include a disclaimer that you are an AI and this is not medical advice.
        If symptoms sound life-threatening (chest pain, stroke signs, severe bleeding), set severity to 'emergency'.`,
        responseMimeType: "application/json",
        responseSchema: healthSchema,
        temperature: 0.4,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response");
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Health Analysis Error:", error);
    throw new Error("Unable to analyze symptoms at this time.");
  }
};

// --- Workout Advisor ---
const workoutSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    goal: { type: Type.STRING },
    duration: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ['beginner', 'intermediate', 'advanced'] },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sets: { type: Type.STRING },
          reps: { type: Type.STRING },
          notes: { type: Type.STRING }
        },
        required: ['name', 'sets', 'reps']
      }
    },
    dietPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          meal: { type: Type.STRING, description: "e.g., Breakfast, Lunch, Dinner, Snack" },
          suggestion: { type: Type.STRING, description: "Recommended food item or meal description" }
        },
        required: ['meal', 'suggestion']
      }
    }
  },
  required: ['goal', 'duration', 'difficulty', 'exercises', 'dietPlan']
};

export const generateWorkout = async (preferences: string): Promise<WorkoutPlan> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a workout plan based on these preferences: "${preferences}"`,
      config: {
        systemInstruction: `You are an expert fitness coach. 
        Create a structured, effective workout routine based on the user's goal, available equipment, or time constraints.
        Include 4-6 exercises with set/rep ranges.
        ALSO provide a simple 1-day diet plan (Breakfast, Lunch, Snack, Dinner) that aligns with their fitness goal (e.g., high protein for muscle gain, low cal for weight loss).`,
        responseMimeType: "application/json",
        responseSchema: workoutSchema,
        temperature: 0.7,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response");
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Workout Generation Error:", error);
    throw new Error("Unable to generate workout plan.");
  }
};