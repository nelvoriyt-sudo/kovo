import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string | null
  icon: string | null
  is_default: boolean
}

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!user) return
    supabase
      .from('categories')
      .select('id, name, type, color, icon, is_default')
      .order('name')
      .then(({ data }) => {
        setCategories(data ?? [])
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addCategory = useCallback(
    async (name: string, type: 'income' | 'expense', color: string) => {
      if (!user) return
      await supabase.from('categories').insert({ user_id: user.id, name, type, color })
      refresh()
    },
    [user, refresh],
  )

  const renameCategory = useCallback(
    async (id: string, name: string) => {
      await supabase.from('categories').update({ name }).eq('id', id)
      refresh()
    },
    [refresh],
  )

  const recolorCategory = useCallback(
    async (id: string, color: string) => {
      await supabase.from('categories').update({ color }).eq('id', id)
      refresh()
    },
    [refresh],
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      await supabase.from('categories').delete().eq('id', id)
      refresh()
    },
    [refresh],
  )

  return { categories, loading, addCategory, renameCategory, recolorCategory, deleteCategory }
}
