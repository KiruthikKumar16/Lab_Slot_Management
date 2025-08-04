import React from 'react';
import { Calendar, Users, FileText, AlertTriangle, TrendingUp, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../App';
import GlassCard from '../components/GlassCard';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  // Mock today's stats
  const todayStats = {
    totalBookings: 24,
    samplesSubmitted: 18,
    noShows: 3,
    activeStudents: 156
  };

  const quickLinks = [
    { to: '/manage-slots', label: 'Lab Slots', icon: Calendar, color: 'from-blue-500 to-blue-600' },
    { to: '/manage-bookings', label: 'Bookings', icon: BookOpen, color: 'from-green-500 to-green-600' },
    { to: '/students', label: 'Students', icon: Users, color: 'from-purple-500 to-purple-600' },
    { to: '/reports', label: 'Reports', icon: FileText, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-full">
            Admin
          </span>
        </div>
        <p className="text-slate-600 text-lg">Welcome back, {user.name}. Here's your lab management overview.</p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Today's Bookings</p>
              <p className="text-3xl font-bold text-slate-800">{todayStats.totalBookings}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Samples Submitted</p>
              <p className="text-3xl font-bold text-green-600">{todayStats.samplesSubmitted}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">No-Shows</p>
              <p className="text-3xl font-bold text-orange-600">{todayStats.noShows}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Active Students</p>
              <p className="text-3xl font-bold text-purple-600">{todayStats.activeStudents}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Links */}
      <GlassCard className="p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="group p-6 bg-white/40 hover:bg-white/60 rounded-2xl border border-white/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 group-hover:text-slate-900">{link.label}</h3>
                <p className="text-sm text-slate-600 mt-1">Manage and monitor</p>
              </Link>
            );
          })}
        </div>
      </GlassCard>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Recent Bookings</h3>
          <div className="space-y-4">
            {[
              { student: 'John Doe', lab: 'Organic Chemistry Lab A', time: '14:00 - 16:00' },
              { student: 'Jane Smith', lab: 'Analytical Lab B', time: '10:00 - 12:00' },
              { student: 'Mike Johnson', lab: 'Physical Chemistry Lab', time: '16:00 - 18:00' },
            ].map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/40 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800">{booking.student}</p>
                  <p className="text-sm text-slate-600">{booking.lab}</p>
                </div>
                <span className="text-sm text-slate-500">{booking.time}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50/60 rounded-xl border border-green-200/50">
              <span className="text-green-800 font-medium">Lab Equipment</span>
              <span className="text-green-600 text-sm font-semibold">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-200/50">
              <span className="text-blue-800 font-medium">Booking System</span>
              <span className="text-blue-600 text-sm font-semibold">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50/60 rounded-xl border border-yellow-200/50">
              <span className="text-yellow-800 font-medium">Maintenance</span>
              <span className="text-yellow-600 text-sm font-semibold">Scheduled</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminDashboard;