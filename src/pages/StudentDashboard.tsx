import React from 'react';
import { Calendar, Clock, BookOpen, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../App';
import GlassCard from '../components/GlassCard';
import StatusTag from '../components/StatusTag';

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  // Mock data
  const upcomingSession = {
    id: '1',
    date: '2024-01-15',
    time: '14:00 - 16:00',
    lab: 'Organic Chemistry Lab A',
    status: 'booked'
  };

  const recentSessions = [
    { id: '1', date: '2024-01-15', time: '14:00 - 16:00', lab: 'Organic Chemistry Lab A', status: 'booked' },
    { id: '2', date: '2024-01-10', time: '10:00 - 12:00', lab: 'Analytical Lab B', status: 'completed' },
    { id: '3', date: '2024-01-08', time: '16:00 - 18:00', lab: 'Physical Chemistry Lab', status: 'completed' },
    { id: '4', date: '2024-01-05', time: '14:00 - 16:00', lab: 'Inorganic Lab C', status: 'no-show' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Welcome back, {user.name}
        </h1>
        <p className="text-slate-600 text-lg">Manage your lab sessions and track your progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Total Sessions</p>
              <p className="text-3xl font-bold text-slate-800">12</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Completed</p>
              <p className="text-3xl font-bold text-green-600">8</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Upcoming</p>
              <p className="text-3xl font-bold text-blue-600">1</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Session Card */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Next Lab Session</h2>
            <StatusTag status={upcomingSession.status} />
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-slate-500" />
              <span className="text-slate-700 font-medium">{upcomingSession.date}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-slate-500" />
              <span className="text-slate-700 font-medium">{upcomingSession.time}</span>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-slate-500" />
              <span className="text-slate-700 font-medium">{upcomingSession.lab}</span>
            </div>
          </div>

          <Link
            to="/book-slot"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Book New Session</span>
          </Link>
        </GlassCard>

        {/* Recent Sessions */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Recent Sessions</h2>
            <Link
              to="/my-sessions"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-300"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-white/30">
                <div>
                  <p className="font-semibold text-slate-800">{session.lab}</p>
                  <p className="text-sm text-slate-600">{session.date} • {session.time}</p>
                </div>
                <StatusTag status={session.status} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default StudentDashboard;