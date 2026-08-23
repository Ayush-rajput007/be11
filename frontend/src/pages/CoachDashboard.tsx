import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { formatCurrency } from '@be11/shared';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Enrollment {
  id: string;
  student: Student;
  status: string;
  createdAt: string;
}

interface Camp {
  id: string;
  name: string;
  sport: string;
  seatsLeft: number;
  seatsLimit: number;
  fee: number;
  enrollments: Enrollment[];
}

interface Session {
  id: string;
  student: Student;
  date: string;
  time: string;
  fee: number;
  status: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

export const CoachDashboard: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'cohorts' | 'sessions' | 'reviews' | 'create_camp'>('cohorts');
  const [loading, setLoading] = useState(true);

  // Coach states
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Selected camp for roster inspection
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);

  // Attendance popup states
  const [attendanceForm, setAttendanceForm] = useState({
    studentId: '',
    campId: '',
    sessionId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
  });
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // Certificate popup states
  const [certificateForm, setCertificateForm] = useState({
    studentId: '',
    studentName: '',
    title: 'Certificate of Mastery',
    sport: 'Cricket',
    issueDate: new Date().toISOString().split('T')[0],
  });
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // New Camp drafting state
  const [campDraft, setCampDraft] = useState({
    name: '',
    description: '',
    sport: 'Cricket',
    venue: '',
    city: 'Mumbai',
    startDate: '',
    durationWeeks: '4',
    skillLevel: 'Beginner',
    seatsLimit: '20',
    fee: '2000',
    timings: 'Weekend 08:00 - 10:00',
    banner: '',
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coaches/coach/dashboard');
      const data = res.data.data;
      setCoachProfile(data.coach);
      setCamps(data.camps);
      setSessions(data.sessions);
      setReviews(data.reviews);

      if (data.camps.length > 0) {
        setSelectedCamp(data.camps[0]);
      }
    } catch (err) {
      console.error('Error fetching coach dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenAttendance = (studentId: string, campId?: string, sessionId?: string) => {
    setAttendanceForm({
      studentId,
      campId: campId || '',
      sessionId: sessionId || '',
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
    });
    setShowAttendanceModal(true);
  };

  const handleLogAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coaches/dashboard/attendance', attendanceForm);
      alert('Attendance logged successfully!');
      setShowAttendanceModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit attendance.');
    }
  };

  const handleOpenCertificate = (studentId: string, studentName: string, sport: string) => {
    setCertificateForm({
      studentId,
      studentName,
      title: 'Certificate of Excellence',
      sport,
      issueDate: new Date().toISOString().split('T')[0],
    });
    setShowCertificateModal(true);
  };

  const handleAwardCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coaches/dashboard/feedback', certificateForm);
      alert('Certificate awarded successfully and notifications sent!');
      setShowCertificateModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to award certificate.');
    }
  };

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coaches/dashboard/camps', campDraft);
      alert('Training camp published successfully!');
      setCampDraft({
        name: '',
        description: '',
        sport: 'Cricket',
        venue: '',
        city: 'Mumbai',
        startDate: '',
        durationWeeks: '4',
        skillLevel: 'Beginner',
        seatsLimit: '20',
        fee: '2000',
        timings: 'Weekend 08:00 - 10:00',
        banner: '',
      });
      setActiveTab('cohorts');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create camp.');
    }
  };

  if (loading) {
    return <div className="pt-24 text-center text-outline text-xs py-16">Loading dashboard...</div>;
  }

  if (!coachProfile) {
    return (
      <div className="pt-24 text-center py-16 max-w-sm mx-auto">
        <h3 className="font-bold text-primary">Access Denied</h3>
        <p className="text-outline text-xs mt-1">No active certified coach profile linked to your user session.</p>
      </div>
    );
  }

  const activeStudentsCount = sessions.length + camps.reduce((sum, c) => sum + c.enrollments.length, 0);
  const totalEarnings = sessions.length * coachProfile.hourlyRate + camps.reduce((sum, c) => sum + (c.seatsLimit - c.seatsLeft) * c.fee, 0);

  return (
    <div className="pt-24 min-h-screen bg-surface-container-low pb-16 text-left font-body-md">
      <div className="max-w-7xl mx-auto px-container-padding">
        {/* Banner */}
        <div className="mb-8">
          <h1 className="font-poppins font-black text-3xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-3xl">sports_cricket</span>
            Coach Workspace
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage your rosters, sessions calendar, student attendance log, and issue certificates.
          </p>
        </div>

        {/* Analyticsaggregate */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 text-left">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
              Active Students
            </span>
            <h3 className="font-display-hero text-3xl font-bold text-primary">{activeStudentsCount}</h3>
          </div>
          <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 text-left">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
              Training Camps
            </span>
            <h3 className="font-display-hero text-3xl font-bold text-primary">{camps.length}</h3>
          </div>
          <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 text-left">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
              Hourly Session Rate
            </span>
            <h3 className="font-display-hero text-3xl font-bold text-primary">{formatCurrency(coachProfile.hourlyRate)}</h3>
          </div>
          <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 text-left">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
              Estimated Earnings
            </span>
            <h3 className="font-display-hero text-3xl font-bold text-[#138808]">
              {formatCurrency(totalEarnings)}
            </h3>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex bg-[#EDF2F7] p-1.5 rounded-2xl w-full md:w-fit mb-8">
          <button
            onClick={() => setActiveTab('cohorts')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cohorts' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            Camps &amp; Roster
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sessions' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            One-to-One Sessions
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reviews' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            Student Feedback
          </button>
          <button
            onClick={() => setActiveTab('create_camp')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create_camp' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            Draft New Camp
          </button>
        </div>

        {/* Tab cohorts */}
        {activeTab === 'cohorts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Camps list */}
            <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm h-fit space-y-4">
              <h3 className="font-poppins font-bold text-sm text-primary uppercase tracking-wider border-b pb-2">Active Cohorts</h3>
              {camps.length === 0 ? (
                <p className="text-outline text-xs">No active training camps published yet.</p>
              ) : (
                <div className="space-y-3">
                  {camps.map((camp) => (
                    <div
                      key={camp.id}
                      onClick={() => setSelectedCamp(camp)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedCamp?.id === camp.id ? 'border-secondary bg-secondary/5 font-bold' : 'border-outline-variant/30 hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <h4 className="text-xs text-primary truncate">{camp.name}</h4>
                      <p className="text-[10px] text-outline mt-0.5">{camp.sport} • {camp.enrollments.length} enrolled</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Camp roster details */}
            <div className="lg:col-span-2 bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm text-left">
              <h3 className="font-poppins font-bold text-base text-primary mb-6">Camp Roster Registry</h3>
              {selectedCamp ? (
                <div className="space-y-6">
                  <div className="flex justify-between border-b pb-4">
                    <div>
                      <h4 className="font-bold text-sm text-primary">{selectedCamp.name}</h4>
                      <span className="text-[10px] text-outline uppercase font-bold tracking-wider">{selectedCamp.sport} Cohort</span>
                    </div>
                    <span className="text-xs font-bold text-[#138808]">Roster limit: {selectedCamp.enrollments.length}/{selectedCamp.seatsLimit}</span>
                  </div>

                  {selectedCamp.enrollments.length === 0 ? (
                    <p className="text-outline text-xs py-4 text-center">No students registered in this camp cohort yet.</p>
                  ) : (
                    <div className="divide-y divide-outline-variant/20">
                      {selectedCamp.enrollments.map((en) => (
                        <div key={en.id} className="py-4 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-primary">{en.student.firstName} {en.student.lastName}</span>
                            <p className="text-[10px] text-outline mt-0.5">{en.student.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenAttendance(en.student.id, selectedCamp.id)}
                              className="px-3.5 py-1.5 border rounded-lg hover:bg-gray-50 text-xs font-bold text-outline cursor-pointer"
                            >
                              Log Attendance
                            </button>
                            <button
                              onClick={() => handleOpenCertificate(en.student.id, `${en.student.firstName} ${en.student.lastName}`, selectedCamp.sport)}
                              className="px-3.5 py-1.5 bg-[#138808] hover:bg-[#0f6c06] text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Award Cert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-outline text-xs">Select a cohort to load the student list.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab sessions list */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm text-left">
            <h3 className="font-poppins font-bold text-base text-primary mb-6">Scheduled One-To-One Bookings</h3>

            {sessions.length === 0 ? (
              <p className="text-outline text-xs py-8 text-center">No sessions scheduled in your calendar currently.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-left text-outline font-semibold">
                      <th className="pb-3 font-semibold">Student Name</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Timings</th>
                      <th className="pb-3 font-semibold">Session Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td className="py-4 font-bold text-primary">{s.student.firstName} {s.student.lastName}</td>
                        <td className="py-4 text-on-surface-variant font-medium">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="py-4 text-on-surface-variant font-medium">{s.time}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            s.status === 'BOOKED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleOpenAttendance(s.student.id, undefined, s.id)}
                            className="px-3.5 py-1.5 border rounded-lg hover:bg-gray-50 text-xs font-bold text-outline cursor-pointer"
                          >
                            Log Attendance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab reviews list */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm text-left space-y-6">
            <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">Student Feedback logs</h3>
            {reviews.length === 0 ? (
              <p className="text-outline text-xs">No feedback ratings submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-b pb-4 last:border-b-0 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-primary">{rev.user.firstName} {rev.user.lastName}</span>
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
        )}

        {/* Tab create camp form */}
        {activeTab === 'create_camp' && (
          <div className="bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm text-left max-w-3xl mx-auto">
            <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider mb-6 border-b pb-3">Draft a Training Camp</h3>
            <form onSubmit={handleCreateCamp} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Camp Title</label>
                  <input
                    type="text"
                    value={campDraft.name}
                    onChange={(e) => setCampDraft({ ...campDraft, name: e.target.value })}
                    required
                    placeholder="Monsoon Cricket Boot Camp"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Target Sport</label>
                  <select
                    value={campDraft.sport}
                    onChange={(e) => setCampDraft({ ...campDraft, sport: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Basketball">Basketball</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Detailed Description</label>
                <textarea
                  value={campDraft.description}
                  onChange={(e) => setCampDraft({ ...campDraft, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Details about syllabus, modules covered..."
                  className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Venue Name</label>
                  <input
                    type="text"
                    value={campDraft.venue}
                    onChange={(e) => setCampDraft({ ...campDraft, venue: e.target.value })}
                    required
                    placeholder="Mumbai Skyline Turf"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">City Location</label>
                  <input
                    type="text"
                    value={campDraft.city}
                    onChange={(e) => setCampDraft({ ...campDraft, city: e.target.value })}
                    required
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Start Date</label>
                  <input
                    type="date"
                    value={campDraft.startDate}
                    onChange={(e) => setCampDraft({ ...campDraft, startDate: e.target.value })}
                    required
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none text-outline"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Weeks Duration</label>
                  <input
                    type="number"
                    value={campDraft.durationWeeks}
                    onChange={(e) => setCampDraft({ ...campDraft, durationWeeks: e.target.value })}
                    required
                    min="1"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Seats Limit</label>
                  <input
                    type="number"
                    value={campDraft.seatsLimit}
                    onChange={(e) => setCampDraft({ ...campDraft, seatsLimit: e.target.value })}
                    required
                    min="5"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Enrollment Fee (INR)</label>
                  <input
                    type="number"
                    value={campDraft.fee}
                    onChange={(e) => setCampDraft({ ...campDraft, fee: e.target.value })}
                    required
                    min="50"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Skill Level</label>
                  <select
                    value={campDraft.skillLevel}
                    onChange={(e) => setCampDraft({ ...campDraft, skillLevel: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Weekly Timings</label>
                  <input
                    type="text"
                    value={campDraft.timings}
                    onChange={(e) => setCampDraft({ ...campDraft, timings: e.target.value })}
                    required
                    placeholder="Weekend 08:00 - 10:00"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Banner Image URL</label>
                  <input
                    type="text"
                    value={campDraft.banner}
                    onChange={(e) => setCampDraft({ ...campDraft, banner: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-secondary-container hover:bg-[#e07f24] text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer shadow-md text-center block"
              >
                Publish Camp
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL 1: Log Attendance */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-24 max-w-sm w-full p-8 text-left text-primary relative shadow-2xl">
            <button
              onClick={() => setShowAttendanceModal(false)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-poppins font-bold text-lg text-primary border-b pb-2 mb-4">Log Student Attendance</h3>
            <form onSubmit={handleLogAttendance} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Target Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none text-outline"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Attendance Mark</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none text-outline"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-[#0A2E6E] text-white rounded-xl font-bold cursor-pointer text-center"
              >
                Log Registry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Award Certificate */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-24 max-w-md w-full p-8 text-left text-primary relative shadow-2xl">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-poppins font-bold text-lg text-primary border-b pb-2 mb-4">Award Completion Certificate</h3>
            <form onSubmit={handleAwardCertificate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Recipient Student</label>
                <input
                  type="text"
                  value={certificateForm.studentName}
                  disabled
                  className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none text-outline font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Certificate Title</label>
                <input
                  type="text"
                  value={certificateForm.title}
                  onChange={(e) => setCertificateForm({ ...certificateForm, title: e.target.value })}
                  required
                  placeholder="Elite Cricket Batsman Certificate"
                  className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Sport</label>
                  <input
                    type="text"
                    value={certificateForm.sport}
                    disabled
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none text-outline"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Issue Date</label>
                  <input
                    type="date"
                    value={certificateForm.issueDate}
                    onChange={(e) => setCertificateForm({ ...certificateForm, issueDate: e.target.value })}
                    required
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none text-outline"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-secondary-container hover:bg-[#e07f24] text-white rounded-xl font-bold cursor-pointer text-center"
              >
                Award Certificate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard;
