import { useState, useEffect } from 'react'
import type { Ticket } from '@/types'
import { useCreateTicket, useUpdateTicket } from '@/api/tickets'
import { useTags, useCreateTag } from '@/api/tags'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ChevronDown, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTicket?: Ticket | null
}

export default function TicketDialog({ open, onOpenChange, editingTicket }: Props) {
  const isEdit = !!editingTicket

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)

  const { data: tags = [] } = useTags()
  const createTicket = useCreateTicket()
  const updateTicket = useUpdateTicket()
  const createTag = useCreateTag()

  // populate form when editing
  useEffect(() => {
    if (open && editingTicket) {
      setTitle(editingTicket.title)
      setDescription(editingTicket.description ?? '')
      setSelectedTagIds(editingTicket.tags.map((t) => t.id))
    } else if (open && !editingTicket) {
      setTitle('')
      setDescription('')
      setSelectedTagIds([])
    }
  }, [open, editingTicket])

  function toggleTag(tagId: number) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  async function handleAddNewTag() {
    const name = newTagName.trim()
    if (!name) return
    const tag = await createTag.mutateAsync(name)
    setSelectedTagIds((prev) => [...prev, tag.id])
    setNewTagName('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    if (isEdit && editingTicket) {
      await updateTicket.mutateAsync({
        id: editingTicket.id,
        body: { title: title.trim(), description: description.trim() || undefined },
      })
      // tag changes via separate API calls are out of scope for Phase 1 inline edit;
      // tags are set on create only. Full tag editing is Phase 2.
    } else {
      await createTicket.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        tag_ids: selectedTagIds,
      })
    }
    onOpenChange(false)
  }

  const isPending = createTicket.isPending || updateTicket.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑 Ticket' : '新建 Ticket'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入 Ticket 标题"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选描述..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">标签</label>
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="text-gray-500">
                      {selectedTagIds.length === 0
                        ? '选择标签...'
                        : `已选 ${selectedTagIds.length} 个`}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="max-h-48 overflow-y-auto">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-100"
                      >
                        <span className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          selectedTagIds.includes(tag.id)
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300',
                        )}>
                          {selectedTagIds.includes(tag.id) && <Check className="h-3 w-3" />}
                        </span>
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 border-t pt-2">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())}
                        placeholder="新建标签..."
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewTag}
                        className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {selectedTagIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tags
                    .filter((t) => selectedTagIds.includes(t.id))
                    .map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                      >
                        {t.name}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? '保存中...' : isEdit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
