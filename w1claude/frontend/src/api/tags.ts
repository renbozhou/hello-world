import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Tag } from '../types'

const QUERY_KEY = 'tags'

export const tagApi = {
  list: () => client.get<Tag[]>('/tags').then((r) => r.data),
  create: (name: string) => client.post<Tag>('/tags', { name }).then((r) => r.data),
  remove: (id: number) => client.delete(`/tags/${id}`),
}

export function useTags() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: tagApi.list,
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tagApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tagApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
