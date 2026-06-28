import React, { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckSquare, AlertTriangle, X } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkRead = async (e, id) => {
    e.stopPropagation()
    await markAsRead(id)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden z-50 animate-slide-down">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/75 dark:bg-slate-950/75 border-b border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-indigo-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold dark:bg-rose-950/30 dark:text-rose-400">
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                All caught up! No notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 flex gap-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20 ${
                    !notif.is_read ? 'bg-slate-50/50 dark:bg-slate-800/10' : ''
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-slate-700 dark:text-slate-350 leading-relaxed ${!notif.is_read ? 'font-medium text-slate-900 dark:text-slate-200' : ''}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(notif.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={(e) => handleMarkRead(e, notif.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start cursor-pointer"
                      title="Mark as Read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
