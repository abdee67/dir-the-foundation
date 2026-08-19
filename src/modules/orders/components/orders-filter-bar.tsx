'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchInput } from '@/components/ui/search-input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
  { value: 'failed', label: 'Failed' },
] as const

interface OrdersFilterBarProps {
  status: string
  q: string
  from: string
  to: string
}

function OrdersFilterBar({ status, q, from, to }: OrdersFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <Tabs value={status || 'all'} onValueChange={(v) => setParam('status', v === 'all' ? '' : v)}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <SearchInput value={q} onChange={(v) => setParam('q', v)} placeholder="Order no. or phone" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="orders-from">From</Label>
          <Input
            id="orders-from"
            type="date"
            value={from}
            onChange={(e) => setParam('from', e.target.value)}
            className="w-36"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="orders-to">To</Label>
          <Input id="orders-to" type="date" value={to} onChange={(e) => setParam('to', e.target.value)} className="w-36" />
        </div>
      </div>
    </div>
  )
}

export { OrdersFilterBar }
