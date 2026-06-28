import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'

export function useInventory({
  page = 1,
  pageSize = 10,
  search = '',
  itemType = '',
  status = '',
  priority = '',
  isActive = '',
  isPurchased = '',
  sortColumn = 'updated_on',
  sortOrder = 'desc',
} = {}) {
  const queryClient = useQueryClient()

  // Fetch Inventory List (Paginated, filtered, sorted)
  const listQuery = useQuery({
    queryKey: [
      'inventory',
      { page, pageSize, search, itemType, status, priority, isActive, isPurchased, sortColumn, sortOrder },
    ],
    queryFn: async () => {
      // Get current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      let query = supabase
        .from('home_inventory_inventory_items')
        .select(
          '*, item_types:home_inventory_item_types(id, name), status_types:home_inventory_status_types(id, name), priority_types:home_inventory_priority_types(id, name)',
          { count: 'exact' }
        )
        .eq('user_id', user.id)

      // Apply Search
      if (search.trim()) {
        query = query.or(`item_code.ilike.%${search}%,item_name.ilike.%${search}%,notes.ilike.%${search}%`)
      }

      // Apply Filters
      if (itemType) query = query.eq('item_type_id', itemType)
      if (status) query = query.eq('status_id', status)
      if (priority) query = query.eq('priority_id', priority)
      if (isActive !== '') query = query.eq('is_active', isActive === 'true')
      if (isPurchased !== '') query = query.eq('is_purchased', isPurchased === 'true')

      // Apply Sorting
      // If we are sorting by item_type, status, or priority, map to foreign key ids
      let orderByCol = sortColumn
      if (sortColumn === 'item_type') orderByCol = 'item_type_id'
      if (sortColumn === 'status') orderByCol = 'status_id'
      if (sortColumn === 'priority') orderByCol = 'priority_id'

      query = query.order(orderByCol, { ascending: sortOrder === 'asc' })

      // Apply Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, count, error } = await query
      if (error) throw error

      return { items: data || [], totalCount: count || 0 }
    },
  })

  // Fetch Single Inventory Item
  const itemQuery = (id) =>
    useQuery({
      queryKey: ['inventory_item', id],
      queryFn: async () => {
        if (!id) return null
        const { data, error } = await supabase
          .from('home_inventory_inventory_items')
          .select('*, item_types:home_inventory_item_types(id, name), status_types:home_inventory_status_types(id, name), priority_types:home_inventory_priority_types(id, name)')
          .eq('id', id)
          .single()
        if (error) throw error
        return data
      },
      enabled: !!id,
    })

  // Create Item Mutation
  const createMutation = useMutation({
    mutationFn: async (newItem) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('home_inventory_inventory_items')
        .insert({
          ...newItem,
          user_id: user.id,
          updated_by: user.id,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_stats'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] })
    },
  })

  // Update Item Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('home_inventory_inventory_items')
        .update({
          ...updates,
          updated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_item', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['inventory_stats'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] })
    },
  })

  // Delete Item Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('home_inventory_inventory_items')
        .delete()
        .eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_stats'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] })
    },
  })

  // Bulk Upload Items Mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (items) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const preparedItems = items.map((item) => ({
        ...item,
        user_id: user.id,
        updated_by: user.id,
      }))

      // Supabase upsert using item_code as matching constraint
      const { data, error } = await supabase
        .from('home_inventory_inventory_items')
        .upsert(preparedItems, { onConflict: 'item_code' })
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_stats'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] })
    },
  })

  return {
    items: listQuery.data?.items || [],
    totalCount: listQuery.data?.totalCount || 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    itemQuery,
    createItem: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateItem: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    bulkUpload: bulkUploadMutation.mutateAsync,
    isBulkUploading: bulkUploadMutation.isPending,
  }
}
