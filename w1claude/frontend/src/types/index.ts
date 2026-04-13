export interface Tag {
  id: number
  name: string
}

export interface Ticket {
  id: number
  title: string
  description: string | null
  status: 'open' | 'done'
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface TicketCreate {
  title: string
  description?: string
  tag_ids?: number[]
}

export interface TicketUpdate {
  title?: string
  description?: string
}

export interface TicketFilters {
  tag_id?: number
  search?: string
  status?: string
}
