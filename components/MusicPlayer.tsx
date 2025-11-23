import React, { useState, useRef, useEffect } from 'react';

interface Track {
  title: string;
  url: string;
  category: string;
}

// Using Mixkit MP3 previews which are reliable for web playback
const TRACKS: Track[] = [
  {
    title: "Forest Ambience",
    url: "https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3",
    category: "Nature"
  },
  {
    title: "Light Rain",
    url: "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3",
    category: "Rain"
  },
  {
    title: "Thunderstorm",
    url: "https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3",
    category: "Rain"
  },
  {
    title: "Ocean Waves",
    url: "https://assets.mixkit.co/active_storage/sfx/1196/1196-preview.mp3",
    category: "Water"
  },
  {
    title: "River Stream",
    url: "https://assets.mixkit.co/active_storage/sfx/1200/1200-preview.mp3",
    category: "Water"
  },
  {
    title: "Deep Underwater",
    url: "https://assets.mixkit.co/active_storage/sfx/1197/1197-preview.mp3",
    category: "Water"
  },
  {
    title: "Morning Birds",
    url: "https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3",
    category: "Nature"
  },
  {
    title: "Campfire Crackle",
    url: "https://assets.mixkit.co/active_storage/sfx/1199/1199-preview.mp3",
    category: "Fire"
  },
  {
    title: "Night Crickets",
    url: "https://assets.mixkit.co/active_storage/sfx/1206/1206-preview.mp3",
    category: "Night"
  },
  {
    title: "Soft Wind",
    url: "https://assets.mixkit.co/active_storage/sfx/1204/1204-preview.mp3",
    category: "Nature"
  },
  {
    title: "Cat Purring",
    url: "https://assets.mixkit.co/active_storage/sfx/1266/1266-preview.mp3",
    category: "Animal"
  },
  {
    title: "Train Journey",
    url: "https://assets.mixkit.co/active_storage/sfx/1229/1229-preview.mp3",
    category: "Travel"
  },
  {
    title: "Beautiful Dream",
    url: "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3",
    category: "Piano"
  },
  {
    title: "Piano Reflection",
    url: "https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3",
    category: "Instrumental"
  },
  {
    title: "Meditation Flute",
    url: "https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3",
    category: "Instrumental"
  },
  {
    title: "Zen Bells",
    url: "https://assets.mixkit.co/active_storage/sfx/2442/2442-preview.mp3",
    category: "Instrumental"
  }
];

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle track switching
  useEffect(() => {
    if (audioRef.current) {
      setError(false);
      // We don't necessarily need to call load() if we just changed src, 
      // but it's safer for some browsers to ensure the new source is ready.
      audioRef.current.load();
      
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                // Fix: Ignore error "The play() request was interrupted by a new load request"
                // This happens when switching tracks quickly.
                if (e.name === 'AbortError' || e.message.includes('interrupted')) {
                    return;
                }
                console.error("Auto-play playback error:", e);
                // Optional: stop playing on real errors
                // setIsPlaying(false);
            });
        }
      }
    }
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    setIsPlaying(true);
                    setError(false);
                })
                .catch(e => {
                    // Ignore interruption errors
                    if (e.name === 'AbortError' || e.message.includes('interrupted')) {
                        return;
                    }
                    console.error("Toggle playback error:", e);
                    setIsPlaying(false);
                    setError(true);
                });
        }
      }
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    // Auto play when manually selecting a track
    setIsPlaying(true);
  };

  return (
    <div className={`fixed z-40 transition-all duration-300 ease-in-out shadow-lg border border-teal-100 bg-white
      ${isExpanded 
        ? 'bottom-20 right-4 left-4 md:left-auto md:w-80 rounded-2xl p-4 max-h-[80vh] overflow-y-auto' 
        : 'bottom-20 right-4 w-12 h-12 md:w-auto md:h-12 rounded-full md:rounded-full flex items-center justify-center md:px-4 md:py-2 cursor-pointer hover:shadow-xl'
      }
    `}>
      {/* 
        Using loop={true} for continuous ambient sound.
        onError handler helps manage broken links or network issues.
      */}
      <audio 
        ref={audioRef} 
        src={TRACKS[currentTrackIndex].url}
        loop={true}
        onError={() => setError(true)}
      />

      {/* Minimized View */}
      {!isExpanded && (
        <div className="flex items-center gap-2" onClick={() => setIsExpanded(true)}>
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${isPlaying ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
            {isPlaying ? (
              <div className="flex gap-0.5 items-end h-3">
                 <div className="w-1 bg-teal-500 animate-[bounce_1s_infinite] h-2"></div>
                 <div className="w-1 bg-teal-500 animate-[bounce_1.2s_infinite] h-3"></div>
                 <div className="w-1 bg-teal-500 animate-[bounce_0.8s_infinite] h-1.5"></div>
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className="hidden md:block text-sm font-medium text-slate-700 whitespace-nowrap">
            {isPlaying ? 'Playing Calm Audio' : 'Calm Zone'}
          </span>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="flex flex-col h-full animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Calm Zone
            </h3>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Current Track Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4 text-center border border-slate-100">
             <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2 text-teal-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
             </div>
             {error ? (
                 <div>
                    <h4 className="font-semibold text-red-500">Stream Error</h4>
                    <p className="text-xs text-red-400">Unable to load audio.</p>
                 </div>
             ) : (
                 <>
                    <h4 className="font-semibold text-slate-800">{TRACKS[currentTrackIndex].title}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{TRACKS[currentTrackIndex].category}</p>
                 </>
             )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <button 
                onClick={prevTrack} 
                className="text-slate-400 hover:text-teal-600 transition-colors p-2"
                aria-label="Previous Track"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button 
                onClick={togglePlay}
                disabled={error}
                className={`w-14 h-14 flex items-center justify-center text-white rounded-full shadow-lg shadow-teal-200 transition-all transform active:scale-95 ${error ? 'bg-slate-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 pl-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                )}
            </button>
            <button 
                onClick={nextTrack} 
                className="text-slate-400 hover:text-teal-600 transition-colors p-2"
                aria-label="Next Track"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 px-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>

          {/* Playlist Selection */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Sound</h4>
            <div className="space-y-1">
                {TRACKS.map((track, idx) => (
                    <button
                        key={idx}
                        onClick={() => selectTrack(idx)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${
                            currentTrackIndex === idx 
                            ? 'bg-teal-50 text-teal-700 font-medium' 
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                             <span className={`w-1.5 h-1.5 rounded-full ${currentTrackIndex === idx ? 'bg-teal-500' : 'bg-slate-300 group-hover:bg-slate-400'}`}></span>
                             <span>{track.title}</span>
                        </div>
                        {currentTrackIndex === idx && isPlaying && (
                             <div className="flex gap-0.5 items-end h-3">
                                <div className="w-0.5 bg-teal-500 animate-[bounce_1s_infinite] h-2"></div>
                                <div className="w-0.5 bg-teal-500 animate-[bounce_1.2s_infinite] h-3"></div>
                                <div className="w-0.5 bg-teal-500 animate-[bounce_0.8s_infinite] h-1.5"></div>
                             </div>
                        )}
                    </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;