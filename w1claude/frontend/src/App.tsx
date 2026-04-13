import { useState, useEffect } from 'react'
import type { Ticket, TicketFilters } from '@/types'
import TagSidebar from '@/components/TagSidebar'
import SearchBar from '@/components/SearchBar'
import TicketList from '@/components/TicketList'
import TicketDialog from '@/components/TicketDialog'
import { Plus } from 'lucide-react'

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function App() {
  const [searchInput, setSearchInput] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)

  const debouncedSearch = useDebounce(searchInput, 300)

  const filters: TicketFilters = {
    tag_id: selectedTagId,
    search: debouncedSearch || undefined,
  }

  function openCreate() {
    setEditingTicket(null)
    setDialogOpen(true)
  }

  function openEdit(ticket: Ticket) {
    setEditingTicket(ticket)
    setDialogOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">Ticket Manager</h1>
          <div className="flex-1" />
          <SearchBar value={searchInput} onChange={setSearchInput} />
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新建
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 px-6 py-6">
        <TagSidebar selectedTagId={selectedTagId} onSelect={setSelectedTagId} />
        <main className="flex-1">
          <TicketList filters={filters} onEdit={openEdit} />
        </main>
      </div>

      <TicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTicket={editingTicket}
      />
    </div>
  )
}
