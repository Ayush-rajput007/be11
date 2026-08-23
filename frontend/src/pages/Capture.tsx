import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Tv, 
  Share2, 
  History, 
  Award, 
  Users, 
  ArrowRight, 
  ChevronRight, 
  Download, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  TrendingUp, 
  Eye, 
  MapPin
} from 'lucide-react';

export const Capture: React.FC = () => {
  // Custom states for simulated interactive dashboard
  const [selectedHighlight, setSelectedHighlight] = useState<number>(0);
  const [isPlayingHighlight, setIsPlayingHighlight] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // States for timeline animated progress on scroll
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(0);

  // Copy Link simulator for the Shareable moments
  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Mock Highlights for interactive Match Centre Dashboard
  const matchMoments = [
    { id: 0, title: "Delhi Smashers WINNING SIX", time: "19.5 Overs", desc: "Aarav hits it clean over long-on to seal the chase!", type: "six", distance: "92m" },
    { id: 1, title: "Vikram Wicket (Clean Bowled)", time: "14.2 Overs", desc: "Perfect inswinging yorker takes out the middle stump.", type: "wicket", distance: "138 km/h" },
    { id: 2, title: "Superb Diving Catch at Slip", time: "08.4 Overs", desc: "Rohan flies to his right for a stunning one-handed grab.", type: "catch", distance: "Reflex" },
    { id: 3, title: "Teammates Celebration Moment", time: "20.0 Overs", desc: "Delhi Smashers lift the league trophy in victory.", type: "celebration", distance: "Emotion" }
  ];

  // Steps for "How it Works"
  const howItWorksSteps = [
    {
      num: "01",
      title: "Book Your Ground",
      desc: "Find and book your favorite cricket ground in India through the BE11 venue scheduler.",
      cta: "Book Ground →",
      link: "/venues"
    },
    {
      num: "02",
      title: "Start Your Match",
      desc: "Arrive at the turf. Our capture cameras are pre-installed. Scan the QR at the booking slot to start capturing.",
      cta: "Learn Setup →",
      link: "#how-it-works"
    },
    {
      num: "03",
      title: "Play & Capture",
      desc: "Enjoy the game. Play with standard rules. Boundaries, wickets, and milestones are tagged automatically.",
      cta: "Match Rules →",
      link: "/live-matches"
    },
    {
      num: "04",
      title: "Relive & Share",
      desc: "Instantly check your dashboard post-match. Save your favorite moments, download them, and share with teammates.",
      cta: "Go to Dashboard →",
      link: "/dashboard"
    }
  ];

  return (
    <div className="pt-20 bg-surface text-on-surface overflow-hidden font-body-lg">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col justify-center py-12 md:py-20 lg:py-24 bg-gradient-to-b from-[#001a49]/5 via-surface to-surface">
        
        {/* Glow and Tri-color Ambient Accents */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-[10%] w-80 h-80 bg-[#fe9832]/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-[#44af33]/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
          {/* Subtle Tricolor Glow Line top */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] opacity-60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-container-padding grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content (Left) */}
          <div className="lg:col-span-6 text-left space-y-6 md:space-y-8">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#dae2ff] border border-[#b1c5ff]/35 text-[#001a49] font-bold text-xs uppercase tracking-wider">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe9832] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#fe9832]"></span>
              </span>
              <span>BE11 Capture is Live</span>
            </div>

            {/* Headline */}
            <h1 className="font-display-hero text-4xl md:text-5xl lg:text-6xl font-black text-[#001a49] leading-[1.1] tracking-tight">
              Every Match Deserves to Be <span className="text-[#fe9832] text-glow-saffron">Remembered.</span>
            </h1>

            {/* Alternate tagline */}
            <p className="text-base md:text-lg font-semibold text-[#fe9832]/90 uppercase tracking-widest font-poppins">
              Capture the game. Relive the moments. Share the memories.
            </p>

            {/* Description */}
            <p className="text-on-surface-variant font-light text-sm md:text-base leading-relaxed max-w-xl">
              BE11 Capture turns your cricket matches into memories you can keep forever — from breathtaking boundaries and wickets to the raw celebrations you share with your teammates on the pitch.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-[#fe9832] text-white rounded-full font-label-bold font-bold text-sm shadow-[0_4px_14px_rgba(254,152,50,0.3)] hover:shadow-[0_8px_24px_rgba(254,152,50,0.5)] hover:-translate-y-0.5 active:translate-y-0 hover:scale-102 transition-all btn-primary-premium flex items-center gap-2 cursor-pointer"
              >
                <span>Capture Your Match</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#timeline-section"
                className="px-8 py-4 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#001a49] rounded-full font-label-bold font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                See How It Works
              </a>
            </div>
            
            {/* Built for India slogan */}
            <div className="pt-6 border-t border-outline-variant/30 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF9933] to-white flex items-center justify-center text-[10px] font-bold text-primary border-2 border-white shadow-sm">IND</div>
                <div className="w-8 h-8 rounded-full bg-[#001a49] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">B11</div>
              </div>
              <p className="text-[11px] text-outline font-semibold tracking-wide uppercase">
                Built for the grassroots cricket culture of India.
              </p>
            </div>
          </div>

          {/* Hero Visual (Right) */}
          <div className="lg:col-span-6 relative flex justify-center items-center w-full min-h-[400px] md:min-h-[500px]">
            {/* Cinematic background stadium glow */}
            <div className="absolute inset-0 bg-[#001a49]/90 rounded-[32px] overflow-hidden shadow-2xl border border-white/10 group">
              
              {/* Broadcast visual background (Ground view) */}
              <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                <img 
                  src="https://images.unsplash.com/photo-1540747737956-37872404a821?auto=format&fit=crop&w=800&q=80" 
                  alt="Cricket Stadium Pitch" 
                  className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10s] ease-out" 
                />
              </div>

              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,26,73,0.8)_80%)]"></div>

              {/* Dynamic Camera Broadcast overlays */}
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                <span className="text-[10px] font-bold tracking-widest text-white uppercase font-poppins">● REC CAM 01</span>
              </div>
              
              <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-[10px] font-semibold tracking-wider text-white/80 font-poppins">1080P FHD 60FPS</span>
              </div>

              {/* Dynamic crosshair overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-16 h-16 border border-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute w-24 h-[1px] bg-white"></div>
                <div className="absolute h-24 w-[1px] bg-white"></div>
              </div>

              {/* FLOATING MATCH UI CARDS (Glassmorphic) */}
              
              {/* Card 1: LIVE League scoreboard */}
              <div className="absolute top-20 left-6 right-6 md:left-8 md:right-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl animate-[float_6s_infinite_ease-in-out]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold bg-[#FF9933] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">LIVE</span>
                  <span className="text-[10px] text-white/70 font-semibold">Delhi Corporate Cricket League</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-white tracking-tight">Delhi Smashers</h4>
                    <p className="text-[10px] text-white/60">Target: 168 (Req Run Rate: 7.7)</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl md:text-3xl font-black text-white">124 <span className="text-sm font-medium text-white/70">/ 3</span></h3>
                    <p className="text-xs text-[#fe9832] font-bold font-poppins">14.2 Overs</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Match Highlight marker */}
              <div className="absolute bottom-24 left-6 bg-black/60 backdrop-blur-lg border border-[#fe9832]/40 p-3 rounded-xl shadow-xl flex items-center gap-3 max-w-[220px] animate-[float_7s_infinite_ease-in-out] pointer-events-none" style={{ animationDelay: '1.5s' }}>
                <div className="w-8 h-8 rounded-full bg-[#fe9832]/20 flex items-center justify-center text-[#fe9832] flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[9px] font-extrabold text-[#fe9832] uppercase tracking-wider">🔥 MATCH HIGHLIGHT</p>
                  <h5 className="text-xs font-bold text-white truncate">Winning Six • 78m</h5>
                  <p className="text-[9px] text-white/50">Tagged at 19.5 Overs</p>
                </div>
              </div>

              {/* Card 3: Player Milestone */}
              <div className="absolute bottom-8 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl flex items-center gap-3 max-w-[200px] animate-[float_8s_infinite_ease-in-out] pointer-events-none" style={{ animationDelay: '3s' }}>
                <div className="w-8 h-8 rounded-full bg-[#44af33]/20 flex items-center justify-center text-[#44af33] border border-[#44af33]/30 flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[9px] font-extrabold text-[#44af33] uppercase tracking-wider">PLAYER MOMENT</p>
                  <h5 className="text-xs font-bold text-white truncate">Aarav — 42* runs</h5>
                  <p className="text-[9px] text-white/60">32 Balls (4x4, 2x6)</p>
                </div>
              </div>

              {/* Bottom camera specs strip */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 border-t border-white/10 pt-2 flex justify-between items-center text-[8px] text-white/40 tracking-widest uppercase">
                <span>ZOOM 1.8X</span>
                <span>ISO 400</span>
                <span>SHUTTER 1/1000s</span>
              </div>
            </div>

            {/* Subtle external border frames */}
            <div className="absolute -inset-4 border border-[#fe9832]/15 rounded-[40px] pointer-events-none z-0"></div>
          </div>
        </div>
      </section>

      {/* 2. EMOTIONAL SECTION */}
      <section className="relative py-24 bg-primary text-white overflow-hidden text-center">
        {/* Background Parallax styling */}
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1531415080290-bc98545ab3ef?auto=format&fit=crop&w=1200&q=80" 
            alt="Cricket players celebrating" 
            className="w-full h-full object-cover object-center scale-110" 
          />
          <div className="absolute inset-0 bg-[#001a49] mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-container-padding space-y-6">
          <h2 className="font-display-hero text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider text-white">
            Because Some Matches Become Memories.
          </h2>
          <div className="w-24 h-[2px] bg-gradient-to-r from-[#FF9933] via-white to-[#138808] mx-auto my-6"></div>
          <p className="text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto text-white/80">
            Years later, you won't remember the exact score of every match. You'll remember the six that disappeared into the evening sky, the last-wicket stand everyone screamed for, the last-over comeback, and the celebration with your teammates.
          </p>
          <p className="text-xl md:text-2xl font-bold text-secondary-container mt-6">
            BE11 Capture helps you keep those moments.
          </p>
        </div>
      </section>

      {/* 3. MORE THAN A RECORDING */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-container-padding">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins">Premium Features</span>
            <h2 className="font-display-hero text-3xl md:text-4xl font-black text-[#001a49]">
              More Than a Recording. It's Your Cricket Memory.
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base font-light">
              Unlike raw camera footage, BE11 Capture is integrated directly into the stadium and scores, tagging matching events dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 01 */}
            <div className="bg-white p-8 rounded-24 shadow-sm border border-outline-variant/30 group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 flex flex-col text-left justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] flex items-start justify-end p-4 text-xs font-bold text-primary/10 group-hover:text-primary/20 transition-colors">01</div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-[#001a49] group-hover:text-white transition-all duration-300">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-primary font-poppins group-hover:text-secondary-container transition-colors">Capture Every Moment</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                  Record your complete cricket match and preserve the game from the first ball to the final celebration.
                </p>
              </div>
            </div>

            {/* Feature 02 */}
            <div className="bg-white p-8 rounded-24 shadow-sm border border-outline-variant/30 group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 flex flex-col text-left justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] flex items-start justify-end p-4 text-xs font-bold text-primary/10 group-hover:text-primary/20 transition-colors">02</div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-[#001a49] group-hover:text-white transition-all duration-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-primary font-poppins group-hover:text-secondary-container transition-colors">Find the Highlights</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                  Turn important moments into memorable clips. Easily crop, edit, and access events: Sixes, Wickets, Catches, and Boundaries.
                </p>
              </div>
            </div>

            {/* Feature 03 */}
            <div className="bg-white p-8 rounded-24 shadow-sm border border-outline-variant/30 group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 flex flex-col text-left justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] flex items-start justify-end p-4 text-xs font-bold text-primary/10 group-hover:text-primary/20 transition-colors">03</div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-[#001a49] group-hover:text-white transition-all duration-300">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-primary font-poppins group-hover:text-secondary-container transition-colors">Share With Your Team</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                  Share memorable clips with teammates, friends, and family instantly via UPI, WhatsApp, or Instagram with custom overlays.
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/30 mt-4 flex items-center justify-between text-[11px] font-bold text-secondary-container cursor-pointer group-hover:underline">
                <span>Share the Moment</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Feature 04 */}
            <div className="bg-white p-8 rounded-24 shadow-sm border border-outline-variant/30 group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 flex flex-col text-left justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] flex items-start justify-end p-4 text-xs font-bold text-primary/10 group-hover:text-primary/20 transition-colors">04</div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-[#001a49] group-hover:text-white transition-all duration-300">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-primary font-poppins group-hover:text-secondary-container transition-colors">Build Your Match History</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                  Keep your matches organized so you can return to your cricket career archives and milestones anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FROM BALL ONE TO LAST BALL TIMELINE */}
      <section id="timeline-section" className="py-24 bg-[#001130] text-white overflow-hidden relative animate-[fadeIn_0.5s_ease-out]">
        {/* Absolute tricolor styling overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(254,152,50,0.1)_0%,rgba(0,0,0,0)_60%)]"></div>
        
        <div className="max-w-7xl mx-auto px-container-padding text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-secondary-container uppercase tracking-widest block font-poppins">Match Progression</span>
            <h2 className="font-display-hero text-3xl md:text-4xl font-black text-white">
              From Ball One to the Last Celebration.
            </h2>
            <p className="text-white/60 text-xs md:text-sm font-light">
              Scroll through a captured match. See how specific timeline events trigger instant highlights on the camera record feed.
            </p>
          </div>

          {/* Interactive Match Timeline Row */}
          <div className="relative pt-12 pb-8 max-w-5xl mx-auto overflow-x-auto scrollbar-hide md:overflow-x-visible">
            <div className="min-w-[600px] md:min-w-0 relative">
              {/* Horizontal Timeline Connector Bar */}
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/10 -translate-y-1/2"></div>
              
              {/* Draw overlay progress bar */}
              <div className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-[#FF9933] to-[#138808] -translate-y-1/2 transition-all duration-500" style={{ width: `${(activeTimelineStep / 5) * 100}%` }}></div>

              <div className="grid grid-cols-6 gap-2 md:gap-4 relative z-10">
                
                {/* Event 0: START */}
                <button 
                  onClick={() => setActiveTimelineStep(0)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3 border-2 transition-all ${activeTimelineStep >= 0 ? 'bg-[#FF9933] border-[#FF9933] text-white scale-110 shadow-lg' : 'bg-[#001130] border-white/20 text-white/50 group-hover:border-white/50'}`}>
                    0.1
                  </div>
                  <span className="text-[10px] font-bold tracking-wider font-poppins uppercase">Start Match</span>
                  <span className="text-[9px] text-white/40 block mt-1">Ready</span>
                </button>

                {/* Event 1: BOUNDARY */}
                <button 
                  onClick={() => setActiveTimelineStep(1)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3 border-2 transition-all ${activeTimelineStep >= 1 ? 'bg-[#FF9933] border-[#FF9933] text-white scale-110 shadow-lg' : 'bg-[#001130] border-white/20 text-white/50 group-hover:border-white/50'}`}>
                    01.2
                  </div>
                  <span className="text-[10px] font-bold tracking-wider font-poppins uppercase text-[#FF9933]">Four</span>
                  <span className="text-[9px] text-white/40 block mt-1">Boundary</span>
                </button>

                {/* Event 2: WICKET */}
                <button 
                  onClick={() => setActiveTimelineStep(2)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3 border-2 transition-all ${activeTimelineStep >= 2 ? 'bg-red-600 border-red-600 text-white scale-110 shadow-lg' : 'bg-[#001130] border-white/20 text-white/50 group-hover:border-white/50'}`}>
                    05.4
                  </div>
                  <span className="text-[10px] font-bold tracking-wider font-poppins uppercase text-red-500">Wicket</span>
                  <span className="text-[9px] text-white/40 block mt-1">Clean bowled</span>
                </button>

                {/* Event 3: SIX */}
                <button 
                  onClick={() => setActiveTimelineStep(3)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3 border-2 transition-all ${activeTimelineStep >= 3 ? 'bg-[#FF9933] border-[#FF9933] text-white scale-110 shadow-lg' : 'bg-[#001130] border-white/20 text-white/50 group-hover:border-white/50'}`}>
                    08.1
                  </div>
                  <span className="text-[10px] font-bold tracking-wider font-poppins uppercase text-[#FF9933]">Six</span>
                  <span className="text-[9px] text-white/40 block mt-1">Huge hit!</span>
                </button>

                {/* Event 4: CATCH */}
                <button 
                  onClick={() => setActiveTimelineStep(4)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3 border-2 transition-all ${activeTimelineStep >= 4 ? 'bg-[#138808] border-[#138808] text-white scale-110 shadow-lg' : 'bg-[#001130] border-white/20 text-white/50 group-hover:border-white/50'}`}>
                    12.3
                  </div>
                  <span className="text-[10px] font-bold tracking-wider font-poppins uppercase text-green-500">Catch</span>
                  <span className="text-[9px] text-white/40 block mt-1">Diving grab</span>
                </button>

                {/* Event 5: WINNING MOMENT */}
                <button 
                  onClick={() => setActiveTimelineStep(5)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3 border-2 transition-all ${activeTimelineStep >= 5 ? 'bg-gradient-to-r from-[#FF9933] to-[#138808] border-none text-white scale-110 shadow-lg' : 'bg-[#001130] border-white/20 text-white/50 group-hover:border-white/50'}`}>
                    14.5
                  </div>
                  <span className="text-[10px] font-bold tracking-wider font-poppins uppercase text-green-400">Winner</span>
                  <span className="text-[9px] text-white/40 block mt-1">Celebrations</span>
                </button>

              </div>
            </div>
          </div>

          {/* Timeline Event Description Card Container */}
          <div className="max-w-2xl mx-auto mt-10 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-xs font-bold font-poppins text-[#FF9933] tracking-widest uppercase">
                {activeTimelineStep === 0 ? "Match Initiation" : 
                 activeTimelineStep === 1 ? "Boundary Event Tag" :
                 activeTimelineStep === 2 ? "Wicket Event Tag" :
                 activeTimelineStep === 3 ? "Maximum Boundary Hit" :
                 activeTimelineStep === 4 ? "Crucial Fielding Catch" : "Victory Moment"}
              </span>
              <span className="text-xs text-white/50">
                {activeTimelineStep === 0 ? "Overs: 0.1" : 
                 activeTimelineStep === 1 ? "Overs: 01.2" :
                 activeTimelineStep === 2 ? "Overs: 05.4" :
                 activeTimelineStep === 3 ? "Overs: 08.1" :
                 activeTimelineStep === 4 ? "Overs: 12.3" : "Overs: 14.5"}
              </span>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-bold font-poppins text-sm flex-shrink-0">
                {activeTimelineStep}
              </div>
              <div>
                <h4 className="text-lg font-bold font-poppins">
                  {activeTimelineStep === 0 && "Camera Feeds Enabled & Recording Starts"}
                  {activeTimelineStep === 1 && "Rahul drives through covers for 4 runs"}
                  {activeTimelineStep === 2 && "Bowler knocks middle stump clean off"}
                  {activeTimelineStep === 3 && "Sixer! High ball clears the boundary fence"}
                  {activeTimelineStep === 4 && "Spectacular catch at cover boundary"}
                  {activeTimelineStep === 5 && "Winning boundary chased down! Match celebration captured"}
                </h4>
                <p className="text-xs text-white/60 mt-1 leading-relaxed font-light">
                  {activeTimelineStep === 0 && "Both primary camera rigs and scoring interfaces are sync'd. The referee's digital scorecard starts logging ball tags to the cloud video feed."}
                  {activeTimelineStep === 1 && "A cover drive hit with speed. Our algorithms crop a 15-second block around the batsman strike event. High definition slow-motion review ready."}
                  {activeTimelineStep === 2 && "The crowd erupts. Bowling camera registers speed at 138 km/h. Clip is saved instantly into match memories database."}
                  {activeTimelineStep === 3 && "Estimated at 85m. Auto-generates a clip tag inside the highlight editor with visual score overlay indicating boundary type."}
                  {activeTimelineStep === 4 && "AI logs a field event index code. Captures player running trajectory and teammate celebration."}
                  {activeTimelineStep === 5 && "Target chased. The final celebratory team scene is logged directly to the team's share dashboard. Instant social export available."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. YOUR MATCH, YOUR STORY - SIMULATED DASHBOARD */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Story description */}
            <div className="lg:col-span-5 text-left space-y-6">
              <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins">MATCH CENTRE</span>
              <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary leading-tight">
                Your Match, Your Story.
              </h2>
              <p className="text-on-surface-variant font-light text-sm md:text-base leading-relaxed">
                Revisit your team's match details, run rates, wickets, and milestones in a dashboard built like a professional tournament platform. Select any highlight on the right to simulate playing the moments.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-primary">Pre-installed high quality camera arrays</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-primary">Tagging synced with local turf digital scoring</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-primary">Instant mobile highlight delivery post-match</span>
                </div>
              </div>
            </div>

            {/* Right Column: Simulated Dashboard Widget */}
            <div className="lg:col-span-7 bg-[#001a49] text-white p-6 md:p-8 rounded-3xl shadow-2xl border border-white/10 text-left">
              {/* Dashboard Top bar */}
              <div className="flex justify-between items-center border-b border-white/15 pb-4 mb-6">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FF9933]">Match Centre Dashboard</h4>
                  <p className="text-[10px] text-white/50">Sunday, August 16, 2026</p>
                </div>
                <span className="text-[9px] font-bold bg-white/15 px-2.5 py-1 rounded-full text-white/80 border border-white/10 uppercase font-poppins">ID: BE11-7392</span>
              </div>

              {/* Match Header */}
              <div className="grid grid-cols-11 gap-2 items-center text-center mb-6">
                <div className="col-span-4 text-left">
                  <h5 className="font-poppins font-black text-sm md:text-base text-white">Delhi Smashers</h5>
                  <p className="text-[10px] text-white/60">Won by 4 wickets</p>
                </div>
                <div className="col-span-3 flex flex-col items-center">
                  <span className="text-[9px] font-bold bg-green-600 text-white px-2 py-0.5 rounded mb-1 uppercase tracking-wide">RESULT</span>
                  <span className="text-xs font-semibold text-white/40">vs</span>
                </div>
                <div className="col-span-4 text-right">
                  <h5 className="font-poppins font-black text-sm md:text-base text-white">Noida Strikers</h5>
                  <p className="text-[10px] text-white/60">Toss: Noida (Bat)</p>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-center">
                <div>
                  <p className="text-[10px] text-white/50 tracking-wider uppercase font-poppins">Delhi Smashers</p>
                  <h3 className="text-2xl md:text-3xl font-black text-white mt-1">168 / 6</h3>
                  <p className="text-[11px] font-bold text-[#fe9832] font-poppins">19.5 Overs</p>
                </div>
                <div className="border-l border-white/10">
                  <p className="text-[10px] text-white/50 tracking-wider uppercase font-poppins">Noida Strikers</p>
                  <h3 className="text-2xl md:text-3xl font-black text-white mt-1">167 / 6</h3>
                  <p className="text-[11px] font-bold text-white/70 font-poppins">20.0 Overs</p>
                </div>
              </div>

              {/* Moments List */}
              <div className="mb-6">
                <h5 className="text-[10px] font-extrabold text-white/70 uppercase tracking-widest mb-3">Interactive Highlights</h5>
                <div className="space-y-2">
                  {matchMoments.map((mom) => (
                    <button
                      key={mom.id}
                      onClick={() => {
                        setSelectedHighlight(mom.id);
                        setIsPlayingHighlight(true);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${selectedHighlight === mom.id ? 'bg-[#FF9933]/15 border-[#FF9933] text-white shadow-md' : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedHighlight === mom.id ? 'bg-[#FF9933] text-white' : 'bg-white/10 text-white/70'}`}>
                          {mom.type === 'six' && <Sparkles className="w-4 h-4" />}
                          {mom.type === 'wicket' && <Award className="w-4 h-4" />}
                          {mom.type === 'catch' && <TrendingUp className="w-4 h-4" />}
                          {mom.type === 'celebration' && <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <h6 className="text-xs font-bold font-poppins">{mom.title}</h6>
                          <p className="text-[9px] text-white/40">{mom.desc}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 font-poppins">
                        <span className="text-[9px] font-semibold bg-white/10 px-2 py-0.5 rounded text-white/60">{mom.time}</span>
                        <p className="text-[8px] text-[#fe9832] font-bold mt-1">{mom.distance}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watch Video Frame Simulation */}
              <AnimatePresence mode="wait">
                {isPlayingHighlight && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-black rounded-2xl overflow-hidden border border-white/10 relative"
                  >
                    <div className="aspect-video w-full relative flex items-center justify-center bg-zinc-950">
                      {/* Video graphic layout */}
                      <div className="absolute inset-0 bg-[#FF9933]/10 mix-blend-color z-0"></div>
                      <img 
                        src="https://images.unsplash.com/photo-1531415080290-bc98545ab3ef?auto=format&fit=crop&w=600&q=80" 
                        alt="Simulated highlight clip" 
                        className="w-full h-full object-cover opacity-60 z-0" 
                      />
                      {/* Play overlay controls */}
                      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/40">
                        <div className="flex justify-between items-center text-[10px] text-white/80">
                          <span className="font-bold bg-red-600 px-2 py-0.5 rounded text-white tracking-widest font-poppins text-[8px]">REPLAY</span>
                          <span>CAM 2 (Slow Mo)</span>
                        </div>
                        
                        <div className="flex justify-center items-center">
                          <button className="w-12 h-12 rounded-full bg-[#FF9933] hover:scale-105 transition-all text-white flex items-center justify-center shadow-lg cursor-pointer">
                            <Play className="w-6 h-6 fill-white ml-1" />
                          </button>
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-[#FF9933] uppercase font-poppins">Delhi Smashers Centre</p>
                            <h5 className="text-xs font-semibold">{matchMoments[selectedHighlight].title}</h5>
                          </div>
                          <span className="text-[9px] text-white/50">{matchMoments[selectedHighlight].time}</span>
                        </div>
                      </div>
                    </div>
                    {/* Share action bar inside dashboard widget */}
                    <div className="p-3 bg-zinc-900 flex justify-between items-center text-xs">
                      <span className="text-[9px] text-white/50">Simulated Player Highlights</span>
                      <div className="flex gap-2 font-poppins">
                        <button className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-[10px] font-bold transition-all cursor-pointer">
                          <Download className="w-3.5 h-3.5" />
                          <span>Save Clip</span>
                        </button>
                        <button 
                          onClick={handleCopyLink}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#FF9933] text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle highlights button */}
              {!isPlayingHighlight && (
                <button
                  onClick={() => setIsPlayingHighlight(true)}
                  className="w-full h-12 bg-white/10 hover:bg-white/15 rounded-xl flex items-center justify-center gap-2 border border-white/10 font-label-bold font-bold text-xs uppercase tracking-wider transition-all mt-4 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Watch Highlights Demo</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* 6. AI HIGHLIGHTS SECTION (Concept Showcase) */}
      <section className="py-24 bg-primary text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(68,175,51,0.05)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="max-w-7xl mx-auto px-container-padding grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
          
          <div className="space-y-6">
            <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins block">Coming to BE11 Capture</span>
            <h2 className="font-display-hero text-3xl md:text-4xl font-black text-white leading-tight">
              Your Best Moments, Found Faster.
            </h2>
            <p className="text-white/70 font-light text-sm md:text-base leading-relaxed">
              We are working on integrating advanced machine-learning computer vision models. In the future, BE11 Capture will organize the moments that matter — boundaries, wickets, celebrations, and match-defining plays — so you spend less time searching and more time reliving the game.
            </p>
            
            {/* Planned tag */}
            <div className="bg-[#138808]/20 border border-[#138808]/40 p-4 rounded-xl max-w-md">
              <div className="flex gap-3 items-start">
                <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-green-400 uppercase font-poppins">Planned Experience</h4>
                  <p className="text-[11px] text-white/60 mt-1">
                    AI sound sensors will pick up ball strikes and wicket cheers to automatically slice and trim perfect reels without manual editor review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Timeline visualization graphic */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <h4 className="text-xs font-bold tracking-widest text-[#FF9933] uppercase font-poppins">AI Video Timeline Sync</h4>
            
            <div className="space-y-4">
              {/* Timeline clip block */}
              <div className="h-10 bg-white/10 rounded-lg flex overflow-hidden border border-white/5 relative items-center">
                <div className="absolute left-[15%] w-[8%] h-full bg-[#FF9933]/40 border-x border-[#FF9933]"></div>
                <div className="absolute left-[45%] w-[6%] h-full bg-red-500/40 border-x border-red-500"></div>
                <div className="absolute left-[70%] w-[10%] h-full bg-[#138808]/40 border-x border-[#138808]"></div>
                
                <span className="text-[8px] text-white/30 absolute left-4 font-mono">00:00</span>
                <span className="text-[8px] text-white/30 absolute right-4 font-mono">20:00</span>
              </div>

              {/* Tag labels */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="p-2 rounded bg-[#FF9933]/15 text-[#FF9933] border border-[#FF9933]/30 font-bold font-poppins">
                  SIX TAG
                </div>
                <div className="p-2 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold font-poppins">
                  WICKET TAG
                </div>
                <div className="p-2 rounded bg-[#138808]/15 text-green-400 border border-[#138808]/30 font-bold font-poppins">
                  CATCH TAG
                </div>
                <div className="p-2 rounded bg-white/10 text-white/70 border border-white/15 font-bold font-poppins">
                  CELEBRATION
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-4 text-center">
              <span className="text-[10px] text-white/40 tracking-wider">BE11 Sports AI Labs project. Estimated Release: Q4 2026.</span>
            </div>
          </div>

        </div>
      </section>

      {/* 7. TEAM MEMORY SECTION */}
      <section className="py-24 bg-surface-container-low text-center relative overflow-hidden">
        
        {/* Absolute tricolor separator accent line */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"></div>

        <div className="max-w-6xl mx-auto px-container-padding space-y-12 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual with Overlaid memory cards */}
            <div className="relative rounded-3xl overflow-hidden h-[360px] md:h-[450px] shadow-2xl border border-outline-variant/30 group">
              <img 
                src="https://images.unsplash.com/photo-1531415080290-bc98545ab3ef?auto=format&fit=crop&w=800&q=80" 
                alt="Grassroots cricket players sharing victory laugh" 
                className="w-full h-full object-cover scale-102 group-hover:scale-105 transition-all duration-[6s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent"></div>

              {/* Overlay note 1 */}
              <div className="absolute top-8 left-6 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg rotate-[-3deg] border border-[#FF9933]/20 max-w-[160px] animate-[float_6s_infinite_ease-in-out]">
                <p className="text-[10px] font-bold text-[#FF9933] font-poppins">Vikram's York</p>
                <h5 className="text-xs font-bold text-primary mt-0.5">"That last-over six."</h5>
                <span className="text-[8px] text-outline">Match 04</span>
              </div>

              {/* Overlay note 2 */}
              <div className="absolute top-1/3 right-8 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg rotate-[4deg] border border-[#138808]/20 max-w-[160px] animate-[float_7s_infinite_ease-in-out]" style={{ animationDelay: '1s' }}>
                <p className="text-[10px] font-bold text-[#138808] font-poppins">Rohan's Catch</p>
                <h5 className="text-xs font-bold text-primary mt-0.5">"That impossible catch!"</h5>
                <span className="text-[8px] text-outline">League Semis</span>
              </div>

              {/* Overlay note 3 */}
              <div className="absolute bottom-16 left-8 bg-[#FF9933] text-white p-3 rounded-xl shadow-lg rotate-[-2deg] max-w-[180px] animate-[float_8s_infinite_ease-in-out]" style={{ animationDelay: '2s' }}>
                <p className="text-[10px] font-extrabold uppercase font-poppins text-white/80">Champions</p>
                <h5 className="text-xs font-bold mt-0.5">"First tournament together."</h5>
                <span className="text-[8px] text-white/70">Delhi Cup 2026</span>
              </div>
            </div>

            {/* Core copy */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins">Team memories</span>
              <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary leading-tight">
                One Match.<br />A Hundred Memories.
              </h2>
              <p className="text-on-surface-variant font-light text-sm md:text-base leading-relaxed">
                Because cricket in India isn't just about the numbers on the scoreboard. It's about the people standing beside you, the banter in the dressing room, and the moments when the game gets unforgettable.
              </p>
              
              <div className="pt-2">
                <a
                  href="#how-it-works"
                  className="px-6 py-3.5 bg-primary text-white hover:bg-primary/90 rounded-full font-label-bold font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 group cursor-pointer"
                >
                  <span>Create Your Match Memory</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 8. SHAREABLE HIGHLIGHTS (Social Showcase) */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
            
            {/* Left side text */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins">SOCIAL REACH</span>
              <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary leading-tight">
                Turn Great Plays Into Shareable Moments.
              </h2>
              <p className="text-on-surface-variant font-light text-sm md:text-base leading-relaxed font-light">
                Download your boundaries and wickets in standard mobile 9:16 layout format, customized with match stats, brand logo, and player profiles ready for Instagram Reels or YouTube Shorts.
              </p>
              
              <div className="space-y-4 border-t border-outline-variant/30 pt-6">
                <div className="flex gap-3">
                  <Smartphone className="w-5 h-5 text-[#fe9832]" />
                  <div>
                    <h5 className="text-xs font-bold text-primary font-poppins">9:16 Mobile Optimized</h5>
                    <p className="text-[11px] text-on-surface-variant">Slices are exported in high quality smartphone aspect ratios.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Tv className="w-5 h-5 text-[#fe9832]" />
                  <div>
                    <h5 className="text-xs font-bold text-primary font-poppins">Broadcast Graphics</h5>
                    <p className="text-[11px] text-on-surface-variant">Clean layout overlays display batsman name, ball tag, and scorecard.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side Reels frame simulation */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-[300px] h-[540px] bg-black rounded-[36px] border-[8px] border-zinc-800 overflow-hidden shadow-2xl relative flex flex-col justify-between p-5 text-white">
                
                {/* Reels video background simulation */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src="https://images.unsplash.com/photo-1540747737956-37872404a821?auto=format&fit=crop&w=400&q=80" 
                    alt="Cricket bowler releasing ball" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85"></div>
                </div>

                {/* Header info (logo overlay) */}
                <div className="relative z-10 flex justify-between items-center text-[10px]">
                  <img src="/be11_logo.png" alt="BE11 Logo" className="h-6 w-auto object-contain brightness-0 invert" />
                  <span className="font-bold text-white/70 bg-black/40 px-2 py-0.5 rounded font-mono">19.5 OVERS</span>
                </div>

                {/* Middle Action play button */}
                <div className="relative z-10 flex justify-center items-center h-20">
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center animate-pulse">
                    <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom Overlay specs */}
                <div className="relative z-10 space-y-4">
                  
                  {/* Performance overlay tag */}
                  <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10 space-y-1">
                    <div className="flex justify-between items-center text-[8px] text-[#FF9933] font-black uppercase tracking-wider font-poppins">
                      <span>Delhi Corporate League</span>
                      <span>Target: 168</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Aarav hits WINNING SIX</h5>
                    <div className="flex justify-between text-[9px] text-white/60">
                      <span>Batting: 42* (32)</span>
                      <span>Run Rate: 8.4</span>
                    </div>
                  </div>

                  {/* Account detail & Share Buttons */}
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">@AaravCricket</p>
                      <p className="text-[9px] text-white/50">Delhi Smashers</p>
                    </div>

                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/20 flex items-center justify-center text-white transition-all shadow border border-white/15 cursor-pointer">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleCopyLink}
                        className="w-8 h-8 rounded-full bg-[#FF9933] text-white flex items-center justify-center transition-all shadow cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. BUILT FOR EVERY CRICKETER */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-container-padding">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins block">WHO IS IT FOR?</span>
            <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary">
              Built for Every Cricketer.
            </h2>
            <p className="text-on-surface-variant text-sm font-light">
              BE11 Capture is engineered to serve the entire Indian grassroots sports ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Audience Card 1 */}
            <div className="bg-white rounded-24 overflow-hidden border border-outline-variant/30 shadow-sm group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 text-left flex flex-col justify-between h-[360px] relative">
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1540747737956-37872404a821?auto=format&fit=crop&w=400&q=80" 
                  alt="Young cricketers training" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent"></div>
              </div>
              
              <div></div>

              <div className="p-6 relative z-10 space-y-2">
                <h4 className="text-lg font-bold text-white font-poppins">Players & Teams</h4>
                <p className="text-[11px] text-white/70 font-light leading-relaxed">
                  Keep every great performance. Settle match discussions with video proof and build your career portfolio.
                </p>
              </div>
            </div>

            {/* Audience Card 2 */}
            <div className="bg-white rounded-24 overflow-hidden border border-outline-variant/30 shadow-sm group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 text-left flex flex-col justify-between h-[360px] relative">
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80" 
                  alt="Stadium match light" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent"></div>
              </div>
              
              <div></div>

              <div className="p-6 relative z-10 space-y-2">
                <h4 className="text-lg font-bold text-white font-poppins">Tournament Organizers</h4>
                <p className="text-[11px] text-white/70 font-light leading-relaxed">
                  Give every match the broadcast experience. Increase your league profile and sponsor engagement.
                </p>
              </div>
            </div>

            {/* Audience Card 3 */}
            <div className="bg-white rounded-24 overflow-hidden border border-outline-variant/30 shadow-sm group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 text-left flex flex-col justify-between h-[360px] relative">
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=400&q=80" 
                  alt="Coach instructions" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent"></div>
              </div>
              
              <div></div>

              <div className="p-6 relative z-10 space-y-2">
                <h4 className="text-lg font-bold text-white font-poppins">Academies</h4>
                <p className="text-[11px] text-white/70 font-light leading-relaxed">
                  Help young cricketers track and relive their growth. Analyze batting postures and bowling releases on camera.
                </p>
              </div>
            </div>

            {/* Audience Card 4 */}
            <div className="bg-white rounded-24 overflow-hidden border border-outline-variant/30 shadow-sm group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 text-left flex flex-col justify-between h-[360px] relative">
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1540747737956-37872404a821?auto=format&fit=crop&w=400&q=80" 
                  alt="Empty grass ground" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent"></div>
              </div>
              
              <div></div>

              <div className="p-6 relative z-10 space-y-2">
                <h4 className="text-lg font-bold text-white font-poppins">Venue Owners</h4>
                <p className="text-[11px] text-white/70 font-light leading-relaxed">
                  Turn your ground into a modern cricket experience. Attract competitive teams and charge a premium for captured matches.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 10. ACADEMY / PLAYER DEVELOPMENT SECTION */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-container-padding text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side detail */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins">PLAYER DEVELOPMENT</span>
              <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary leading-tight">
                Watch Your Game Grow With You.
              </h2>
              <p className="text-on-surface-variant font-light text-sm md:text-base leading-relaxed font-light">
                Preserving matches allows players to revisit past cricket sessions, correct techniques under coach guidance, and document match milestones.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#fe9832]/15 text-[#fe9832] flex items-center justify-center">
                    <Eye className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="text-xs font-bold text-[#001a49] font-poppins">Review</h5>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed font-light">Watch matches to identify posture adjustments.</p>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#44af33]/15 text-[#44af33] flex items-center justify-center">
                    <Award className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="text-xs font-bold text-[#001a49] font-poppins">Learn</h5>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed font-light">Isolate boundary details to build strike confidence.</p>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <History className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="text-xs font-bold text-[#001a49] font-poppins">Progress</h5>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed font-light">Construct a personal match history archive.</p>
                </div>
              </div>
            </div>

            {/* Right side graphic representation of analytical tags */}
            <div className="lg:col-span-6 bg-white border border-outline-variant/30 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
              <div className="flex justify-between items-center text-xs">
                <h4 className="font-bold text-primary tracking-wider uppercase font-poppins">Strike Action Analysis</h4>
                <span className="font-bold text-white bg-[#44af33] px-2 py-0.5 rounded font-mono text-[9px]">Sync Code OK</span>
              </div>
              
              {/* Graphic container */}
              <div className="aspect-video w-full rounded-2xl bg-zinc-900 overflow-hidden relative flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1540747737956-37872404a821?auto=format&fit=crop&w=600&amp;q=80" 
                  alt="Batsman pose analysis illustration" 
                  className="w-full h-full object-cover opacity-60" 
                />
                
                {/* Vectors of strike tags */}
                <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
                  <div className="flex justify-between items-start text-[9px] text-white font-mono">
                    <span className="bg-black/60 px-2 py-1 rounded">Frame Index: #1839</span>
                    <span className="bg-black/60 px-2 py-1 rounded">Release Angle: 22°</span>
                  </div>
                  
                  {/* Overlay cross lines simulating analytical tagging */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-4/5 h-[2px] bg-red-500 rotate-[15deg]"></div>
                    <div className="w-4/5 h-[2px] bg-green-500 rotate-[-45deg]"></div>
                  </div>

                  <div className="flex justify-between items-end text-[10px]">
                    <span className="bg-[#fe9832] px-2 py-0.5 rounded font-bold font-poppins text-white">Sweet Spot Contact</span>
                    <span className="text-white/60 bg-black/40 px-2 py-0.5 rounded font-mono">Tag: Cover Drive</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-on-surface-variant font-poppins">
                <span>Total Deliveries Logged: 120</span>
                <span>Milestone Clips: 18</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 11. INDIA / NATIONALISTIC BRAND MOMENT */}
      <section className="py-24 bg-gradient-to-b from-surface via-surface-container-low to-surface border-y border-outline-variant/30">
        <div className="max-w-6xl mx-auto px-container-padding text-center space-y-6">
          <div className="inline-flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF9933] rounded-full"></div>
            <div className="w-3 h-3 bg-white border rounded-full"></div>
            <div className="w-3 h-3 bg-[#138808] rounded-full"></div>
          </div>
          <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary uppercase tracking-wide">
            Made for India's Love of Cricket.
          </h2>
          <p className="text-secondary-container font-semibold tracking-widest text-xs uppercase font-poppins">
            From neighbourhood grounds to competitive tournaments, every cricket story deserves a place to live.
          </p>
          <div className="w-32 h-[3px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] mx-auto my-6"></div>
          <p className="text-on-surface-variant font-light text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-light">
            BE11 is deep-rooted in the passion of Indian cricket. From floodlit corporate leagues in Delhi to academy turf in Mumbai, we understand that matches are more than scores. They are community histories built ball by ball.
          </p>
        </div>
      </section>

      {/* 12. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-surface text-center">
        <div className="max-w-7xl mx-auto px-container-padding">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins block">PROCESS FLOW</span>
            <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary">
              Getting Started with BE11 Capture.
            </h2>
            <p className="text-on-surface-variant text-sm font-light">
              Four simple steps from booking to playing and sharing your milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {howItWorksSteps.map((step, idx) => (
              <div key={idx} className="bg-white p-8 rounded-24 border border-outline-variant/30 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all relative flex flex-col justify-between">
                <span className="text-4xl font-black text-[#fe9832]/15 font-poppins absolute top-6 right-6">{step.num}</span>
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-primary font-poppins">{step.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-light">{step.desc}</p>
                </div>
                <div className="pt-4 mt-2">
                  <Link to={step.link} className="text-xs font-bold text-secondary-container hover:underline inline-flex items-center gap-1 font-poppins">
                    <span>{step.cta}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 13. PRODUCT ECOSYSTEM SECTION */}
      <section className="py-24 bg-surface-container-low text-center">
        <div className="max-w-7xl mx-auto px-container-padding">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins block">Ecosystem Integrity</span>
            <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary">
              Everything You Need Around the Game.
            </h2>
            <p className="text-on-surface-variant text-sm font-light">
              BE11 is the ultimate digital sports ecosystem. Find coaches, book pitches, construct jerseys, and review matches in a single network.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-left">
            
            {/* Ecosystem Venues */}
            <Link to="/venues" className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm hover:-translate-y-1.5 hover:shadow-md transition-all space-y-3 flex flex-col justify-between group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary font-poppins">Venues</h4>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal font-light">Find and book ground slots near you.</p>
              </div>
            </Link>

            {/* Ecosystem Live Matches */}
            <Link to="/live-matches" className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm hover:-translate-y-1.5 hover:shadow-md transition-all space-y-3 flex flex-col justify-between group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary font-poppins">Live Matches</h4>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal font-light">Follow matches live on scorecard arrays.</p>
              </div>
            </Link>

            {/* Ecosystem Coaches */}
            <Link to="/coaches" className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm hover:-translate-y-1.5 hover:shadow-md transition-all space-y-3 flex flex-col justify-between group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary font-poppins">Coaches</h4>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal font-light">Hire certified coaches for training drills.</p>
              </div>
            </Link>

            {/* Ecosystem Store */}
            <Link to="/store" className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm hover:-translate-y-1.5 hover:shadow-md transition-all space-y-3 flex flex-col justify-between group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary font-poppins">Store</h4>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal font-light">Shop sports items and customized gears.</p>
              </div>
            </Link>

            {/* Ecosystem Jersey Builder */}
            <Link to="/jersey-builder" className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm hover:-translate-y-1.5 hover:shadow-md transition-all space-y-3 flex flex-col justify-between group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary font-poppins">Jersey Builder</h4>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal font-light">Design sublimated shirts for your squad.</p>
              </div>
            </Link>

            {/* Ecosystem BE11 Capture */}
            <div className="bg-[#fe9832]/10 p-5 rounded-2xl border border-[#fe9832] shadow-md transition-all space-y-3 flex flex-col justify-between text-left relative overflow-hidden">
              <div className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe9832] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fe9832]"></span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#fe9832] text-white flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary font-poppins flex items-center gap-1.5">
                  <span>Capture</span>
                  <span className="text-[8px] bg-primary text-white px-1 py-0.5 rounded font-black font-poppins">NEW</span>
                </h4>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-normal font-light">Save and export match highlight timelines.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 14. TESTIMONIALS */}
      <section className="py-24 bg-surface text-center">
        <div className="max-w-7xl mx-auto px-container-padding">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-secondary-container uppercase tracking-widest font-poppins block">TESTIMONIALS</span>
            <h2 className="font-display-hero text-3xl md:text-4xl font-black text-primary">
              Built Around the Moments That Matter.
            </h2>
            <p className="text-on-surface-variant text-sm font-light">
              See what organizers and players across India think about match highlight recording.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Testimonial 1 */}
            <div className="bg-surface-container-low p-8 rounded-24 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex gap-1 text-amber-500 text-xs">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-light italic">
                "Our corporate league bookings went up 40% after installing BE11 Capture. Teams love being able to share their boundaries on WhatsApp right after the final wicket. It makes local matches feel like an IPL game."
              </p>
              <div className="border-t border-outline-variant/30 pt-4 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white font-poppins">AS</div>
                <div>
                  <h5 className="text-xs font-bold text-primary font-poppins">Ankur Sharma</h5>
                  <p className="text-[9px] text-outline">Venue Owner, Delhi Sports Arena</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-surface-container-low p-8 rounded-24 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex gap-1 text-amber-500 text-xs">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-light italic">
                "I was able to save my first tournament century century run on video. Seeing that boundary shot sweet spot on the analysis tool has boosted my confidence. The tricolor details are classy too!"
              </p>
              <div className="border-t border-outline-variant/30 pt-4 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-[#FF9933] flex items-center justify-center text-[10px] font-bold text-white font-poppins">RV</div>
                <div>
                  <h5 className="text-xs font-bold text-primary font-poppins">Rohan Verma</h5>
                  <p className="text-[9px] text-outline">Player, Noida Club League</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-surface-container-low p-8 rounded-24 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex gap-1 text-amber-500 text-xs">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-light italic">
                "Having video captures of our academy nets sessions has helped us instruct student bowlers on their release angles. Highly recommend it to all serious training academies in Bengaluru."
              </p>
              <div className="border-t border-outline-variant/30 pt-4 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-[#138808] flex items-center justify-center text-[10px] font-bold text-white font-poppins">KK</div>
                <div>
                  <h5 className="text-xs font-bold text-primary font-poppins">Kartik Kumar</h5>
                  <p className="text-[9px] text-outline">Head Coach, Bengaluru Colts Academy</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 15. FINAL CALL TO ACTION */}
      <section className="relative py-24 bg-primary text-white overflow-hidden text-center">
        {/* Dynamic Tennis/Cricket ball trajectory line overlay in CSS */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
            <path 
              d="M0 350 C 300 50, 700 50, 1000 350" 
              fill="none" 
              stroke="#FF9933" 
              strokeWidth="4" 
              strokeDasharray="10, 10" 
              className="animate-[dash_20s_linear_infinite]"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF9933]/5 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-container-padding space-y-6">
          <span className="text-xs font-bold text-secondary-container uppercase tracking-widest block font-poppins">Ready to record?</span>
          <h2 className="font-display-hero text-3xl md:text-5xl font-black text-white leading-tight uppercase tracking-wider">
            Don't Just Play the Match.<br />Keep It Forever.
          </h2>
          <p className="text-white/70 text-xs md:text-sm font-light max-w-lg mx-auto">
            Capture the sixes. Relive the wickets. Share the celebrations. Make every match memorable on BE11 Capture.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-[#fe9832] hover:bg-[#e07b16] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Explore BE11 Capture
            </a>
            <Link
              to="/venues"
              className="px-8 py-4 bg-white hover:bg-gray-100 text-[#001a49] rounded-full text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Book Your Venue
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
export default Capture;
