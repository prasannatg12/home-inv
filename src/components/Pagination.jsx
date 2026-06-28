import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, pageSize, totalCount, onChangePage }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const startEntry = (page - 1) * pageSize + 1
  const endEntry = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-b-xl">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount === 0 ? 0 : startEntry}</span> to{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{endEntry}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span> entries
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChangePage(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="text-sm text-slate-600 dark:text-slate-300 px-3">
          Page <span className="font-semibold text-slate-800 dark:text-slate-100">{page}</span> of{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-100">{totalPages}</span>
        </div>

        <button
          onClick={() => onChangePage(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
