import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { GroundDTO, SlotDTO, ReviewDTO, formatCurrency } from '@be11/shared';

export const VenueDetail: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const { isAuthenticated, user, updateWalletBalance } = useAuthStore();

  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(initialDate);
  const [ground, setGround] = useState<GroundDTO | null>(null);
  const [slots, setSlots] = useState<SlotDTO[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotDTO | null>(null);

  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [groundRes, slotsRes, reviewsRes] = await Promise.all([
        api.get(`/grounds/${id}`),
        api.get(`/grounds/${id}/slots`, { params: { date } }),
        api.get(`/reviews/ground/${id}`),
      ]);

      setGround(groundRes.data.data.ground);
      setSlots(slotsRes.data.data.slots);
      setReviews(reviewsRes.data.data.reviews);
      setSelectedSlot(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id, date]);

  const handleBookSlot = async () => {
    if (!isAuthenticated) {
      setError('Please log in from the top account dropdown first.');
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available slot.');
      return;
    }

    setBookingLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/bookings', {
        groundId: id,
        date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      setSuccess('Booking successfully confirmed!');
      // Update wallet balance locally
      if (user) {
        updateWalletBalance(user.walletBalance - selectedSlot.price);
      }
      // Reload slots
      fetchDetails();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Booking process failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please log in to leave a review.');
      return;
    }

    try {
      await api.post('/reviews', {
        groundId: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewComment('');
      // Reload reviews and ratings
      fetchDetails();
    } catch (err: any) {
      console.error(err);
      setError('Failed to post review.');
    }
  };

  if (loading && !ground) {
    return <div className="pt-24 text-center">Loading venue details...</div>;
  }

  if (!ground) {
    return <div className="pt-24 text-center">Venue not found.</div>;
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-surface-container-low text-left">
      <div className="max-w-7xl mx-auto px-container-padding">
        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-semibold mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-on-tertiary-container/10 text-on-tertiary-container p-4 rounded-xl text-sm font-semibold mb-6">
            {success}
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-24 overflow-hidden shadow-sm">
              <img
                className="w-full h-96 object-cover"
                alt={ground.name}
                src={ground.images[0]}
              />
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="font-poppins font-bold text-3xl text-primary">{ground.name}</h1>
                    <p className="text-on-surface-variant flex items-center gap-1 mt-2 text-sm">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {ground.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F8FAFC] px-4 py-2 rounded-full border border-outline-variant/30">
                    <span
                      className="material-symbols-outlined text-secondary-container"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                    <span className="font-bold text-primary text-lg">{ground.rating || 'N/A'}</span>
                  </div>
                </div>

                <h3 className="font-poppins font-bold text-lg text-primary mb-2">Description</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm mb-6">
                  {ground.description}
                </p>

                <h3 className="font-poppins font-bold text-lg text-primary mb-2">Amenities</h3>
                <div className="flex gap-2 flex-wrap mb-4">
                  {ground.amenities.map((am) => (
                    <span
                      key={am}
                      className="bg-[#EDF2F7] px-4 py-2 rounded-xl text-primary font-semibold text-xs"
                    >
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-24 p-8 shadow-sm">
              <h3 className="font-poppins font-bold text-xl text-primary mb-6">User Reviews</h3>

              {isAuthenticated && (
                <form onSubmit={handleReviewSubmit} className="mb-8 p-4 bg-[#F8FAFC] rounded-xl space-y-4">
                  <h4 className="font-poppins font-semibold text-sm text-primary">Write a Review</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Rating:</span>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="bg-white border rounded-lg px-2 py-1 focus:ring-primary focus:border-primary text-sm font-semibold"
                    >
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience playing here..."
                    className="w-full bg-white rounded-lg p-3 border focus:ring-primary focus:border-primary text-sm font-body-md"
                  ></textarea>
                  <button
                    type="submit"
                    className="bg-[#0A2E6E] text-white px-6 py-2 rounded-xl font-label-bold text-xs btn-primary-premium shadow-md cursor-pointer"
                  >
                    Submit Review
                  </button>
                </form>
              )}

              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">No reviews yet for this venue.</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-[#E5E7EB] pb-6 last:border-none last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-primary text-sm">{rev.userName}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined text-secondary-container text-sm"
                              style={{ fontVariationSettings: '"FILL" 1' }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-on-surface-variant text-sm mt-1">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-24 p-8 shadow-sm border border-outline-variant/30 sticky top-24">
              <h3 className="font-poppins font-bold text-xl text-primary mb-4">Book Your Slot</h3>

              <div className="mb-4">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Choose Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md"
                />
              </div>

              <div className="mb-6">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-3">
                  Available Slots
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {slots.map((s) => (
                    <button
                      key={s.startTime}
                      disabled={!s.isAvailable}
                      onClick={() => setSelectedSlot(s)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        !s.isAvailable
                          ? 'bg-[#EDF2F7] text-on-surface-variant/40 border-transparent cursor-not-allowed'
                          : selectedSlot?.startTime === s.startTime
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-white text-primary border-outline-variant hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {s.startTime} - {s.endTime}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSlot && (
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-outline-variant/30 mb-6 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Selected Slot:</span>
                    <span className="font-bold text-primary">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Rate:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(selectedSlot.price)}/hr
                    </span>
                  </div>
                  <div className="h-[1px] bg-[#E5E7EB] w-full"></div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-primary">Total Price:</span>
                    <span className="font-bold text-on-tertiary-container">
                      {formatCurrency(selectedSlot.price)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBookSlot}
                disabled={bookingLoading || !selectedSlot}
                className="w-full py-4 rounded-xl bg-secondary-container hover:bg-[#e07f24] text-white font-label-bold btn-primary-premium shadow-lg cursor-pointer disabled:bg-outline/20 disabled:cursor-not-allowed"
              >
                {bookingLoading ? 'Processing...' : 'Confirm & Pay'}
              </button>

              <p className="text-[10px] text-outline text-center mt-3 leading-relaxed">
                Payments are securely deducted from your preloaded be11 wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
