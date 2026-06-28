import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { History, Loader2, ArrowRight, CornerDownRight } from 'lucide-react'

export default function AuditLogs() {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const { data, error: fetchError } = await supabase
        .from('home_inventory_audit_logs')
        .select('*')
        .eq('performed_by', user.id)
        .order('performed_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    },
  })

  // Helper to format/render change log deltas
  const renderChanges = (log) => {
    const changeObj = log.changes || {}
    const oldVals = changeObj.old || {}
    const newVals = changeObj.new || {}

    if (log.action === 'CREATE') {
      return (
        <span className="text-xs text-slate-550 dark:text-slate-450 italic">
          Item created with initial quantity of{' '}
          <strong className="text-slate-800 dark:text-slate-200">
            {newVals.item_quantity} {newVals.unit_type}
          </strong>
        </span>
      )
    }

    if (log.action === 'DELETE') {
      return (
        <span className="text-xs text-rose-600 dark:text-rose-450 italic">
          Item permanently deleted
        </span>
      )
    }

    // UPDATE - compute delta changes
    const deltas = []
    const fieldsToTrack = [
      { key: 'item_quantity', label: 'Quantity' },
      { key: 'status_id', label: 'Status' },
      { key: 'priority_id', label: 'Priority' },
      { key: 'is_purchased', label: 'Purchased' },
      { key: 'is_active', label: 'Active State' },
      { key: 'notes', label: 'Notes' },
    ]

    fieldsToTrack.forEach(({ key, label }) => {
      const oldVal = oldVals[key]
      const newVal = newVals[key]

      if (oldVal !== newVal && oldVal !== undefined && newVal !== undefined) {
        let displayOld = String(oldVal === null ? '-' : oldVal)
        let displayNew = String(newVal === null ? '-' : newVal)

        // Handle booleans
        if (typeof oldVal === 'boolean') {
          displayOld = oldVal ? 'Yes' : 'No'
          displayNew = newVal ? 'Yes' : 'No'
        }

        deltas.push(
          <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
            <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-550">{label}:</span>
            <span className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-[10px] line-through text-slate-450">{displayOld}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-semibold">{displayNew}</span>
          </div>
        )
      }
    })

    if (deltas.length === 0) {
      return <span className="text-xs text-slate-400">Metadata updated (no trackable changes)</span>
    }

    return <div className="space-y-0.5 mt-1">{deltas}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Audit Activity Logs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          History log of creations, modifications, and deletions.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-550">Loading activity history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-slate-500">
            <p className="font-semibold text-lg text-rose-600">Failed to load logs</p>
            <p className="text-xs">{error.message || 'An error occurred while loading audit trails.'}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <History className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-800" />
            No audit logs captured yet. Try updating inventory items!
          </div>
        ) : (
          /* Timeline view */
          <div className="relative border-l border-slate-200 dark:border-slate-850 ml-4 pl-6 space-y-8">
            {logs.map((log) => {
              let actionBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              if (log.action === 'CREATE') {
                actionBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
              } else if (log.action === 'DELETE') {
                actionBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
              } else if (log.action === 'UPDATE') {
                actionBadge = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
              }

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 group-hover:scale-110 transition-transform"></span>

                  <div className="space-y-1">
                    {/* Log metadata header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${actionBadge}`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        {log.item_code}
                      </span>
                      <span className="text-xs text-slate-400">
                        at {new Date(log.performed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    {/* Change list */}
                    <div className="pt-1">{renderChanges(log)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
