'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { TestTube, User, LogOut, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NotificationItem } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface NavigationProps {
  currentPage: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const { user, appUser, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/notifications')
        const payload = await res.json()
        if (res.ok) setNotifications(payload.notifications || [])
      } catch {}
    }
    load()
  }, [])

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
              <button onClick={() => setOpen(!open)} className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full" />
                )}
              </button>
              <button onClick={handleSignOut} className="text-slate-600 hover:text-slate-800">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {open && (
        <div className="absolute right-4 mt-2 w-80 bg-white shadow-xl rounded-xl border border-slate-200 z-50">
          <div className="p-3 border-b border-slate-100 font-semibold text-slate-800">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length ? notifications.map(n => (
              <div key={n.id} className={`p-3 text-sm ${n.is_read ? 'bg-white' : 'bg-slate-50'}`}>
                <div className="font-medium text-slate-800">{n.title}</div>
                <div className="text-slate-600">{n.message}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            )) : (
              <div className="p-4 text-slate-500 text-sm">No notifications</div>
            )}
          </div>
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={async () => {
                const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
                try {
                  await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: unreadIds }) })
                  setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
                } catch {}
              }}
              className="m-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Mark all as read
            </button>
          )}
        </div>
      )}
    </div>
  )
} 