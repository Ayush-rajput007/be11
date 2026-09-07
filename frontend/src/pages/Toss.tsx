import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export const Toss: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'flipping' | 'settled'>('idle');
  const [result, setResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [shockwave, setShockwave] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [tossKey, setTossKey] = useState(0);

  // Sound preference persistence
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('be11_toss_sound_enabled');
    return saved !== 'false';
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const landingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and preload the audio file on mount
  useEffect(() => {
    // Main flip audio
    const audio = new Audio('/audio/Ipl_Toss_Audio.mp3');
    audio.preload = 'auto';
    audioRef.current = audio;

    // Landing click audio
    const landingAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-84.wav');
    landingAudio.preload = 'auto';
    landingAudio.volume = 0.35;
    landingAudioRef.current = landingAudio;

    // Generate slow background floating particles (capped at 28 for performance/taste)
    const items = Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 8,
      speed: Math.random() * 8 + 8,
      color: Math.random() > 0.6 ? '#FF9933' : Math.random() > 0.3 ? '#ffe066' : '#6366f1'
    }));
    setParticles(items);

    // Ensure audio ceases if the page is exited or component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (landingAudioRef.current) {
        landingAudioRef.current.pause();
        landingAudioRef.current.currentTime = 0;
        landingAudioRef.current = null;
      }
    };
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('be11_toss_sound_enabled', String(next));
      return next;
    });
  };

  const handleToss = async () => {
    if (phase === 'flipping') return;

    // Reset result state and update flip key to trigger direct CSS animation restart
    setResult(null);
    setPhase('flipping');
    setShockwave(false);
    setTossKey((prev) => prev + 1);

    // Generate outcome immediately before animation launches
    const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';

    // Handle flip audio in the direct call stack of the user click
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      if (soundEnabled) {
        try {
          await audio.play();
        } catch (err) {
          console.error('Toss audio playback failed:', err);
        }
      }
    }

    // Delay result setting slightly to match the rotation tumble, resolving any race condition
    setTimeout(() => {
      setResult(outcome);
    }, 100);

    // Settle stage triggered exactly at 3s matching the 3D flip keyframes
    setTimeout(() => {
      setPhase('settled');
      setShockwave(true);

      // Play landing sound if sound is enabled
      const landingAudio = landingAudioRef.current;
      if (soundEnabled && landingAudio) {
        landingAudio.currentTime = 0;
        landingAudio.play().catch(() => {});
      }

      // Hide impact ring after 800ms
      setTimeout(() => setShockwave(false), 800);
    }, 3000);
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-[#05060A] text-white font-poppins relative overflow-hidden flex flex-col justify-between">
      
      {/* Background ambient lighting glows */}
      <div className="absolute top-[30%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none z-0 animate-pulse duration-[8000ms]" />
      <div className="absolute top-[40%] right-[30%] translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-[#FF8C1A]/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-[#ffe066]/5 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Floating background particles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden particles-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none opacity-20"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              animation: `particles-float ${p.speed}s infinite linear`,
              animationDelay: `-${p.delay}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-6 z-10 relative text-center w-full flex-grow flex flex-col justify-start pt-4 sm:pt-6 py-4">
        
        {/* Page Hero */}
        <div className="mb-4 sm:mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8C1A] bg-[#FF8C1A]/10 px-4 py-1.5 rounded-full border border-[#FF8C1A]/20">
            Pre-Match Decider
          </span>
          <h1 className="font-poppins font-black text-5xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-indigo-300 mt-3 sm:mt-4 leading-none">
            Coin Toss
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-2 uppercase tracking-widest font-semibold max-w-md mx-auto">
            Who gets the first choice?
          </p>
          <p className="text-indigo-400/40 text-[9px] uppercase tracking-wider mt-1.5 font-bold">
            One flip. One decision. Let the game begin.
          </p>
        </div>

        {/* Sound toggler control */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-md cursor-pointer ${
              soundEnabled
                ? 'bg-[#FF8C1A]/15 border-[#FF8C1A]/30 text-[#FF8C1A] hover:bg-[#FF8C1A]/25'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
            aria-label="Toggle toss sound setting"
          >
            <span className="material-symbols-outlined text-sm">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
            {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
          </button>
        </div>

        {/* Coin Perspective Arena */}
        <div className="coin-perspective h-64 sm:h-76 flex flex-col items-center justify-center relative mb-4 sm:mb-6">
          
          {/* Shockwave expand ring */}
          {shockwave && (
            <div className="absolute custom-coin-3d rounded-full border-4 border-[#FF8C1A]/40 animate-shockwave-ring pointer-events-none" />
          )}

          {/* Dynamic Shadow */}
          <div 
            className={`absolute bottom-6 w-32 sm:w-44 h-2 rounded-full bg-black/90 pointer-events-none origin-center blur-[3px] transition-all duration-300 ${
              phase === 'flipping' ? 'animate-coin-shadow' : 'opacity-40 scale-100'
            }`} 
          />

          {/* 3D Coin Model */}
          <div
            key={tossKey}
            className={`custom-coin-3d ${
              phase === 'flipping'
                ? result === 'HEADS'
                  ? 'animate-toss-heads'
                  : 'animate-toss-tails'
                : phase === 'settled'
                ? result === 'HEADS'
                  ? 'animate-settled-heads'
                  : 'animate-settled-tails'
                : 'animate-coin-idle'
            }`}
          >
            {/* Layers stacking for physical thickness */}
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="premium-ring"
                style={{ transform: `translateZ(${i - 8}px)` }}
              />
            ))}

            {/* Heads (Front Face) */}
            <div className="premium-face premium-front flex flex-col items-center justify-center p-3">
              <div className="absolute inset-2 border border-dashed border-[#ffe066]/20 rounded-full" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#ffe066] uppercase mb-1 drop-shadow-md">
                BE11
              </span>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#aa8010]/20 border border-[#ffe066]/25 flex items-center justify-center shadow-inner overflow-hidden">
                <img 
                  src="/be11_logo.png" 
                  alt="BE11 Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain gold-filter-logo" 
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#ffe066] uppercase mt-2.5 drop-shadow-md">
                HEADS
              </span>
              <div className="specular-highlight animate-shine-toss" />
            </div>

            {/* Tails (Back Face) */}
            <div className="premium-face premium-back flex flex-col items-center justify-center p-3">
              <div className="absolute inset-2 border border-dashed border-[#ffe066]/20 rounded-full" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#ffe066] uppercase mb-1 drop-shadow-md">
                BE11
              </span>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#aa8010]/20 border border-[#ffe066]/25 flex items-center justify-center shadow-inner">
                <svg className="w-9 h-9 sm:w-10 sm:h-10 text-[#ffe066] drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18.5 5.5L5.5 18.5" strokeLinecap="round"/>
                  <path d="M19 5L5 19" strokeLinecap="round" strokeWidth="2.5"/>
                  <path d="M5.5 5.5L18.5 18.5" strokeLinecap="round"/>
                  <path d="M5 5L19 19" strokeLinecap="round" strokeWidth="2.5"/>
                  <circle cx="12" cy="12" r="3" fill="#ffe066"/>
                  <circle cx="12" cy="12" r="2.2" stroke="#aa8010" strokeWidth="0.5"/>
                </svg>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#ffe066] uppercase mt-2.5 drop-shadow-md">
                TAILS
              </span>
              <div className="specular-highlight animate-shine-toss" />
            </div>

          </div>

        </div>

        {/* State Indicators & Result Container */}
        <div className="h-20 flex flex-col items-center justify-center mb-4 sm:mb-6">
          {phase === 'idle' && (
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
              READY TO DECIDE
            </span>
          )}

          {phase === 'flipping' && (
            <span className="text-[#FF8C1A] text-[10px] font-black uppercase tracking-widest animate-pulse">
              FLIPPING...
            </span>
          )}

          {phase === 'settled' && result && (
            <div className="animate-fade-in flex flex-col items-center">
              <span className="text-[8px] text-[#FF8C1A] font-black uppercase tracking-widest mb-1.5 bg-[#FF8C1A]/10 px-3 py-1 rounded-full border border-[#FF8C1A]/20">
                RESULT DECIDED
              </span>
              <div className="bg-white/5 border border-white/10 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-xl flex flex-col items-center min-w-[200px]">
                <span className="text-xl sm:text-2xl font-black text-[#ffe066] tracking-wider uppercase">
                  {result === 'HEADS' ? '🏏 HEADS' : '⚽ TAILS'}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Your first choice
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-20">
          {phase === 'settled' ? (
            <button
              onClick={handleToss}
              className="w-44 sm:w-48 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#FF6A00] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_14px_rgba(255,106,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer"
            >
              Toss Again
            </button>
          ) : (
            <button
              onClick={handleToss}
              disabled={phase === 'flipping'}
              className="w-44 sm:w-48 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#FF6A00] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_14px_rgba(255,106,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {phase === 'flipping' ? 'Flipping...' : 'Flip Coin'}
            </button>
          )}

          <Link
            to="/"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
            }}
            className="w-44 sm:w-48 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all text-center hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            Back to Home
          </Link>
        </div>

        {/* How It Works section */}
        <div className="mt-8 border-t border-white/5 pt-6 text-left max-w-xl mx-auto">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 text-center sm:text-left">
            How The Toss Works
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-400 font-light leading-relaxed">
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="block font-black text-white text-xs mb-1 uppercase text-indigo-300">01. Flip</span>
              Click Flip Coin to generate a randomized result and initiate audio.
            </div>
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="block font-black text-white text-xs mb-1 uppercase text-indigo-300">02. Decide</span>
              The metallic coin spins through realistic 3D keyframe stages in sync with the audio track.
            </div>
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="block font-black text-white text-xs mb-1 uppercase text-indigo-300">03. Play</span>
              Read the landing face outcome card to choose fields, play sides, or bat first.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
