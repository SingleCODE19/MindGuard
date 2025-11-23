import React from 'react';
import { ReminderSettings } from '../types';

interface NotificationSettingsProps {
  settings: ReminderSettings;
  onSave: (settings: ReminderSettings) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onSave }) => {
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const handleToggle = async () => {
    if (!settings.enabled) {
      const granted = await requestPermission();
      if (granted) {
        onSave({ ...settings, enabled: true });
      } else {
        alert('Notifications are blocked. Please enable them in your browser settings.');
      }
    } else {
      onSave({ ...settings, enabled: false });
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification("MindGuard Test", {
        body: "This is how your check-in reminders will appear!",
      });
    } else {
      alert('Permission not granted yet or not supported.');
    }
  };

  return (
    <div className="animate-fade-in bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto mt-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-800">Check-in Reminders</h2>
            <p className="text-slate-500 text-sm">Set a schedule to track your mood regularly.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div>
                <span className="block font-medium text-slate-700">Enable Notifications</span>
                <span className="text-xs text-slate-400">Receive gentle nudges to check in with yourself.</span>
            </div>
            <button 
                onClick={handleToggle}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.enabled ? 'bg-teal-500' : 'bg-slate-300'}`}
            >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.enabled ? 'translate-x-6' : ''}`}></div>
            </button>
        </div>

        {settings.enabled && (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => onSave({...settings, frequency: 'daily'})}
                            className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-all flex flex-col items-center gap-1 ${settings.frequency === 'daily' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span>Daily</span>
                            <span className="text-xs font-normal opacity-70">Every day at set time</span>
                        </button>
                        <button 
                            onClick={() => onSave({...settings, frequency: 'weekly'})}
                            className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-all flex flex-col items-center gap-1 ${settings.frequency === 'weekly' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span>Weekly</span>
                            <span className="text-xs font-normal opacity-70">Once a week</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Time</label>
                    <input 
                        type="time" 
                        value={settings.time}
                        onChange={(e) => onSave({...settings, time: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button 
                        onClick={sendTestNotification}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Test notification now
                    </button>
                    <p className="text-xs text-slate-400 mt-2">
                        Note: Notifications work best when the app tab is open in the background.
                    </p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;