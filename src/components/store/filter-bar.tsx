'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Category } from '@/types/db'

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

interface FilterBarProps {
  categories: Pick<Category, 'id' | 'name' | 'slug'>[]
  availableSizes: string[]
  activeCategories: string[]
  activeSizes: string[]
  activeSort?: string
  query?: string
  totalCount?: number
}

function selectionLabel(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural
}

export function FilterBar({
  categories,
  availableSizes,
  activeCategories,
  activeSizes,
  activeSort,
  query,
  totalCount,
}: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [draftCategories, setDraftCategories] = useState<string[]>(activeCategories)
  const [draftSizes, setDraftSizes] = useState<string[]>(activeSizes)

  useEffect(() => {
    if (!mobileFilterOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileFilterOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileFilterOpen])

  const update = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      params.delete('page')
      const next = params.toString()
      router.push(`/products${next ? `?${next}` : ''}`)
    },
    [router, searchParams],
  )

  function toggleSelection(key: 'category' | 'size', current: string[], value: string) {
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    update({ [key]: next.join(',') || undefined })
  }

  function openMobileFilters() {
    setDraftCategories(activeCategories)
    setDraftSizes(activeSizes)
    setMobileFilterOpen(true)
  }

  function toggleDraft(value: string, type: 'category' | 'size') {
    const setter = type === 'category' ? setDraftCategories : setDraftSizes
    setter((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value])
  }

  function applyMobileFilters() {
    update({
      category: draftCategories.join(',') || undefined,
      size: draftSizes.join(',') || undefined,
    })
    setMobileFilterOpen(false)
  }

  const hasActiveFilters = Boolean(activeCategories.length || activeSizes.length || activeSort || query)
  const activeFilterCount = activeCategories.length + activeSizes.length
  const countLabel = totalCount == null
    ? 'Pieces'
    : `${totalCount} ${selectionLabel(totalCount, 'piece')}`

  const filterOptions = (
    <div className="flex flex-col gap-7">
      <div>
        <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const selected = activeCategories.includes(category.slug)
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleSelection('category', activeCategories, category.slug)}
                aria-pressed={selected}
                className={cn(
                  'border px-3 py-2 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors',
                  selected
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-black hover:text-black',
                )}
              >
                {category.name}
              </button>
            )
          })}
        </div>
      </div>

      {availableSizes.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">Size</p>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const selected = activeSizes.includes(size)
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSelection('size', activeSizes, size)}
                  aria-pressed={selected}
                  className={cn(
                    'flex h-9 min-w-9 items-center justify-center border px-2 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors',
                    selected
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-black hover:text-black',
                  )}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="hidden border-y border-neutral-200 py-5 sm:block">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">Filter collection</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => router.push('/products')}
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-neutral-500 transition-colors hover:text-black"
                >
                  <X className="size-3" /> Clear all
                </button>
              )}
            </div>
            {filterOptions}
          </div>

          <div className="w-56 shrink-0 border-l border-neutral-200 pl-6">
            <label htmlFor="catalog-sort" className="block text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">
              Sort by
            </label>
            <select
              id="catalog-sort"
              value={activeSort ?? ''}
              onChange={(event) => update({ sort: event.target.value || undefined })}
              className="mt-3 h-10 w-full border border-neutral-200 bg-white px-3 text-xs text-neutral-900 outline-none transition-colors focus:border-black"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-4 text-[10px] tracking-[0.12em] uppercase text-neutral-400">{countLabel}</p>
          </div>
        </div>

        <form
          className="relative mt-7 max-w-sm"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            update({ q: form.get('q')?.toString().trim() || undefined })
          }}
        >
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search the collection"
            className="h-10 w-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-xs text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
          />
        </form>
      </div>

      <div className="sticky top-0 z-20 -mx-4 border-y border-neutral-200 bg-[#faf9f7] px-4 py-3 sm:hidden">
        <div className="grid grid-cols-2 divide-x divide-neutral-200 border border-neutral-900">
          <button
            type="button"
            onClick={openMobileFilters}
            className="flex h-11 items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase"
          >
            <SlidersHorizontal className="size-3.5" />
            Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}
          </button>
          <label className="relative flex items-center">
            <span className="sr-only">Sort products</span>
            <select
              value={activeSort ?? ''}
              onChange={(event) => update({ sort: event.target.value || undefined })}
              className="h-11 w-full appearance-none bg-transparent px-3 pr-6 text-center text-[11px] font-semibold tracking-[0.14em] uppercase outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-[10px] tracking-[0.12em] uppercase text-neutral-400">{countLabel}</p>
      </div>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[80] bg-black/45 sm:hidden" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter collection"
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-[#faf9f7] px-5 pb-6 pt-5"
          >
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">Filter collection</p>
                <p className="mt-1 text-xs text-neutral-600">{countLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex size-9 items-center justify-center border border-neutral-300"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-7 py-6">
              <div>
                <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const selected = draftCategories.includes(category.slug)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleDraft(category.slug, 'category')}
                        aria-pressed={selected}
                        className={cn(
                          'border px-3 py-2 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors',
                          selected ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white text-neutral-700',
                        )}
                      >
                        {category.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {availableSizes.length > 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const selected = draftSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleDraft(size, 'size')}
                          aria-pressed={selected}
                          className={cn(
                            'flex h-9 min-w-9 items-center justify-center border px-2 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors',
                            selected ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white text-neutral-700',
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <form
              className="relative border-t border-neutral-200 pt-5"
              onSubmit={(event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                update({ q: form.get('q')?.toString().trim() || undefined })
              }}
            >
              <label htmlFor="mobile-catalog-search" className="mb-2 block text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">Search</label>
              <Search className="absolute bottom-[13px] left-3 size-3.5 text-neutral-400" />
              <input
                id="mobile-catalog-search"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search the collection"
                className="h-11 w-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-black"
              />
            </form>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraftCategories([])
                  setDraftSizes([])
                }}
                className="h-12 border border-black text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Clear filters
              </button>
              <button
                type="button"
                onClick={applyMobileFilters}
                className="h-12 border border-black bg-black text-[11px] font-semibold tracking-[0.14em] uppercase text-white"
              >
                View {countLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
