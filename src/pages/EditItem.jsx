import React, { useState } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useMasters } from '../hooks/useMasters'
import { ItemForm } from '../components/ItemForm'

export default function EditItem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { itemQuery, updateItem, isUpdating } = useInventory()
  const { data: item, isLoading: loadingItem, error: itemError } = itemQuery(id)
  const { itemTypes, statusTypes, priorityTypes, isLoading: loadingMasters } = useMasters()
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setError(null)
    try {
      await updateItem({ id, ...formData })
      navigate('/')
    } catch (err) {
      console.error('Update item failed:', err)
      if (err.code === '23505') {
        setError(new Error('An item with this Item Code already exists. Please choose a unique code.'))
      } else {
        setError(err)
      }
    }
  }

  const isLoading = loadingItem || loadingMasters

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-550 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Edit Inventory Item
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Modify details and tracking parameters for this item.
          </p>
        </div>
      </div>

      {/* Main card panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-550">Loading item details...</p>
          </div>
        ) : itemError || !item ? (
          <div className="text-center py-12 text-slate-500">
            <p className="font-semibold text-lg text-rose-600">Failed to load item</p>
            <p className="text-xs">{itemError?.message || 'The specified item does not exist or you do not have permission to edit it.'}</p>
          </div>
        ) : (
          <ItemForm
            itemTypes={itemTypes}
            statusTypes={statusTypes}
            priorityTypes={priorityTypes}
            onSubmit={handleSubmit}
            isSubmitting={isUpdating}
            error={error}
            defaultValues={{
              item_code: item.item_code,
              item_quantity: item.item_quantity,
              item_name: item.item_name,
              unit_type: item.unit_type,
              item_type_id: item.item_type_id,
              status_id: item.status_id,
              priority_id: item.priority_id,
              low_stock_threshold: item.low_stock_threshold,
              is_purchased: item.is_purchased,
              notes: item.notes || '',
              is_active: item.is_active,
            }}
          />
        )}
      </div>
    </div>
  )
}
