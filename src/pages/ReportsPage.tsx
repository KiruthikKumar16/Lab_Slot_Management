import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Users, AlertTriangle, FileText } from 'lucide-react';
import { User } from '../App';
import GlassCard from '../components/GlassCard';

interface ReportsPageProps {
  user: User;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ user }) => {
  const [selectedReport, setSelectedReport] = useState('weekly-attendance');

  // Mock report data
  const reportData = {
    'weekly-attendance': [
      { week: 'Week 1', bookings: 45, completed: 38, noShows: 4, cancelled: 3 },
      { week: 'Week 2', bookings: 52, completed: 46, noShows: 3, cancelled: 3 },
      { week: 'Week 3', bookings: 48, completed: 41, noShows: 5, cancelled: 2 },
      { week: 'Week 4', bookings: 55, completed: 50, noShows: 2, cancelled: 3 },
    ],
    'sample-stats': [
      { lab: 'Organic Chemistry Lab A', totalSamples: 156, avgPerSession: 6.2 },
      { lab: 'Analytical Lab B', totalSamples: 134, avgPerSession: 5.8 },
      { lab: 'Physical Chemistry Lab', totalSamples: 189, avgPerSession: 7.1 },
      { lab: 'Inorganic Lab C', totalSamples: 98, avgPerSession: 5.4 },
    ],
    'no-shows': [
      { student: 'John Doe', email: 'john.doe@university.edu', noShowCount: 3, lastNoShow: '2024-01-10' },
      { student: 'Mike Johnson', email: 'mike.johnson@university.edu', noShowCount: 2, lastNoShow: '2024-01-08' },
      { student: 'Sarah Wilson', email: 'sarah.wilson@university.edu', noShowCount: 2, lastNoShow: '2024-01-05' },
    ]
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    alert(`Exporting ${selectedReport} report as ${format.toUpperCase()}...`);
  };

  const renderReportTable = () => {
    switch (selectedReport) {
      case 'weekly-attendance':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 border-b border-white/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Week</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Total Bookings</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Completed</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">No-Shows</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Cancelled</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {reportData['weekly-attendance'].map((week, index) => (
                  <tr key={index} className="hover:bg-white/20 transition-colors duration-200">
                    <td className="px-6 py-4 font-semibold text-slate-800">{week.week}</td>
                    <td className="px-6 py-4 text-slate-800">{week.bookings}</td>
                    <td className="px-6 py-4 text-green-600 font-semibold">{week.completed}</td>
                    <td className="px-6 py-4 text-orange-600 font-semibold">{week.noShows}</td>
                    <td className="px-6 py-4 text-red-600 font-semibold">{week.cancelled}</td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">
                      {Math.round((week.completed / week.bookings) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'sample-stats':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 border-b border-white/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Laboratory</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Total Samples</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Average per Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {reportData['sample-stats'].map((lab, index) => (
                  <tr key={index} className="hover:bg-white/20 transition-colors duration-200">
                    <td className="px-6 py-4 font-semibold text-slate-800">{lab.lab}</td>
                    <td className="px-6 py-4 text-blue-600 font-semibold">{lab.totalSamples}</td>
                    <td className="px-6 py-4 text-slate-800">{lab.avgPerSession}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'no-shows':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 border-b border-white/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">No-Show Count</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Last No-Show</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {reportData['no-shows'].map((student, index) => (
                  <tr key={index} className="hover:bg-white/20 transition-colors duration-200">
                    <td className="px-6 py-4 font-semibold text-slate-800">{student.student}</td>
                    <td className="px-6 py-4 text-slate-600">{student.email}</td>
                    <td className="px-6 py-4 text-orange-600 font-semibold">{student.noShowCount}</td>
                    <td className="px-6 py-4 text-slate-800">{student.lastNoShow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  const getReportIcon = (reportType: string) => {
    switch (reportType) {
      case 'weekly-attendance':
        return Calendar;
      case 'sample-stats':
        return BarChart3;
      case 'no-shows':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const reportOptions = [
    { value: 'weekly-attendance', label: 'Weekly Attendance' },
    { value: 'sample-stats', label: 'Sample Statistics' },
    { value: 'no-shows', label: 'No-Show Analysis' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Reports & Analytics
        </h1>
        <p className="text-slate-600 text-lg">Generate and export detailed lab usage reports</p>
      </div>

      {/* Report Selection */}
      <GlassCard className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <BarChart3 className="w-6 h-6 text-slate-600" />
            <label className="font-semibold text-slate-800">Select Report Type:</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 min-w-48"
            >
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Report Content */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-white/30">
          <div className="flex items-center space-x-3">
            {React.createElement(getReportIcon(selectedReport), {
              className: "w-6 h-6 text-slate-600"
            })}
            <h2 className="text-xl font-bold text-slate-800">
              {reportOptions.find(option => option.value === selectedReport)?.label}
            </h2>
          </div>
        </div>

        {renderReportTable()}
      </GlassCard>

      {/* Summary Cards */}
      {selectedReport === 'weekly-attendance' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Total Bookings</p>
            <p className="text-2xl font-bold text-slate-800">200</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">175</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <p className="text-slate-600 font-medium mb-1">No-Shows</p>
            <p className="text-2xl font-bold text-orange-600">14</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-purple-600">87.5%</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;