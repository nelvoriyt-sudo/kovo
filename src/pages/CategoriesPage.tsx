import { TrashSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CATEGORY_PALETTE } from '@/lib/categoryColors'
import { useCategories, type Category } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'

export function CategoriesPage() {
  const { categories, loading, addCategory, renameCategory, recolorCategory, deleteCategory } =
    useCategories()

  const expense = categories.filter((c) => c.type === 'expense')
  const income = categories.filter((c) => c.type === 'income')

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">Categories</h1>
      <p className="mt-1 text-[15px] text-muted">
        Rename, recolor, add, or remove the categories your transactions use.
      </p>

      {loading ? (
        <p className="mt-10 text-[15px] text-muted">Loading…</p>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          <CategoryGroup
            title="Expense categories"
            items={expense}
            type="expense"
            onAdd={addCategory}
            onRename={renameCategory}
            onRecolor={recolorCategory}
            onDelete={deleteCategory}
          />
          <CategoryGroup
            title="Income categories"
            items={income}
            type="income"
            onAdd={addCategory}
            onRename={renameCategory}
            onRecolor={recolorCategory}
            onDelete={deleteCategory}
          />
        </div>
      )}
    </div>
  )
}

function CategoryGroup({
  title,
  items,
  type,
  onAdd,
  onRename,
  onRecolor,
  onDelete,
}: {
  title: string
  items: Category[]
  type: 'income' | 'expense'
  onAdd: (name: string, type: 'income' | 'expense', color: string) => void
  onRename: (id: string, name: string) => void
  onRecolor: (id: string, color: string) => void
  onDelete: (id: string) => void
}) {
  const [newName, setNewName] = useState('')

  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-light">{title}</h2>
      <div className="flex flex-col gap-2">
        {items.map((c) => (
          <CategoryRow key={c.id} category={c} onRename={onRename} onRecolor={onRecolor} onDelete={onDelete} />
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          const color = CATEGORY_PALETTE[items.length % CATEGORY_PALETTE.length]
          onAdd(newName.trim(), type, color)
          setNewName('')
        }}
      >
        <Input
          placeholder={`Add ${type} category…`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" className="w-auto px-4">
          Add
        </Button>
      </form>
    </section>
  )
}

function CategoryRow({
  category,
  onRename,
  onRecolor,
  onDelete,
}: {
  category: Category
  onRename: (id: string, name: string) => void
  onRecolor: (id: string, color: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [pickerOpen, setPickerOpen] = useState(false)
  const color = category.color ?? '#a49b8f'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="relative">
        <button
          type="button"
          aria-label={`Change color for ${category.name}`}
          onClick={() => setPickerOpen((v) => !v)}
          className="h-6 w-6 touch-manipulation rounded-full border border-border"
          style={{ backgroundColor: color }}
        />
        {pickerOpen && (
          <div className="absolute left-0 top-8 z-10 flex w-40 flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-2 shadow-lg">
            {CATEGORY_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Use ${c}`}
                onClick={() => {
                  onRecolor(category.id, c)
                  setPickerOpen(false)
                }}
                className={cn(
                  'h-6 w-6 touch-manipulation rounded-full border-2',
                  color === c ? 'border-ink' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) onRename(category.id, name.trim())
            setEditing(false)
          }}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
          <Button type="submit" className="h-9 w-auto px-3">
            Save
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-[15px] text-ink"
        >
          {category.name}
        </button>
      )}

      {!editing && (
        <button
          type="button"
          aria-label={`Delete ${category.name}`}
          onClick={() => {
            if (confirm(`Delete "${category.name}"? Transactions using it will become uncategorized, and any budget for it will be removed.`)) {
              onDelete(category.id)
            }
          }}
          className="touch-manipulation rounded-full p-1.5 text-muted-light hover:bg-paper-dim hover:text-[#a34c3f]"
        >
          <TrashSimple className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
