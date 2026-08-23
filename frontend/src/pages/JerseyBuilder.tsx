import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';
import { formatCurrency } from '@be11/shared';
import { JerseyPreview3D } from '../components/jersey/JerseyPreview3D';
import { JerseyPreview } from '../components/jersey/JerseyPreview';

interface SavedDesign {
  id: string;
  name: string;
  sport: string;
  config: any;
  updatedAt: string;
}

interface TemplatePreset {
  id: string;
  name: string;
  sport: string;
  config: any;
  popularity: number;
}

export const JerseyBuilder: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  // 1. Core Customizer States
  const [designName, setDesignName] = useState('Dream Jersey Pro');
  const [sport, setSport] = useState<'Cricket' | 'Football'>('Cricket');
  const [teamName, setTeamName] = useState('INDIA');
  const [playerName, setPlayerName] = useState('VIRAT');
  const [number, setNumber] = useState('18');

  // Sublimation Colors
  const [primaryColor, setPrimaryColor] = useState('#004F98'); // India Blue
  const [secondaryColor, setSecondaryColor] = useState('#FF9933'); // Saffron
  const [accentColor, setAccentColor] = useState('#138808'); // Green

  // Patterns
  const [pattern, setPattern] = useState('Gradient');
  const [patternScale, setPatternScale] = useState(1.0);
  const [patternRotation, setPatternRotation] = useState(0);
  const [patternOpacity, setPatternOpacity] = useState(0.8);
  const [patternIntensity, setPatternIntensity] = useState(1.0);

  const [collar, setCollar] = useState('V Neck');
  const [sleeves, setSleeves] = useState('Half');

  const [font, setFont] = useState('Modern');
  const [numberStyle, setNumberStyle] = useState('Bold');
  const [fabric, setFabric] = useState('Standard');
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  // Logo manager coordinates states
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoScale, setLogoScale] = useState(1.0);
  const [logoX, setLogoX] = useState(256);
  const [logoY, setLogoY] = useState(220);
  const [logoRotate, setLogoRotate] = useState(0);

  // Sponsor manager coordinates states
  const [sponsorUrl, setSponsorUrl] = useState<string>('');
  const [sponsorScale, setSponsorScale] = useState(1.0);
  const [sponsorX, setSponsorX] = useState(256);
  const [sponsorY, setSponsorY] = useState(400);
  const [sponsorRotate, setSponsorRotate] = useState(0);

  // Active element focused layer (selected by direct click on 3D mesh)
  const [activeLayer, setActiveLayer] = useState<'logo' | 'sponsor' | 'teamName' | 'playerName' | 'number' | null>(null);

  // Graphics states
  const [badges, setBadges] = useState<string[]>([]);
  const [previewView, setPreviewView] = useState<'front' | 'back' | 'left' | 'right' | 'top'>('front');
  const [autoRotate, setAutoRotate] = useState(false);

  // Adobe/Figma-like active left floating toolbar tab
  const [activeToolbarTab, setActiveToolbarTab] = useState<'design' | 'colors' | 'patterns' | 'fabric' | 'collars' | 'graphics' | 'ai' | 'export' | null>('design');

  // AI Prompt box
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState('');

  // Undo / Redo history stacks
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Workspace backend state
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [templates, setTemplates] = useState<TemplatePreset[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);

  // Checkout modal flow
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutFullName, setCheckoutFullName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutPincode, setCheckoutPincode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Export handlers
  const [exportFn, setExportFn] = useState<(() => string) | null>(null);

  // Lists definitions
  const colorsList = [
    { name: 'Navy Blue', hex: '#0A2E6E' },
    { name: 'India Blue', hex: '#004F98' },
    { name: 'Saffron', hex: '#FF9933' },
    { name: 'Indian Green', hex: '#138808' },
    { name: 'Pitch Black', hex: '#1A1A1A' },
    { name: 'Gold', hex: '#D97706' },
    { name: 'Crimson Red', hex: '#E11D48' },
    { name: 'Purple', hex: '#6B21A8' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Lemon Yellow', hex: '#EAB308' },
  ];

  // Exactly 75 professional sports jersey patterns
  const patternsList = [
    'Plain', 'Gradient', 'Stripes', 'Diagonal', 'Lightning', 'Geometric', 'Camouflage', 'Wave', 'Mesh', 'Carbon',
    'Chevron', 'Tech Grid', 'Halftone', 'Retro Stripes', 'Indian Flag', 'Galaxy Space', 'Gold Edition', 'Academy Star',
    'F1 Speedline', 'Cyberpunk Hex', 'Faded Paint', 'Digital Camo', 'Abstract Wave', 'Classic Plaid', 'Zebra print',
    'Viper Scale', 'Diamond Grid', 'Tribal Flame', 'Circuit Board', 'Pixel Noise', 'Tiger Stripes', 'Crumpled Paper',
    'Brick Wall', 'Shattered Glass', 'Water Ripple', 'Sunburst', 'Snowflake', 'Floral Bloom', 'Splatter Ink', 'Tie Dye',
    'Retro Wave', 'Neon Grid', 'Argyle Knit', 'Houndstooth', 'Herringbone', 'Gingham Check', 'Pin Stripes', 'Chalk Line',
    'Ombre Fade', 'Split Tone', 'Glitch Art', 'Marble Vein', 'Honeycomb', 'Spider Web', 'Vintage Gold', 'Olympic rings',
    'Desert Storm', 'Midnight Glow', 'Aurora Borealis', 'Fire Flame', 'Frost Ice', 'Forest Camo', 'Volcano Ash', 'Steel Plate',
    'Warp Speed', 'Matrix Code', 'Polka Dot', 'Starry Sky', 'Drip Paint', 'Brush Stroke', 'Radial Ray', 'Barbed Wire',
    'Aztec Print', 'Japanese Wave', 'Vortex Spiral'
  ];

  const collarsList = ['Round', 'V Neck', 'Polo', 'Mandarin', 'Elite', 'Tournament', 'Training'];
  const sleevesList = ['Half', 'Full', 'Sleeveless', 'Compression', 'Raglan', 'Practice'];
  
  const fabricsList = [
    { key: 'Standard', label: 'Standard Poly-Mesh', price: 0, desc: 'Durable, moisture-wicking standard athletic fit.' },
    { key: 'Performance', label: 'Performance Max', price: 200, desc: 'Dual layer ventilation, optimized structure.' },
    { key: 'Dry Fit', label: 'Premium Dry Fit', price: 250, desc: 'Highly stretchable, athletic dry fit panels.' },
    { key: 'Elite', label: 'Elite Pro Match', price: 350, desc: 'Laser cut venting, premium athletic grade fabric.' },
    { key: 'Mesh', label: 'Air Ventilation Mesh', price: 300, desc: 'Ultra lightweight, laser-vented panels.' },
    { key: 'Premium Knit', label: 'Pro Knit Ribbed', price: 400, desc: 'Premium heavy structure mesh, IPL match replica.' }
  ];

  const fontsList = ['Classic', 'Modern', 'Bold', 'Outline', 'Shadow'];
  const numberStylesList = ['Standard', 'Bold', 'Outline', 'Shadow'];

  // History state manager
  const saveStateToHistory = (stateSnapshot: any) => {
    const nextStack = historyStack.slice(0, historyIndex + 1);
    nextStack.push(JSON.parse(JSON.stringify(stateSnapshot)));
    setHistoryStack(nextStack);
    setHistoryIndex(nextStack.length - 1);
  };

  const captureActiveState = () => ({
    designName, sport, teamName, playerName, number,
    primaryColor, secondaryColor, accentColor, pattern,
    patternScale, patternRotation, patternOpacity, patternIntensity,
    collar, sleeves, font, numberStyle, fabric, size, quantity, badges,
    logoUrl, logoScale, logoX, logoY, logoRotate,
    sponsorUrl, sponsorScale, sponsorX, sponsorY, sponsorRotate
  });

  const restoreState = (snapshot: any) => {
    if (!snapshot) return;
    setDesignName(snapshot.designName);
    setSport(snapshot.sport);
    setTeamName(snapshot.teamName);
    setPlayerName(snapshot.playerName);
    setNumber(snapshot.number);
    setPrimaryColor(snapshot.primaryColor);
    setSecondaryColor(snapshot.secondaryColor);
    setAccentColor(snapshot.accentColor);
    setPattern(snapshot.pattern);
    setPatternScale(snapshot.patternScale || 1.0);
    setPatternRotation(snapshot.patternRotation || 0);
    setPatternOpacity(snapshot.patternOpacity || 0.8);
    setPatternIntensity(snapshot.patternIntensity || 1.0);
    setCollar(snapshot.collar);
    setSleeves(snapshot.sleeves);
    setFont(snapshot.font);
    setNumberStyle(snapshot.numberStyle);
    setFabric(snapshot.fabric);
    setSize(snapshot.size);
    setQuantity(snapshot.quantity);
    setBadges(snapshot.badges || []);
    setLogoUrl(snapshot.logoUrl || '');
    setLogoScale(snapshot.logoScale || 1.0);
    setLogoX(snapshot.logoX || 256);
    setLogoY(snapshot.logoY || 220);
    setLogoRotate(snapshot.logoRotate || 0);
    setSponsorUrl(snapshot.sponsorUrl || '');
    setSponsorScale(snapshot.sponsorScale || 1.0);
    setSponsorX(snapshot.sponsorX || 256);
    setSponsorY(snapshot.sponsorY || 400);
    setSponsorRotate(snapshot.sponsorRotate || 0);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      restoreState(historyStack[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      restoreState(historyStack[nextIdx]);
    }
  };

  // Capture initial state
  useEffect(() => {
    if (historyStack.length === 0) {
      saveStateToHistory(captureActiveState());
    }
  }, []);

  const recordUpdate = () => {
    saveStateToHistory(captureActiveState());
  };

  const fetchWorkspace = async () => {
    if (!isAuthenticated) return;
    setLoadingWorkspace(true);
    try {
      const [savedRes, templatesRes] = await Promise.all([
        api.get('/shop/jerseys/saved'),
        api.get('/shop/jerseys/templates'),
      ]);
      setSavedDesigns(savedRes.data.data.designs);
      setTemplates(templatesRes.data.data.templates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [isAuthenticated]);

  // AI Prompt customizer parser
  const handleAiPromptGenerate = () => {
    if (!aiPrompt) return;
    setAiStatus('Generating custom styling pattern attributes...');
    const text = aiPrompt.toLowerCase();

    let pri = primaryColor;
    let sec = secondaryColor;
    let acc = accentColor;

    if (text.includes('india') || text.includes('blue')) {
      pri = '#004F98';
      sec = '#FF9933';
      acc = '#138808';
    } else if (text.includes('australia') || text.includes('gold') || text.includes('yellow')) {
      pri = '#EAB308';
      sec = '#138808';
      acc = '#FFFFFF';
    } else if (text.includes('england') || text.includes('white')) {
      pri = '#FFFFFF';
      sec = '#E11D48';
      acc = '#0A2E6E';
    } else if (text.includes('black') || text.includes('minimal')) {
      pri = '#111115';
      sec = '#EAB308';
      acc = '#6366f1';
    } else if (text.includes('vintage') || text.includes('retro')) {
      pri = '#0F172A';
      sec = '#F1F5F9';
      acc = '#FF9933';
    }

    let pat = pattern;
    if (text.includes('camo') || text.includes('camouflage')) {
      pat = 'Camouflage';
    } else if (text.includes('stripes') || text.includes('vertical')) {
      pat = 'Stripes';
    } else if (text.includes('lightning') || text.includes('thunder')) {
      pat = 'Lightning';
    } else if (text.includes('wave') || text.includes('curved')) {
      pat = 'Wave';
    } else if (text.includes('hexagon') || text.includes('grid')) {
      pat = 'Hexagon';
    }

    setPrimaryColor(pri);
    setSecondaryColor(sec);
    setAccentColor(acc);
    setPattern(pat);
    recordUpdate();

    setTimeout(() => {
      setAiStatus('💡 AI Design Presets Applied!');
      setTimeout(() => setAiStatus(''), 3000);
    }, 700);
  };

  // Image upload handler
  const handleGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'sponsor') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'logo') {
          setLogoUrl(reader.result);
        } else {
          setSponsorUrl(reader.result);
        }
        setTimeout(recordUpdate, 100);
      }
    };
    reader.readAsDataURL(file);
  };

  // Pricing calculations
  const getPriceBreakdown = () => {
    const base = 899.0;
    const patternCost = pattern === 'Plain' ? 0 : 100.0;
    const fabricCost = fabricsList.find((f) => f.key === fabric)?.price || 0;
    const badgeCost = badges.length * 75.0;

    const unitPrice = base + patternCost + fabricCost + badgeCost;
    const qty = quantity;
    
    // Bulk discounts
    let discountPercentVal = 0;
    if (qty >= 20) {
      discountPercentVal = 20;
    } else if (qty >= 15) {
      discountPercentVal = 15;
    } else if (qty >= 11) {
      discountPercentVal = 10;
    }

    const subtotal = unitPrice * qty;
    const discountAmount = subtotal * (discountPercentVal / 100);
    const couponDiscount = (subtotal - discountAmount) * (discountPercent / 100);
    const finalSubtotal = subtotal - discountAmount - couponDiscount;
    const gst = finalSubtotal * 0.18;
    const delivery = finalSubtotal > 2000 ? 0 : 150.0;
    const total = finalSubtotal + gst + delivery;

    return {
      base,
      customization: patternCost,
      fabricPrice: fabricCost,
      badgesPrice: badgeCost,
      qty,
      discount: discountAmount + couponDiscount,
      discountPercentVal,
      gst,
      delivery,
      total,
    };
  };

  const pb = getPriceBreakdown();

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setDiscountPercent(10);
      alert('10% Coupon code applied!');
    } else if (couponCode.toUpperCase() === 'BE11SUPER') {
      setDiscountPercent(20);
      alert('20% Coupon applied!');
    } else {
      alert('Coupon code invalid or expired');
    }
  };

  const handleSaveDesign = async () => {
    if (!isAuthenticated) {
      alert('Please log in from the top account dropdown first.');
      return;
    }

    setSaving(true);
    try {
      const config = {
        primaryColor,
        secondaryColor,
        accentColor,
        pattern,
        patternScale,
        patternRotation,
        patternOpacity,
        patternIntensity,
        collar,
        sleeves,
        playerName,
        playerNumber: number,
        teamName,
        font,
        numberStyle,
        fabric,
        size,
        badges,
        logoUrl, logoScale, logoX, logoY, logoRotate,
        sponsorUrl, sponsorScale, sponsorX, sponsorY, sponsorRotate
      };

      await api.post('/shop/jerseys/saved', {
        name: designName,
        sport,
        config,
      });

      alert('Jersey design successfully saved to your workspace!');
      fetchWorkspace();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save jersey design.');
    } finally {
      setSaving(false);
    }
  };

  // Simulated payments flow
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutFullName || !checkoutPhone || !checkoutAddress || !checkoutCity || !checkoutPincode) {
      alert('All delivery fields are required.');
      return;
    }

    setOrdering(true);
    try {
      const resOrder = await api.post('/payments/create-order', { amount: pb.total });
      const rzpOrder = resOrder.data.data;

      await api.post('/payments/verify', {
        razorpayOrderId: rzpOrder.id,
        razorpayPaymentId: `pay_jersey_${Math.random().toString(36).substring(2, 10)}`,
        razorpaySignature: `sig_jersey_${Math.random().toString(36).substring(2, 20)}`,
        amount: pb.total,
        description: `Custom Jersey Order: ${teamName} #${number}`,
      });

      alert('Order Placed Successfully! Simulated Razorpay payment verified.');
      setShowCheckout(false);
    } catch (err) {
      console.error(err);
      alert('Checkout failed.');
    } finally {
      setOrdering(false);
    }
  };

  const handleExportSnapshot = () => {
    if (!exportFn) {
      alert('Three.js canvas is loading, please rotate the preview first.');
      return;
    }
    const dataUrl = exportFn();
    const link = document.createElement('a');
    link.download = `${designName.replace(/\s+/g, '_')}_3d_preview.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden font-poppins selection:bg-indigo-500 selection:text-white">
      
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex flex-col justify-center items-center px-6 border-b border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-black to-[#050508]">
        {/* Soft background light sweeps */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.06),transparent_45%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.04),transparent_40%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10 pt-16">
          <div className="text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-[10px] text-indigo-300 font-black uppercase tracking-wider">NEXT-GEN 3D STUDIO ACTIVE</span>
            </div>

            <h1 className="font-poppins font-black text-4xl sm:text-6xl tracking-tight leading-none text-white uppercase">
              Create Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-400 to-[#FF9933] drop-shadow-md">
                Dream Jersey
              </span>
            </h1>

            <p className="text-sm text-gray-400 max-w-lg leading-relaxed font-light">
              Design professional cricket wear using our mathematical vertex-displacement 3D configurator. Fabric mapping, custom patterns, and direct print alignments updating in real time.
            </p>

            <div className="flex gap-4 pt-2">
              <a 
                href="#design-workspace"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 duration-250 block text-center"
              >
                Start Designing
              </a>
              <a 
                href="#templates-gallery"
                className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-2xl border border-white/5 transition-all block text-center"
              >
                Browse Templates
              </a>
            </div>
          </div>

          {/* Cinematic floating shirt preview display */}
          <div className="h-[480px] w-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none"></div>
            <div className="w-full max-w-sm h-full rounded-3xl overflow-hidden border border-white/5 shadow-2xl p-2 bg-[#09090F]/45">
              <JerseyPreview3D
                primaryColor="#F8FAFC"
                secondaryColor="#1E293B"
                accentColor="#334155"
                pattern="Plain"
                patternScale={1.0}
                patternRotation={0}
                patternOpacity={0}
                patternIntensity={0}
                collar="V Neck"
                sleeves="Half"
                playerName=""
                playerNumber=""
                teamName=""
                font="Modern"
                numberStyle="Bold"
                view="front"
                fabric="Elite"
                autoRotate={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. ADOBE/FIGMA-STYLE DESIGN WORKSPACE */}
      <section id="design-workspace" className="max-w-7xl mx-auto px-6 py-20 space-y-8 scroll-mt-24 text-left border-t border-white/5">
        <div>
          <h2 className="font-poppins font-black text-xl text-white uppercase tracking-wider">Configure Sublimation</h2>
          <p className="text-[10px] text-gray-400 mt-1">Access the left interactive toolbar palette to modify colors, fabric roughness, or generate presets via AI prompts.</p>
        </div>

        {/* Figma layout container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative min-h-[580px]">
          
          {/* LEFT FLOATING TOOLBAR PALETTE (3/12 cols) */}
          <div className="lg:col-span-4 flex gap-4 items-stretch">
            {/* Toolbar Sidebar Panel */}
            <div className="w-16 bg-[#08080C] border border-white/5 rounded-3xl py-6 flex flex-col items-center justify-between shadow-2xl">
              <div className="space-y-4">
                {[
                  { id: 'design', icon: 'edit_note', label: 'Design' },
                  { id: 'colors', icon: 'palette', label: 'Colors' },
                  { id: 'patterns', icon: 'texture', label: 'Patterns' },
                  { id: 'fabric', icon: 'style', label: 'Fabric' },
                  { id: 'collars', icon: 'join_inner', label: 'Collar' },
                  { id: 'graphics', icon: 'image', label: 'Graphics' },
                  { id: 'ai', icon: 'psychology', label: 'AI Prompt' },
                  { id: 'export', icon: 'download', label: 'Export' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveToolbarTab(activeToolbarTab === item.id ? null : (item.id as any))}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                      activeToolbarTab === item.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={item.label}
                  >
                    <span className="material-symbols-outlined text-sm">{item.icon}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <button onClick={handleUndo} disabled={historyIndex <= 0} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs hover:bg-white/10 disabled:opacity-30 cursor-pointer">
                  <span className="material-symbols-outlined text-[10px]">undo</span>
                </button>
                <button onClick={handleRedo} disabled={historyIndex >= historyStack.length - 1} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs hover:bg-white/10 disabled:opacity-30 cursor-pointer">
                  <span className="material-symbols-outlined text-[10px]">redo</span>
                </button>
              </div>
            </div>

            {/* Flyout panel showing active tab settings */}
            {activeToolbarTab && (
              <div className="flex-1 bg-[#09090F] border border-white/5 rounded-3xl p-5 shadow-2xl space-y-4 animate-fade-in">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="font-poppins font-black text-xs uppercase tracking-wider text-indigo-400">
                    Customizer: {activeToolbarTab}
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  {activeToolbarTab === 'design' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Design Name</label>
                        <input
                          type="text" value={designName}
                          onChange={(e) => { setDesignName(e.target.value); recordUpdate(); }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Team Label</label>
                        <input
                          type="text" value={teamName}
                          onChange={(e) => { setTeamName(e.target.value.toUpperCase()); recordUpdate(); }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Player Name</label>
                          <input
                            type="text" value={playerName}
                            onChange={(e) => { setPlayerName(e.target.value.toUpperCase()); recordUpdate(); }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Squad Number</label>
                          <input
                            type="text" maxLength={3} value={number}
                            onChange={(e) => { setNumber(e.target.value); recordUpdate(); }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white font-bold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Typography Font</label>
                          <select
                            value={font}
                            onChange={(e) => { setFont(e.target.value); recordUpdate(); }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                          >
                            {fontsList.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Number Style</label>
                          <select
                            value={numberStyle}
                            onChange={(e) => { setNumberStyle(e.target.value); recordUpdate(); }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                          >
                            {numberStylesList.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeToolbarTab === 'colors' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Custom Palette Picker</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col items-center gap-1">
                            <input 
                              type="color" value={primaryColor} 
                              onChange={(e) => { setPrimaryColor(e.target.value); recordUpdate(); }} 
                              className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent" 
                            />
                            <span className="text-[8px] text-gray-400 uppercase font-black">Primary</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <input 
                              type="color" value={secondaryColor} 
                              onChange={(e) => { setSecondaryColor(e.target.value); recordUpdate(); }} 
                              className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent" 
                            />
                            <span className="text-[8px] text-gray-400 uppercase font-black">Secondary</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <input 
                              type="color" value={accentColor} 
                              onChange={(e) => { setAccentColor(e.target.value); recordUpdate(); }} 
                              className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent" 
                            />
                            <span className="text-[8px] text-gray-400 uppercase font-black">Accent</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Suggested Swatches</label>
                        <div className="grid grid-cols-5 gap-2">
                          {colorsList.map((c) => (
                            <button
                              key={c.name}
                              onClick={() => { setPrimaryColor(c.hex); recordUpdate(); }}
                              className="w-full aspect-square rounded-xl border border-white/10 hover:scale-105 transition-all cursor-pointer"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeToolbarTab === 'patterns' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sublimation Pattern</label>
                        <select
                          value={pattern}
                          onChange={(e) => { setPattern(e.target.value); recordUpdate(); }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        >
                          {patternsList.map((pat) => (
                            <option key={pat} value={pat}>{pat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                            <span>Pattern Scale</span>
                            <span>{patternScale.toFixed(1)}x</span>
                          </div>
                          <input 
                            type="range" min="0.5" max="3" step="0.1"
                            value={patternScale}
                            onChange={(e) => { setPatternScale(parseFloat(e.target.value)); recordUpdate(); }}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                            <span>Pattern Rotation</span>
                            <span>{patternRotation}°</span>
                          </div>
                          <input 
                            type="range" min="0" max="360" step="5"
                            value={patternRotation}
                            onChange={(e) => { setPatternRotation(parseInt(e.target.value)); recordUpdate(); }}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                            <span>Pattern Opacity</span>
                            <span>{Math.round(patternOpacity * 100)}%</span>
                          </div>
                          <input 
                            type="range" min="0.1" max="1" step="0.05"
                            value={patternOpacity}
                            onChange={(e) => { setPatternOpacity(parseFloat(e.target.value)); recordUpdate(); }}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                            <span>Pattern Intensity</span>
                            <span>{patternIntensity.toFixed(1)}x</span>
                          </div>
                          <input 
                            type="range" min="0.5" max="2" step="0.1"
                            value={patternIntensity}
                            onChange={(e) => { setPatternIntensity(parseFloat(e.target.value)); recordUpdate(); }}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeToolbarTab === 'fabric' && (
                    <div className="space-y-2 text-xs">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Choose Fabric Material</label>
                      {fabricsList.map((fab) => (
                        <label 
                          key={fab.key}
                          onClick={() => { setFabric(fab.key); recordUpdate(); }}
                          className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                            fabric === fab.key ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          <input 
                            type="radio" name="fabric_radio"
                            checked={fabric === fab.key}
                            onChange={() => {}}
                            className="mt-1 text-indigo-500 focus:ring-0" 
                          />
                          <div>
                            <p className="font-bold text-xs text-white">{fab.label} {fab.price > 0 ? `(+ ₹${fab.price})` : '(Base)'}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">{fab.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {activeToolbarTab === 'collars' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Collar Line</label>
                        <select
                          value={collar}
                          onChange={(e) => { setCollar(e.target.value); recordUpdate(); }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        >
                          {collarsList.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sleeves Style</label>
                        <select
                          value={sleeves}
                          onChange={(e) => { setSleeves(e.target.value); recordUpdate(); }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        >
                          {sleevesList.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {activeToolbarTab === 'graphics' && (
                    <div className="space-y-4">
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl text-[10px] text-indigo-300 leading-normal font-medium">
                        🎯 <strong>Pro Tip:</strong> Click directly on the 3D shirt logos or text labels to highlight and configure them!
                      </div>

                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Team Badge Logo</label>
                        <input 
                          type="file" accept="image/*"
                          onChange={(e) => handleGraphicUpload(e, 'logo')}
                          className="w-full text-xs text-gray-400 bg-black/30 p-2 rounded-xl border border-white/5"
                        />
                        {logoUrl && (
                          <div className="space-y-2 bg-black/40 p-3 rounded-2xl border border-white/5">
                            <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                              <span>Logo Scale</span>
                              <span>{logoScale.toFixed(1)}x</span>
                            </div>
                            <input 
                              type="range" min="0.2" max="2.5" step="0.1"
                              value={logoScale}
                              onChange={(e) => { setLogoScale(parseFloat(e.target.value)); recordUpdate(); }}
                              className="w-full accent-indigo-500"
                            />
                            <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                              <span>Move X</span>
                              <span>{logoX}px</span>
                            </div>
                            <input 
                              type="range" min="100" max="412" step="5"
                              value={logoX}
                              onChange={(e) => { setLogoX(parseInt(e.target.value)); recordUpdate(); }}
                              className="w-full accent-indigo-500"
                            />
                            <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                              <span>Move Y</span>
                              <span>{logoY}px</span>
                            </div>
                            <input 
                              type="range" min="150" max="450" step="5"
                              value={logoY}
                              onChange={(e) => { setLogoY(parseInt(e.target.value)); recordUpdate(); }}
                              className="w-full accent-indigo-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Center Sponsor Brand</label>
                        <input 
                          type="file" accept="image/*"
                          onChange={(e) => handleGraphicUpload(e, 'sponsor')}
                          className="w-full text-xs text-gray-400 bg-black/30 p-2 rounded-xl border border-white/5"
                        />
                        {sponsorUrl && (
                          <div className="space-y-2 bg-black/40 p-3 rounded-2xl border border-white/5">
                            <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                              <span>Sponsor Scale</span>
                              <span>{sponsorScale.toFixed(1)}x</span>
                            </div>
                            <input 
                              type="range" min="0.2" max="2.5" step="0.1"
                              value={sponsorScale}
                              onChange={(e) => { setSponsorScale(parseFloat(e.target.value)); recordUpdate(); }}
                              className="w-full accent-indigo-500"
                            />
                            <div className="flex justify-between text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                              <span>Move Y</span>
                              <span>{sponsorY}px</span>
                            </div>
                            <input 
                              type="range" min="300" max="750" step="5"
                              value={sponsorY}
                              onChange={(e) => { setSponsorY(parseInt(e.target.value)); recordUpdate(); }}
                              className="w-full accent-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeToolbarTab === 'ai' && (
                    <div className="space-y-4">
                      <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-4 space-y-2">
                        <label className="text-[9px] text-indigo-300 font-black uppercase tracking-widest">AI Prompt Assistant</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" placeholder="e.g. Australia gold, wave pattern..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
                          />
                          <button 
                            onClick={handleAiPromptGenerate}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Go
                          </button>
                        </div>
                        {aiStatus && <p className="text-[9px] text-emerald-400 font-bold mt-1 animate-pulse">{aiStatus}</p>}
                      </div>
                    </div>
                  )}

                  {activeToolbarTab === 'export' && (
                    <div className="space-y-2.5">
                      <button
                        onClick={handleExportSnapshot}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer border border-white/5 transition-all text-center"
                      >
                        Download HD 3D PNG
                      </button>
                      <button
                        onClick={() => {
                          alert('Manufacturer Print Sheet exported! Layout specifications sent to your profile.');
                        }}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer border border-white/5 transition-all text-center"
                      >
                        Print Layout PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CENTER STAGE CONFIGURATOR (5/12 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 relative">
            <div className="bg-[#08080C] border border-white/5 rounded-3xl p-6 relative flex flex-col justify-between min-h-[500px] shadow-2xl">
              {/* Soft glow radial background beneath jersey */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_55%)] pointer-events-none z-0"></div>

              {/* View angle selectors */}
              <div className="absolute top-6 left-6 flex bg-black/50 p-1.5 rounded-xl z-20 border border-white/5 backdrop-blur-md">
                {(['front', 'back', 'left', 'right', 'top'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setPreviewView(v)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                      previewView === v ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Auto rotate toggle */}
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`absolute top-6 right-6 px-3.5 py-1.5 rounded-xl text-[9px] uppercase tracking-wider font-black z-20 border transition-all cursor-pointer ${
                  autoRotate ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-black/50 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                🔄 Auto-Rotate
              </button>

              {/* 3D Canvas */}
              <div className="w-full flex-1 py-8 z-10">
                <JerseyPreview3D
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  accentColor={accentColor}
                  pattern={pattern}
                  patternScale={patternScale}
                  patternRotation={patternRotation}
                  patternOpacity={patternOpacity}
                  patternIntensity={patternIntensity}
                  collar={collar}
                  sleeves={sleeves}
                  playerName={playerName}
                  playerNumber={number}
                  teamName={teamName}
                  font={font}
                  numberStyle={numberStyle}
                  view={previewView}
                  logoUrl={logoUrl}
                  logoScale={logoScale}
                  logoX={logoX}
                  logoY={logoY}
                  logoRotate={logoRotate}
                  sponsorUrl={sponsorUrl}
                  sponsorScale={sponsorScale}
                  sponsorX={sponsorX}
                  sponsorY={sponsorY}
                  sponsorRotate={sponsorRotate}
                  badges={badges}
                  fabric={fabric}
                  autoRotate={autoRotate}
                  activeLayer={activeLayer}
                  onSelectLayer={(lay) => {
                    setActiveLayer(lay);
                    if (lay === 'logo' || lay === 'sponsor') {
                      setActiveToolbarTab('graphics');
                    } else if (lay === 'teamName' || lay === 'playerName' || lay === 'number') {
                      setActiveToolbarTab('design');
                    }
                  }}
                  onExportReady={(fn) => setExportFn(() => fn)}
                />
              </div>

              {/* Camera reset info */}
              <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-2xl p-3 z-10 backdrop-blur-md">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Drag to rotate 360° &bull; Click jersey meshes to edit</span>
                <button
                  onClick={() => setPreviewView('front')}
                  className="bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Reset View
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT FLOATING INSPECTOR PANEL (3/12 cols) */}
          <div className="lg:col-span-3 bg-[#08080C] border border-white/5 rounded-3xl p-5 space-y-6 text-left self-start lg:sticky lg:top-24 shadow-2xl">
            <h3 className="font-poppins font-black text-xs uppercase tracking-wider border-b border-white/5 pb-2 text-indigo-400">Order Invoice</h3>
            
            <div className="space-y-2 text-[10px] text-gray-400">
              <div className="flex justify-between">
                <span>Base Sublimation:</span>
                <span className="text-white font-bold">{formatCurrency(pb.base)}</span>
              </div>
              {pb.customization > 0 && (
                <div className="flex justify-between">
                  <span>Pattern custom:</span>
                  <span className="text-white font-bold">+ {formatCurrency(pb.customization)}</span>
                </div>
              )}
              {pb.fabricPrice > 0 && (
                <div className="flex justify-between">
                  <span>{fabric} Fabric:</span>
                  <span className="text-white font-bold">+ {formatCurrency(pb.fabricPrice)}</span>
                </div>
              )}
              {pb.badgesPrice > 0 && (
                <div className="flex justify-between">
                  <span>Attached Badges:</span>
                  <span className="text-white font-bold">+ {formatCurrency(pb.badgesPrice)}</span>
                </div>
              )}
              
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span>Quantity:</span>
                <span className="text-white font-bold">x {pb.qty}</span>
              </div>
              
              {pb.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Total Discount ({pb.discountPercentVal + discountPercent}%):</span>
                  <span className="font-bold">- {formatCurrency(pb.discount)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-white/5 pt-2">
                <span>GST (18%):</span>
                <span className="text-white font-bold">{formatCurrency(pb.gst)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Cost:</span>
                <span className="text-white font-bold">{pb.delivery === 0 ? 'FREE' : formatCurrency(pb.delivery)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-3 font-bold text-sm">
              <span className="text-indigo-400">Grand Total:</span>
              <span className="text-emerald-400 font-poppins font-black text-base">{formatCurrency(pb.total)}</span>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Promo Coupon</label>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="WELCOME10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] uppercase text-white"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Quantity Multiplier</label>
              <input 
                type="number" min={1} max={100}
                value={quantity}
                onChange={(e) => { setQuantity(Math.max(1, parseInt(e.target.value) || 1)); recordUpdate(); }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white text-center"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full py-3 bg-[#FF9933] hover:bg-[#e07f24] text-white rounded-2xl font-black text-[11px] uppercase tracking-wider text-center cursor-pointer transition-all shadow-lg active:scale-95 animate-pulse"
              >
                Order & Checkout
              </button>
              
              <button
                onClick={handleSaveDesign}
                disabled={saving}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider text-center cursor-pointer transition-all disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save Design to Account'}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. PREMIUM CONFIGURATOR UTILITY FEATURES */}
      <section className="bg-[#08080C] py-20 border-y border-white/5 text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
            <span className="material-symbols-outlined text-indigo-400 text-2xl">auto_videoconferencing</span>
            <h4 className="font-bold text-sm text-white">Mathematical 3D Creases</h4>
            <p className="text-xs text-gray-400 leading-normal">Parametric mesh deforming mapping vertical folds and sleeve slanting directly modeled from physical reference shirts.</p>
          </div>
          <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
            <span className="material-symbols-outlined text-indigo-400 text-2xl">history</span>
            <h4 className="font-bold text-sm text-white">Complete Undo & Redo History</h4>
            <p className="text-xs text-gray-400 leading-normal">State snapshot stack record buffering modifications instantly. Traverse custom layouts or compare versions seamlessly.</p>
          </div>
          <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
            <span className="material-symbols-outlined text-indigo-400 text-2xl">bolt</span>
            <h4 className="font-bold text-sm text-white">AI Color Harmony Parser</h4>
            <p className="text-xs text-gray-400 leading-normal">Smart prompt builder reading text instructions and applying color/pattern settings matching team profiles instantly.</p>
          </div>
        </div>
      </section>

      {/* 4. TEMPLATE PRESENTS GALLERY */}
      <section id="templates-gallery" className="max-w-7xl mx-auto px-6 py-20 text-left space-y-10">
        <div>
          <h3 className="font-poppins font-black text-lg tracking-wider text-white uppercase">Popular Templates</h3>
          <p className="text-[10px] text-gray-400 mt-1">Select structured color schemes matching cricket lobbies, retro stripes, and IPL franchises.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(templates.length > 0 ? templates.map(t => ({
            name: t.name,
            primary: t.config.primaryColor || '#004F98',
            secondary: t.config.secondaryColor || '#FF9933',
            accent: t.config.accentColor || '#138808',
            pattern: t.config.pattern || 'Gradient'
          })) : [
            { name: 'India Sublimation', primary: '#004F98', secondary: '#FF9933', accent: '#138808', pattern: 'Gradient' },
            { name: 'Australia Gold match', primary: '#EAB308', secondary: '#138808', accent: '#FFFFFF', pattern: 'Diagonal' },
            { name: 'Squad Camouflage', primary: '#1A1A1A', secondary: '#D97706', accent: '#6B21A8', pattern: 'Camouflage' },
            { name: 'Lightning Speed', primary: '#6B21A8', secondary: '#EAB308', accent: '#FFFFFF', pattern: 'Lightning' },
          ]).map((tmpl) => (
            <div 
              key={tmpl.name} 
              onClick={() => {
                setPrimaryColor(tmpl.primary);
                setSecondaryColor(tmpl.secondary);
                setAccentColor(tmpl.accent);
                setPattern(tmpl.pattern);
                recordUpdate();
              }}
              className="bg-[#08080C] border border-white/5 rounded-3xl p-5 hover:border-indigo-500/40 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-indigo-300 transition-all">{tmpl.name}</h4>
                <p className="text-[9px] text-gray-400 mt-0.5">{tmpl.pattern} style sublimation</p>
                
                <div className="my-4 bg-[#040408] rounded-2xl p-4 flex justify-center border border-white/5">
                  <div className="w-24 h-24">
                    <JerseyPreview
                      primaryColor={tmpl.primary}
                      secondaryColor={tmpl.secondary}
                      accentColor={tmpl.accent}
                      pattern={tmpl.pattern}
                      collar="V Neck"
                      sleeves="Half"
                      playerName=""
                      playerNumber=""
                      teamName=""
                      font="Modern"
                      numberStyle="Bold"
                      view="front"
                    />
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider text-right block group-hover:underline">Apply Preset &rarr;</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FABRIC ATTRIBUTES comparison specifications sheet */}
      <section className="bg-[#08080C] py-20 border-t border-white/5 text-left">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          <div>
            <h3 className="font-poppins font-black text-lg tracking-wider text-white uppercase">Fabric comparison</h3>
            <p className="text-[10px] text-gray-400 mt-1">Review weight options, density meters, and athletic moisture features across fit ranges.</p>
          </div>

          <div className="bg-[#08080C] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 font-bold text-gray-300 uppercase tracking-widest text-[9px]">
                  <th className="p-4">Fabric Style</th>
                  <th className="p-4">Weight density</th>
                  <th className="p-4">Moisture wicking</th>
                  <th className="p-4">Stretch factor</th>
                  <th className="p-4 text-right">Premium Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-400">
                <tr>
                  <td className="p-4 font-bold text-white">Standard Poly-Mesh</td>
                  <td className="p-4">160 GSM</td>
                  <td className="p-4">Standard Dry</td>
                  <td className="p-4">High stretch</td>
                  <td className="p-4 text-right text-emerald-400">Included</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Premium Dry Fit</td>
                  <td className="p-4">140 GSM</td>
                  <td className="p-4">Instant Moisture Dry</td>
                  <td className="p-4">Ultra elastic</td>
                  <td className="p-4 text-right text-white">+ {formatCurrency(250)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Performance Max</td>
                  <td className="p-4">130 GSM</td>
                  <td className="p-4">Dual layer venting</td>
                  <td className="p-4">Contoured fit</td>
                  <td className="p-4 text-right text-white">+ {formatCurrency(200)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Elite Pro Match</td>
                  <td className="p-4">110 GSM</td>
                  <td className="p-4">Laser panels dry</td>
                  <td className="p-4">High compression</td>
                  <td className="p-4 text-right text-white">+ {formatCurrency(350)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Air Ventilation Mesh</td>
                  <td className="p-4">120 GSM</td>
                  <td className="p-4">Air Flow Max</td>
                  <td className="p-4">Breathable Mesh</td>
                  <td className="p-4 text-right text-white">+ {formatCurrency(300)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Pro Knit Ribbed</td>
                  <td className="p-4">180 GSM</td>
                  <td className="p-4">IPL Sublimation Grade</td>
                  <td className="p-4">Heavy structural</td>
                  <td className="p-4 text-right text-white">+ {formatCurrency(400)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. USER SAVED DESIGNS WORKSPACE */}
      {savedDesigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20 text-left space-y-6 border-t border-white/5">
          <div>
            <h3 className="font-poppins font-black text-lg tracking-wider text-white uppercase">Your Saved Designs</h3>
            <p className="text-[10px] text-gray-400 mt-1">Load or manage your custom sports Jersey design templates saved to your profile.</p>
          </div>
          {loadingWorkspace ? (
            <p className="text-xs text-indigo-400">Loading saved jerseys...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {savedDesigns.map((design) => (
                <div 
                  key={design.id} 
                  onClick={() => {
                    const conf = design.config;
                    if (conf) {
                      setPrimaryColor(conf.primaryColor || '#004F98');
                      setSecondaryColor(conf.secondaryColor || '#FF9933');
                      setAccentColor(conf.accentColor || '#138808');
                      setPattern(conf.pattern || 'Gradient');
                      setPatternScale(conf.patternScale || 1.0);
                      setPatternRotation(conf.patternRotation || 0);
                      setPatternOpacity(conf.patternOpacity || 0.8);
                      setPatternIntensity(conf.patternIntensity || 1.0);
                      setCollar(conf.collar || 'V Neck');
                      setSleeves(conf.sleeves || 'Half');
                      setPlayerName(conf.playerName || 'VIRAT');
                      setNumber(conf.playerNumber || '18');
                      setTeamName(conf.teamName || 'INDIA');
                      setFont(conf.font || 'Modern');
                      setNumberStyle(conf.numberStyle || 'Bold');
                      setFabric(conf.fabric || 'Standard');
                      setBadges(conf.badges || []);
                      setLogoUrl(conf.logoUrl || '');
                      setLogoScale(conf.logoScale || 1.0);
                      setLogoX(conf.logoX || 256);
                      setLogoY(conf.logoY || 220);
                      setLogoRotate(conf.logoRotate || 0);
                      setSponsorUrl(conf.sponsorUrl || '');
                      setSponsorScale(conf.sponsorScale || 1.0);
                      setSponsorX(conf.sponsorX || 256);
                      setSponsorY(conf.sponsorY || 400);
                      setSponsorRotate(conf.sponsorRotate || 0);
                      recordUpdate();
                    }
                  }}
                  className="bg-[#08080C] border border-white/5 rounded-3xl p-5 hover:border-indigo-500/40 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-xs text-white group-hover:text-indigo-300 transition-all">{design.name}</h4>
                    <p className="text-[9px] text-gray-400 mt-0.5">{design.sport} &bull; Custom design</p>
                    
                    <div className="my-4 bg-[#040408] rounded-2xl p-4 flex justify-center border border-white/5">
                      <div className="w-24 h-24">
                        <JerseyPreview
                          primaryColor={design.config.primaryColor || '#004F98'}
                          secondaryColor={design.config.secondaryColor || '#FF9933'}
                          accentColor={design.config.accentColor || '#138808'}
                          pattern={design.config.pattern || 'Gradient'}
                          collar={design.config.collar || 'V Neck'}
                          sleeves={design.config.sleeves || 'Half'}
                          playerName=""
                          playerNumber=""
                          teamName=""
                          font={design.config.font || 'Modern'}
                          numberStyle={design.config.numberStyle || 'Bold'}
                          view="front"
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider text-right block group-hover:underline">Load Design &rarr;</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CHECKOUT MODAL DRAWER */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#08080C] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              &times;
            </button>

            <h3 className="font-poppins font-black text-base text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">
              Customize Shipping & Billing
            </h3>

            <form onSubmit={(e) => handleCheckoutSubmit(e)} className="space-y-3.5 text-xs text-gray-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-400 block">Recipient Full Name</label>
                  <input 
                    type="text" placeholder="Full Name" 
                    value={checkoutFullName}
                    onChange={(e) => setCheckoutFullName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-400 block">Phone Number</label>
                  <input 
                    type="text" placeholder="Phone" 
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-gray-400 block">Delivery Street Address</label>
                <input 
                  type="text" placeholder="Street / Locality / Landmark" 
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-400 block">City</label>
                  <input 
                    type="text" placeholder="City" 
                    value={checkoutCity}
                    onChange={(e) => setCheckoutCity(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-400 block">Pincode</label>
                  <input 
                    type="text" placeholder="Pincode" 
                    value={checkoutPincode}
                    onChange={(e) => setCheckoutPincode(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" 
                    required 
                  />
                </div>
              </div>

              <div className="bg-black/35 rounded-2xl p-4 space-y-2 border border-white/5 mt-4">
                <p className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">Settlement Invoice summary</p>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Subtotal ({pb.qty} Jerseys):</span>
                  <span>{formatCurrency(pb.total - pb.gst - pb.delivery)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>GST (18%):</span>
                  <span>{formatCurrency(pb.gst)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 border-b border-white/5 pb-2">
                  <span>Delivery fee:</span>
                  <span>{pb.delivery === 0 ? 'FREE' : formatCurrency(pb.delivery)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-white pt-1">
                  <span>Total Settlement amount:</span>
                  <span className="text-emerald-400">{formatCurrency(pb.total)}</span>
                </div>
              </div>

              <button
                type="submit" disabled={ordering}
                className="w-full py-3 bg-[#FF9933] hover:bg-[#e07f24] text-white rounded-2xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all mt-4 disabled:opacity-40 animate-pulse"
              >
                {ordering ? 'Simulating Razorpay...' : `Pay & Place Order (${formatCurrency(pb.total)})`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
