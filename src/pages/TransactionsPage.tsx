import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useCategories } from '@/hooks/useCategories'
import { emptyFilters, useFilteredTransactions, type TransactionFilters } from '@/hooks/useFilteredTransactions'
import { getCategoryColor } from '@/lib/categoryColors'
import { useFormatCurrency } from '@/lib/currencyContext'
import { notifyTransactionsChanged } from '@/lib/events'
import { supabase } from '@/lib/supabase'

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters)
  const { transactions, loading } = useFilteredTransactions(filters)
  const { categories } = useCategories()
  const formatCurrency = useFormatCurrency()

  function update<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  async function handleDelete(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    notifyTransactionsChanged()
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]))

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Transactions</h1>
      <p className="mt-1 text-[15px] text-muted">Search and filter everything you've logged.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Input
          placeholder="Search description…"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="col-span-2 sm:col-span-3 lg:col-span-2"
        />
        <Select value={filters.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input type="date" value={filters.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} aria-label="From date" />
        <Input type="date" value={filters.dateTo} onChange={(e) => update('dateTo', e.target.value)} aria-label="To date" />
        <Input
          type="number"
          placeholder="Min $"
          value={filters.amountMin}
          onChange={(e) => update('amountMin', e.target.value)}
          aria-label="Minimum amount"
        />
        <Input
          type="number"
          placeholder="Max $"
          value={filters.amountMax}
          onChange={(e) => update('amountMax', e.target.value)}
          aria-label="Maximum amount"
        />
      </div>

      {loading ? (
        <p className="mt-10 text-[15px] text-muted">Loading…</p>
      ) : transactions.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No transactions found</p>
          <p className="mt-2 text-[15px] text-muted">Try widening your filters, or add a new one.</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {transactions.map((t) => {
            const category = t.category_id ? categoryById.get(t.category_id) : undefined
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category ? getCategoryColor(category) : '#a49b8f' }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium text-ink">
                    {t.description || category?.name || (t.type === 'income' ? 'Income' : 'Expense')}
                  </div>
                  <div className="text-[13px] text-muted-light">
                    {t.date}
                    {category ? ` · ${category.name}` : ''}
                  </div>
                </div>
                <span
                  className={
                    t.type === 'income'
                      ? 'text-[15px] font-semibold text-[#4d7358]'
                      : 'text-[15px] font-semibold text-ink'
                  }
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatCurrency(Number(t.amount))}
                </span>
                <button
                  type="button"
                  aria-label="Delete transaction"
                  onClick={() => handleDelete(t.id)}
                  className="touch-manipulation rounded-full p-1.5 text-muted-light hover:bg-paper-dim hover:text-[#a34c3f]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 4h10M6.5 4V2.5h3V4M4.5 4l.5 9.5h6l.5-9.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
