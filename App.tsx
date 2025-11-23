import React, { useState, useEffect } from 'react';
import { analyzeMood } from './services/geminiService';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { MoodEntry, ViewState, AnalysisResult, EmotionType, ReminderSettings, User } from './types';
import AudioRecorder from './components/AudioRecorder';
import StressGauge from './components/StressGauge';
import Dashboard from './components/Dashboard';
import SOSMode from './components/SOSMode';
import NotificationSettings from './components/NotificationSettings';
import MusicPlayer from './components/MusicPlayer';
import AuthOverlay from './components/AuthOverlay';
import HealthHub from './components/HealthHub';

export default function App() {
  // State
  const [view, setView] = useState<ViewState>('home');
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [sosActive, setSosActive] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    frequency: 'daily',
    time: '09:00'
  });

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Initialize Auth Subscription
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth((currentUser) => {
      setUser(currentUser);
      // If no user (logged out), we are done loading initial auth, 
      // but data loading will trigger in the next effect.
      if (!currentUser) setIsDataLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  // Data Loading Strategy
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      if (user) {
        // --- Authenticated Mode: Load from Cloud ---
        try {
          const cloudHistory = await dataService.getMoodHistory(user.id);
          setHistory(cloudHistory);

          const cloudSettings = await dataService.getSettings(user.id);
          if (cloudSettings) {
            setReminderSettings(cloudSettings);
          }
        } catch (error) {
          console.error("Failed to load cloud data", error);
        }
      } else {
        // --- Guest Mode: Load from Local Storage ---
        const storedHistory = localStorage.getItem('mindguard_history_guest');
        const storedSettings = localStorage.getItem('mindguard_settings_guest');

        if (storedHistory) setHistory(JSON.parse(storedHistory));
        else setHistory([]);

        if (storedSettings) setReminderSettings(JSON.parse(storedSettings));
        else setReminderSettings({ enabled: false, frequency: 'daily', time: '09:00' });
      }
      setIsDataLoading(false);
    };

    loadData();
  }, [user]);

  // Save Logic (Triggered on state change)
  useEffect(() => {
    // We only auto-save to LocalStorage for GUESTS. 
    // Cloud saving is handled explicitly in handlers (handleAnalysis, handleSettingsChange) 
    // to avoid excessive writes during state updates, or we can debounce here.
    // For simplicity and robustness, we will only use this effect for Guest LocalStorage.
    
    if (!user) {
      localStorage.setItem('mindguard_history_guest', JSON.stringify(history));
      localStorage.setItem('mindguard_settings_guest', JSON.stringify(reminderSettings));
    }
  }, [history, reminderSettings, user]);

  // Notification Polling Effect
  useEffect(() => {
    const checkReminders = () => {
        if (!reminderSettings.enabled) return;
        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const [targetHour, targetMinute] = reminderSettings.time.split(':').map(Number);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if we passed the time today
        const passedTimeToday = (currentHour > targetHour) || (currentHour === targetHour && currentMinute >= targetMinute);
        
        if (passedTimeToday) {
            const lastSentDate = reminderSettings.lastSent ? new Date(reminderSettings.lastSent) : null;
            let shouldSend = false;

            if (reminderSettings.frequency === 'daily') {
                if (!lastSentDate || lastSentDate.getDate() !== now.getDate() || lastSentDate.getMonth() !== now.getMonth() || lastSentDate.getFullYear() !== now.getFullYear()) {
                    shouldSend = true;
                }
            } else if (reminderSettings.frequency === 'weekly') {
                 if (!lastSentDate || (now.getTime() - lastSentDate.getTime()) > 6 * 24 * 60 * 60 * 1000) {
                    shouldSend = true;
                }
            }

            if (shouldSend) {
                 new Notification("MindGuard Check-in", {
                    body: "It's time for your mental health check-in. How are you feeling right now?",
                    tag: 'mindguard-checkin'
                 });
                 
                 const newSettings = {...reminderSettings, lastSent: new Date().toISOString()};
                 setReminderSettings(newSettings);
                 
                 // Explicit save for updated lastSent
                 if (user) {
                   dataService.saveSettings(user.id, newSettings);
                 }
            }
        }
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();
    return () => clearInterval(interval);
  }, [reminderSettings, user]);

  const handleAnalysis = async (text: string, audioBase64?: string, mimeType?: string) => {
    setIsAnalyzing(true);
    setCurrentResult(null);

    const result = await analyzeMood(text, audioBase64, mimeType);

    if (result.stressScore >= 85 || result.primaryEmotion === EmotionType.Fear) {
        setSosActive(true);
    }

    const newEntry: MoodEntry = {
      ...result,
      id: crypto.randomUUID()
    };

    setCurrentResult(result);
    
    // Optimistic UI update
    setHistory(prev => [newEntry, ...prev]);

    // Persist Data
    if (user) {
      try {
        await dataService.saveMoodEntry(user.id, newEntry);
      } catch (err) {
        console.error("Failed to save to cloud", err);
        // Optionally show a toast error
      }
    }
    // Note: Guest data is saved via the useEffect listening to [history]

    setIsAnalyzing(false);
    setInputText(''); 
  };

  const handleTextSubmit = () => {
    if (!inputText.trim()) return;
    handleAnalysis(inputText);
  };

  const handleSettingsSave = async (newSettings: ReminderSettings) => {
    setReminderSettings(newSettings);
    if (user) {
      await dataService.saveSettings(user.id, newSettings);
    }
  };

  const handleAuthSuccess = async (loggedInUser: User) => {
    // Check if we need to migrate guest data
    const guestHistoryRaw = localStorage.getItem('mindguard_history_guest');
    const guestSettingsRaw = localStorage.getItem('mindguard_settings_guest');

    if (guestHistoryRaw) {
      const guestHistory = JSON.parse(guestHistoryRaw);
      if (guestHistory.length > 0) {
        // Upload guest history to new user account
        await dataService.batchSaveMoodEntries(loggedInUser.id, guestHistory);
        // Clear guest storage
        localStorage.removeItem('mindguard_history_guest');
      }
    }

    if (guestSettingsRaw) {
      const guestSettings = JSON.parse(guestSettingsRaw);
      // We prioritize cloud settings usually, but for first sync we can push local settings
      // if the user doesn't have settings yet. For simplicity, let's just save.
      await dataService.saveSettings(loggedInUser.id, guestSettings);
      localStorage.removeItem('mindguard_settings_guest');
    }
    
    // FIX: Manually set user state. 
    // This ensures the UI updates immediately even if the Mock Auth subscription doesn't fire.
    setUser(loggedInUser);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setView('home');
    setCurrentResult(null);
    // Data reload will happen automatically due to user state change
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32">
      {/* Animation Styles */}
      <style>{`
        @keyframes nav-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes nav-grow {
          0% { transform: scaleY(0.4); opacity: 0; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .nav-icon-pop {
          animation: nav-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .nav-bar-grow {
          transform-origin: bottom;
          animation: nav-grow 0.6s ease-out forwards;
        }
      `}</style>

      {/* Auth Modal */}
      {showAuth && (
        <AuthOverlay 
          onAuthSuccess={handleAuthSuccess} 
          onClose={() => setShowAuth(false)} 
        />
      )}

      {/* Navigation Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">MindGuard</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* User Profile / Auth Button */}
            {user ? (
               <div className="flex items-center gap-3 mr-2">
                 <div className="hidden sm:flex flex-col items-end">
                   <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                   <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500">Sign Out</button>
                 </div>
                 <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
               </div>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="text-sm font-semibold text-teal-600 hover:text-teal-700 px-3 py-1 mr-1"
              >
                Sign In
              </button>
            )}

            <button
                onClick={() => setView('settings')}
                className={`p-2 rounded-lg transition-colors ${view === 'settings' ? 'bg-slate-100 text-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}
                aria-label="Settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            <button 
                onClick={() => setSosActive(!sosActive)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${sosActive ? 'bg-slate-800 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
            >
                {sosActive ? 'Exit SOS' : 'SOS'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {sosActive && (
            <div className="mb-8">
                <SOSMode />
            </div>
        )}

        {!sosActive && (
        <>
            {/* Main Input Area - Only show if no current result or in Home view */}
            {view === 'home' && !currentResult && (
            <div className="flex flex-col gap-6 animate-fade-in">
                <div className="text-center space-y-2 py-8">
                <h2 className="text-3xl font-bold text-slate-800">
                    {user ? `Hi, ${user.name.split(' ')[0]}. ` : ''}How are you feeling?
                </h2>
                <p className="text-slate-500">Share your thoughts, or just talk to me. I'm here to listen.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type how you're feeling, or what's on your mind..."
                        className="w-full h-32 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none transition-all"
                    />
                    <div className="flex items-center justify-between mt-4">
                        <AudioRecorder 
                            disabled={isAnalyzing} 
                            onRecordingComplete={(base64, mime) => handleAnalysis(inputText, base64, mime)} 
                        />
                        <button
                            onClick={handleTextSubmit}
                            disabled={!inputText.trim() || isAnalyzing}
                            className={`px-6 py-2 rounded-full font-semibold text-white transition-all ${
                                !inputText.trim() || isAnalyzing 
                                ? 'bg-slate-300 cursor-not-allowed' 
                                : 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200'
                            }`}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Mood'}
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* Results View */}
            {view === 'home' && currentResult && (
                <div className="space-y-6 animate-fade-in">
                    <button 
                        onClick={() => setCurrentResult(null)}
                        className="text-sm text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-2"
                    >
                        ← New Check-in
                    </button>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Score Card */}
                        <div className="md:col-span-1">
                            <StressGauge score={currentResult.stressScore} />
                        </div>

                        {/* Summary Card */}
                        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium 
                                    ${currentResult.primaryEmotion === EmotionType.Stress ? 'bg-red-100 text-red-700' :
                                      currentResult.primaryEmotion === EmotionType.Happiness ? 'bg-yellow-100 text-yellow-700' :
                                      currentResult.primaryEmotion === EmotionType.Sadness ? 'bg-blue-100 text-blue-700' :
                                      'bg-slate-100 text-slate-700'}`}>
                                    {currentResult.primaryEmotion}
                                </span>
                                <span className="text-slate-400 text-sm">•</span>
                                <span className="text-slate-500 text-sm">{new Date(currentResult.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">AI Insight</h3>
                            <p className="text-slate-600 leading-relaxed">{currentResult.emotionalSummary}</p>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Recommended for You</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {currentResult.recommendations.map((rec, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                                            rec.category === 'breathing' ? 'bg-sky-100 text-sky-600' :
                                            rec.category === 'relaxation' ? 'bg-indigo-100 text-indigo-600' :
                                            rec.category === 'motivation' ? 'bg-amber-100 text-amber-600' :
                                            'bg-emerald-100 text-emerald-600'
                                        }`}>
                                            {rec.category}
                                        </span>
                                        {rec.durationMinutes && (
                                            <span className="text-xs text-slate-400">{rec.durationMinutes} min</span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-slate-800 mb-2">{rec.title}</h4>
                                    <p className="text-sm text-slate-600">{rec.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Health Hub View */}
            {view === 'health' && <HealthHub />}

            {/* History Dashboard View */}
            {view === 'history' && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                             <h2 className="text-2xl font-bold text-slate-800">Your Progress</h2>
                             <p className="text-sm text-slate-500">{user ? `Cloud History for ${user.email}` : 'Local Guest Session History'}</p>
                        </div>
                       
                        {!user && (
                          <div className="bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-full">
                            Sign in to save permanently
                          </div>
                        )}
                    </div>
                    
                    {isDataLoading ? (
                      <div className="h-64 flex items-center justify-center text-slate-400">Loading history...</div>
                    ) : (
                      <>
                        <Dashboard history={history} />
                        
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Entries</h3>
                            <div className="space-y-3">
                                {history.slice(0, 5).map(entry => (
                                    <div key={entry.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-slate-800">{entry.primaryEmotion}</span>
                                                <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-1">{entry.emotionalSummary}</p>
                                        </div>
                                        <div className={`text-lg font-bold ${entry.stressScore > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {entry.stressScore}
                                        </div>
                                    </div>
                                ))}
                                {history.length === 0 && <p className="text-slate-400 text-center">No entries yet.</p>}
                            </div>
                        </div>
                      </>
                    )}
                </div>
            )}

            {/* Settings View */}
            {view === 'settings' && (
                <div className="space-y-6">
                    {/* User Profile Card within Settings */}
                    {user && (
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                             <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                             <div>
                                 <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                                 <p className="text-slate-500 text-sm">{user.email}</p>
                                 <p className="text-xs text-slate-400 mt-1">Joined {new Date(user.joinedAt).toLocaleDateString()}</p>
                             </div>
                         </div>
                    )}
                    
                    <NotificationSettings 
                        settings={reminderSettings} 
                        onSave={handleSettingsSave} 
                    />

                    {/* Sync Info */}
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3">
                         <div className="text-indigo-500 mt-0.5">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                         </div>
                         <div>
                             <h4 className="text-sm font-bold text-indigo-800">Cloud Sync Status</h4>
                             <p className="text-xs text-indigo-700 mt-1">
                                 {user 
                                 ? "Your data is securely synced to the cloud and available on all your devices." 
                                 : "You are currently in Guest Mode. Data is only saved on this device. Sign in to sync."}
                             </p>
                         </div>
                    </div>
                </div>
            )}
        </>
        )}
      </main>

      {/* Music Player Component */}
      <MusicPlayer />

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe pt-2 px-6 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center h-16">
            <button 
                onClick={() => {setView('home'); if(currentResult) setCurrentResult(null);}}
                className={`flex flex-col items-center gap-1 group ${view === 'home' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform group-hover:scale-110 ${view === 'home' ? 'nav-icon-pop' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
                <span className="text-xs font-medium">Home</span>
            </button>

            <button 
                onClick={() => setView('health')}
                className={`flex flex-col items-center gap-1 group ${view === 'health' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                <span className="text-xs font-medium">Health</span>
            </button>

            <div className="relative -top-5">
                <button 
                    onClick={() => {
                        setView('home'); 
                        setCurrentResult(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-200 text-white transform transition-all active:scale-95 group"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-500 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            <button 
                onClick={() => setView('history')}
                className={`flex flex-col items-center gap-1 group ${view === 'history' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {/* Split into 3 separate paths for individual animation */}
                        <path 
                            strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" 
                            className={view === 'history' ? 'nav-bar-grow' : ''} 
                            style={{animationDelay: '0ms'}}
                        />
                        <path 
                            strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M15 19v-10a2 2 0 00-2-2h-2a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" 
                            className={view === 'history' ? 'nav-bar-grow' : ''} 
                            style={{animationDelay: '100ms'}}
                        />
                        <path 
                            strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M21 19v-14a2 2 0 00-2-2h-2a2 2 0 00-2 2v14a2 2 0 002 2h2a2 2 0 002-2z" 
                            className={view === 'history' ? 'nav-bar-grow' : ''} 
                            style={{animationDelay: '200ms'}}
                        />
                    </svg>
                </div>
                <span className="text-xs font-medium">Stats</span>
            </button>

            <button 
                onClick={() => setView('settings')}
                className={`flex flex-col items-center gap-1 group ${view === 'settings' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className="text-xs font-medium">Config</span>
            </button>
        </div>
      </nav>
    </div>
  );
}