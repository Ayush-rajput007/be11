import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { formatCurrency } from '@be11/shared';

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface Camp {
  id: string;
  name: string;
  sport: string;
  startDate: string;
  fee: number;
  timings: string;
}

interface CoachReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  studentName: string;
}

interface CoachDetails {
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
  academyName?: string;
  academy?: { name: string; city: string };
  avgRating: number;
  reviews: CoachReview[];
  camps: Camp[];
  availabilities: AvailabilitySlot[];
}

export const CoachProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, updateWalletBalance } = useAuthStore();

  const [coach, setCoach] = useState<CoachDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'profile' or 'book'
  const initialTab = searchParams.get('tab') === 'book' ? 'book' : 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'book'>(initialTab);

  // Booking details states
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchCoachDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/coaches/${id}`);
      setCoach(res.data.data.coach);
    } catch (err) {
      console.error('Error fetching coach details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachDetails();
  }, [id]);

  const handleBookSession = async () => {
    if (!isAuthenticated) {
      alert('Please log in first to book a slot.');
      return;
    }
    if (!coach || !selectedSlot) return;

    if (user && user.walletBalance < coach.hourlyRate) {
      alert(`Insufficient balance. Session fee is ${formatCurrency(coach.hourlyRate)}, but your wallet balance is ${formatCurrency(user.walletBalance)}.`);
      return;
    }

    // Determine slot date: for simplicity, book the next upcoming dayOfWeek
    const getNextDateForDayOfWeek = (dayOfWeek: number): string => {
      const today = new Date();
      const resultDate = new Date(today.getTime());
      const currentDay = today.getDay();
      let steps = dayOfWeek - currentDay;
      if (steps <= 0) {
        steps += 7; // next week
      }
      resultDate.setDate(today.getDate() + steps);
      return resultDate.toISOString().split('T')[0];
    };

    const targetDate = getNextDateForDayOfWeek(selectedSlot.dayOfWeek);

    setBookingLoading(true);
    try {
      await api.post(`/coaches/${coach.id}/book`, {
        date: targetDate,
        time: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
        availabilityId: selectedSlot.id,
      });

      // Update wallet balance locally
      if (user) {
        updateWalletBalance(user.walletBalance - coach.hourlyRate);
      }

      setBookingSuccess(true);
      fetchCoachDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to book slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || '';
  };

  if (loading) {
    return <div className="pt-24 text-center text-outline text-xs py-16">Loading profile...</div>;
  }

  if (!coach) {
    return (
      <div className="pt-24 text-center py-16 max-w-sm mx-auto">
        <h3 className="font-bold text-primary">Profile Not Found</h3>
        <button onClick={() => navigate('/coaches')} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-surface-container-low pb-16 text-left font-body-md">
      {/* Banner */}
      <div className="bg-[#001a49] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540747737956-37872404a821?auto=format&fit=crop&w=1200&q=80')" }}></div>
        <div className="max-w-7xl mx-auto px-container-padding relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
          <img
            src={coach.gallery[0] || 'https://images.unsplash.com/photo-1544045560-723f63933a3e?auto=format&fit=crop&w=200&q=80'}
            alt={coach.name}
            className="w-28 h-28 rounded-2xl object-cover border-2 border-white/20 bg-gray-50 flex-shrink-0"
          />
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
              <h1 className="font-poppins font-black text-2xl md:text-3xl tracking-tight">{coach.name}</h1>
              <span className="material-symbols-outlined text-secondary text-xl">verified</span>
            </div>
            <p className="text-[#FF9933] font-bold text-xs">{coach.academyName || 'Independent Sports Coach'}</p>
            <div className="flex justify-center md:justify-start items-center gap-1.5 text-xs text-white/70">
              <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
              <span className="font-bold text-white">{coach.avgRating.toFixed(1)}</span>
              <span>({coach.reviews.length} reviews)</span>
              <span className="mx-2">•</span>
              <span>{coach.experienceYears} Years Exp</span>
              <span className="mx-2">•</span>
              <span>{coach.city}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-container-padding mt-8">
        {/* Tab triggers */}
        <div className="flex border-b border-outline-variant/30 mb-8 gap-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 cursor-pointer transition-all border-b-2 ${
              activeTab === 'profile' ? 'border-secondary text-primary' : 'border-transparent text-outline'
            }`}
          >
            Coach Achievements &amp; Bio
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`pb-3 cursor-pointer transition-all border-b-2 ${
              activeTab === 'book' ? 'border-secondary text-primary' : 'border-transparent text-outline'
            }`}
          >
            Book Private Session
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Tab 1: Profile View */}
          {activeTab === 'profile' ? (
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm space-y-3">
                <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">About the Coach</h3>
                <p className="text-outline text-xs leading-relaxed">{coach.about}</p>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm space-y-3">
                <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">Coaching Accomplishments</h3>
                <ul className="space-y-2 text-xs">
                  {coach.achievements.map((ach, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <span className="material-symbols-outlined text-secondary text-lg">emoji_events</span>
                      <span className="text-primary font-semibold">{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Training Style */}
              <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm space-y-2">
                <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">Philosophy &amp; Training Style</h3>
                <p className="text-outline text-xs leading-relaxed">{coach.trainingStyle}</p>
              </div>

              {/* Dynamic Video Showcase */}
              {coach.videos.length > 0 && (
                <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm space-y-3">
                  <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">Training Drills Preview</h3>
                  <video controls className="w-full h-56 rounded-xl object-cover bg-black" src={coach.videos[0]}></video>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm space-y-6">
                <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">Student Reviews</h3>
                {coach.reviews.length === 0 ? (
                  <p className="text-outline text-xs">No student feedback logs submitted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {coach.reviews.map((rev) => (
                      <div key={rev.id} className="border-b pb-4 last:border-b-0 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-primary">{rev.studentName}</span>
                          <span className="text-outline">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-xs text-yellow-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-sm">star</span>
                          ))}
                        </div>
                        <p className="text-outline text-xs leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Booking Calendar view */
            <div className="lg:col-span-2 bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm space-y-6">
              <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">Availability Calendar</h3>
              <p className="text-outline text-xs">Select one of Coach’s open times slots to book a private session. Select next upcoming date is scheduled automatically.</p>

              {coach.availabilities.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-outline text-xs">
                  Coach does not have any open availability slots right now. Check back soon.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coach.availabilities.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm flex justify-between items-center ${
                        selectedSlot?.id === slot.id ? 'border-secondary bg-secondary/5' : 'border-outline-variant/30 hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-outline block">{getDayName(slot.dayOfWeek)}</span>
                        <span className="font-poppins font-bold text-sm text-primary">{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <span className="material-symbols-outlined text-outline text-lg">event_available</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pricing & Camps side panel */}
          <div className="bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm h-fit space-y-6">
            <div>
              <span className="text-[9px] text-outline uppercase font-bold block mb-0.5">Session Rate</span>
              <h3 className="font-poppins font-black text-2xl text-[#138808]">
                {formatCurrency(coach.hourlyRate)}<span className="text-xs text-outline font-medium"> / hr</span>
              </h3>
              <p className="text-outline text-[11px] mt-1">One-to-one structured personal coaching drill.</p>
            </div>

            <button
              onClick={() => setActiveTab('book')}
              className="w-full py-3.5 bg-secondary-container hover:bg-[#e07f24] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer text-center block"
            >
              Book One-To-One
            </button>

            {coach.camps.length > 0 && (
              <div className="pt-6 border-t space-y-4">
                <h4 className="font-poppins font-bold text-xs text-primary uppercase tracking-wider">Coach’s Active Camps</h4>
                <div className="space-y-3">
                  {coach.camps.map((camp) => (
                    <div key={camp.id} className="border p-3 rounded-lg hover:bg-gray-50 cursor-pointer text-xs" onClick={() => navigate('/coaches#camps')}>
                      <h5 className="font-bold text-primary truncate">{camp.name}</h5>
                      <span className="text-[#138808] font-bold block mt-1">{formatCurrency(camp.fee)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Checkout dialog modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-24 max-w-md w-full p-8 text-left text-primary relative shadow-2xl">
            <button
              onClick={() => setSelectedSlot(null)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {!bookingSuccess ? (
              <div className="space-y-5">
                <h3 className="font-poppins font-bold text-lg text-primary border-b pb-2">Confirm Session Booking</h3>
                <div className="space-y-2 text-xs border bg-gray-50 p-4 rounded-xl">
                  <p><span className="text-outline font-semibold">Coach Profile:</span> {coach.name}</p>
                  <p><span className="text-outline font-semibold">Scheduled Day:</span> {getDayName(selectedSlot.dayOfWeek)}</p>
                  <p><span className="text-outline font-semibold">Timings:</span> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
                  <p><span className="text-outline font-semibold">Session Rate:</span> {formatCurrency(coach.hourlyRate)}</p>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-outline font-medium">Your Wallet Balance:</span>
                  <span className="text-primary font-bold">{formatCurrency(user?.walletBalance || 0)}</span>
                </div>

                <button
                  onClick={handleBookSession}
                  disabled={bookingLoading}
                  className="w-full py-3 bg-secondary-container hover:bg-[#e07f24] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer text-center"
                >
                  {bookingLoading ? 'Processing Booking...' : 'Pay & Book Session'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center py-4">
                <span className="material-symbols-outlined text-5xl text-[#138808]">check_circle</span>
                <h3 className="font-poppins font-bold text-lg text-primary">Session Scheduled!</h3>
                <p className="text-outline text-xs max-w-xs mx-auto">
                  Your private one-to-one coaching session is locked. Review schedule in your dashboard.
                </p>
                <button
                  onClick={() => {
                    setSelectedSlot(null);
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

export default CoachProfile;
