import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useMasters } from '../hooks/useMasters'
import { ItemForm } from '../components/ItemForm'

export default function CreateItem() {
  const navigate = useNavigate()
  const { createItem, isCreating } = useInventory()
  const { itemTypes, statusTypes, priorityTypes, isLoading: loadingMasters } = useMasters()
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setError(null)
    try {
      await createItem(formData)
      navigate('/')
    } catch (err) {
      console.error('Create item failed:', err)
      
      // Handle unique constraint check
      if (err.code === '23505') {
        setError(new Error('An item with this Item Code already exists. Please choose a unique code.'))
      } else {
        setError(err)
      }
    }
  }

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
            Create Inventory Item
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fill in the details to add a new item to your pantry or storage.
          </p>
        </div>
      </div>

      {/* Main card panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        {loadingMasters ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <span className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-650 animate-spin"></span>
            <p className="text-sm text-slate-500">Loading configurations...</p>
          </div>
        ) : (
          <ItemForm
            itemTypes={itemTypes}
            statusTypes={statusTypes}
            priorityTypes={priorityTypes}
            onSubmit={handleSubmit}
            isSubmitting={isCreating}
            error={error}
          />
        )}
      </div>
    </div>
  )
}
