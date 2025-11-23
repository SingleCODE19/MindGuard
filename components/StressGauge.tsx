import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface StressGaugeProps {
  score: number;
}

const StressGauge: React.FC<StressGaugeProps> = ({ score }) => {
  const data = [{ name: 'score', value: score, fill: score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#10b981' }];

  let statusText = "Calm";
  let colorClass = "text-emerald-600";
  
  if (score > 40) {
    statusText = "Moderate Stress";
    colorClass = "text-amber-500";
  }
  if (score > 70) {
    statusText = "High Stress";
    colorClass = "text-red-500";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Mental Stress Score</h3>
      <div className="w-48 h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            innerRadius="80%" 
            outerRadius="100%" 
            barSize={10} 
            data={data} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={30} 
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
          <span className={`text-4xl font-bold ${colorClass}`}>{score}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">/ 100</span>
        </div>
      </div>
      <p className={`text-center font-medium mt-[-20px] ${colorClass}`}>{statusText}</p>
    </div>
  );
};

export default StressGauge;
