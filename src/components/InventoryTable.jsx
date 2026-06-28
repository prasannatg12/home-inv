import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'

export function InventoryTable({
  items = [],
  sortColumn,
  sortOrder,
  onSort,
  onDelete,
  isDeleting = false,
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const headers = [
    // { label: 'Item Code', key: 'item_code' },
    { label: 'Name', key: 'item_name' },
    { label: 'Qty / Unit', key: 'item_quantity' },
    { label: 'Category', key: 'item_type' },
    { label: 'Status', key: 'status' },
    { label: 'Priority', key: 'priority' },
    { label: 'Purchased', key: 'is_purchased' },
    { label: 'Threshold', key: 'low_stock_threshold' },
    { label: 'State', key: 'is_active' },
    { label: 'Notes', key: 'notes' },
    { label: 'Updated', key: 'updated_on' },
  ]

  const renderSortIcon = (colKey) => {
    if (sortColumn !== colKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40 group-hover:opacity-100 transition-opacity" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-indigo-600 dark:text-indigo-400" />
    )
  }

  const handleDeleteClick = (e, id) => {
    e.preventDefault()
    setDeleteConfirmId(id)
  }

  const handleConfirmDelete = async (id) => {
    await onDelete(id)
    setDeleteConfirmId(null)
  }

  return (
    <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-t-xl">
      <table className="w-full table-auto border-collapse text-left text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/75 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold select-none">
            {headers.map((h) => (
              <th
                key={h.key}
                onClick={() => onSort(h.key)}
                className="px-6 py-4 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group whitespace-nowrap"
              >
                <div className="flex items-center">
                  {h.label}
                  {renderSortIcon(h.key)}
                </div>
              </th>
            ))}
            <th className="sticky right-0 z-10 px-6 py-4 font-semibold text-right bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm border-l border-slate-200 dark:border-slate-800 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.length === 0 ? (
            <tr>
              <td colSpan={headers.length + 1} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="font-semibold text-base">No inventory items found</p>
                  <p className="text-xs">Try adjusting your filters, adding a new item, or importing a CSV file.</p>
                </div>
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const isLowStock =
                Number(item.item_quantity) <= Number(item.low_stock_threshold) && item.is_active

              return (
                <tr
                  key={item.id}
                  className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${isLowStock
                    ? 'bg-rose-50/20 dark:bg-rose-950/5 border-l-4 border-l-rose-500'
                    : 'border-l-4 border-l-transparent'
                    }`}
                >
                  {/* Name */}
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                    {item.item_name}
                    {isLowStock && (
                      <span
                        className="inline-flex items-center gap-0.5 ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                        title="Low Stock"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        LOW STOCK
                      </span>
                    )}
                  </td>


                  {/* Quantity / Unit */}
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                    {item.item_quantity} <span className="text-xs font-normal text-slate-400">{item.unit_type}</span>
                  </td>

                  {/* Item Type */}
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {item.item_types?.name}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge statusName={item.status_types?.name} />
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityBadge priorityName={item.priority_types?.name} />
                  </td>

                  {/* Purchased */}
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {item.is_purchased ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                    )}
                  </td>

                  {/* Low Stock Threshold */}
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
                    {item.low_stock_threshold} <span className="text-[10px] text-slate-400">{item.unit_type}</span>
                  </td>

                  {/* Is Active */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={item.notes}>
                    {item.notes || '-'}
                  </td>

                  {/* Updated On */}
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                    {new Date(item.updated_on).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>

                  {/* Actions — sticky right */}
                  <td className="sticky right-0 z-10 px-6 py-4 whitespace-nowrap text-right bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-l border-slate-200 dark:border-slate-800 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <span className="font-medium text-rose-600">Delete?</span>
                        <button
                          onClick={() => handleConfirmDelete(item.id)}
                          disabled={isDeleting}
                          className="bg-rose-600 text-white px-2.5 py-1 rounded hover:bg-rose-700 disabled:opacity-50 cursor-pointer font-semibold"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isDeleting}
                          className="bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded hover:bg-slate-350 dark:hover:bg-slate-700 cursor-pointer font-semibold"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3.5">
                        <Link
                          to={`/edit/${item.id}`}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          title="Edit Item"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={(e) => handleDeleteClick(e, item.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
