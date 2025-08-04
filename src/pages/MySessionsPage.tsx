import React from 'react';
import { Calendar, Clock, MapPin, X, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../App';
import GlassCard from '../components/GlassCard';
import StatusTag from '../components/StatusTag';

interface MySessionsPageProps {
  user: User;
}

interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  lab: string;
  status: 'booked' | 'completed' | 'cancelled' | 'no-show';
  canCancel: boolean;
  canSubmitSamples: boolean;
}

const MySessionsPage: React.FC<MySessionsPageProps> = ({ user }) => {
  // Mock sessions data
  const sessions: Session[] = [
    { id: '1', date: '2024-01-15', startTime: '14:00', endTime: '16:00', lab: 'Organic Chemistry Lab A', status: 'booked', canCancel: true, canSubmitSamples: false },
    { id: '2', date: '2024-01-18', startTime: '10:00', endTime: '12:00', lab: 'Analytical Lab B', status: 'booked', canCancel: true, canSubmitSamples: false },
    { id: '3', date: '2024-01-10', startTime: '16:00', endTime: '18:00', lab: 'Physical Chemistry Lab', status: 'completed', canCancel: false, canSubmitSamples: true },
    { id: '4', date: '2024-01-08', startTime: '14:00', endTime: '16:00', lab: 'Inorganic Lab C', status: 'completed', canCancel: false, canSubmitSamples: false },
    { id: '5', date: '2024-01-05', startTime: '09:00', endTime: '11:00', lab: 'Organic Chemistry Lab A', status: 'no-show', canCancel: false, canSubmitSamples: false },
    { id: '6', date: '2024-01-03', startTime: '14:00', endTime: '16:00', lab: 'Analytical Lab B', status: 'cancelled', canCancel: false, canSubmitSamples: false },
  ];

  const handleCancelSession = (sessionId: string) => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      alert(`Session ${sessionId} cancelled`);
    }
  };

  const getDateStatus = (dateStr: string) => {
    const sessionDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    return sessionDate > tomorrow;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          My Lab Sessions
        </h1>
        <p className="text-slate-600 text-lg">View and manage all your lab bookings</p>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <GlassCard key={session.id} className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <StatusTag status={session.status} />
                  <h3 className="text-lg font-bold text-slate-800">{session.lab}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{session.startTime} - {session.endTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{session.lab}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                {session.canSubmitSamples && (
                  <Link
                    to={`/submit-samples/${session.id}`}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Submit Samples</span>
                  </Link>
                )}
                
                {session.canCancel && getDateStatus(session.date) && (
                  <button
                    onClick={() => handleCancelSession(session.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {sessions.length === 0 && (
        <GlassCard className="p-12 text-center">
          <p className="text-slate-600 text-lg mb-4">You haven't booked any lab sessions yet.</p>
          <Link
            to="/book-slot"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Book Your First Session
          </Link>
        </GlassCard>
      )}
    </div>
  );
};

export default MySessionsPage;