import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Ticket, TicketCreate, TicketUpdate, TicketFilters } from '../types'

const QUERY_KEY = 'tickets'

export const ticketApi = {
  list: (filters: TicketFilters) =>
    client.get<Ticket[]>('/tickets', { params: filters }).then((r) => r.data),

  get: (id: number) =>
    client.get<Ticket>(`/tickets/${id}`).then((r) => r.data),

  create: (body: TicketCreate) =>
    client.post<Ticket>('/tickets', body).then((r) => r.data),

  update: (id: number, body: TicketUpdate) =>
    client.put<Ticket>(`/tickets/${id}`, body).then((r) => r.data),

  remove: (id: number) =>
    client.delete(`/tickets/${id}`),

  patchStatus: (id: number, status: 'open' | 'done') =>
    client.patch<Ticket>(`/tickets/${id}/status`, { status }).then((r) => r.data),

  addTag: (ticketId: number, tagId: number) =>
    client.post<Ticket>(`/tickets/${ticketId}/tags/${tagId}`).then((r) => r.data),

  removeTag: (ticketId: number, tagId: number) =>
    client.delete<Ticket>(`/tickets/${ticketId}/tags/${tagId}`).then((r) => r.data),
}

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => ticketApi.list(filters),
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ticketApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: TicketUpdate }) =>
      ticketApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ticketApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function usePatchTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'open' | 'done' }) =>
      ticketApi.patchStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
