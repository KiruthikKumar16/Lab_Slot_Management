'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { TestTube, User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

interface NavigationProps {
  currentPage: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const { user, appUser, isAdmin, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const getNavItems = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', href: '/admin', current: currentPage === 'admin' },
        { name: 'Lab Slots', href: '/admin/lab-slots', current: currentPage === 'lab-slots' },
        { name: 'Bookings', href: '/admin/bookings', current: currentPage === 'bookings' },
        { name: 'Booking Settings', href: '/admin/booking-settings', current: currentPage === 'booking-settings' },
        { name: 'Students', href: '/admin/students', current: currentPage === 'students' },
        { name: 'Reports', href: '/admin/reports', current: currentPage === 'reports' }
      ]
    } else {
      return [
        { name: 'Dashboard', href: '/dashboard', current: currentPage === 'dashboard' },
        { name: 'Book Slot', href: '/book', current: currentPage === 'book' },
        { name: 'My Sessions', href: '/my-sessions', current: currentPage === 'my-sessions' }
      ]
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-white/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <TestTube className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">ChemLab Pro</h1>
              <p className="text-xs text-slate-600">University Lab Management</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1">
            {getNavItems().map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  item.current
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">
                {appUser?.email || user?.email || (isAdmin ? 'Admin' : 'Student')}
              </p>
              <p className="text-xs text-slate-600">
                {isAdmin ? 'Admin' : 'Student'} • {appUser?.email?.split('@')[0] || user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <button onClick={handleSignOut} className="text-slate-600 hover:text-slate-800">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 