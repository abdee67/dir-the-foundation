'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import type { CmsPage } from '@/types/db'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'

export type CmsPageRow = Pick<CmsPage, 'id' | 'title' | 'slug' | 'type' | 'status' | 'draft_blocks' | 'updated_at'>

interface CmsPagesTableProps {
  data: CmsPageRow[]
}

const TYPE_LABELS: Record<CmsPage['type'], string> = {
  page: 'Page',
  home: 'Home',
  policy: 'Policy',
}

function CmsPagesTable({ data }: CmsPagesTableProps) {
  const columns = React.useMemo<ColumnDef<CmsPageRow>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <Link href={`/admin/cms/pages/${row.original.id}`} className="font-medium hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ row }) => <span className="text-muted-foreground">/{row.original.slug}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{TYPE_LABELS[row.original.type]}</Badge>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Badge variant={row.original.status === 'published' ? 'success' : 'secondary'}>
              {row.original.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
            {row.original.draft_blocks !== null ? (
              <span className="size-1.5 rounded-full bg-amber-500" title="Has unpublished changes" />
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{format(new Date(row.original.updated_at), 'd MMM, h:mm a')}</span>
        ),
      },
    ],
    [],
  )

  return <DataTable columns={columns} data={data} searchKey="title" searchPlaceholder="Search pages..." />
}

export { CmsPagesTable }
