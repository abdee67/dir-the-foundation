'use client'

import { format } from 'date-fns'
import { Wallet } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMoney } from '@/lib/money'
import type { Payment } from '@/types/db'

interface PaymentsCardProps {
  payments: Payment[]
}

function PaymentsCard({ payments }: PaymentsCardProps) {

  return (
    <Card>
      <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No payments recorded"
            description="Record an advance, full, or balance payment for this order."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="capitalize">{payment.kind}</TableCell>
                  <TableCell className="uppercase">{payment.method}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(payment.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge kind="payment" value={payment.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {payment.provider_ref || payment.sender_number || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {payment.verified_at ? format(new Date(payment.verified_at), 'd MMM, h:mm a') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export { PaymentsCard }
