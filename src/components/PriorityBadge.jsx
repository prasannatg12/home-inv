import React from 'react'

export function PriorityBadge({ priorityName }) {
  const normalized = (priorityName || '').toLowerCase().trim()

  let colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  
  if (normalized === 'low') {
    colorClasses = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  } else if (normalized === 'medium') {
    colorClasses = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
  } else if (normalized === 'high') {
    colorClasses = 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400'
  } else if (normalized === 'urgent') {
    colorClasses = 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 animate-pulse'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${colorClasses}`}>
      {priorityName}
    </span>
  )
}
