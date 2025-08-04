import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Calendar, Clock, Users } from 'lucide-react';
import { User } from '../App';
import GlassCard from '../components/GlassCard';
import StatusTag from '../components/StatusTag';

interface ManageLabSlotsPageProps {
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
  status: 'available' | 'full' | 'closed';
}

const ManageLabSlotsPage: React.FC<ManageLabSlotsPageProps> = ({ user }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    lab: '',
    capacity: ''
  });

  // Mock lab slots data
  const [labSlots, setLabSlots] = useState<LabSlot[]>([
    { id: '1', date: '2024-01-15', startTime: '09:00', endTime: '11:00', lab: 'Organic Chemistry Lab A', capacity: 8, booked: 3, status: 'available' },
    { id: '2', date: '2024-01-15', startTime: '11:00', endTime: '13:00', lab: 'Analytical Lab B', capacity: 6, booked: 6, status: 'full' },
    { id: '3', date: '2024-01-15', startTime: '14:00', endTime: '16:00', lab: 'Physical Chemistry Lab', capacity: 10, booked: 5, status: 'available' },
    { id: '4', date: '2024-01-16', startTime: '09:00', endTime: '11:00', lab: 'Inorganic Lab C', capacity: 8, booked: 0, status: 'closed' },
  ]);

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlot: LabSlot = {
      id: Date.now().toString(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      lab: formData.lab,
      capacity: parseInt(formData.capacity),
      booked: 0,
      status: 'available'
    };
    
    setLabSlots([...labSlots, newSlot]);
    setFormData({ date: '', startTime: '', endTime: '', lab: '', capacity: '' });
    setShowCreateForm(false);
    alert('Lab slot created successfully!');
  };

  const handleDeleteSlot = (slotId: string) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      setLabSlots(labSlots.filter(slot => slot.id !== slotId));
      alert('Slot deleted successfully!');
    }
  };

  const toggleSlotStatus = (slotId: string) => {
    setLabSlots(labSlots.map(slot => 
      slot.id === slotId 
        ? { ...slot, status: slot.status === 'closed' ? 'available' : 'closed' }
        : slot
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Manage Lab Slots
            </h1>
            <p className="text-slate-600 text-lg">Create and manage available lab time slots</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Slot</span>
          </button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Lab Slot</h2>
            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Laboratory</label>
                <select
                  value={formData.lab}
                  onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
                  className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  required
                >
                  <option value="">Select a laboratory</option>
                  <option value="Organic Chemistry Lab A">Organic Chemistry Lab A</option>
                  <option value="Analytical Lab B">Analytical Lab B</option>
                  <option value="Physical Chemistry Lab">Physical Chemistry Lab</option>
                  <option value="Inorganic Lab C">Inorganic Lab C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  placeholder="Maximum students"
                  required
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-3 bg-gray-200/60 text-gray-700 rounded-xl font-semibold hover:bg-gray-300/60 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg"
                >
                  Create Slot
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Slots Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/40 border-b border-white/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Laboratory</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Capacity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {labSlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-white/20 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-slate-800">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">{slot.date}</span>
                      <Clock className="w-4 h-4 text-slate-500 ml-2" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">{slot.lab}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-800">{slot.booked}/{slot.capacity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusTag status={slot.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleSlotStatus(slot.id)}
                        className={`p-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                          slot.status === 'closed'
                            ? 'bg-green-100/80 text-green-700 hover:bg-green-200/80'
                            : 'bg-orange-100/80 text-orange-700 hover:bg-orange-200/80'
                        }`}
                      >
                        {slot.status === 'closed' ? 'Open' : 'Close'}
                      </button>
                      <button className="p-2 text-blue-600 hover:bg-blue-100/60 rounded-lg transition-all duration-300">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-2 text-red-600 hover:bg-red-100/60 rounded-lg transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default ManageLabSlotsPage;