import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'

export function useUserSettings() {
  const queryClient = useQueryClient()

  // Fetch settings
  const settingsQuery = useQuery({
    queryKey: ['user_settings'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      // If no settings exist yet, create default settings
      if (!data) {
        const defaultSettings = {
          user_id: user.id,
          phone_number: '',
          notifications_enabled: true,
          email_notifications_enabled: false,
        }
        const { data: inserted, error: insertError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single()
        if (insertError) throw insertError
        return inserted
      }

      return data
    },
  })

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] })
    },
  })

  return {
    settings: settingsQuery.data || {
      phone_number: '',
      notifications_enabled: true,
      email_notifications_enabled: false,
    },
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  }
}
