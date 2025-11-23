import React from 'react';

const SOSMode: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg animate-fade-in">
      {/* Animated Background Wave */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <svg 
            className="absolute -bottom-4 left-0 w-[200%] h-full animate-wave" 
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
        >
            <path fill="#ef4444" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,202.7C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave 20s linear infinite;
        }
      `}</style>

      <div className="relative z-10 flex items-start gap-4">
        <div className="bg-red-100 p-3 rounded-full shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-red-800 mb-2">Emergency Support</h2>
          <p className="text-red-700 mb-4">
            You are not alone. If you are in immediate danger or experiencing a medical emergency, please contact emergency services immediately.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <a href="tel:988" className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call 988 (Lifeline)
            </a>
            <a href="sms:988" className="flex items-center justify-center gap-2 bg-white/80 border-2 border-red-600 text-red-700 font-bold py-3 px-6 rounded-lg hover:bg-red-50 transition-colors backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
              Text 988
            </a>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg border border-red-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">5-4-3-2-1 Grounding Technique</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-red-600 font-bold text-xs">5</span>
                Things you can see
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-red-600 font-bold text-xs">4</span>
                Things you can touch
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-red-600 font-bold text-xs">3</span>
                Things you can hear
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-red-600 font-bold text-xs">2</span>
                Things you can smell
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-red-600 font-bold text-xs">1</span>
                Thing you can taste
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSMode;