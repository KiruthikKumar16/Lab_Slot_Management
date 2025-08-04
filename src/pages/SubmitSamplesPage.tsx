import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, FileText, Send } from 'lucide-react';
import { User } from '../App';
import GlassCard from '../components/GlassCard';

interface SubmitSamplesPageProps {
  user: User;
}

const SubmitSamplesPage: React.FC<SubmitSamplesPageProps> = ({ user }) => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sampleCount, setSampleCount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock session data
  const session = {
    id: sessionId,
    date: '2024-01-10',
    startTime: '16:00',
    endTime: '18:00',
    lab: 'Physical Chemistry Lab',
    status: 'completed'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sampleCount || parseInt(sampleCount) < 1) {
      alert('Please enter a valid sample count');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    alert('Samples submitted successfully!');
    navigate('/my-sessions');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Submit Samples
        </h1>
        <p className="text-slate-600 text-lg">Submit your lab sample details and observations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Session Details */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Session Details</span>
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-white/40 rounded-xl border border-white/30">
              <p className="font-semibold text-slate-800 mb-2">{session.lab}</p>
              <div className="space-y-2 text-sm text-slate-600">
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

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/50">
              <h3 className="font-semibold text-blue-800 mb-2">Submission Requirements</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Enter the total number of samples prepared</li>
                <li>• Provide detailed observations and notes</li>
                <li>• Include any unusual findings or deviations</li>
                <li>• Mention equipment used and conditions</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Submission Form */}
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Number of Samples
              </label>
              <input
                type="number"
                min="1"
                value={sampleCount}
                onChange={(e) => setSampleCount(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800"
                placeholder="Enter number of samples"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Observations & Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800 resize-none"
                placeholder="Enter your detailed observations, procedures followed, results obtained, and any notes..."
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/my-sessions')}
                className="flex-1 py-3 px-4 bg-gray-200/60 text-gray-700 rounded-xl font-semibold hover:bg-gray-300/60 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Samples</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default SubmitSamplesPage;