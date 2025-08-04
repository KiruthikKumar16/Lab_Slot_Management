import React, { useState } from 'react';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { User } from '../App';
import GlassCard from '../components/GlassCard';
import StatusTag from '../components/StatusTag';

interface BookSlotPageProps {
  user: User;
}

interface LabSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  lab: string;
  capacity: number;
  booked: number;
  status: 'available' | 'full';
}

const BookSlotPage: React.FC<BookSlotPageProps> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  
  // Mock lab slots data
  const labSlots: LabSlot[] = [
    { id: '1', date: '2024-01-15', startTime: '09:00', endTime: '11:00', lab: 'Organic Chemistry Lab A', capacity: 8, booked: 3, status: 'available' },
    { id: '2', date: '2024-01-15', startTime: '11:00', endTime: '13:00', lab: 'Analytical Lab B', capacity: 6, booked: 6, status: 'full' },
    { id: '3', date: '2024-01-15', startTime: '14:00', endTime: '16:00', lab: 'Physical Chemistry Lab', capacity: 10, booked: 5, status: 'available' },
    { id: '4', date: '2024-01-15', startTime: '16:00', endTime: '18:00', lab: 'Inorganic Lab C', capacity: 8, booked: 2, status: 'available' },
    { id: '5', date: '2024-01-16', startTime: '09:00', endTime: '11:00', lab: 'Organic Chemistry Lab A', capacity: 8, booked: 1, status: 'available' },
    { id: '6', date: '2024-01-16', startTime: '14:00', endTime: '16:00', lab: 'Analytical Lab B', capacity: 6, booked: 4, status: 'available' },
  ];

  const filteredSlots = labSlots.filter(slot => slot.date === selectedDate);

  const handleBookSlot = (slotId: string) => {
    alert(`Booking slot ${slotId} for ${user.name}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Book Lab Session
        </h1>
        <p className="text-slate-600 text-lg">Select an available time slot for your lab session</p>
      </div>

      {/* Date Filter */}
      <GlassCard className="p-6 mb-8">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-slate-600" />
          <label className="font-semibold text-slate-800">Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          >
            <option value="2024-01-15">January 15, 2024</option>
            <option value="2024-01-16">January 16, 2024</option>
            <option value="2024-01-17">January 17, 2024</option>
          </select>
        </div>
      </GlassCard>

      {/* Available Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSlots.map((slot) => (
          <GlassCard key={slot.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <StatusTag status={slot.status} />
              <div className="text-right">
                <p className="text-sm text-slate-500">Capacity</p>
                <p className="font-bold text-slate-800">{slot.booked}/{slot.capacity}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700 font-medium">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700 font-medium">{slot.lab}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">
                  {slot.capacity - slot.booked} spots available
                </span>
              </div>
            </div>

            <button
              onClick={() => handleBookSlot(slot.id)}
              disabled={slot.status === 'full'}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                slot.status === 'available'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200/60 text-gray-500 cursor-not-allowed'
              }`}
            >
              {slot.status === 'available' ? 'Book This Slot' : 'Fully Booked'}
            </button>
          </GlassCard>
        ))}
      </div>

      {filteredSlots.length === 0 && (
        <GlassCard className="p-12 text-center">
          <p className="text-slate-600 text-lg">No lab slots available for the selected date.</p>
          <p className="text-slate-500 mt-2">Please select a different date.</p>
        </GlassCard>
      )}
    </div>
  );
};

export default BookSlotPage;