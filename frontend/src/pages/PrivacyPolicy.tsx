import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Server, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
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
              <Shield className="w-7 h-7 text-[#FF8C1A]" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-poppins tracking-tight text-white">
              Privacy Policy
            </h1>
          </div>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-light leading-relaxed">
            Learn how BE11 collects, uses, and safeguards your personal information when you use our sports booking platform and services.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>Effective Date: September 2026</span>
            <span>•</span>
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Official Policy
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#E5E7EB] space-y-10">
          
          {/* Section 1: Introduction */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">1</span>
              Introduction
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              BE11 Sports (&ldquo;BE11&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains our practices regarding the collection, storage, and handling of your information across our website (<a href="https://be11.in" className="text-[#FF8C1A] font-medium hover:underline">https://be11.in</a>), web applications, and services related to sports ground reservations, venue management, and community sports activities.
            </p>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              By accessing or using BE11, you acknowledge that you have read, understood, and agreed to the practices described in this Privacy Policy and our <Link to="/terms" className="text-[#FF8C1A] font-medium hover:underline">Terms of Service</Link>.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">2</span>
              Information We Collect
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              We collect information strictly necessary to provide, manage, and optimize our sports venue booking services:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#f7f9fb] border border-gray-100 space-y-2">
                <div className="font-semibold text-sm text-[#102A56] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#FF8C1A]" /> Account Information
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  When you register, we collect your full name, email address, mobile phone number, and a hashed password if you register with email credentials.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f7f9fb] border border-gray-100 space-y-2">
                <div className="font-semibold text-sm text-[#102A56] flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#FF8C1A]" /> Booking &amp; Slot Data
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  When reserving a ground, we record your selected venue, sport, date, time slot, match format, total booking price, and confirmation status.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Google Sign-In & OAuth User Data */}
          <section className="space-y-4 bg-blue-50/60 p-6 rounded-2xl border border-blue-100">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49] text-white text-xs font-bold">3</span>
              Google Authentication &amp; OAuth User Data
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              BE11 provides a convenient option to sign in using your Google account via Google OAuth 2.0. If you choose this method:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#444650] pl-2">
              <li>
                <strong>Data Requested:</strong> We request access only to your basic public Google profile information (such as your name and avatar) and verified primary email address.
              </li>
              <li>
                <strong>Purpose of Collection:</strong> This data is solely used to authenticate your identity, establish your BE11 account profile, and communicate booking status updates to your email.
              </li>
              <li>
                <strong>No Password Storage:</strong> BE11 does not receive or store your Google password.
              </li>
              <li>
                <strong>No Sharing or Sale:</strong> We do not sell, rent, or trade your Google account information with third parties or data brokers.
              </li>
              <li>
                <strong>Google API Limited Use:</strong> Our use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy.
              </li>
            </ul>
          </section>

          {/* Section 4: How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">4</span>
              How We Use Your Information
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              We process your personal information for the following specific purposes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#444650] pl-2">
              <li>To confirm, coordinate, and administer sports ground bookings with official venue administrators.</li>
              <li>To prevent double-booking conflicts through real-time schedule synchronization.</li>
              <li>To send essential transactional notifications, including email verification codes and booking confirmations.</li>
              <li>To provide customer support and respond to user queries regarding turf schedules and matches.</li>
              <li>To enforce platform rules and safeguard against fraudulent account creation or reservation abuse.</li>
            </ul>
          </section>

          {/* Section 5: Cookies and Session Storage */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">5</span>
              Cookies &amp; Local Storage
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              BE11 uses browser local storage and essential session identifiers to maintain your authenticated login state while browsing across pages. These storage mechanisms are strictly operational and allow you to remain signed in to manage your bookings without re-entering credentials on every page reload. We do not use intrusive cross-site tracking cookies.
            </p>
          </section>

          {/* Section 6: Data Storage and Security */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">6</span>
              Data Storage &amp; Security Practices
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              Your data is stored in secured relational database infrastructure protected by industry-standard access controls and network isolation. All web traffic between your browser and our platform is transmitted over encrypted HTTPS (Transport Layer Security). User passwords for email accounts are hashed using modern cryptographic algorithms before database storage.
            </p>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              While we follow established security practices to protect your data, please note that no method of electronic transmission or storage over the internet is completely guaranteed against unauthorized access.
            </p>
          </section>

          {/* Section 7: Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">7</span>
              Third-Party Services
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              BE11 partners with trusted infrastructure providers to deliver reliable services:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#444650] pl-2">
              <li><strong>Hosting &amp; Edge Delivery:</strong> Cloud edge infrastructure and serverless execution via Vercel.</li>
              <li><strong>Database Hosting:</strong> Managed PostgreSQL cloud database infrastructure with secure connection pooling.</li>
              <li><strong>Email Delivery:</strong> Transactional email services for sending account verification codes and booking notifications.</li>
              <li><strong>Google Identity Services:</strong> Secure identity authentication if you choose Google Sign-In.</li>
            </ul>
          </section>

          {/* Section 8: Data Retention */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">8</span>
              Data Retention
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              We retain personal information for as long as your BE11 account remains active, or as necessary to provide booking history, resolve disputes, and maintain operational audit trails. When an account or booking record is no longer needed, it is deleted or anonymized in accordance with applicable retention procedures.
            </p>
          </section>

          {/* Section 9: User Rights & Data Deletion */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">9</span>
              Your Rights &amp; Data Deletion
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              You maintain full control over your personal data:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#444650] pl-2">
              <li><strong>Access &amp; Review:</strong> You may view and edit your profile details at any time through your Profile Settings.</li>
              <li><strong>Account Deletion:</strong> You have the right to request deletion of your account and associated personal data by emailing our support team at <a href="mailto:support@be11.com" className="text-[#FF8C1A] hover:underline font-medium">support@be11.com</a>.</li>
              <li><strong>Revoke Google Access:</strong> If you registered with Google, you can revoke BE11&rsquo;s access to your Google account at any time through your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#FF8C1A] hover:underline font-medium">Google Security Settings</a>.</li>
            </ul>
          </section>

          {/* Section 10: Policy Updates */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#001a49]/5 text-[#001a49] text-xs font-bold">10</span>
              Policy Updates
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              We may update this Privacy Policy periodically to reflect improvements in our platform or legal requirements. When updates occur, we will revise the &ldquo;Last Updated&rdquo; date at the top of this page. We encourage you to review this page periodically to stay informed about our privacy practices.
            </p>
          </section>

          {/* Section 11: Contact Information */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-xl font-bold text-[#102A56] font-poppins flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FF8C1A] text-white text-xs font-bold">11</span>
              Contact Us
            </h2>
            <p className="text-[#444650] text-sm leading-relaxed font-normal">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out to our team:
            </p>
            <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row gap-4 sm:gap-8 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[#102A56]">
                <Mail className="w-4 h-4 text-[#FF8C1A]" />
                <span>Email: <a href="mailto:support@be11.com" className="font-semibold hover:underline">support@be11.com</a></span>
              </div>
              <div className="flex items-center gap-2 text-[#102A56]">
                <Lock className="w-4 h-4 text-[#FF8C1A]" />
                <span>Help Desk: <a href="mailto:help@be11.com" className="font-semibold hover:underline">help@be11.com</a></span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
export default PrivacyPolicy;
