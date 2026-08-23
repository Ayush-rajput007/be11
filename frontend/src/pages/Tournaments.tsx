import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useLocationStore } from '../store/locationStore.js';
import { formatCurrency } from '@be11/shared';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  status: string;
  score: string | null;
  overs: string | null;
  result: string | null;
  tournament?: {
    name: string;
    sport: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  sport: string;
  status: string; // UPCOMING, ONGOING, COMPLETED
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  teamsLimit: number;
  entryFee: number;
  prizePool: number;
  organizer: {
    firstName: string;
    lastName: string;
  };
  ground?: {
    name: string;
    location: string;
  };
  city: string;
  rules: string | null;
  sponsors: any; // array
  gallery: any;  // array
  registrations: any[];
  matches: Match[];
  reviews: Review[];
}

export const Tournaments: React.FC = () => {
  const { isAuthenticated, user, updateWalletBalance } = useAuthStore();
  const { selectedCity } = useLocationStore();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); // Tournament IDs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('All');
  const [feeFilter, setFeeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected Tournament Details Modal
  const [selectedTourney, setSelectedTourney] = useState<Tournament | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'rules' | 'fixtures' | 'reviews'>('info');

  // Multi-step Registration Wizard
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [regTeamName, setRegTeamName] = useState('');
  const [regCaptainName, setRegCaptainName] = useState('');
  const [regContactPhone, setRegContactPhone] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playersList, setPlayersList] = useState<string[]>([]);
  const [regLoading, setRegLoading] = useState(false);

  // Host Tournament Modal (Organizer Panel)
  const [isHostOpen, setIsHostOpen] = useState(false);
  const [hostName, setHostName] = useState('');
  const [hostDesc, setHostDesc] = useState('');
  const [hostSport, setHostSport] = useState('Cricket');
  const [hostStart, setHostStart] = useState('');
  const [hostEnd, setHostEnd] = useState('');
  const [hostDeadline, setHostDeadline] = useState('');
  const [hostLimit, setHostLimit] = useState(8);
  const [hostFee, setHostFee] = useState('');
  const [hostPrize, setHostPrize] = useState('');
  const [hostRules, setHostRules] = useState('');
  const [hostLoading, setHostLoading] = useState(false);

  // Featured Tournament countdown timer helper
  const [countdown, setCountdown] = useState('00d 00h 00m');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Get Tournaments
      const tourneyRes = await api.get('/tournaments');
      setTournaments(tourneyRes.data.data.tournaments);

      // 2. Get Live Matches
      const matchesRes = await api.get('/tournaments/live/matches');
      setLiveMatches(matchesRes.data.data.matches);

      // 3. Get Favorites if Logged in
      if (isAuthenticated) {
        const favsRes = await api.get('/tournaments/favs/my');
        setFavorites(favsRes.data.data.favorites.map((f: any) => f.tournamentId));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve leagues and matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, selectedCity]);

  // Handle countdown updates
  useEffect(() => {
    const interval = setInterval(() => {
      const featured = tournaments.find((t) => t.status === 'UPCOMING');
      if (!featured) return;
      const target = new Date(featured.startDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('Live Now');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${days}d ${hours}h ${mins}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournaments]);

  // Toggle favorite trigger
  const handleToggleFav = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please log in to save favorites.');
      return;
    }
    try {
      const res = await api.post(`/tournaments/${id}/favorite`);
      if (res.data.data.isFavorite) {
        setFavorites((prev) => [...prev, id]);
      } else {
        setFavorites((prev) => prev.filter((favId) => favId !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit registration wizard
  const handleRegisterSubmit = async () => {
    if (!selectedTourney) return;
    setRegLoading(true);
    try {
      await api.post(`/tournaments/${selectedTourney.id}/register`, {
        teamName: regTeamName,
        captainName: regCaptainName,
        contactPhone: regContactPhone,
        playersList: [...playersList, regCaptainName],
      });

      if (selectedTourney.entryFee > 0 && user) {
        updateWalletBalance(user.walletBalance - selectedTourney.entryFee);
      }

      setRegStep(5); // Show success invoice step
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit tournament entry.');
    } finally {
      setRegLoading(false);
    }
  };

  // Host Tournament (Organizer Submit)
  const handleHostTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to host leagues.');
      return;
    }

    setHostLoading(true);
    try {
      await api.post('/tournaments/admin/create', {
        name: hostName,
        description: hostDesc,
        sport: hostSport,
        startDate: hostStart,
        endDate: hostEnd,
        registrationDeadline: hostDeadline,
        teamsLimit: hostLimit,
        entryFee: hostFee ? parseFloat(hostFee) : 0,
        prizePool: hostPrize ? parseFloat(hostPrize) : 0,
        city: selectedCity,
        rules: hostRules,
      });

      alert('League successfully created by organizer!');
      setIsHostOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Creation failed.');
    } finally {
      setHostLoading(false);
    }
  };

  // Share link helper
  const handleShare = (t: Tournament, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/tournaments/${t.id}`;
    if (navigator.share) {
      navigator.share({
        title: t.name,
        text: t.description,
        url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard!');
    }
  };

  // Local calculations
  const featuredTourney = tournaments.find((t) => t.status === 'UPCOMING');

  const filteredTourneys = tournaments.filter((t) => {
    if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (sportFilter !== 'All' && t.sport !== sportFilter) return false;
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (feeFilter === 'Free' && t.entryFee > 0) return false;
    if (feeFilter === 'Paid' && t.entryFee === 0) return false;
    if (t.city !== selectedCity) return false;
    return true;
  });

  return (
    <div className="pt-24 min-h-screen bg-surface-container-low pb-24 text-left">
      <div className="max-w-7xl mx-auto px-container-padding">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold mb-6">
            {error}
          </div>
        )}
        {/* Hero Section Banner */}
        <section className="relative rounded-[32px] bg-primary text-white p-8 md:p-16 overflow-hidden mb-12 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747737956-37872f84a62f?auto=format&fit=crop&w=1200&q=80')] bg-cover opacity-20 pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl">
            <span className="bg-secondary-container text-on-secondary-container font-label-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-6 inline-block">
              be11 Arena Leagues
            </span>
            <h1 className="font-display-hero text-headline-lg-mobile md:text-headline-lg font-bold leading-tight mb-6 text-white">
              Discover &amp; Compete in Premium Leagues
            </h1>
            <p className="text-white/80 font-body-lg text-sm max-w-lg mb-8">
              Join competitive local leagues, follow live scores, and win cash prize pools in Delhi, Mumbai, Pune and other major cities.
            </p>
            <div className="flex gap-4">
              <a
                href="#all-tournaments"
                className="px-6 py-3 rounded-xl bg-secondary-container text-on-secondary-container font-label-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all text-center"
              >
                Explore Tournaments
              </a>
              <button
                onClick={() => setIsHostOpen(true)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-label-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Host Tournament
              </button>
            </div>
          </div>

          {/* Featured Dynamic Timer Block */}
          {featuredTourney && (
            <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-24 p-6 border border-white/20 max-w-xs w-full text-center">
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-2">Featured Registration Deadline</p>
              <h4 className="font-poppins font-bold text-lg text-white mb-4 line-clamp-1">{featuredTourney.name}</h4>
              <div className="font-display-hero text-3xl font-extrabold text-secondary-container mb-4 animate-pulse">
                {countdown}
              </div>
              <div className="flex justify-between text-xs text-white/80 mb-2">
                <span>Registration Limit:</span>
                <span className="font-bold">{featuredTourney.registrations?.length || 0} / {featuredTourney.teamsLimit} Teams</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-container transition-all duration-500"
                  style={{ width: `${((featuredTourney.registrations?.length || 0) / featuredTourney.teamsLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </section>

        {/* Live Match Scoreboard Section */}
        {liveMatches.length > 0 && (
          <section className="mb-12">
            <h2 className="font-poppins font-bold text-xl text-primary mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
              Live Tournaments Feed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveMatches.map((m) => (
                <div key={m.id} className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 flex justify-between items-center gap-4">
                  <div className="text-left space-y-1">
                    <span className="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      LIVE • {m.tournament?.sport}
                    </span>
                    <h4 className="font-bold text-sm text-primary">{m.homeTeam} vs {m.awayTeam}</h4>
                    <p className="text-xs text-outline leading-tight">{m.tournament?.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">📍 {m.time} | Stadium Turf</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="font-poppins font-bold text-md text-[#138808]">{m.score}</p>
                    <p className="text-[10px] text-outline italic">{m.result}</p>
                    <button
                      onClick={() => alert('Real-time socket streams are in sync!')}
                      className="px-4 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Watch Live
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search & Filter controls row */}
        <section id="all-tournaments" className="mb-8">
          <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                Sport Type
              </label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary text-xs"
              >
                <option value="All">All Sports</option>
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                Entry Fee
              </label>
              <select
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary text-xs"
              >
                <option value="All">All Fee Types</option>
                <option value="Free">Free Entry</option>
                <option value="Paid">Paid Entry</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                Search Name
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Monsoon Cup, League..."
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary text-xs"
              />
            </div>
          </div>
        </section>

        {/* Results grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-24 h-72 animate-pulse"></div>
            ))}
          </div>
        ) : filteredTourneys.length === 0 ? (
          <p className="text-on-surface-variant text-center py-12">No active tournaments found matching criteria in {selectedCity}.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {filteredTourneys.map((t) => {
              const regList = t.registrations || [];
              const isFav = favorites.includes(t.id);

              return (
                <div
                  key={t.id}
                  onClick={async () => {
                    const res = await api.get(`/tournaments/${t.id}`);
                    setSelectedTourney(res.data.data.tournament);
                    setDetailTab('info');
                  }}
                  className="bg-white rounded-24 overflow-hidden shadow-sm border border-outline-variant/30 hover:border-primary transition-all flex flex-col justify-between cursor-pointer premium-card group"
                >
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={
                        t.sport === 'Cricket'
                          ? 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80'
                          : 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={t.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-all"
                    />
                    <button
                      onClick={(e) => handleToggleFav(t.id, e)}
                      className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm text-outline hover:text-red-500 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isFav ? '"FILL" 1' : undefined }}>
                        favorite
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleShare(t, e)}
                      className="absolute top-3 left-3 bg-white p-2 rounded-full shadow-sm text-outline hover:text-primary cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">share</span>
                    </button>
                    <span className="absolute bottom-3 left-3 bg-[#FF9933]/90 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {t.sport}
                    </span>
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-poppins font-bold text-md text-primary mb-1 line-clamp-1">{t.name}</h3>
                      <p className="text-xs text-outline flex items-center gap-1 mb-4">
                        <span className="material-symbols-outlined text-sm">location_on</span> {t.ground?.name || 'Local Turf'}, {t.city}
                      </p>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed mb-6">{t.description}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-primary mb-4">
                        <span>Fee: {t.entryFee === 0 ? 'FREE' : formatCurrency(t.entryFee)}</span>
                        <span className="text-[#138808]">Pool: {formatCurrency(t.prizePool)}</span>
                      </div>

                      <div className="flex justify-between text-[10px] text-outline mb-2">
                        <span>Slots Filled:</span>
                        <span className="font-bold">{regList.length} / {t.teamsLimit} Teams</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#EDF2F7] rounded-full overflow-hidden mb-6">
                        <div
                          className="h-full bg-secondary-container transition-all"
                          style={{ width: `${(regList.length / t.teamsLimit) * 100}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTourney(t);
                            setIsRegOpen(true);
                            setRegStep(1);
                          }}
                          disabled={t.status !== 'UPCOMING' || regList.length >= t.teamsLimit}
                          className="py-2 rounded-xl bg-[#0A2E6E] text-white text-[10px] font-bold btn-primary-premium shadow-md cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Join League
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const res = await api.get(`/tournaments/${t.id}`);
                            setSelectedTourney(res.data.data.tournament);
                            setDetailTab('info');
                          }}
                          className="py-2 rounded-xl border border-primary text-primary text-[10px] font-bold text-center cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tournament Details Drawer Modal */}
      {selectedTourney && !isRegOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-24 max-w-4xl w-full p-8 text-primary relative shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto text-left">
            <button
              onClick={() => setSelectedTourney(null)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <span className="bg-[#FF9933]/15 text-[#FF9933] font-bold text-[9px] px-3.5 py-1.5 rounded-full uppercase tracking-wider block w-fit mb-3">
              {selectedTourney.sport} League
            </span>
            <h2 className="font-poppins font-bold text-2xl text-[#0A2E6E] mb-1">{selectedTourney.name}</h2>
            <p className="text-xs text-outline mb-6">📍 Hosted at: {selectedTourney.ground?.name || 'Local Turf'}, {selectedTourney.city}</p>

            {/* Modal Detail Tabs */}
            <div className="flex gap-4 border-b pb-2 mb-6">
              {['info', 'rules', 'fixtures', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab as any)}
                  className={`text-xs font-bold uppercase pb-1 border-b-2 cursor-pointer transition-all ${
                    detailTab === tab ? 'border-primary text-primary' : 'border-transparent text-outline'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content block */}
            <div className="min-h-[250px] text-sm text-on-surface-variant leading-relaxed">
              {detailTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-primary mb-2">Description</h4>
                    <p className="text-xs text-on-surface-variant mb-4">{selectedTourney.description}</p>
                    <p className="text-xs font-semibold text-primary">Dates: {selectedTourney.startDate} to {selectedTourney.endDate}</p>
                    <p className="text-xs text-outline mt-1">Registration Ends: {selectedTourney.registrationDeadline || 'N/A'}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-outline-variant/30 text-xs">
                      <p className="font-bold text-primary mb-1">Financial Structure</p>
                      <p className="text-outline">Entry Fee: <strong className="text-primary">{selectedTourney.entryFee === 0 ? 'FREE' : `₹${selectedTourney.entryFee}`}</strong></p>
                      <p className="text-outline">Grand Prize Pool: <strong className="text-[#138808]">₹{selectedTourney.prizePool}</strong></p>
                    </div>
                    {selectedTourney.status === 'UPCOMING' && (
                      <button
                        onClick={() => setIsRegOpen(true)}
                        disabled={selectedTourney.registrations?.length >= selectedTourney.teamsLimit}
                        className="w-full py-3 bg-[#0A2E6E] text-white rounded-xl font-label-bold text-xs btn-primary-premium shadow-md cursor-pointer disabled:opacity-40"
                      >
                        Register Squad Now
                      </button>
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'rules' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-primary">Official Tournament Rules</h4>
                  <p className="text-xs text-on-surface-variant whitespace-pre-line">{selectedTourney.rules || 'Standard league formats apply.'}</p>
                </div>
              )}

              {detailTab === 'fixtures' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-primary">League Match Fixtures &amp; Brackets</h4>
                  {selectedTourney.matches?.length === 0 ? (
                    <p className="text-xs text-outline">Fixtures draw will be released after registration closes.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTourney.matches?.map((m) => (
                        <div key={m.id} className="bg-[#F8FAFC] border p-4 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between font-bold text-primary">
                            <span>{m.homeTeam} vs {m.awayTeam}</span>
                            <span className="text-secondary-container">{m.status}</span>
                          </div>
                          <p className="text-outline text-[10px]">{m.date} | {m.time}</p>
                          {m.score && <p className="text-[#138808] font-bold mt-1">Score: {m.score}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'reviews' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-primary">Player Reviews</h4>
                  {selectedTourney.reviews?.length === 0 ? (
                    <p className="text-xs text-outline">No reviews posted yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {selectedTourney.reviews?.map((r) => (
                        <div key={r.id} className="p-3 bg-[#F8FAFC] rounded-xl border text-xs">
                          <div className="flex justify-between font-bold text-primary mb-1">
                            <span>{r.user?.firstName} {r.user?.lastName}</span>
                            <span className="text-secondary-container">⭐ {r.rating}</span>
                          </div>
                          <p className="text-on-surface-variant">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-step Registration Wizard Modal */}
      {isRegOpen && selectedTourney && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-24 max-w-md w-full p-8 text-primary relative shadow-2xl animate-fade-in border border-outline-variant/30 text-left">
            <button
              onClick={() => {
                setIsRegOpen(false);
                setRegStep(1);
              }}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Progress Stepper Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Step {regStep} of 5</span>
                <span className="text-xs font-bold text-[#FF9933]">
                  {regStep === 1 && 'Team Name'}
                  {regStep === 2 && 'Roster Entry'}
                  {regStep === 3 && 'Confirmation Summary'}
                  {regStep === 4 && 'Deduct Entry Fee'}
                  {regStep === 5 && 'Invoice Check'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#EDF2F7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-container transition-all duration-300"
                  style={{ width: `${(regStep / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step 1: Team Name */}
            {regStep === 1 && (
              <div className="space-y-4">
                <h4 className="font-poppins font-bold text-lg text-[#0A2E6E]">Enter Team Details</h4>
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    value={regTeamName}
                    onChange={(e) => setRegTeamName(e.target.value)}
                    placeholder="e.g. Bandra Warriors"
                    className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Captain Name</label>
                  <input
                    type="text"
                    required
                    value={regCaptainName}
                    onChange={(e) => setRegCaptainName(e.target.value)}
                    placeholder="e.g. Rohit Verma"
                    className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Captain Phone</label>
                  <input
                    type="text"
                    required
                    value={regContactPhone}
                    onChange={(e) => setRegContactPhone(e.target.value)}
                    placeholder="+91 99999 99999"
                    className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                  />
                </div>
                <button
                  onClick={() => regTeamName && regCaptainName && regContactPhone ? setRegStep(2) : alert('Fill details first.')}
                  className="w-full py-3 bg-[#0A2E6E] text-white rounded-xl font-label-bold text-xs cursor-pointer btn-primary-premium shadow-md mt-4 text-center"
                >
                  Continue to Roster
                </button>
              </div>
            )}

            {/* Step 2: Roster Entry */}
            {regStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-poppins font-bold text-lg text-[#0A2E6E]">Enter Squad List</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Player Name"
                    className="flex-grow bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPlayerName) return;
                      setPlayersList((p) => [...p, newPlayerName]);
                      setNewPlayerName('');
                    }}
                    className="bg-primary text-white px-4 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-xl border">
                  <p className="text-[10px] text-outline font-bold">Captain: {regCaptainName} (Auto-included)</p>
                  {playersList.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-white p-1 px-2 rounded border">
                      <span>{p}</span>
                      <button onClick={() => setPlayersList((prev) => prev.filter((pl) => pl !== p))} className="text-red-500 text-[10px]">Remove</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setRegStep(1)} className="w-1/2 py-2.5 border rounded-xl text-xs font-bold text-center cursor-pointer">Back</button>
                  <button onClick={() => setRegStep(3)} className="w-1/2 py-2.5 bg-[#0A2E6E] text-white rounded-xl text-xs font-bold text-center cursor-pointer">Review Entry</button>
                </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {regStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-poppins font-bold text-lg text-[#0A2E6E]">Review Registration</h4>
                <div className="bg-[#F8FAFC] p-4 rounded-xl border space-y-2 text-xs text-outline">
                  <p><strong>Team:</strong> <span className="text-primary">{regTeamName}</span></p>
                  <p><strong>Captain:</strong> <span className="text-primary">{regCaptainName}</span></p>
                  <p><strong>Roster Count:</strong> <span className="text-primary">{playersList.length + 1} players</span></p>
                  <p><strong>Entry Fee:</strong> <span className="text-[#138808] font-bold">{selectedTourney.entryFee === 0 ? 'FREE' : formatCurrency(selectedTourney.entryFee)}</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setRegStep(2)} className="w-1/2 py-2.5 border rounded-xl text-xs font-bold text-center cursor-pointer">Back</button>
                  <button onClick={() => setRegStep(4)} className="w-1/2 py-2.5 bg-[#0A2E6E] text-white rounded-xl text-xs font-bold text-center cursor-pointer">Proceed to Pay</button>
                </div>
              </div>
            )}

            {/* Step 4: Pay Fee */}
            {regStep === 4 && (
              <div className="space-y-4">
                <h4 className="font-poppins font-bold text-lg text-[#0A2E6E]">Submit Payment</h4>
                <p className="text-xs text-on-surface-variant">The entry fee will be deducted directly from your be11 wallet balance.</p>
                <div className="bg-[#F8FAFC] p-4 rounded-xl border text-xs text-outline space-y-1.5">
                  <p>Current Balance: <strong className="text-primary">{formatCurrency(user?.walletBalance || 0)}</strong></p>
                  <p>Deduction Fee: <strong className="text-red-500">- {formatCurrency(selectedTourney.entryFee)}</strong></p>
                  <div className="h-[1px] bg-gray-200 my-2"></div>
                  <p className="font-bold">Remaining Balance: <strong className="text-[#138808]">{formatCurrency((user?.walletBalance || 0) - selectedTourney.entryFee)}</strong></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setRegStep(3)} className="w-1/2 py-2.5 border rounded-xl text-xs font-bold text-center cursor-pointer">Back</button>
                  <button
                    onClick={handleRegisterSubmit}
                    disabled={regLoading}
                    className="w-1/2 py-2.5 bg-[#0A2E6E] text-white rounded-xl text-xs font-bold text-center cursor-pointer btn-primary-premium shadow-md"
                  >
                    {regLoading ? 'Processing...' : 'Confirm & Join'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Success Invoice */}
            {regStep === 5 && (
              <div className="space-y-4 text-center">
                <span className="material-symbols-outlined text-green-500 text-5xl">check_circle</span>
                <h4 className="font-poppins font-bold text-lg text-[#0A2E6E]">Welcome to the League!</h4>
                <p className="text-xs text-outline">Your registration invoice has been created and logged in your user dashboard under ledger statements.</p>
                <button
                  onClick={() => {
                    setIsRegOpen(false);
                    setSelectedTourney(null);
                    setRegStep(1);
                  }}
                  className="w-full py-3 bg-secondary-container text-white rounded-xl text-xs font-bold cursor-pointer mt-4"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Host Tournament Modal (Organizer Panel Form) */}
      {isHostOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleHostTournament} className="bg-white rounded-24 max-w-lg w-full p-8 text-primary relative shadow-2xl animate-fade-in border border-outline-variant/30 space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <button
              type="button"
              onClick={() => setIsHostOpen(false)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-poppins font-bold text-xl text-[#0A2E6E] border-b pb-2">Host a Tournament</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">League Name</label>
                <input
                  required
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Winter Soccer Cup"
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Sport</label>
                <select
                  value={hostSport}
                  onChange={(e) => setHostSport(e.target.value)}
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Description</label>
              <textarea
                required
                rows={2}
                value={hostDesc}
                onChange={(e) => setHostDesc(e.target.value)}
                placeholder="Brief information about fixtures, tournament structure..."
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Start Date</label>
                <input
                  required
                  type="date"
                  value={hostStart}
                  onChange={(e) => setHostStart(e.target.value)}
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">End Date</label>
                <input
                  required
                  type="date"
                  value={hostEnd}
                  onChange={(e) => setHostEnd(e.target.value)}
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Deadline</label>
                <input
                  required
                  type="date"
                  value={hostDeadline}
                  onChange={(e) => setHostDeadline(e.target.value)}
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Entry Fee (₹)</label>
                <input
                  type="number"
                  value={hostFee}
                  onChange={(e) => setHostFee(e.target.value)}
                  placeholder="e.g. 500 (0 for Free)"
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Prize Pool (₹)</label>
                <input
                  type="number"
                  value={hostPrize}
                  onChange={(e) => setHostPrize(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Teams Limit</label>
                <input
                  required
                  type="number"
                  value={hostLimit}
                  onChange={(e) => setHostLimit(parseInt(e.target.value, 10))}
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Official Rules Summary</label>
              <textarea
                rows={2}
                value={hostRules}
                onChange={(e) => setHostRules(e.target.value)}
                placeholder="Standard rules, team size limit..."
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2 border text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={hostLoading}
              className="w-full py-3 bg-[#0A2E6E] text-white rounded-xl font-label-bold text-xs btn-primary-premium shadow-md cursor-pointer"
            >
              {hostLoading ? 'Creating Tournament...' : 'Launch Tournament'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default Tournaments;
