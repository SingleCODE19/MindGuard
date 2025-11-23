import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MoodEntry, EmotionType } from '../types';

interface DashboardProps {
  history: MoodEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-700">No Data Yet</h3>
        <p className="text-slate-500 mt-2">Complete a check-in to see your analytics.</p>
      </div>
    );
  }

  // Format data for charts
  const lineData = history.slice().reverse().map(entry => ({
    date: new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
    score: entry.stressScore
  }));

  // Count emotions
  const emotionCounts = history.reduce((acc, curr) => {
    acc[curr.primaryEmotion] = (acc[curr.primaryEmotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(emotionCounts).map(key => ({
    name: key,
    count: emotionCounts[key]
  }));

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case EmotionType.Stress: return '#ef4444';
      case EmotionType.Anger: return '#f97316';
      case EmotionType.Fear: return '#a855f7';
      case EmotionType.Sadness: return '#3b82f6';
      case EmotionType.Happiness: return '#eab308';
      case EmotionType.Anxiety: return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Weekly Stress Trends</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}} 
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#0ea5e9" 
                strokeWidth={3} 
                dot={{fill: '#0ea5e9', strokeWidth: 2, r: 4, stroke: '#fff'}} 
                activeDot={{r: 6}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Emotion Distribution</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}} 
                dy={10}
              />
              <YAxis allowDecimals={false} hide />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                cursor={{fill: 'transparent'}}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getEmotionColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
