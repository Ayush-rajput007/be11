import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { formatCurrency } from '@be11/shared';
import { useNavigate } from 'react-router-dom';

interface Coach {
  id: string;
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  certifications: string[];
  sports: string[];
  languages: string[];
  city: string;
  about: string;
  achievements: string[];
  gallery: string[];
  videos: string[];
  trainingStyle: string;
  hourlyRate: number;
  academyName: string;
  avgRating: number;
  reviewsCount: number;
}

interface Camp {
  id: string;
  name: string;
  description: string;
  sport: string;
  venue: string;
  city: string;
  startDate: string;
  durationWeeks: number;
  skillLevel: string;
  seatsLimit: number;
  seatsLeft: number;
  fee: number;
  timings: string;
  banner: string;
  coachName: string;
  academyName: string;
}

interface Academy {
  id: string;
  name: string;
  logo: string;
  city: string;
  sports: string[];
  rating: number;
  coachesCount: number;
}

export const Coaches: React.FC = () => {
  const { isAuthenticated, user, updateWalletBalance } = useAuthStore();
  const navigate = useNavigate();

  // Data states
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [expFilter, setExpFilter] = useState('');
  const [rateFilter, setRateFilter] = useState('');

  // Apply Coach application modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyForm, setApplyForm] = useState({
    experienceYears: '1',
    certifications: '',
    sports: '',
    languages: 'English, Hindi',
    city: 'Mumbai',
    about: '',
    trainingStyle: 'Personal training',
    hourlyRate: '1500',
    achievements: '',
  });

  // Join Camp Checkout flow modal states
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [joinStep, setJoinStep] = useState<1 | 2 | 3>(1); // 1: Details, 2: Payment, 3: Confirmation
  const [joiningLoading, setJoiningLoading] = useState(false);

  // User progression stats (mock metrics linked to student backend trainings)
  const [studentStats, setStudentStats] = useState({
    sessionsCount: 8,
    skillLevel: 'Intermediate',
    attendancePercent: 92,
    badges: ['Perfect Serve', 'Death Overs Anchor'],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coachesRes, campsRes, academiesRes] = await Promise.all([
        api.get('/coaches', {
          params: {
            sport: sportFilter || undefined,
            city: cityFilter || undefined,
            experience: expFilter || undefined,
            rateRange: rateFilter || undefined,
          },
        }),
        api.get('/coaches/camps', {
          params: {
            sport: sportFilter || undefined,
            city: cityFilter || undefined,
          },
        }),
        api.get('/coaches/academies'),
      ]);

      setCoaches(coachesRes.data.data.coaches);
      setCamps(campsRes.data.data.camps);
      setAcademies(academiesRes.data.data.academies);

      // Load user training progression stats if logged in
      if (isAuthenticated) {
        try {
          const trainingsRes = await api.get('/coaches/student/trainings');
          const data = trainingsRes.data.data;
          const completedCount = data.sessions.filter((s: any) => s.status === 'COMPLETED').length + data.enrollments.length * 4;
          const level = data.enrollments.length > 1 ? 'Advanced' : data.enrollments.length === 1 ? 'Intermediate' : 'Beginner';
          setStudentStats({
            sessionsCount: completedCount || 3,
            skillLevel: level,
            attendancePercent: data.attendances.length > 0 
              ? Math.round((data.attendances.filter((a: any) => a.status === 'PRESENT').length / data.attendances.length) * 100)
              : 100,
            badges: data.certificates.map((c: any) => c.title) || ['Agility Rookie'],
          });
        } catch {
          // Fallback to default mock
        }
      }
    } catch (err) {
      console.error('Error fetching coaching marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sportFilter, cityFilter, expFilter, rateFilter, isAuthenticated]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSportFilter('');
    setCityFilter('');
    setExpFilter('');
    setRateFilter('');
  };

  const handleApplyAsCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplySuccess('');
    try {
      const payload = {
        ...applyForm,
        certifications: applyForm.certifications.split(',').map((c) => c.trim()).filter(Boolean),
        sports: applyForm.sports.split(',').map((s) => s.trim()).filter(Boolean),
        languages: applyForm.languages.split(',').map((l) => l.trim()).filter(Boolean),
        achievements: applyForm.achievements.split(',').map((a) => a.trim()).filter(Boolean),
      };

      await api.post('/coaches/apply', payload);
      setApplySuccess('Your coaching application has been submitted! Administrative approvals will activate your dashboard.');
      setTimeout(() => {
        setApplyModalOpen(false);
        setApplySuccess('');
        fetchData();
      }, 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Coach registration failed.');
    }
  };

  const handleOpenJoinCamp = (camp: Camp) => {
    setSelectedCamp(camp);
    setJoinStep(1);
  };

  const handleJoinCamp = async () => {
    if (!isAuthenticated) {
      alert('Please log in first before registering in training camps.');
      setSelectedCamp(null);
      return;
    }
    if (!selectedCamp) return;

    if (user && user.walletBalance < selectedCamp.fee) {
      alert(`Insufficient balance. Camp fee is ${formatCurrency(selectedCamp.fee)}, but your wallet only holds ${formatCurrency(user.walletBalance)}.`);
      return;
    }

    setJoiningLoading(true);
    try {
      await api.post(`/coaches/camps/${selectedCamp.id}/join`);
      
      // Update local wallet store
      if (user) {
        updateWalletBalance(user.walletBalance - selectedCamp.fee);
      }

      setJoinStep(3);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join training camp.');
    } finally {
      setJoiningLoading(false);
    }
  };

  // Autocomplete suggestions
  const sportsList = ['Cricket', 'Football', 'Badminton', 'Basketball', 'Tennis', 'Volleyball', 'Kabaddi'];
  const citiesList = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];

  const filteredCoachesList = coaches.filter((c) => {
    const text = `${c.name} ${c.academyName} ${c.about}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="pt-16 min-h-screen bg-surface-container-low pb-20 text-left font-body-md">
      {/* 1. Large Academy Style Hero Banner */}
      <section className="relative h-[65vh] flex flex-col justify-center items-center overflow-hidden px-container-padding text-center bg-gradient-to-tr from-[#001a49] via-[#0A2E6E] to-[#138808]/40">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540747737956-37872404a821?auto=format&fit=crop&w=1920&q=80')" }}></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF9933]/15 rounded-full blur-[120px]"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#138808]/15 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <h1 className="font-poppins font-black text-4xl md:text-6xl text-white tracking-tight leading-none">
            Train Like a <span className="bg-gradient-to-r from-[#FF9933] via-white to-[#138808] bg-clip-text text-transparent">Champion</span>
          </h1>
          <p className="text-white/80 text-sm md:text-lg max-w-2xl mx-auto font-medium">
            Learn from certified coaches, join professional training camps, improve your skills, and become match-ready.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <a href="#coaches" className="px-8 py-3.5 bg-[#FF9933] hover:bg-[#e07f24] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer">
              Find Coaches
            </a>
            <a href="#camps" className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl backdrop-blur-sm transition-all border border-white/20 cursor-pointer">
              Explore Camps
            </a>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-container-padding -mt-10 relative z-20 space-y-12">
        {/* 2. Global Autocomplete Search Engine */}
        <div className="bg-white rounded-24 p-6 shadow-xl border border-outline-variant/30 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Search Coach/Academy</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs bg-gray-50 text-primary border-outline-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Select Sport</label>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 text-primary border-outline-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              <option value="">All Sports</option>
              {sportsList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Select City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-xs bg-gray-50 text-primary border-outline-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              <option value="">All Cities</option>
              {citiesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleResetFilters}
              className="flex-1 py-2.5 border border-outline-variant text-outline rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer text-center"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* 3. User Progression Stats Widget */}
        {isAuthenticated && (
          <section className="bg-gradient-to-r from-primary to-[#0A2E6E] rounded-24 p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-[#138808]/15 rounded-full blur-[80px]"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <span className="text-[9px] bg-secondary-container text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Player Progression
                </span>
                <h2 className="font-poppins font-bold text-2xl">Track Your Growth</h2>
                <p className="text-white/60 text-xs">Verify your active training metrics, attendance rates, and achievements.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full md:w-auto">
                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-white/50 uppercase font-bold block mb-1">Sessions</span>
                  <span className="font-poppins font-black text-xl">{studentStats.sessionsCount} completed</span>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-white/50 uppercase font-bold block mb-1">Current Level</span>
                  <span className="font-poppins font-black text-xl text-secondary-container">{studentStats.skillLevel}</span>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-white/50 uppercase font-bold block mb-1">Attendance</span>
                  <span className="font-poppins font-black text-xl text-[#138808]">{studentStats.attendancePercent}%</span>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-white/50 uppercase font-bold block mb-1">Certificates</span>
                  <span className="font-poppins font-black text-xl">{studentStats.badges.length} won</span>
                </div>
              </div>
            </div>

            {studentStats.badges.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2 items-center text-xs">
                <span className="text-white/60 font-semibold uppercase tracking-wider text-[9px]">Badges Awarded:</span>
                {studentStats.badges.map((b, idx) => (
                  <span key={idx} className="bg-white/10 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-xs">workspace_premium</span>
                    {b}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Filter Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Filters */}
          <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm h-fit space-y-6">
            <h3 className="font-poppins font-bold text-sm text-primary border-b pb-2 uppercase tracking-wider">Refine Coach Search</h3>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Minimum Experience</label>
              <div className="grid grid-cols-4 gap-2">
                {['1', '3', '5', '10'].map((years) => (
                  <button
                    key={years}
                    onClick={() => setExpFilter(years)}
                    className={`py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      expFilter === years ? 'bg-primary text-white border-primary' : 'border-outline-variant/45 hover:bg-gray-50'
                    }`}
                  >
                    {years}+
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Coaching Rate / Hr</label>
              <div className="space-y-2">
                {[
                  { key: 'beginner', label: 'Beginner (< ₹1,500)' },
                  { key: 'intermediate', label: 'Intermediate (₹1,500 - ₹3,000)' },
                  { key: 'advanced', label: 'Advanced (> ₹3,000)' }
                ].map((rate) => (
                  <label key={rate.key} className="flex items-center gap-2.5 text-xs text-primary font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="rate"
                      checked={rateFilter === rate.key}
                      onChange={() => setRateFilter(rate.key)}
                      className="accent-secondary"
                    />
                    {rate.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Coach Marketplace Listings */}
          <div className="lg:col-span-3 space-y-8" id="coaches">
            <div className="flex justify-between items-center">
              <h2 className="font-poppins font-bold text-xl text-primary">Certified Coaches ({filteredCoachesList.length})</h2>
            </div>

            {loading ? (
              <div className="text-center py-12 text-outline text-xs font-semibold">Loading coaches...</div>
            ) : filteredCoachesList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-24 border border-dashed text-outline p-6 text-xs">
                No coaches matched the active filters. Modify selection parameters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCoachesList.map((coach) => (
                  <div
                    key={coach.id}
                    className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all premium-card"
                  >
                    <div>
                      {/* Top banner info */}
                      <div className="flex gap-4 items-start mb-4">
                        <img
                          src={coach.gallery[0] || 'https://images.unsplash.com/photo-1544045560-723f63933a3e?auto=format&fit=crop&w=150&q=80'}
                          alt={coach.name}
                          className="w-16 h-16 rounded-xl object-cover border bg-gray-50 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-grow text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-poppins font-bold text-base text-primary leading-tight truncate">
                              {coach.name}
                            </h3>
                            <span className="material-symbols-outlined text-secondary text-base flex-shrink-0" title="Verified Coach">
                              verified
                            </span>
                          </div>
                          <p className="text-xs text-[#138808] font-bold mt-0.5">{coach.academyName}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-outline">
                            <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                            <span className="font-bold text-primary">{coach.avgRating.toFixed(1)}</span>
                            <span>({coach.reviewsCount} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-outline text-xs leading-relaxed line-clamp-3 mb-4">{coach.about}</p>

                      <div className="grid grid-cols-2 gap-4 text-[11px] mb-4 border-t pt-4 border-dashed border-outline-variant/30">
                        <div>
                          <span className="text-outline font-semibold uppercase block text-[9px] tracking-wider">Experience</span>
                          <span className="font-bold text-primary">{coach.experienceYears} Years</span>
                        </div>
                        <div>
                          <span className="text-outline font-semibold uppercase block text-[9px] tracking-wider">Specialization</span>
                          <span className="font-bold text-primary truncate block">{coach.sports.join(', ')}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-outline font-semibold uppercase block text-[9px] tracking-wider mb-1.5">Certifications</span>
                        <div className="flex flex-wrap gap-1">
                          {coach.certifications.slice(0, 2).map((cert, idx) => (
                            <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-semibold text-primary truncate max-w-[170px]" title={cert}>
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 flex justify-between items-center gap-4 mt-2">
                      <div>
                        <span className="text-[9px] text-outline uppercase font-bold block mb-0.5">Session Rate</span>
                        <span className="font-poppins font-black text-sm text-[#138808]">
                          {formatCurrency(coach.hourlyRate)}/hr
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/coaches/${coach.id}`)}
                          className="px-4 py-2 rounded-lg border border-primary text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => navigate(`/coaches/${coach.id}?tab=book`)}
                          className="px-4 py-2 bg-secondary-container hover:bg-[#e07f24] text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Book Slot
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Upcoming Training Camps Section */}
        <section className="space-y-6 pt-6" id="camps">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <h2 className="font-poppins font-bold text-2xl text-primary">Upcoming Training Camps</h2>
            <p className="text-on-surface-variant text-xs font-medium">Join multi-week development cohorts headed by top-tier academy directors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {camps.map((camp) => (
              <div key={camp.id} className="bg-white rounded-24 overflow-hidden border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between premium-card">
                <div>
                  <div className="h-44 relative bg-gray-100">
                    <img src={camp.banner} alt={camp.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-secondary-container text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      {camp.sport}
                    </span>
                    <span className="absolute top-3 right-3 bg-black/60 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                      {camp.skillLevel}
                    </span>
                  </div>

                  <div className="p-6 space-y-4 text-left">
                    <div>
                      <h3 className="font-poppins font-bold text-base text-primary line-clamp-1">{camp.name}</h3>
                      <p className="text-[11px] text-outline font-bold mt-0.5">Led by {camp.coachName}</p>
                    </div>

                    <p className="text-outline text-xs leading-relaxed line-clamp-3">{camp.description}</p>

                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-b py-3 border-outline-variant/20">
                      <div>
                        <span className="text-outline text-[9px] font-bold uppercase block mb-0.5">Start Date</span>
                        <span className="font-bold text-primary">{new Date(camp.startDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-outline text-[9px] font-bold uppercase block mb-0.5">Duration</span>
                        <span className="font-bold text-primary">{camp.durationWeeks} Weeks</span>
                      </div>
                      <div>
                        <span className="text-outline text-[9px] font-bold uppercase block mb-0.5">Seats Left</span>
                        <span className="font-bold text-[#138808]">{camp.seatsLeft} / {camp.seatsLimit}</span>
                      </div>
                      <div>
                        <span className="text-outline text-[9px] font-bold uppercase block mb-0.5">Timings</span>
                        <span className="font-bold text-primary truncate block" title={camp.timings}>{camp.timings}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex justify-between items-center gap-4">
                  <div>
                    <span className="text-[9px] text-outline uppercase font-bold block mb-0.5">Program Fee</span>
                    <span className="font-poppins font-black text-base text-[#138808]">
                      {formatCurrency(camp.fee)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenJoinCamp(camp)}
                    className="px-6 py-2.5 bg-primary hover:bg-[#0A2E6E] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                  >
                    Join Camp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Popular Academies Grid */}
        <section className="space-y-6 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <h2 className="font-poppins font-bold text-2xl text-primary">Popular Academies</h2>
            <p className="text-on-surface-variant text-xs font-medium">Verify premium local learning hubs and professional sports networks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {academies.map((ac) => (
              <div key={ac.id} className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm flex items-center gap-4 hover:shadow-md transition-all premium-card text-left">
                <img src={ac.logo} alt={ac.name} className="w-16 h-16 rounded-xl object-cover border bg-gray-50 flex-shrink-0" />
                <div className="min-w-0 flex-grow">
                  <h3 className="font-poppins font-bold text-sm text-primary truncate leading-tight">{ac.name}</h3>
                  <p className="text-[11px] text-outline mt-0.5">{ac.city} • {ac.sports.join(', ')}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-outline">
                    <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                    <span className="font-bold text-primary">{ac.rating.toFixed(1)}</span>
                    <span>• {ac.coachesCount} Coaches</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Why Train with be11 */}
        <section className="bg-white rounded-24 p-10 border border-outline-variant/30 shadow-sm space-y-8 text-center">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="font-poppins font-bold text-2xl text-primary">Why Train With be11</h2>
            <p className="text-on-surface-variant text-xs font-medium">Our technology-driven sports framework delivers professional-grade outcomes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: 'military_tech', title: 'Certified Coaches', desc: 'Direct access to national-level instructors and legends.' },
              { icon: 'shield', title: 'Verified Academies', desc: 'Onsite inspections ensure elite turf nets and lights.' },
              { icon: 'analytics', title: 'Structured Progression', desc: 'Personalized batch calendars and digital progress feedback.' },
              { icon: 'workspace_premium', title: 'Earn Certificates', desc: 'Acquire authorized academy certs for completed leagues.' }
            ].map((feature, idx) => (
              <div key={idx} className="p-4 rounded-xl hover:bg-gray-50 transition-all text-center space-y-2">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary">
                  <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-poppins font-bold text-sm text-primary">{feature.title}</h3>
                <p className="text-outline text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Become a Coach CTA banner */}
        <section className="bg-gradient-to-r from-[#FF9933]/15 to-[#138808]/15 rounded-24 p-10 border border-secondary/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left space-y-2">
            <h2 className="font-poppins font-bold text-2xl text-primary">Become a Coach on be11</h2>
            <p className="text-on-surface-variant text-xs max-w-xl leading-relaxed">
              Reach thousands of aspiring players, manage custom training batches, publish camps, log attendances, and scale your athletic training business.
            </p>
          </div>
          <button
            onClick={() => setApplyModalOpen(true)}
            className="px-8 py-3.5 bg-primary hover:bg-[#0A2E6E] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            Apply as Coach
          </button>
        </section>
      </div>

      {/* MODAL 1: Become a Coach Registration Wizard */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-24 max-w-2xl w-full p-8 text-left text-primary relative shadow-2xl my-8">
            <button
              onClick={() => setApplyModalOpen(false)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-poppins font-bold text-xl text-[#0a2e6e] mb-2 flex items-center gap-2 border-b pb-3">
              <span className="material-symbols-outlined text-secondary text-2xl">sports_cricket</span>
              Apply as a certified Coach
            </h3>

            {applySuccess ? (
              <div className="bg-on-tertiary-container/10 text-on-tertiary-container p-6 rounded-xl font-bold text-xs my-4 leading-relaxed flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                {applySuccess}
              </div>
            ) : (
              <form onSubmit={handleApplyAsCoach} className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Years of Experience</label>
                    <input
                      type="number"
                      value={applyForm.experienceYears}
                      onChange={(e) => setApplyForm({ ...applyForm, experienceYears: e.target.value })}
                      required
                      min="1"
                      className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Coaching Rate (INR/hr)</label>
                    <input
                      type="number"
                      value={applyForm.hourlyRate}
                      onChange={(e) => setApplyForm({ ...applyForm, hourlyRate: e.target.value })}
                      required
                      min="100"
                      className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Sports (comma separated)</label>
                  <input
                    type="text"
                    value={applyForm.sports}
                    onChange={(e) => setApplyForm({ ...applyForm, sports: e.target.value })}
                    required
                    placeholder="Cricket, Badminton"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Certifications (comma separated)</label>
                  <input
                    type="text"
                    value={applyForm.certifications}
                    onChange={(e) => setApplyForm({ ...applyForm, certifications: e.target.value })}
                    required
                    placeholder="BCCI Level 2 Coach, ICC Diploma"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Coaching Achievements (comma separated)</label>
                  <input
                    type="text"
                    value={applyForm.achievements}
                    onChange={(e) => setApplyForm({ ...applyForm, achievements: e.target.value })}
                    placeholder="Mentored state champions, Played IPL"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">About Bio Details</label>
                  <textarea
                    value={applyForm.about}
                    onChange={(e) => setApplyForm({ ...applyForm, about: e.target.value })}
                    required
                    rows={3}
                    placeholder="Bio summary detailing your sports background and style..."
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none resize-none"
                  />
                </div>

                <div className="border-t pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-5 py-2.5 border rounded-xl font-bold cursor-pointer hover:bg-gray-50 text-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-secondary-container hover:bg-[#e07f24] text-white rounded-xl font-bold cursor-pointer shadow-sm"
                  >
                    Agree &amp; Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Join Camp Checkout Flow */}
      {selectedCamp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-24 max-w-md w-full p-8 text-left text-primary relative shadow-2xl">
            <button
              onClick={() => setSelectedCamp(null)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {joinStep === 1 && (
              <div className="space-y-5">
                <h3 className="font-poppins font-bold text-lg text-primary border-b pb-2">Camp Cohort Details</h3>
                <div className="flex gap-4">
                  <img src={selectedCamp.banner} alt={selectedCamp.name} className="w-16 h-16 object-cover rounded-lg border" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-primary">{selectedCamp.name}</h4>
                    <p className="text-xs text-[#138808] font-bold">{selectedCamp.academyName}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs border bg-gray-50 p-4 rounded-xl">
                  <p><span className="text-outline font-semibold">Start Date:</span> {new Date(selectedCamp.startDate).toLocaleDateString()}</p>
                  <p><span className="text-outline font-semibold">Timings:</span> {selectedCamp.timings}</p>
                  <p><span className="text-outline font-semibold">Duration:</span> {selectedCamp.durationWeeks} Weeks</p>
                  <p><span className="text-outline font-semibold">Skill Level:</span> {selectedCamp.skillLevel}</p>
                </div>
                <button
                  onClick={() => setJoinStep(2)}
                  className="w-full py-3 bg-primary hover:bg-[#0A2E6E] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer text-center"
                >
                  Proceed to Payment
                </button>
              </div>
            )}

            {joinStep === 2 && (
              <div className="space-y-5">
                <h3 className="font-poppins font-bold text-lg text-primary border-b pb-2">Cohort Enrollment Fee</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-outline font-medium">Program Title:</span>
                    <span className="text-primary font-bold">{selectedCamp.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline font-medium">Your Wallet Balance:</span>
                    <span className="text-primary font-bold">{formatCurrency(user?.walletBalance || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 font-semibold">
                    <span className="text-primary">Grand Total</span>
                    <span className="text-[#138808] font-black text-sm">{formatCurrency(selectedCamp.fee)}</span>
                  </div>
                </div>
                <button
                  onClick={handleJoinCamp}
                  disabled={joiningLoading}
                  className="w-full py-3 bg-secondary-container hover:bg-[#e07f24] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer text-center"
                >
                  {joiningLoading ? 'Enrolling...' : 'Pay from Wallet'}
                </button>
              </div>
            )}

            {joinStep === 3 && (
              <div className="space-y-4 text-center py-4">
                <span className="material-symbols-outlined text-5xl text-[#138808]">check_circle</span>
                <h3 className="font-poppins font-bold text-lg text-primary">Enrollment Successful!</h3>
                <p className="text-outline text-xs max-w-xs mx-auto">
                  You are now registered in {selectedCamp.name}. Check details and schedules in your dashboard.
                </p>
                <button
                  onClick={() => {
                    setSelectedCamp(null);
                    navigate('/my-training');
                  }}
                  className="w-full mt-4 py-2.5 border rounded-xl text-xs font-bold text-primary hover:bg-gray-50 cursor-pointer"
                >
                  Go to My Training
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Coaches;
