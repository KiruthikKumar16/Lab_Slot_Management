import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import BookSlotPage from './pages/BookSlotPage';
import MySessionsPage from './pages/MySessionsPage';
import SubmitSamplesPage from './pages/SubmitSamplesPage';
import AdminDashboard from './pages/AdminDashboard';
import ManageLabSlotsPage from './pages/ManageLabSlotsPage';
import ManageBookingsPage from './pages/ManageBookingsPage';
import StudentManagementPage from './pages/StudentManagementPage';
import ReportsPage from './pages/ReportsPage';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navigation user={user} onLogout={handleLogout} />
        <main className="pt-20">
          <Routes>
            {user.role === 'student' ? (
              <>
                <Route path="/" element={<StudentDashboard user={user} />} />
                <Route path="/book-slot" element={<BookSlotPage user={user} />} />
                <Route path="/my-sessions" element={<MySessionsPage user={user} />} />
                <Route path="/submit-samples/:sessionId" element={<SubmitSamplesPage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<AdminDashboard user={user} />} />
                <Route path="/manage-slots" element={<ManageLabSlotsPage user={user} />} />
                <Route path="/manage-bookings" element={<ManageBookingsPage user={user} />} />
                <Route path="/students" element={<StudentManagementPage user={user} />} />
                <Route path="/reports" element={<ReportsPage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;