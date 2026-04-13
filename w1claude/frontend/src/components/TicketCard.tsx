import { useState } from 'react'
import type { Ticket } from '@/types'
import { usePatchTicketStatus, useDeleteTicket } from '@/api/tickets'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  ticket: Ticket
  onEdit: (ticket: Ticket) => void
}

export default function TicketCard({ ticket, onEdit }: Props) {
  const patchStatus = usePatchTicketStatus()
  const deleteTicket = useDeleteTicket()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isDone = ticket.status === 'done'

  function toggleStatus() {
    patchStatus.mutate({ id: ticket.id, status: isDone ? 'open' : 'done' })
  }

  return (
    <div className={cn(
      'rounded-lg border bg-white p-4 shadow-sm transition-opacity',
      isDone && 'opacity-60',
    )}>
      <div className="flex items-start gap-3">
        <button onClick={toggleStatus} className="mt-0.5 shrink-0 text-gray-400 hover:text-blue-500">
          {isDone
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className="h-5 w-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={cn('font-medium leading-snug', isDone && 'line-through text-gray-400')}>
            {ticket.title}
          </p>
          {ticket.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
          )}
          {ticket.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ticket.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onEdit(ticket)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="编辑"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <button
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  删除后无法恢复，确定要删除「{ticket.title}」吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTicket.mutate(ticket.id)}
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
