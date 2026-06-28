import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { useInventory } from '../hooks/useInventory'
import { useMasters } from '../hooks/useMasters'
import { InventoryTable } from '../components/InventoryTable'
import { FiltersBar } from '../components/FiltersBar'
import { Pagination } from '../components/Pagination'
import Fab from '../components/Fab'
import {
  Layers,
  AlertTriangle,
  ShoppingCart,
  CheckSquare,
  Plus,
  Loader2,
  Package,
} from 'lucide-react'

export default function InventoryList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [itemType, setItemType] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [isActive, setIsActive] = useState('')
  const [isPurchased, setIsPurchased] = useState('')
  const [sortColumn, setSortColumn] = useState('updated_on')
  const [sortOrder, setSortOrder] = useState('desc')

  const pageSize = 8

  // Fetch Inventory and Masters
  const {
    items,
    totalCount,
    isLoading,
    deleteItem,
    isDeleting,
    bulkUpload,
    isBulkUploading,
  } = useInventory({
    page,
    pageSize,
    search,
    itemType,
    status,
    priority,
    isActive,
    isPurchased,
    sortColumn,
    sortOrder,
  })

  const { itemTypes, statusTypes, priorityTypes } = useMasters()

  // Fetch Dashboard Stats — fetches only 4 lightweight columns for all user items
  // and computes totals client-side (home inventories are small, typically < 500 items).
  const statsQuery = useQuery({
    queryKey: ['inventory_stats'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) return { total: 0, lowStock: 0, purchased: 0, active: 0 }

      const { data: allItems, error } = await supabase
        .from('home_inventory_inventory_items')
        .select('item_quantity, low_stock_threshold, is_purchased, is_active')
        .eq('user_id', user.id)

      if (error) throw error

      const total = allItems.length
      let lowStock = 0
      let purchased = 0
      let active = 0

      allItems.forEach((item) => {
        if (item.is_active) active++
        if (item.is_purchased) purchased++
        if (item.is_active && Number(item.item_quantity) <= Number(item.low_stock_threshold)) {
          lowStock++
        }
      })

      return { total, lowStock, purchased, active }
    },
  })

  // Handle Sort changes
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortOrder('asc')
    }
    setPage(1) // Reset to first page
  }

  // Handle page navigation
  const handleChangePage = (newPage) => {
    setPage(newPage)
  }

  // Handle filter changes (Reset pagination to page 1)
  const handleSetSearch = (val) => {
    setSearch(val)
    setPage(1)
  }
  const handleSetItemType = (val) => {
    setItemType(val)
    setPage(1)
  }
  const handleSetStatus = (val) => {
    setStatus(val)
    setPage(1)
  }
  const handleSetPriority = (val) => {
    setPriority(val)
    setPage(1)
  }
  const handleSetIsActive = (val) => {
    setIsActive(val)
    setPage(1)
  }
  const handleSetIsPurchased = (val) => {
    setIsPurchased(val)
    setPage(1)
  }

  const stats = statsQuery.data || { total: 0, lowStock: 0, purchased: 0, active: 0 }

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track, filter, and manage your household items.
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Item
        </Link>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Items</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className={`glass-panel p-5 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 ${stats.lowStock > 0 ? 'ring-1 ring-rose-500/30 bg-rose-50/10' : ''
          }`}>
          <div className={`p-3 rounded-xl ${stats.lowStock > 0
            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-550'
            }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock</p>
            <p className={`text-xl font-bold ${stats.lowStock > 0 ? 'text-rose-650 dark:text-rose-450' : 'text-slate-800 dark:text-white'
              }`}>{stats.lowStock}</p>
          </div>
        </div>

        {/* Purchased Items */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Purchased</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.purchased}</p>
          </div>
        </div>

        {/* Active Items */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Items</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.active}</p>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <FiltersBar
        search={search}
        setSearch={handleSetSearch}
        itemType={itemType}
        setItemType={handleSetItemType}
        status={status}
        setStatus={handleSetStatus}
        priority={priority}
        setPriority={handleSetPriority}
        isActive={isActive}
        setIsActive={handleSetIsActive}
        isPurchased={isPurchased}
        setIsPurchased={handleSetIsPurchased}
        itemTypes={itemTypes}
        statusTypes={statusTypes}
        priorityTypes={priorityTypes}
        onBulkUpload={bulkUpload}
        isBulkUploading={isBulkUploading}
      />

      {/* Inventory Grid Table with loading skeleton */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-550">Fetching inventory items...</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <InventoryTable
            items={items}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
            onDelete={deleteItem}
            isDeleting={isDeleting}
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onChangePage={handleChangePage}
          />
        </div>
      )}
      <Fab to="/create" />
    </div>
  )
}
