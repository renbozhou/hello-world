import { useTags, useDeleteTag } from '@/api/tags'
import { Tag, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  selectedTagId: number | undefined
  onSelect: (tagId: number | undefined) => void
}

export default function TagSidebar({ selectedTagId, onSelect }: Props) {
  const { data: tags = [] } = useTags()
  const deleteTag = useDeleteTag()

  return (
    <aside className="w-48 shrink-0">
      <h2 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <Tag className="h-3 w-3" /> 标签
      </h2>
      <ul className="space-y-0.5">
        <li>
          <button
            onClick={() => onSelect(undefined)}
            className={cn(
              'w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100',
              selectedTagId === undefined && 'bg-gray-200 font-medium',
            )}
          >
            全部
          </button>
        </li>
        {tags.map((tag) => (
          <li key={tag.id} className="group flex items-center">
            <button
              onClick={() => onSelect(tag.id === selectedTagId ? undefined : tag.id)}
              className={cn(
                'flex-1 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100',
                selectedTagId === tag.id && 'bg-blue-100 font-medium text-blue-700',
              )}
            >
              {tag.name}
            </button>
            <button
              onClick={() => deleteTag.mutate(tag.id)}
              className="mr-1 hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
              title="删除标签"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
