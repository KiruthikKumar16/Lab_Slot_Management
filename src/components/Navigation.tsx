import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Calendar, BookOpen, Users, BarChart3, Settings, TestTube } from 'lucide-react';
import { User as UserType } from '../App';

interface NavigationProps {
  user: UserType;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const studentLinks = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/book-slot', label: 'Book Slot', icon: Calendar },
    { path: '/my-sessions', label: 'My Sessions', icon: BookOpen },
  ];

  const adminLinks = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/manage-slots', label: 'Lab Slots', icon: Calendar },
    { path: '/manage-bookings', label: 'Bookings', icon: BookOpen },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  const links = user.role === 'student' ? studentLinks : adminLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                ChemLab Pro
              </h1>
              <p className="text-xs text-slate-500 font-medium">University Lab Management</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-800 hover:shadow-md'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">
                {user.role} • {user.email.split('@')[0]}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;