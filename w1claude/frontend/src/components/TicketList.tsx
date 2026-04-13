import type { Ticket } from '@/types'
import TicketCard from './TicketCard'
import { useTickets } from '@/api/tickets'
import type { TicketFilters } from '@/types'
import { Loader2 } from 'lucide-react'

interface Props {
  filters: TicketFilters
  onEdit: (ticket: Ticket) => void
}

export default function TicketList({ filters, onEdit }: Props) {
  const { data: tickets, isLoading, isError } = useTickets(filters)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-sm text-red-500">
        加载失败，请检查后端服务是否启动。
      </div>
    )
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        暂无 Ticket，点击右上角「新建」创建第一个吧。
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} onEdit={onEdit} />
      ))}
    </div>
  )
}
