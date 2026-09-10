import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';
import {
  CRICKET_ROLES,
  IPL_TEAMS,
  BATTING_STYLES,
  BOWLING_STYLES,
  CRICKET_PLAYERS,
  FOOTBALL_POSITIONS,
  FOOTBALL_CLUBS,
  FOOTBALL_PLAYERS,
  PREFERRED_FEET,
} from '@be11/shared';
import { SearchableSelect } from '../components/common/SearchableSelect.js';

interface AuthSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const ProfileSettings: React.FC = () => {
  const { user, token, login } = useAuthStore();

  // Primary Account / Personal Information
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'Mumbai');
  const [state, setState] = useState(user?.state || 'Maharashtra');
  const [favSport, setFavSport] = useState(user?.favoriteSport || 'Cricket');

  // Cricket Profile State
  const [cricketRole, setCricketRole] = useState(user?.cricketProfile?.playingRole || 'Batsman');
  const [iplTeam, setIplTeam] = useState(user?.cricketProfile?.favoriteIplTeam || 'Mumbai Indians');
  const [cricketPlayer, setCricketPlayer] = useState(user?.cricketProfile?.favoritePlayer || '');
  const [battingStyle, setBattingStyle] = useState(user?.cricketProfile?.battingStyle || 'Right-Handed');
  const [bowlingStyle, setBowlingStyle] = useState(user?.cricketProfile?.bowlingStyle || 'Right-Arm Medium');

  // Football Profile State
  const [footballPosition, setFootballPosition] = useState(user?.footballProfile?.position || 'Forward');
  const [footballClub, setFootballClub] = useState(user?.footballProfile?.favoriteClub || 'Real Madrid');
  const [footballPlayer, setFootballPlayer] = useState(user?.footballProfile?.favoritePlayer || '');
  const [preferredFoot, setPreferredFoot] = useState(user?.footballProfile?.preferredFoot || 'Right');

  // Feedback states
  const [personalSuccessMsg, setPersonalSuccessMsg] = useState('');
  const [personalErrorMsg, setPersonalErrorMsg] = useState('');
  const [personalSaving, setPersonalSaving] = useState(false);

  const [sportsSuccessMsg, setSportsSuccessMsg] = useState('');
  const [sportsErrorMsg, setSportsErrorMsg] = useState('');
  const [sportsSaving, setSportsSaving] = useState(false);

  // Device list
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Fetch full profile from API on mount to ensure fresh state
  const loadFreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const freshUser = res.data?.data?.user;
      if (freshUser) {
        if (freshUser.firstName) setFirstName(freshUser.firstName);
        if (freshUser.lastName) setLastName(freshUser.lastName);
        if (freshUser.phone) setPhone(freshUser.phone);
        if (freshUser.city) setCity(freshUser.city);
        if (freshUser.state) setState(freshUser.state);
        if (freshUser.favoriteSport) setFavSport(freshUser.favoriteSport);

        if (freshUser.cricketProfile) {
          if (freshUser.cricketProfile.playingRole) setCricketRole(freshUser.cricketProfile.playingRole);
          if (freshUser.cricketProfile.favoriteIplTeam) setIplTeam(freshUser.cricketProfile.favoriteIplTeam);
          if (freshUser.cricketProfile.favoritePlayer) setCricketPlayer(freshUser.cricketProfile.favoritePlayer);
          if (freshUser.cricketProfile.battingStyle) setBattingStyle(freshUser.cricketProfile.battingStyle);
          if (freshUser.cricketProfile.bowlingStyle) setBowlingStyle(freshUser.cricketProfile.bowlingStyle);
        }

        if (freshUser.footballProfile) {
          if (freshUser.footballProfile.position) setFootballPosition(freshUser.footballProfile.position);
          if (freshUser.footballProfile.favoriteClub) setFootballClub(freshUser.footballProfile.favoriteClub);
          if (freshUser.footballProfile.favoritePlayer) setFootballPlayer(freshUser.footballProfile.favoritePlayer);
          if (freshUser.footballProfile.preferredFoot) setPreferredFoot(freshUser.footballProfile.preferredFoot);
        }

        if (token) {
          login(freshUser, token);
        }
      }
    } catch (err) {
      console.error('Failed to load fresh profile:', err);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data?.data?.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadFreshProfile();
    fetchSessions();
  }, []);

  // Save Primary Personal Information
  const handlePersonalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalSuccessMsg('');
    setPersonalErrorMsg('');
    setPersonalSaving(true);

    try {
      const res = await api.patch('/auth/profile', {
        firstName,
        lastName,
        phone,
        city,
        state,
        favoriteSport: favSport,
      });

      const updatedUser = res.data?.data?.user;
      if (updatedUser && token) {
        login(updatedUser, token);
      }
      setPersonalSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      console.error(err);
      setPersonalErrorMsg(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setPersonalSaving(false);
    }
  };

  // Save Sports Profile
  const handleSportsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSportsSuccessMsg('');
    setSportsErrorMsg('');
    setSportsSaving(true);

    try {
      const payload: Record<string, any> = {
        favoriteSport: favSport,
      };

      if (favSport === 'Cricket') {
        payload.cricketProfile = {
          playingRole: cricketRole,
          favoriteIplTeam: iplTeam,
          favoritePlayer: cricketPlayer,
          battingStyle: battingStyle,
          bowlingStyle: bowlingStyle,
        };
      } else if (favSport === 'Football') {
        payload.footballProfile = {
          position: footballPosition,
          favoriteClub: footballClub,
          favoritePlayer: footballPlayer,
          preferredFoot: preferredFoot,
        };
      }

      const res = await api.patch('/users/profile/sports', payload);
      const updatedUser = res.data?.data?.user;
      if (updatedUser && token) {
        login(updatedUser, token);
      }
      setSportsSuccessMsg('Sports profile updated successfully.');
    } catch (err: any) {
      console.error(err);
      setSportsErrorMsg(err.response?.data?.message || 'Failed to update sports profile.');
    } finally {
      setSportsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to terminate all other active login sessions?')) return;
    try {
      await api.post('/auth/logout-all');
      alert('Successfully terminated sessions from all other devices!');
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert('Failed to terminate other sessions.');
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050508] text-white text-left font-poppins relative">
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 z-10 relative space-y-8">
        <div>
          <h1 className="font-poppins font-black text-3xl uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-400">
            Account Settings
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Configure your personal credentials, contact endpoints, and multi-device sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Left Column (Personal Information + Sports Profile directly below) */}
          <div className="md:col-span-7 space-y-8">
            
            {/* 1. PRIMARY ACCOUNT / PERSONAL INFORMATION SECTION */}
            <div className="bg-[#09090F]/70 border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider">
                  Personal Information
                </h3>
              </div>

              {personalSuccessMsg && (
                <div className="bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <span>✓</span>
                  <span>{personalSuccessMsg}</span>
                </div>
              )}

              {personalErrorMsg && (
                <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-2xl text-xs font-semibold">
                  {personalErrorMsg}
                </div>
              )}

              <form onSubmit={handlePersonalSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                    <input
                      required
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                    <input
                      required
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Favorite Sport</label>
                    <select
                      value={favSport}
                      onChange={(e) => setFavSport(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="Cricket">Cricket</option>
                      <option value="Football">Football</option>
                      <option value="Badminton">Badminton</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={personalSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {personalSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>

            {/* 2. NEW SPORTS PROFILE SECTION (Directly Below Personal Information) */}
            <div className="bg-[#09090F]/70 border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="border-b border-white/5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">
                      {favSport === 'Football' ? '⚽' : favSport === 'Cricket' ? '🏏' : '🏆'}
                    </span>
                    <div>
                      <h2 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider">
                        Sports Profile
                      </h2>
                      <p className="text-gray-400 text-[11px] font-light mt-0.5">
                        Tell us how you play and what you follow.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                    {favSport}
                  </span>
                </div>
              </div>

              {sportsSuccessMsg && (
                <div className="bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <span>✓</span>
                  <span>{sportsSuccessMsg}</span>
                </div>
              )}

              {sportsErrorMsg && (
                <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-2xl text-xs font-semibold">
                  {sportsErrorMsg}
                </div>
              )}

              {/* CRICKET PROFILE */}
              {favSport === 'Cricket' && (
                <form onSubmit={handleSportsSave} className="space-y-4 text-xs">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <span>🏏</span>
                    <span>Cricket Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Playing Role */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Playing Role</label>
                      <select
                        value={cricketRole}
                        onChange={(e) => setCricketRole(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        {CRICKET_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Favorite IPL Team */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Favorite IPL Team</label>
                      <select
                        value={iplTeam}
                        onChange={(e) => setIplTeam(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        {IPL_TEAMS.map((team) => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3. Favorite Cricket Player (Searchable / Selectable) */}
                  <SearchableSelect
                    id="favoriteCricketPlayer"
                    label="Favorite Cricket Player"
                    value={cricketPlayer}
                    onChange={setCricketPlayer}
                    options={CRICKET_PLAYERS}
                    placeholder="Search or enter favorite player (e.g. Virat Kohli)..."
                    helperText="Select from top Indian & international stars or enter custom player"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 4. Batting Style */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Batting Style</label>
                      <select
                        value={battingStyle}
                        onChange={(e) => setBattingStyle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        {BATTING_STYLES.map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>

                    {/* 5. Bowling Style */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bowling Style</label>
                      <select
                        value={bowlingStyle}
                        onChange={(e) => setBowlingStyle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        {BOWLING_STYLES.map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={sportsSaving}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      {sportsSaving ? 'Saving...' : 'Save Sports Profile'}
                    </button>

                    <span className="text-[10px] text-gray-500">
                      Changes persist across sport switches
                    </span>
                  </div>
                </form>
              )}

              {/* FOOTBALL PROFILE */}
              {favSport === 'Football' && (
                <form onSubmit={handleSportsSave} className="space-y-4 text-xs">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <span>⚽</span>
                    <span>Football Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Playing Position */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Playing Position</label>
                      <select
                        value={footballPosition}
                        onChange={(e) => setFootballPosition(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        {FOOTBALL_POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Preferred Foot */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Preferred Foot</label>
                      <select
                        value={preferredFoot}
                        onChange={(e) => setPreferredFoot(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        {PREFERRED_FEET.map((foot) => (
                          <option key={foot} value={foot}>{foot}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2. Favorite Football Club (Searchable / Selectable) */}
                  <SearchableSelect
                    id="favoriteFootballClub"
                    label="Favorite Football Club"
                    value={footballClub}
                    onChange={setFootballClub}
                    options={FOOTBALL_CLUBS}
                    placeholder="Search or enter club (e.g. Real Madrid, Mohun Bagan SG)..."
                    helperText="Includes popular Indian (ISL) & major European clubs"
                  />

                  {/* 3. Favorite Football Player (Searchable / Selectable) */}
                  <SearchableSelect
                    id="favoriteFootballPlayer"
                    label="Favorite Football Player"
                    value={footballPlayer}
                    onChange={setFootballPlayer}
                    options={FOOTBALL_PLAYERS}
                    placeholder="Search or enter favorite player (e.g. Sunil Chhetri, Lionel Messi)..."
                    helperText="Includes top Indian national stars & international icons"
                  />

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={sportsSaving}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      {sportsSaving ? 'Saving...' : 'Save Sports Profile'}
                    </button>

                    <span className="text-[10px] text-gray-500">
                      Changes persist across sport switches
                    </span>
                  </div>
                </form>
              )}

              {/* OTHER SPORTS (Future Extensibility) */}
              {favSport !== 'Cricket' && favSport !== 'Football' && (
                <div className="py-8 px-4 text-center space-y-2 bg-black/30 rounded-2xl border border-white/5">
                  <span className="text-3xl">🏸</span>
                  <p className="text-sm font-bold text-white">{favSport} Profile Coming Soon</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Select <strong>Cricket</strong> or <strong>Football</strong> in Favorite Sport above to customize your player profile.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Profile Persona Summary & Session Security */}
          <div className="md:col-span-5 space-y-8">
            
            {/* SPORTS PROFILE SUMMARY CARD */}
            <div className="bg-[#09090F]/70 border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider">
                  Player Persona
                </h3>
                <span className="text-[9px] uppercase tracking-widest text-[#FF9933] font-bold">
                  Live Summary
                </span>
              </div>

              {favSport === 'Cricket' ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-black/40 to-black/60 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🏏</span>
                    <div>
                      <h4 className="font-bold text-sm text-white">{cricketRole || 'Batsman'}</h4>
                      <p className="text-[11px] text-indigo-300">{iplTeam || 'IPL Team Not Set'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Favorite Player</span>
                      <span className="text-white font-medium truncate max-w-[140px]">{cricketPlayer || 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Batting Style</span>
                      <span className="text-white font-medium">{battingStyle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bowling Style</span>
                      <span className="text-white font-medium">{bowlingStyle}</span>
                    </div>
                  </div>
                </div>
              ) : favSport === 'Football' ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-black/40 to-black/60 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">⚽</span>
                    <div>
                      <h4 className="font-bold text-sm text-white">{footballPosition || 'Forward'}</h4>
                      <p className="text-[11px] text-emerald-300">{footballClub || 'Club Not Set'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Favorite Player</span>
                      <span className="text-white font-medium truncate max-w-[140px]">{footballPlayer || 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Preferred Foot</span>
                      <span className="text-white font-medium">{preferredFoot}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center text-xs text-gray-500">
                  Select Cricket or Football to preview your player card.
                </div>
              )}
            </div>

            {/* SESSION SECURITY PANEL (Preserved Exactly) */}
            <div className="bg-[#09090F]/70 border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider">
                  Session Security
                </h3>
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  className="text-[9px] text-[#FF9933] hover:underline font-bold uppercase tracking-wider cursor-pointer"
                >
                  Logout Others
                </button>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed font-light">
                Review active JWT session tokens registered to your account. Wiping others rotates security keys.
              </p>

              <div className="space-y-3 pt-2">
                {sessionsLoading ? (
                  <p className="text-xs text-indigo-400">Loading session logs...</p>
                ) : sessions.length === 0 ? (
                  <p className="text-xs text-gray-500">No other devices active.</p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between text-[10px]"
                    >
                      <div>
                        <p className="font-bold text-white uppercase tracking-wider">Device Log</p>
                        <p
                          className="text-[9px] text-gray-400 mt-0.5 max-w-[180px] truncate"
                          title={s.userAgent || 'Unknown browser'}
                        >
                          {s.userAgent || 'Chrome / Windows'}
                        </p>
                        <p className="text-[8px] text-gray-500 mt-0.5">IP: {s.ipAddress || '127.0.0.1'}</p>
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
