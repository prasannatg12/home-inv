import React, { useRef, useState } from 'react'
import { Download, Upload, Search, X, SlidersHorizontal, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { supabase } from '../supabaseClient'

export function FiltersBar({
  search,
  setSearch,
  itemType,
  setItemType,
  status,
  setStatus,
  priority,
  setPriority,
  isActive,
  setIsActive,
  isPurchased,
  setIsPurchased,
  itemTypes = [],
  statusTypes = [],
  priorityTypes = [],
  onBulkUpload,
  isBulkUploading = false,
}) {
  const [showFilters, setShowFilters] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef(null)

  // Clear all filters
  const handleResetFilters = () => {
    setSearch('')
    setItemType('')
    setStatus('')
    setPriority('')
    setIsActive('')
    setIsPurchased('')
  }

  // Handle Export CSV
  const handleExportCSV = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('home_inventory_inventory_items')
        .select('*, item_types:home_inventory_item_types(name), status_types:home_inventory_status_types(name), priority_types:home_inventory_priority_types(name)')
        .eq('user_id', user.id)

      // Apply current filters to export the matching dataset (ignoring pagination)
      if (search.trim()) {
        query = query.or(`item_code.ilike.%${search}%,notes.ilike.%${search}%`)
      }
      if (itemType) query = query.eq('item_type_id', itemType)
      if (status) query = query.eq('status_id', status)
      if (priority) query = query.eq('priority_id', priority)
      if (isActive !== '') query = query.eq('is_active', isActive === 'true')
      if (isPurchased !== '') query = query.eq('is_purchased', isPurchased === 'true')

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        alert('No data matches the selected filters to export.')
        return
      }

      // Format CSV Headers & rows
      const csvHeaders = [
        'Item Code',
        'Quantity',
        'Unit Type',
        'Category / Type',
        'Status',
        'Priority',
        'Low Stock Threshold',
        'Is Purchased',
        'Active',
        'Notes',
        'Last Updated',
      ]

      const csvRows = data.map((item) => [
        `"${item.item_code.replace(/"/g, '""')}"`,
        item.item_quantity,
        item.unit_type,
        `"${(item.item_types?.name || '').replace(/"/g, '""')}"`,
        `"${(item.status_types?.name || '').replace(/"/g, '""')}"`,
        `"${(item.priority_types?.name || '').replace(/"/g, '""')}"`,
        item.low_stock_threshold,
        item.is_purchased ? 'TRUE' : 'FALSE',
        item.is_active ? 'TRUE' : 'FALSE',
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        new Date(item.updated_on).toLocaleDateString(),
      ])

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [csvHeaders.join(','), ...csvRows.map((e) => e.join(','))].join('\n')

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `home_inventory_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('CSV Export failed:', err)
      alert('Failed to export CSV. Please try again.')
    }
  }

  // Handle CSV Import
  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadSuccess(false)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result
        if (typeof text !== 'string') throw new Error('Invalid file type')

        const lines = text.split('\n').map((l) => l.trim())
        if (lines.length < 2) throw new Error('CSV is empty or missing header')

        // Clean headers and find positions
        const csvHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))

        const requiredHeaders = ['item_code', 'item_quantity', 'unit_type', 'item_type', 'status', 'priority']
        const missing = requiredHeaders.filter((h) => !csvHeaders.includes(h))
        if (missing.length > 0) {
          throw new Error(`Missing required headers: ${missing.join(', ')}`)
        }

        const itemsToUpload = []

        // Parse rows
        for (let i = 1; i < lines.length; i++) {
          const rowText = lines[i]
          if (!rowText) continue

          // Handle comma-separated fields while keeping quotes intact
          // Simple regex-based CSV splitter
          const values = rowText.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rowText.split(',')
          const row = values.map((val) => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))

          const itemObj = {}
          csvHeaders.forEach((header, index) => {
            if (index < row.length) {
              itemObj[header] = row[index]
            }
          })

          // Validate fields and map to Master UUIDs
          const itemCode = itemObj.item_code
          const itemQuantity = parseFloat(itemObj.item_quantity)
          const unitType = itemObj.unit_type
          const typeName = itemObj.item_type?.toLowerCase()
          const statusName = itemObj.status?.toLowerCase()
          const priorityName = itemObj.priority?.toLowerCase()

          if (!itemCode) throw new Error(`Row ${i + 1}: Item Code is empty`)
          if (isNaN(itemQuantity)) throw new Error(`Row ${i + 1}: Quantity must be a number`)
          if (!['gm', 'kg', 'ml', 'ltr'].includes(unitType)) {
            throw new Error(`Row ${i + 1}: Invalid unit type "${unitType}". Must be gm, kg, ml, or ltr`)
          }

          // Match category
          const matchedType = itemTypes.find((t) => t.name.toLowerCase() === typeName)
          if (!matchedType) {
            throw new Error(`Row ${i + 1}: Unknown category "${itemObj.item_type}". Options are: ${itemTypes.map((t) => t.name).join(', ')}`)
          }

          // Match status
          const matchedStatus = statusTypes.find((s) => s.name.toLowerCase() === statusName)
          if (!matchedStatus) {
            throw new Error(`Row ${i + 1}: Unknown status "${itemObj.status}". Options are: ${statusTypes.map((s) => s.name).join(', ')}`)
          }

          // Match priority
          const matchedPriority = priorityTypes.find((p) => p.name.toLowerCase() === priorityName)
          if (!matchedPriority) {
            throw new Error(`Row ${i + 1}: Unknown priority "${itemObj.priority}". Options are: ${priorityTypes.map((p) => p.name).join(', ')}`)
          }

          itemsToUpload.push({
            item_code: itemCode,
            item_quantity: itemQuantity,
            unit_type: unitType,
            item_type_id: matchedType.id,
            status_id: matchedStatus.id,
            priority_id: matchedPriority.id,
            low_stock_threshold: parseFloat(itemObj.low_stock_threshold || '0'),
            is_purchased: (itemObj.is_purchased || '').toUpperCase() === 'TRUE',
            is_active: itemObj.is_active === undefined || (itemObj.is_active || '').toUpperCase() !== 'FALSE',
            notes: itemObj.notes || '',
          })
        }

        // Send to Database
        await onBulkUpload(itemsToUpload)
        setUploadSuccess(true)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (err) {
        console.error('CSV parse error:', err)
        setUploadError(err.message || 'Failed to parse CSV file.')
      }
    }
    reader.readAsText(file)
  }

  const isFiltered = search || itemType || status || priority || isActive || isPurchased

  return (
    <div className="space-y-4">
      {/* Messages */}
      {uploadError && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Import Error:</span> {uploadError}
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400 rounded-lg text-sm animate-fade-in">
          <FileSpreadsheet className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Success!</span> Bulk upload completed successfully.
          </div>
          <button onClick={() => setUploadSuccess(false)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 focus:bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Toggle filter panel */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all cursor-pointer ${showFilters || isFiltered
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {isFiltered && '(Active)'}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          {/* Bulk Upload */}
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            {isBulkUploading ? 'Uploading...' : 'Bulk Upload'}
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCSVImport}
              disabled={isBulkUploading}
              className="hidden"
            />
          </label>

          {/* CSV Help info */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              alert(
                'CSV format template requirements:\nHeaders: item_code, item_quantity, unit_type, item_type, status, priority, low_stock_threshold, is_purchased, is_active, notes\n\nExample row:\nSPICE-CHILI, 500, gm, spices, available, high, 100, true, true, Mild chili powder'
              )
            }}
            className="text-xs text-indigo-600 hover:underline px-1 dark:text-indigo-400"
          >
            CSV Format Help
          </a>
        </div>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-down">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {itemTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              {statusTypes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              {priorityTypes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Item State
            </label>
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All States</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {/* Purchased Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Purchased State
            </label>
            <select
              value={isPurchased}
              onChange={(e) => setIsPurchased(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Purchased</option>
              <option value="true">Purchased</option>
              <option value="false">Not Purchased</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <div className="sm:col-span-2 md:col-span-5 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
