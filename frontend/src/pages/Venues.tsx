import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useLocationStore } from '../store/locationStore.js';
import { GroundDTO } from '@be11/shared';

export const Venues: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedCity, setCity } = useLocationStore();

  // URL state
  const initialSport = searchParams.get('sport') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [sport, setSport] = useState(initialSport);
  const [search, setSearch] = useState(initialSearch);
  const [date] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [grounds, setGrounds] = useState<GroundDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mapInstanceRef = useRef<any>(null);

  // Sync URL city with state store
  const urlCity = searchParams.get('city');
  useEffect(() => {
    if (urlCity && urlCity !== selectedCity) {
      setCity(urlCity);
    }
  }, [urlCity, selectedCity, setCity]);

  const fetchGrounds = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (sport !== 'All') params.sport = sport;
      if (selectedCity) params.city = selectedCity;
      if (search) params.search = search;

      const res = await api.get('/grounds', { params });
      setGrounds(res.data.data.grounds);
    } catch (err: any) {
      console.error(err);
      setError('Failed to retrieve venues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrounds();
  }, [sport, selectedCity, searchParams]);

  // Leaflet Map initialization
  useEffect(() => {
    if (viewMode !== 'map' || grounds.length === 0) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    // Clean old instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const centerLat = grounds[0]?.latitude || 19.0760;
    const centerLng = grounds[0]?.longitude || 72.8777;

    const map = L.map('map-container').setView([centerLat, centerLng], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    grounds.forEach((g) => {
      if (!g.latitude || !g.longitude) return;

      const popupHtml = `
        <div style="font-family: 'Poppins', sans-serif; min-width: 200px; padding: 4px;">
          <h4 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0; color: #0A2E6E;">${g.name}</h4>
          <p style="font-size: 11px; color: #64748B; margin: 0 0 8px 0; display: flex; align-items: center; gap: 2px;">
            📍 ${g.location}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 10px; font-weight: bold;">
            <span style="color: #e07f24;">₹${g.pricePerHour}/hr</span>
            <span style="color: #f59e0b; display: flex; align-items: center; gap: 2px;">⭐ ${g.rating || 'N/A'}</span>
          </div>
          <a href="/venues/${g.id}?date=${date}" style="display: block; text-align: center; text-decoration: none; background: #0A2E6E; color: white; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Book Turf Now
          </a>
        </div>
      `;

      L.marker([g.latitude, g.longitude]).addTo(map).bindPopup(popupHtml);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, grounds, date]);

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ sport, city: selectedCity, search });
  };

  return (
    <div className="pt-24 min-h-screen bg-surface-container-low pb-16">
      <div className="max-w-7xl mx-auto px-container-padding">
        {/* Search header filter panel */}
        <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 mb-8 text-left">
          <h2 className="font-poppins font-bold text-xl text-primary mb-4">Find Sports Fields</h2>
          <form onSubmit={handleApplySearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                Where (City)
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md appearance-none"
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Pune">Pune</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Ranchi">Ranchi</option>
                <option value="Deoghar">Deoghar</option>
                <option value="Dhanbad">Dhanbad</option>
                <option value="Patna">Patna</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Jaipur">Jaipur</option>
                <option value="Indore">Indore</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                Sport Type
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md appearance-none"
              >
                <option value="All">All Sports</option>
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                Keywords / Name
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md"
                placeholder="Arena, Turf..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-secondary-container hover:bg-[#e07f24] text-white py-3 rounded-xl font-label-bold btn-primary-premium shadow-md flex justify-center items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-white">search</span>
              Filter Venues
            </button>
          </form>
        </div>

        {/* Results grid header & View Toggle */}
        <div className="flex justify-between items-center mb-6 text-left">
          <h3 className="font-poppins font-bold text-lg text-primary">
            {loading ? 'Searching...' : `${grounds.length} venues found`}
          </h3>

          <div className="flex bg-[#EDF2F7] p-1 rounded-xl border border-outline-variant/30">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">map</span>
              Map View
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-semibold mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-24 h-[420px] animate-pulse">
                <div className="h-60 bg-gray-200 rounded-t-24"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <div
            id="map-container"
            className="w-full h-[550px] bg-white rounded-24 shadow-sm border border-outline-variant/30 overflow-hidden relative"
            style={{ zIndex: 1 }}
          ></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {grounds.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-24 overflow-hidden shadow-sm premium-card group cursor-pointer"
                onClick={() => navigate(`/venues/${g.id}?date=${date}`)}
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt={g.name}
                    src={
                      g.images[0] ||
                      'https://images.unsplash.com/photo-1540747737956-37872f84a62f?auto=format&fit=crop&w=600&q=80'
                    }
                  />
                  <div className="absolute top-4 right-4 glass-panel px-3 py-1.5 rounded-full flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-secondary-container"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                    <span className="text-label-bold text-primary">{g.rating || 'N/A'}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-primary text-xl font-bold">{g.name}</h3>
                    <span className="text-on-tertiary-container font-label-bold font-bold">
                      ₹{g.pricePerHour}/hr
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-label-sm flex items-center gap-1 mb-4 text-xs">
                    <span className="material-symbols-outlined text-sm">location_on</span>{' '}
                    {g.location}
                  </p>
                  <div className="flex gap-2 flex-wrap mb-6">
                    {g.amenities.map((am) => (
                      <span
                        key={am}
                        className="bg-surface-container px-3 py-1 rounded-full text-label-sm text-outline text-xs"
                      >
                        {am}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/venues/${g.id}?date=${date}`);
                    }}
                    className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-bold btn-primary-premium cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
