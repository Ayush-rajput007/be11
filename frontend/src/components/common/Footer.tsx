import React, { useState } from 'react';
import { Link } from 'react-router-dom';
export const Footer: React.FC = () => {

  // Modal State
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);

  // Newsletter State
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsError('');
    setSubscribed(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNewsError('Please enter a valid email address.');
      return;
    }

    setNewsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      setNewsError('Subscription failed. Please try again.');
    } finally {
      setNewsLoading(false);
    }
  };

  const openModal = (title: string, content: React.ReactNode) => {
    setModalTitle(title);
    setModalContent(content);
  };

  const closeModal = () => {
    setModalTitle('');
    setModalContent(null);
  };

  return (
    <footer className="w-full bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] border-t border-[#E5E7EB] text-[#111827] font-poppins relative">
      
      {/* 1. TOP CTA SECTION */}
      <section className="max-w-7xl mx-auto py-16 px-6 text-center border-b border-[#E5E7EB] space-y-6">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-[#102A56]">
          Ready to Elevate Your Game?
        </h2>
        <p className="text-[#6B7280] text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed">
          Book venues, find coaches, shop premium gear, and create custom jerseys.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            to="/venues"
            className="px-6 py-3 bg-[#FF8C1A] hover:bg-[#e07b16] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Book Venues
          </Link>
          <Link
            to="/coaches"
            className="px-6 py-3 bg-[#102A56] hover:bg-[#0c1f40] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Explore Coaches
          </Link>
          <Link
            to="/store"
            className="px-6 py-3 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#111827] rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            Shop Store
          </Link>
          <Link
            to="/jersey-builder"
            className="px-6 py-3 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#111827] rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            Create Jersey
          </Link>
        </div>
      </section>

      {/* 2. MAIN FOOTER (5 COLUMNS) */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 text-left">
        
        {/* Column 1: Brand Info */}
        <div className="space-y-6">
          <img
            alt="be11 Official Logo"
            className="h-[42px] w-auto object-contain"
            src="/be11_logo.png"
          />
          <p className="text-[#6B7280] text-[11px] leading-relaxed font-light">
            Premium sports venue bookings, professional academies, and customized sublimated squad merchandise.
          </p>
          <div className="flex gap-3">
            {['facebook', 'instagram', 'linkedin', 'twitter'].map((soc) => (
              <a
                key={soc}
                href={`https://${soc}.com`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#FF8C1A] hover:border-[#FF8C1A] transition-all transform hover:-translate-y-0.5"
                title={soc}
              >
                <span className="material-symbols-outlined text-sm">share</span>
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Play */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#102A56] uppercase tracking-wider">Play</h4>
          <ul className="space-y-2.5 text-[11px] text-[#6B7280] font-light">
            <li><Link to="/venues" className="hover:text-[#FF8C1A] transition-all">Venues</Link></li>
            <li><Link to="/live-matches" className="hover:text-[#FF8C1A] transition-all">Live Matches</Link></li>
            <li><Link to="/capture" className="hover:text-[#FF8C1A] transition-all flex items-center gap-1 font-semibold text-[#102A56]">BE11 Capture</Link></li>
            <li><Link to="/store" className="hover:text-[#FF8C1A] transition-all">Store</Link></li>
            <li><Link to="/jersey-builder" className="hover:text-[#FF8C1A] transition-all">Jersey Builder</Link></li>
            <li><Link to="/kit-builder" className="hover:text-[#FF8C1A] transition-all">Kit Builder</Link></li>
            <li><Link to="/coaches" className="hover:text-[#FF8C1A] transition-all">Coaches</Link></li>
            <li><Link to="/venues" className="hover:text-[#FF8C1A] transition-all">Grounds</Link></li>
          </ul>
        </div>

        {/* Column 3: Business */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#102A56] uppercase tracking-wider">Business</h4>
          <ul className="space-y-2.5 text-[11px] text-[#6B7280] font-light">
            <li><Link to="/become-vendor" className="hover:text-[#FF8C1A] transition-all flex items-center gap-1 font-semibold text-[#102A56]">Become a Vendor</Link></li>
            <li><Link to="/tournaments" className="hover:text-[#FF8C1A] transition-all flex items-center gap-1 font-semibold text-[#102A56]">Tournament Hosting</Link></li>
            <li><Link to="/become-vendor" className="hover:text-[#FF8C1A] transition-all">Academies Program</Link></li>
            <li><Link to="/become-vendor" className="hover:text-[#FF8C1A] transition-all">Partner Program</Link></li>
            <li><Link to="/coaches" className="hover:text-[#FF8C1A] transition-all">Coach Registration</Link></li>
            <li><Link to="/tournaments" className="hover:text-[#FF8C1A] transition-all">Corporate Sports</Link></li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#102A56] uppercase tracking-wider">Support</h4>
          <ul className="space-y-2.5 text-[11px] text-[#6B7280] font-light">
            <li>
              <button
                type="button"
                onClick={() => openModal('FAQs', <div className="space-y-2">Please browse support categories or submit your booking queries to support@be11.com.</div>)}
                className="hover:text-[#FF8C1A] transition-all text-left cursor-pointer"
              >
                FAQs
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openModal('Privacy Policy', <div className="space-y-2">Your credentials remain encrypted. We gather data solely to confirm ground slots booking.</div>)}
                className="hover:text-[#FF8C1A] transition-all text-left cursor-pointer"
              >
                Privacy
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openModal('Terms & Conditions', <div className="space-y-2">By registering, you comply with local arena guidelines and safety rules.</div>)}
                className="hover:text-[#FF8C1A] transition-all text-left cursor-pointer"
              >
                Terms
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openModal('Refund Policy', <div className="space-y-2">Prepaid slots canceled 4+ hours early yield full refunds in wallet accounts.</div>)}
                className="hover:text-[#FF8C1A] transition-all text-left cursor-pointer"
              >
                Refund Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openModal('Shipping Policy', <div className="space-y-2">Custom jersey configuration orders are customized and shipped within 7 business days.</div>)}
                className="hover:text-[#FF8C1A] transition-all text-left cursor-pointer"
              >
                Shipping Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openModal('Contact Support', <div className="space-y-2">Reach us 24x7. Phone: 1800-be11-PLAY. email: help@be11.com.</div>)}
                className="hover:text-[#FF8C1A] transition-all text-left cursor-pointer"
              >
                Contact
              </button>
            </li>
          </ul>
        </div>

        {/* Column 5: Newsletter */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#102A56] uppercase tracking-wider">Newsletter</h4>
          <p className="text-[#6B7280] text-[11px] font-light leading-relaxed">
            Get early access to turf slots releases, match schedules, and active customizer promotions.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <input
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[#111827] placeholder:text-[#6B7280]/40 text-xs focus:outline-none focus:border-[#FF8C1A]/50"
              placeholder="Your email address"
              type="email"
            />
            {newsError && <p className="text-red-500 text-[9px] font-semibold">{newsError}</p>}
            {subscribed && <p className="text-emerald-600 text-[9px] font-semibold">Subscribed successfully!</p>}
            <button
              type="submit"
              disabled={newsLoading}
              className="w-full py-2.5 bg-[#FF8C1A] hover:bg-[#e07b16] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
            >
              {newsLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>

      </div>

      {/* 3. POPULAR SPORTS LIST (ONE LINE) */}
      <section className="max-w-7xl mx-auto px-6 py-6 border-t border-[#E5E7EB] text-left text-xs font-light text-[#6B7280]">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[9px] font-bold text-[#102A56] uppercase tracking-widest mr-2">Popular Sports</span>
          {['Cricket', 'Football', 'Badminton', 'Volleyball', 'Basketball', 'Tennis'].map((s, idx) => (
            <React.Fragment key={s}>
              {idx > 0 && <span className="text-gray-300 px-1">&bull;</span>}
              <Link to={`/live-matches?sport=${s.toLowerCase()}`} className="hover:text-[#FF8C1A] font-medium transition-all">
                {s}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* 4. LOWER FOOTER */}
      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-[#E5E7EB] flex flex-col md:flex-row justify-between items-center text-[10px] text-[#6B7280] gap-4">
        <div>© 2026 be11 Sports. All rights reserved.</div>
        <div className="flex items-center gap-1">Made with ❤️ in India</div>
        <div className="flex gap-4">
          <button type="button" onClick={() => openModal('Privacy Policy', <div>Privacy constraints are strictly enforced.</div>)} className="hover:text-[#FF8C1A]">Privacy</button>
          <button type="button" onClick={() => openModal('Terms & Conditions', <div>Complies with standard sports reservation terms.</div>)} className="hover:text-[#FF8C1A]">Terms</button>
          <button type="button" onClick={() => openModal('Cookies Policy', <div>Standard authentication and preferences cookies active.</div>)} className="hover:text-[#FF8C1A]">Cookies</button>
          <span>v1.2.0</span>
        </div>
      </div>

      {/* Modal Dialog Overlay */}
      {modalContent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-8 text-left text-[#111827] relative shadow-2xl animate-fade-in border border-[#E5E7EB]">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[#6B7280] hover:text-[#111827] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-poppins font-bold text-lg text-[#102A56] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              {modalTitle}
            </h3>
            <div className="text-[#6B7280] font-light text-xs leading-relaxed mb-6">
              {modalContent}
            </div>
            <button
              onClick={closeModal}
              className="bg-[#102A56] hover:bg-[#0c1f40] text-white px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </footer>
  );
};
