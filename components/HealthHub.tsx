import React, { useState } from 'react';
import { analyzeSymptoms, generateWorkout } from '../services/geminiService';
import { HealthAnalysisResult, WorkoutPlan } from '../types';

const HealthHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'symptoms' | 'fitness'>('symptoms');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<HealthAnalysisResult | null>(null);
  const [workoutResult, setWorkoutResult] = useState<WorkoutPlan | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setHealthResult(null);
    setWorkoutResult(null);

    try {
      if (activeTab === 'symptoms') {
        const result = await analyzeSymptoms(input);
        setHealthResult(result);
      } else {
        const result = await generateWorkout(input);
        setWorkoutResult(result);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Health & Fitness Hub</h2>
        <p className="text-slate-500">Holistic wellness support for your body.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('symptoms')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'symptoms' 
              ? 'bg-white text-rose-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Symptom Checker
        </button>
        <button
          onClick={() => setActiveTab('fitness')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'fitness' 
              ? 'bg-white text-emerald-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Fitness Advisor
        </button>
      </div>

      {/* Input Area */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {activeTab === 'symptoms' 
            ? "Describe your symptoms (e.g., headache, fever, fatigue)" 
            : "Describe your fitness goal (e.g., home workout, weight loss, no equipment)"}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeTab === 'symptoms' ? "I have a throbbing headache on the right side..." : "I want a 20 min HIIT workout for beginners..."}
          className="w-full h-24 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all mb-4"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
            loading || !input.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : activeTab === 'symptoms' 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200'
          }`}
        >
          {loading ? 'Analyzing...' : activeTab === 'symptoms' ? 'Check Symptoms' : 'Generate Workout'}
        </button>
      </div>

      {/* Symptom Result */}
      {healthResult && activeTab === 'symptoms' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className={`p-4 flex items-center justify-between ${
            healthResult.severity === 'emergency' ? 'bg-red-50 text-red-700' :
            healthResult.severity === 'high' ? 'bg-orange-50 text-orange-700' :
            'bg-rose-50 text-rose-700'
          }`}>
            <span className="font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Health Analysis
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white/50 rounded">
              Severity: {healthResult.severity}
            </span>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Possible Causes</h4>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                {healthResult.possibleCauses.map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-2">Recommended Advice</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{healthResult.advice}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                 </svg>
                 Nutritional Support
              </h4>
              <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                {healthResult.dietaryRecommendations && healthResult.dietaryRecommendations.length > 0 ? (
                    healthResult.dietaryRecommendations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                    ))
                ) : (
                    <li className="list-none italic opacity-70">No specific dietary restrictions.</li>
                )}
              </ul>
            </div>

            <p className="text-xs text-slate-400 italic text-center pt-2 border-t border-slate-100">
              Disclaimer: {healthResult.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* Workout Result */}
      {workoutResult && activeTab === 'fitness' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-4 bg-emerald-50 text-emerald-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">{workoutResult.goal}</h3>
              <p className="text-xs opacity-80">{workoutResult.duration} • {workoutResult.difficulty}</p>
            </div>
            <div className="p-2 bg-white/50 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <div className="p-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Routine</h4>
            <div className="space-y-4 mb-8">
              {workoutResult.exercises.map((ex, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-800">{ex.name}</h5>
                    <div className="flex gap-4 text-sm text-slate-500 mt-1">
                      <span>{ex.sets} Sets</span>
                      <span>{ex.reps} Reps</span>
                    </div>
                    {ex.notes && <p className="text-xs text-slate-400 mt-1">{ex.notes}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Diet Plan Section */}
            {workoutResult.dietPlan && workoutResult.dietPlan.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                     <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Daily Diet Plan
                     </h4>
                     <div className="grid gap-3 sm:grid-cols-2">
                        {workoutResult.dietPlan.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200/50 shadow-sm">
                                <span className="text-xs font-bold text-amber-500 uppercase block mb-1">{item.meal}</span>
                                <p className="text-sm text-slate-700">{item.suggestion}</p>
                            </div>
                        ))}
                     </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthHub;