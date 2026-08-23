import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { formatCurrency } from '@be11/shared';
import { useNavigate } from 'react-router-dom';

interface Enrollment {
  id: string;
  camp: {
    name: string;
    sport: string;
    venue: string;
    startDate: string;
    durationWeeks: number;
    timings: string;
    coach: { user: { firstName: string; lastName: string } };
  };
  status: string;
}

interface Session {
  id: string;
  type: string;
  date: string;
  time: string;
  fee: number;
  status: string;
  coach: { user: { firstName: string; lastName: string } };
}

interface Attendance {
  id: string;
  campId: string | null;
  sessionId: string | null;
  date: string;
  status: string;
}

interface Certificate {
  id: string;
  title: string;
  sport: string;
  issueDate: string;
  certificateUrl: string;
  coach: { user: { firstName: string; lastName: string } };
}

export const MyTraining: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coaches/student/trainings');
      const data = res.data.data;
      setEnrollments(data.enrollments);
      setSessions(data.sessions);
      setAttendances(data.attendances);
      setCertificates(data.certificates);
    } catch (err) {
      console.error('Error fetching student trainings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrainingData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="pt-24 text-center py-16 max-w-sm mx-auto">
        <h3 className="font-bold text-primary">Login Required</h3>
        <p className="text-outline text-xs mt-1">Please log in to track your academy growth and class schedules.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="pt-24 text-center text-outline text-xs py-16">Loading training records...</div>;
  }

  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length + enrollments.length * 4;
  const attendanceRate = attendances.length > 0
    ? Math.round((attendances.filter((a) => a.status === 'PRESENT').length / attendances.length) * 100)
    : 100;

  return (
    <div className="pt-24 min-h-screen bg-surface-container-low pb-16 text-left font-body-md">
      <div className="max-w-7xl mx-auto px-container-padding space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-poppins font-black text-3xl text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-3xl">sports_cricket</span>
              My Training Log
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Monitor your active sports coaching batches, check-in reports, and download achievements.
            </p>
          </div>
          <button
            onClick={() => navigate('/coaches')}
            className="px-5 py-2.5 bg-primary hover:bg-[#0a2e6e] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-sm"
          >
            Browse Coaches
          </button>
        </div>

        {/* Growth Stats widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">sports</span>
            </div>
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">Syllabus Completed</span>
              <span className="font-poppins font-black text-xl text-primary">{completedCount} Lessons</span>
            </div>
          </div>

          <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">co_present</span>
            </div>
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">Attendance Rate</span>
              <span className="font-poppins font-black text-xl text-[#138808]">{attendanceRate}%</span>
            </div>
          </div>

          <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">Certificates Earned</span>
              <span className="font-poppins font-black text-xl text-primary">{certificates.length} Credentials</span>
            </div>
          </div>
        </div>

        {/* Roster splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main schedules list */}
          <div className="lg:col-span-2 space-y-8">
            {/* Registered Camps */}
            <div className="bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm text-left space-y-6">
              <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">My Registered Training Camps</h3>
              {enrollments.length === 0 ? (
                <p className="text-outline text-xs py-4">You have not enrolled in any training camps currently.</p>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((en) => (
                    <div key={en.id} className="border p-5 rounded-xl text-xs flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-primary">{en.camp.name}</h4>
                        <p className="text-[11px] text-outline font-medium">Led by Coach {en.camp.coach.user.firstName} {en.camp.coach.user.lastName}</p>
                        <p className="text-outline mt-2"><span className="font-semibold">Venue:</span> {en.camp.venue}</p>
                        <p className="text-outline"><span className="font-semibold">Timings:</span> {en.camp.timings}</p>
                      </div>
                      <div className="flex md:flex-col justify-between items-end gap-2 text-right">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[9px]">
                          {en.status}
                        </span>
                        <p className="text-outline text-[10px]">Starts: {new Date(en.camp.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 1-to-1 Scheduled Sessions */}
            <div className="bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm text-left space-y-6">
              <h3 className="font-poppins font-bold text-base text-primary uppercase tracking-wider">Scheduled One-To-One Classes</h3>
              {sessions.length === 0 ? (
                <p className="text-outline text-xs py-4">No private sessions currently booked in your training diary.</p>
              ) : (
                <div className="space-y-4">
                  {sessions.map((s) => (
                    <div key={s.id} className="border p-5 rounded-xl text-xs flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-primary">Private Session with Coach {s.coach.user.firstName}</h4>
                        <p className="text-outline"><span className="font-semibold">Scheduled Date:</span> {new Date(s.date).toLocaleDateString()}</p>
                        <p className="text-outline"><span className="font-semibold">Class Timings:</span> {s.time}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          s.status === 'BOOKED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {s.status}
                        </span>
                        <p className="text-outline text-[10px] block">Fee: {formatCurrency(s.fee)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side stats: certificates and check-ins */}
          <div className="space-y-8">
            {/* Certificates */}
            <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm text-left space-y-4">
              <h3 className="font-poppins font-bold text-xs text-primary uppercase tracking-wider border-b pb-2">Academic Certificates</h3>
              {certificates.length === 0 ? (
                <p className="text-outline text-xs">No completion certificates awarded yet.</p>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="border p-3.5 rounded-xl space-y-2">
                      <div>
                        <h4 className="font-bold text-xs text-primary">{cert.title}</h4>
                        <p className="text-[10px] text-outline mt-0.5">{cert.sport} • Coach {cert.coach.user.firstName}</p>
                      </div>
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-secondary font-bold flex items-center gap-1 hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download Document
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance checklist log */}
            <div className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm text-left space-y-4">
              <h3 className="font-poppins font-bold text-xs text-primary uppercase tracking-wider border-b pb-2">Attendance Check-Ins</h3>
              {attendances.length === 0 ? (
                <p className="text-outline text-xs">No check-in logs submitted yet.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {attendances.map((a) => (
                    <div key={a.id} className="flex justify-between items-center">
                      <span className="text-outline">{new Date(a.date).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTraining;
