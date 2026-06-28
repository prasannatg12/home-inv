import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Loader2 } from 'lucide-react'

const itemSchema = z.object({
  item_code: z.string().min(1, 'Item Code is required').max(100),
  item_quantity: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' }).min(0, 'Quantity must be 0 or greater')
  ),
  unit_type: z.enum(['gm', 'kg', 'ml', 'ltr'], { required_error: 'Unit is required' }),
  item_name: z.string(),
  item_type_id: z.string().uuid('Item Type is required'),
  status_id: z.string().uuid('Status is required'),
  priority_id: z.string().uuid('Priority is required'),
  low_stock_threshold: z.preprocess(
    (val) => (val === '' || val === null ? 0 : Number(val)),
    z.number({ invalid_type_error: 'Threshold must be a number' }).min(0, 'Threshold must be 0 or greater')
  ),
  is_purchased: z.boolean().default(false),
  notes: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

export function ItemForm({
  itemTypes = [],
  statusTypes = [],
  priorityTypes = [],
  onSubmit,
  defaultValues,
  isSubmitting = false,
  error = null,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultValues || {
      item_code: '',
      item_name: '',
      item_quantity: '',
      unit_type: 'kg',
      item_type_id: '',
      status_id: '',
      priority_id: '',
      low_stock_threshold: 0,
      is_purchased: false,
      notes: '',
      is_active: true,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{error.message || 'An error occurred while saving the item.'}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Item Code */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="item_code">
            Item Code <span className="text-rose-500">*</span>
          </label>
          <input
            id="item_code"
            type="text"
            placeholder="e.g. SPICE-MD-01"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 ${errors.item_code
              ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-400 dark:border-rose-950'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-150 focus:border-indigo-500'
              }`}
            {...register('item_code')}
          />
          {errors.item_code && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.item_code.message}
            </p>
          )}
        </div>

        {/* Item Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="item_name">
            Item Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="item_name"
            type="text"
            placeholder="e.g. Red chilly powder"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 ${errors.item_name
              ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-400 dark:border-rose-950'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-150 focus:border-indigo-500'
              }`}
            {...register('item_name')}
          />
          {errors.item_name && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.item_name.message}
            </p>
          )}
        </div>


        {/* Item Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="item_type_id">
            Category / Item Type <span className="text-rose-500">*</span>
          </label>
          <select
            id="item_type_id"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 ${errors.item_type_id
              ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-400 dark:border-rose-950'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-150 focus:border-indigo-500'
              }`}
            {...register('item_type_id')}
          >
            <option value="">Select Category</option>
            {itemTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.item_type_id && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.item_type_id.message}
            </p>
          )}
        </div>


        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="item_quantity">
            Quantity <span className="text-rose-500">*</span>
          </label>
          <input
            id="item_quantity"
            type="number"
            step="any"
            placeholder="0"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 ${errors.item_quantity
              ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-400 dark:border-rose-950'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-150 focus:border-indigo-500'
              }`}
            {...register('item_quantity')}
          />
          {errors.item_quantity && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.item_quantity.message}
            </p>
          )}
        </div>

        {/* Unit Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="unit_type">
            Unit Type <span className="text-rose-500">*</span>
          </label>
          <select
            id="unit_type"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 ${errors.unit_type
              ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-400 dark:border-rose-950'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-150 focus:border-indigo-500'
              }`}
            {...register('unit_type')}
          >
            <option value="gm">gm (Grams)</option>
            <option value="kg">kg (Kilograms)</option>
            <option value="ml">ml (Milliliters)</option>
            <option value="ltr">ltr (Liters)</option>
          </select>
          {errors.unit_type && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.unit_type.message}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="status_id">
            Status <span className="text-rose-500">*</span>
          </label>
          <select
            id="status_id"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 ${errors.status_id
              ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-400 dark:border-rose-950'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-150 focus:border-indigo-500'
              }`}
            {...register('status_id')}
          >
            <option value="">Select Status</option>
            {statusTypes.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          {errors.status_id && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.status_id.message}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="priority_id">
            Priority <span className="text-rose-500">*</span>
          </label>
          <select
            id="priority_id"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 ${errors.priority_id
              ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-400 dark:border-rose-950'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-150 focus:border-indigo-500'
              }`}
            {...register('priority_id')}
          >
            <option value="">Select Priority</option>
            {priorityTypes.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.name}
              </option>
            ))}
          </select>
          {errors.priority_id && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.priority_id.message}
            </p>
          )}
        </div>

        {/* Low Stock Threshold */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="low_stock_threshold">
            Low Stock Threshold
          </label>
          <input
            id="low_stock_threshold"
            type="number"
            step="any"
            placeholder="0"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 ${errors.low_stock_threshold
              ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-400 dark:border-rose-950'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-150 focus:border-indigo-500'
              }`}
            {...register('low_stock_threshold')}
          />
          {errors.low_stock_threshold && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.low_stock_threshold.message}
            </p>
          )}
        </div>

        {/* Toggles (Active / Purchased) */}
        <div className="flex flex-col gap-4 justify-center">
          {/* Is Purchased Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
              {...register('is_purchased')}
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mark as Purchased</span>
          </label>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Item Status (Active)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register('is_active')} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Add details, storage location, description..."
          className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500"
          {...register('notes')}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Item...
            </>
          ) : (
            'Save Inventory Item'
          )}
        </button>
      </div>
    </form>
  )
}
