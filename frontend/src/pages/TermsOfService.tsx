import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, AlertTriangle, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  const lastUpdated = 'September 8, 2026';

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      {/* Hero / Header Section */}
      <div className="bg-gradient-to-br from-[#001a49] via-[#0a2e6e] to-[#102A56] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-[#0a2e6e]/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-300 font-medium">Legal Documents</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-[#FF8C1A]/20 border border-[#FF8C1A]/40 rounded-2xl">
              <FileText className="w-7 h-7 text-[#FF8C1A]" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-poppins tracking-tight text-white">
              Terms of Service
            </h1>
          </div>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-light leading-relaxed">
            Please read these Terms of Service carefully before reserving sports facilities or using any features on the BE11 sports platform.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>Effective Date: September 2026</span>
            <span>•</span>
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Official Terms
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#E5E7EB] space-y-10">
          
          {/* Section 1: Acceptance of Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">1</span>
              Acceptance of Terms
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) and BE11 Sports (&ldquo;BE11&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing our website (<a href="https://be11.in" className="text-[#FF8C1A] font-medium hover:underline">https://be11.in</a>), creating an account, or requesting sports ground bookings, you agree to comply with and be bound by these Terms and our <Link to="/privacy" className="text-[#FF8C1A] font-medium hover:underline">Privacy Policy</Link>.
            </p>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              If you do not agree with any part of these Terms, you must not use our website or booking services.
            </p>
          </section>

          {/* Section 2: Eligibility */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">2</span>
              Eligibility
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              You must be at least 18 years of age, or the legal age of majority in your jurisdiction, to create an account and place ground reservations independently. Minors may use venue facilities only under the supervision and responsibility of a parent or legal guardian who accepts these Terms on their behalf.
            </p>
          </section>

          {/* Section 3: User Accounts & Authentication */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">3</span>
              User Accounts &amp; Security
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              When creating an account with BE11—either via verified email address or Google Sign-In—you agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#444650] pl-2">
              <li>Provide accurate, current, and complete personal details (name, email, mobile number).</li>
              <li>Maintain the confidentiality and security of your login credentials.</li>
              <li>Promptly notify BE11 of any unauthorized use or security compromise of your account.</li>
              <li>Accept responsibility for all actions and reservation requests made under your account credentials.</li>
            </ul>
          </section>

          {/* Section 4: Sports Ground & Venue Bookings */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">4</span>
              Venue Bookings &amp; Real-Time Availability
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              BE11 enables users to discover official sports facilities (such as cricket grounds, multi-sport turfs, and arenas) and check real-time slot availability. Each ground features designated operating hours, specific sport formats (e.g., standard matches, day/night matches), and dynamic slot pricing.
            </p>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              Availability is managed through synchronized scheduling to prevent overlapping reservations and double-bookings.
            </p>
          </section>

          {/* Section 5: Booking Requests & Admin Approval */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">5</span>
              Booking Requests &amp; Confirmation Process
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              When you submit a reservation for a selected date and time slot:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#444650] pl-2">
              <li>Your reservation request is logged in the BE11 booking management system.</li>
              <li>Depending on the specific venue&rsquo;s operational policy, bookings may be confirmed automatically or subject to confirmation by venue administrators.</li>
              <li>Once verified, your confirmed reservation appears in your &ldquo;My Bookings&rdquo; section with complete details and slot verification status.</li>
            </ul>
          </section>

          {/* Section 6: Pricing & Payment Handling */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">6</span>
              Pricing &amp; Payment Handling
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              All ground package rates and slot tariffs displayed on the BE11 platform are quoted in Indian Rupees (₹) and determined by official venue management.
            </p>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              In the current BE11 operational workflow, payment settlement (including advance booking confirmation or full payment upon ground arrival) is handled transparently in coordination with venue management and booking status verification. BE11 displays the exact calculated booking amount before you confirm your reservation.
            </p>
          </section>

          {/* Section 7: Cancellation, Rescheduling & Refunds */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">7</span>
              Cancellation &amp; Rescheduling Rules
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              We understand sports plans may need adjustments. Our cancellation policies are based on real-time operational requirements:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#444650] pl-2">
              <li><strong>Advance Notice:</strong> Cancellation requests must be submitted prior to the scheduled slot start time through your account dashboard or by contacting venue support.</li>
              <li><strong>Weather &amp; Safety Disruptions:</strong> In case of unplayable ground conditions caused by severe weather or ground maintenance, sessions may be rescheduled in coordination with venue administrators.</li>
              <li><strong>No-Shows:</strong> Failure to arrive for a confirmed reservation without prior cancellation may forfeit rescheduling privileges for that slot.</li>
            </ul>
          </section>

          {/* Section 8: User Conduct & Venue Safety */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">8</span>
              User Responsibilities &amp; Venue Rules
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              Users and their teams must conduct themselves with sportsmanship and respect facility rules:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#444650] pl-2">
              <li>Wear appropriate footwear and sports equipment specified by the venue (e.g. rubber turf studs or sports sneakers).</li>
              <li>Respect slot timings: vacate the pitch or court promptly at the conclusion of your reserved duration.</li>
              <li>Refrain from damaging pitch surfaces, perimeter nets, floodlights, or pavilion property. Any deliberate damage may result in facility liability.</li>
              <li>Possession of illegal substances, weapons, or aggressive behavior is strictly prohibited across all participating grounds.</li>
            </ul>
          </section>

          {/* Section 9: Sports Risk Disclaimer */}
          <section className="space-y-3 bg-amber-50/70 p-5 rounded-2xl border border-amber-200">
            <h2 className="text-base sm:text-lg font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Recreational Sports Safety &amp; Assumption of Risk
            </h2>
            <p className="text-[#444650] text-xs sm:text-sm leading-relaxed font-normal">
              Participating in outdoor and indoor sports activities entails inherent risks of physical exertion, athletic injury, and environmental conditions. Users participate voluntarily and assume full responsibility for their physical fitness, pre-existing health conditions, and personal safety during matches.
            </p>
          </section>

          {/* Section 10: Prohibited Use */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">10</span>
              Prohibited Activities
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              You agree not to engage in any of the following unauthorized activities:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#444650] pl-2">
              <li>Using automated scripts, bots, or scraping tools to reserve ground slots or extract platform pricing.</li>
              <li>Reselling, scalping, or commercially subletting reserved slots without prior written consent.</li>
              <li>Attempting to probe, scan, breach, or tamper with our server endpoints, database, or API infrastructure.</li>
              <li>Submitting fraudulent booking requests or misrepresenting identity during registration.</li>
            </ul>
          </section>

          {/* Section 11: Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">11</span>
              Intellectual Property
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              All branding, trade names, logos, user interfaces, website graphics, and underlying source code of BE11 are the exclusive intellectual property of BE11 Sports. You may not copy, reproduce, modify, or distribute any platform content without our explicit prior written authorization.
            </p>
          </section>

          {/* Section 12: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">12</span>
              Limitation of Liability
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              To the maximum extent permitted by applicable law, BE11 and its operators shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your access to or inability to access the platform, third-party facility conduct, weather delays, or personal injury occurring at participating venues.
            </p>
          </section>

          {/* Section 13: Changes to Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">13</span>
              Changes to the Service &amp; Terms
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              BE11 reserves the right to modify or replace these Terms at any time. Significant updates will be communicated through our website with the revised date displayed at the top. Continued use of our platform following notice of changes constitutes your acceptance of the updated Terms.
            </p>
          </section>

          {/* Section 14: Contact Information */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FF8C1A] text-white text-xs font-bold">14</span>
              Contact Information
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              For questions, clarifications, or assistance concerning these Terms of Service, please contact our support team:
            </p>
            <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row gap-4 sm:gap-8 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[#102A56]">
                <Mail className="w-4 h-4 text-[#FF8C1A]" />
                <span>Email: <a href="mailto:support@be11.com" className="font-semibold hover:underline">support@be11.com</a></span>
              </div>
              <div className="flex items-center gap-2 text-[#102A56]">
                <ShieldCheck className="w-4 h-4 text-[#FF8C1A]" />
                <span>Assistance: <a href="mailto:help@be11.com" className="font-semibold hover:underline">help@be11.com</a></span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
export default TermsOfService;
