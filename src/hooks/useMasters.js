import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'

export function useMasters() {
  const itemTypesQuery = useQuery({
    queryKey: ['master', 'item_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_inventory_item_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  })

  const statusTypesQuery = useQuery({
    queryKey: ['master', 'status_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_inventory_status_types')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })

  const priorityTypesQuery = useQuery({
    queryKey: ['master', 'priority_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_inventory_priority_types')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })

  return {
    itemTypes: itemTypesQuery.data || [],
    statusTypes: statusTypesQuery.data || [],
    priorityTypes: priorityTypesQuery.data || [],
    isLoading:
      itemTypesQuery.isLoading ||
      statusTypesQuery.isLoading ||
      priorityTypesQuery.isLoading,
    isError:
      itemTypesQuery.isError ||
      statusTypesQuery.isError ||
      priorityTypesQuery.isError,
    error:
      itemTypesQuery.error ||
      statusTypesQuery.error ||
      priorityTypesQuery.error,
  }
}
