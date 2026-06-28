import React, { useState, useEffect } from 'react'
import { useUserSettings } from '../hooks/useUserSettings'
import { Settings as SettingsIcon, Phone, AlertCircle, Save, Loader2, Mail, CheckCircle } from 'lucide-react'

export default function Settings() {
  const { settings, isLoading, updateSettings, isUpdating } = useUserSettings()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setPhoneNumber(settings.phone_number || '')
      setNotificationsEnabled(settings.notifications_enabled)
      setEmailNotificationsEnabled(settings.email_notifications_enabled || false)
    }
  }, [settings])

  const handleSave = async (e) => {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    try {
      await updateSettings({
        phone_number: phoneNumber,
        notifications_enabled: notificationsEnabled,
        email_notifications_enabled: emailNotificationsEnabled,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Save settings failed:', err)
      setError('Failed to update settings. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          System Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure low stock alerts and notification preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form container */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
              <p className="text-sm text-slate-500">Loading settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {success && (
                <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400 rounded-lg text-sm">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Your notification settings have been updated.</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 rounded-lg text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Push notifications toggle */}
              <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Low Stock UI Notifications
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450">
                    Show indicators and record alert entries when stock is low.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Phone number field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="phone">
                  Phone Number (for SMS Alerts)
                </label>
                <p className="text-xs text-slate-400">
                  Connect phone for push integrations using Supabase webhook webhooks.
                </p>
                <div className="relative max-w-md">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 focus:bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Email notifications toggle */}
              <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Email Notifications
                    </h3>
                    <span className="text-[9px] font-extrabold tracking-wider uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                      Beta / Future
                    </span>
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-450">
                    Receive weekly summary reports of low-stock items via email.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={emailNotificationsEnabled}
                    onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-650"></div>
                </label>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
              <Mail className="w-4.5 h-4.5 text-indigo-500" />
              SMTP & SMS Integrations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mb-4">
              To trigger SMS alerts automatically to your phone number, configure a Supabase Database Webhook or write a Edge function matching inserts on the <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">notifications</code> table.
            </p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-800 dark:text-amber-400">
              <span className="font-semibold block mb-0.5">Sample API Target:</span>
              Twilio SMS Messaging API or Firebase Cloud Messaging (FCM) webhook URL.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
