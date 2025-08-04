import React, { useState } from 'react';
import { User, Mail, Calendar, Trash2, Search } from 'lucide-react';
import { User as UserType } from '../App';
import GlassCard from '../components/GlassCard';

interface StudentManagementPageProps {
  user: UserType;
}

interface Student {
  id: string;
  name: string;
  email: string;
  totalBookings: number;
  completedSessions: number;
  lastActivity: string;
  status: 'active' | 'inactive';
}

const StudentManagementPage: React.FC<StudentManagementPageProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock students data
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'John Doe', email: 'john.doe@university.edu', totalBookings: 15, completedSessions: 12, lastActivity: '2024-01-14', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@university.edu', totalBookings: 22, completedSessions: 20, lastActivity: '2024-01-15', status: 'active' },
    { id: '3', name: 'Mike Johnson', email: 'mike.johnson@university.edu', totalBookings: 8, completedSessions: 6, lastActivity: '2024-01-10', status: 'active' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@university.edu', totalBookings: 18, completedSessions: 15, lastActivity: '2024-01-12', status: 'active' },
    { id: '5', name: 'David Brown', email: 'david.brown@university.edu', totalBookings: 3, completedSessions: 2, lastActivity: '2023-12-20', status: 'inactive' },
    { id: '6', name: 'Emily Davis', email: 'emily.davis@university.edu', totalBookings: 25, completedSessions: 23, lastActivity: '2024-01-15', status: 'active' },
  ]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (window.confirm(`Are you sure you want to remove ${student?.name} from the system?`)) {
      setStudents(students.filter(s => s.id !== studentId));
      alert('Student removed successfully!');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getCompletionRate = (completed: number, total: number) => {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Student Management
        </h1>
        <p className="text-slate-600 text-lg">Manage and monitor all registered students</p>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800 placeholder-slate-500"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-center">
            <p className="text-slate-600 font-medium mb-1">Total Students</p>
            <p className="text-3xl font-bold text-slate-800">{students.length}</p>
            <p className="text-sm text-green-600 font-medium">
              {students.filter(s => s.status === 'active').length} active
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <GlassCard key={student.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{getInitials(student.name)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{student.name}</h3>
                  <p className="text-sm text-slate-600 flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{student.email}</span>
                  </p>
                </div>
              </div>
              
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                student.status === 'active'
                  ? 'bg-green-100/80 text-green-700'
                  : 'bg-gray-100/80 text-gray-700'
              }`}>
                {student.status}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Bookings</span>
                <span className="font-semibold text-slate-800">{student.totalBookings}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Completed</span>
                <span className="font-semibold text-slate-800">{student.completedSessions}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Completion Rate</span>
                <span className="font-semibold text-slate-800">
                  {getCompletionRate(student.completedSessions, student.totalBookings)}%
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Last active: {student.lastActivity}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/30">
              <button
                onClick={() => handleRemoveStudent(student.id)}
                className="w-full flex items-center justify-center space-x-2 py-2 text-red-600 hover:bg-red-50/60 rounded-xl transition-all duration-300 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Student</span>
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <GlassCard className="p-12 text-center">
          <p className="text-slate-600 text-lg">No students found matching your search.</p>
        </GlassCard>
      )}
    </div>
  );
};

export default StudentManagementPage;