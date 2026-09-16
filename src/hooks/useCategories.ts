import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string | null
  icon: string | null
}

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('categories')
      .select('id, name, type, color, icon')
      .order('name')
      .then(({ data }) => {
        if (cancelled) return
        setCategories(data ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return { categories, loading }
}
