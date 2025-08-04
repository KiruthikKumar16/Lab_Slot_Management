import React, { useState } from 'react';
import { Filter, X, RotateCcw, Calendar, Clock, User } from 'lucide-react';
import { User as UserType } from '../App';
import GlassCard from '../components/GlassCard';
import StatusTag from '../components/StatusTag';

interface ManageBookingsPageProps {
  user: UserType;
}

interface Booking {
  id: string;
  studentName: string;
  studentEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  lab: string;
  status: 'booked' | 'completed' | 'cancelled' | 'no-show';
}

const ManageBookingsPage: React.FC<ManageBookingsPageProps> = ({ user }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Mock bookings data
  const [bookings, setBookings] = useState<Booking[]>([
    { id: '1', studentName: 'John Doe', studentEmail: 'john.doe@university.edu', date: '2024-01-15', startTime: '14:00', endTime: '16:00', lab: 'Organic Chemistry Lab A', status: 'booked' },
    { id: '2', studentName: 'Jane Smith', studentEmail: 'jane.smith@university.edu', date: '2024-01-15', startTime: '10:00', endTime: '12:00', lab: 'Analytical Lab B', status: 'completed' },
    { id: '3', studentName: 'Mike Johnson', studentEmail: 'mike.johnson@university.edu', date: '2024-01-14', startTime: '16:00', endTime: '18:00', lab: 'Physical Chemistry Lab', status: 'no-show' },
    { id: '4', studentName: 'Sarah Wilson', studentEmail: 'sarah.wilson@university.edu', date: '2024-01-14', startTime: '09:00', endTime: '11:00', lab: 'Inorganic Lab C', status: 'cancelled' },
    { id: '5', studentName: 'David Brown', studentEmail: 'david.brown@university.edu', date: '2024-01-16', startTime: '14:00', endTime: '16:00', lab: 'Organic Chemistry Lab A', status: 'booked' },
  ]);

  const filteredBookings = bookings.filter(booking => {
    const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
    const dateMatch = !dateFilter || booking.date === dateFilter;
    return statusMatch && dateMatch;
  });

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'cancelled' as const }
          : booking
      ));
      alert('Booking cancelled successfully!');
    }
  };

  const handleReopenSlot = (bookingId: string) => {
    if (window.confirm('Are you sure you want to reopen this cancelled slot?')) {
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'booked' as const }
          : booking
      ));
      alert('Slot reopened successfully!');
    }
  };

  const handleRemoveBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to permanently remove this booking?')) {
      setBookings(bookings.filter(booking => booking.id !== bookingId));
      alert('Booking removed successfully!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Manage Bookings
        </h1>
        <p className="text-slate-600 text-lg">View and manage all student lab bookings</p>
      </div>

      {/* Filters */}
      <GlassCard className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <label className="font-semibold text-slate-800">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              <option value="all">All Status</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No-Show</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <label className="font-semibold text-slate-800">Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {(statusFilter !== 'all' || dateFilter) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200/60 text-gray-700 rounded-xl hover:bg-gray-300/60 transition-all duration-300"
            >
              <X className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </GlassCard>

      {/* Bookings Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/40 border-b border-white/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Laboratory</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-white/20 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{booking.studentName}</p>
                        <p className="text-sm text-slate-600">{booking.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-slate-800">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">{booking.date}</span>
                      <Clock className="w-4 h-4 text-slate-500 ml-2" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">{booking.lab}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusTag status={booking.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      {booking.status === 'booked' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-100/80 text-red-700 rounded-lg hover:bg-red-200/80 transition-all duration-300 text-sm font-medium"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                      
                      {booking.status === 'cancelled' && (
                        <button
                          onClick={() => handleReopenSlot(booking.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-100/80 text-green-700 rounded-lg hover:bg-green-200/80 transition-all duration-300 text-sm font-medium"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleRemoveBooking(booking.id)}
                        className="px-3 py-1 bg-gray-100/80 text-gray-700 rounded-lg hover:bg-gray-200/80 transition-all duration-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredBookings.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-600 text-lg">No bookings found matching the selected filters.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ManageBookingsPage;