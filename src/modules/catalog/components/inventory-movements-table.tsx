'use client'

// Recent inventory_movements DataTable. src/app/(admin)/admin/inventory/page.tsx
// (server) joins product/variant names + resolves actor names (no direct FK
// from inventory_movements to profiles, so that's a second query there).

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import type { InventoryMovementType } from '@/types/db'

export interface MovementRow {
  id: number
  createdAt: string
  productName: string
  variantName: string | null
  type: InventoryMovementType
  qtyDelta: number
  reference: string | null
  note: string | null
  actorName: string | null
}

const TYPE_LABELS: Record<InventoryMovementType, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  adjustment: 'Adjustment',
  return: 'Return',
  release: 'Release',
}

const columns: ColumnDef<MovementRow>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'd MMM yyyy, h:mm a'),
  },
  {
    accessorKey: 'productName',
    header: 'Product',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.productName}</span>
        {row.original.variantName ? (
          <span className="text-muted-foreground text-xs">{row.original.variantName}</span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <Badge variant="outline">{TYPE_LABELS[row.original.type]}</Badge>,
  },
  {
    accessorKey: 'qtyDelta',
    header: () => <div className="text-right">Qty</div>,
    cell: ({ row }) => {
      const delta = row.original.qtyDelta
      return (
        <div
          className={cn(
            'text-right font-medium tabular-nums',
            delta > 0 && 'text-emerald-700 dark:text-emerald-400',
            delta < 0 && 'text-red-700 dark:text-red-500',
          )}
        >
          {delta > 0 ? `+${delta}` : delta}
        </div>
      )
    },
  },
  {
    accessorKey: 'reference',
    header: 'Reference',
    cell: ({ row }) => row.original.reference ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'note',
    header: 'Note',
    cell: ({ row }) => row.original.note ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'actorName',
    header: 'Actor',
    cell: ({ row }) => row.original.actorName ?? <span className="text-muted-foreground">System</span>,
  },
]

interface InventoryMovementsTableProps {
  movements: MovementRow[]
}

function InventoryMovementsTable({ movements }: InventoryMovementsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={movements}
      searchKey="productName"
      searchPlaceholder="Search by product..."
    />
  )
}

export { InventoryMovementsTable }
