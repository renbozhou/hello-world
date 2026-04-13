import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  bindTagToTicket,
  completeTicket,
  createTag,
  createTicket,
  deleteTicket,
  fetchTags,
  fetchTickets,
  unbindTagFromTicket,
  uncompleteTicket,
  updateTicket,
} from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Ticket } from "@/types";

type CompletedFilter = "all" | "true" | "false";

function TicketEditorDialog({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial: Ticket | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
  }, [initial, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title: title.trim(), description: description.trim() || null };
      if (initial) return updateTicket(initial.id, payload);
      return createTicket(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      title={initial ? "编辑 Ticket" : "新建 Ticket"}
    >
      <div className="space-y-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题（必填）" />
        <textarea
          className="min-h-28 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述（可选）"
        />
        <div className="flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={!title.trim() || saveMutation.isPending}>
            保存
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [completed, setCompleted] = useState<CompletedFilter>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const ticketsQuery = useQuery({
    queryKey: ["tickets", { search, completed, tagFilter }],
    queryFn: () => fetchTickets({ q: search, completed, tag: tagFilter }),
  });
  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  };

  const toggleCompleteMutation = useMutation({
    mutationFn: async (ticket: Ticket) => (ticket.is_completed ? uncompleteTicket(ticket.id) : completeTicket(ticket.id)),
    onSuccess: refreshAll,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTicket,
    onSuccess: refreshAll,
  });
  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: refreshAll,
  });
  const bindTagMutation = useMutation({
    mutationFn: ({ ticketId, tagName }: { ticketId: string; tagName: string }) =>
      bindTagToTicket(ticketId, { tag_name: tagName }),
    onSuccess: refreshAll,
  });
  const unbindTagMutation = useMutation({
    mutationFn: ({ ticketId, tagId }: { ticketId: string; tagId: string }) => unbindTagFromTicket(ticketId, tagId),
    onSuccess: refreshAll,
  });

  const tagOptions = tagsQuery.data ?? [];
  const ticketItems = ticketsQuery.data?.items ?? [];

  const errorText = useMemo(() => {
    if (ticketsQuery.error instanceof Error) return ticketsQuery.error.message;
    if (tagsQuery.error instanceof Error) return tagsQuery.error.message;
    return "";
  }, [ticketsQuery.error, tagsQuery.error]);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 md:px-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Project Alpha</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Ticket Center</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="按标题搜索..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Button variant={completed === "all" ? "default" : "outline"} onClick={() => setCompleted("all")}>
            全部
          </Button>
          <Button variant={completed === "false" ? "default" : "outline"} onClick={() => setCompleted("false")}>
            未完成
          </Button>
          <Button variant={completed === "true" ? "default" : "outline"} onClick={() => setCompleted("true")}>
            已完成
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>新建 Ticket</Button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 flex flex-wrap gap-2">
          <Button size="sm" variant={tagFilter === "all" ? "default" : "outline"} onClick={() => setTagFilter("all")}>
            全部标签
          </Button>
          <Button size="sm" variant={tagFilter === "untagged" ? "default" : "outline"} onClick={() => setTagFilter("untagged")}>
            未打标签
          </Button>
          {tagOptions.map((tag) => (
            <Button key={tag.id} size="sm" variant={tagFilter === tag.id ? "default" : "outline"} onClick={() => setTagFilter(tag.id)}>
              {tag.name}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input placeholder="创建新标签..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
          <Button
            onClick={() => {
              if (!newTagName.trim()) return;
              createTagMutation.mutate(newTagName.trim());
              setNewTagName("");
            }}
          >
            新建标签
          </Button>
        </div>
      </section>

      {errorText ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">{errorText}</p> : null}

      <section className="space-y-3">
        {ticketItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-sm text-slate-600 shadow-sm">暂无 Ticket，创建一个吧。</div>
        ) : (
          ticketItems.map((ticket) => (
            <article key={ticket.id} className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-sky-400"
                    type="checkbox"
                    checked={ticket.is_completed}
                    onChange={() => toggleCompleteMutation.mutate(ticket)}
                  />
                  <h2 className={ticket.is_completed ? "font-medium text-slate-400 line-through" : "font-medium text-slate-800"}>{ticket.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingTicket(ticket)}>
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm("确认删除该 Ticket 吗？")) deleteMutation.mutate(ticket.id);
                    }}
                  >
                    删除
                  </Button>
                </div>
              </div>
              {ticket.description ? <p className="mb-2 text-sm leading-relaxed text-slate-600">{ticket.description}</p> : null}
              <div className="mb-2 flex flex-wrap gap-2">
                {ticket.tags.map((tag) => (
                  <button
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full transition-transform hover:scale-[1.02]"
                    onClick={() => unbindTagMutation.mutate({ ticketId: ticket.id, tagId: tag.id })}
                  >
                    <Badge>{tag.name} ×</Badge>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <Button key={tag.id} size="sm" variant="ghost" onClick={() => bindTagMutation.mutate({ ticketId: ticket.id, tagName: tag.name })}>
                    + {tag.name}
                  </Button>
                ))}
              </div>
            </article>
          ))
        )}
      </section>

      <TicketEditorDialog open={isCreateOpen} initial={null} onClose={() => setIsCreateOpen(false)} />
      <TicketEditorDialog open={!!editingTicket} initial={editingTicket} onClose={() => setEditingTicket(null)} />
    </main>
  );
}
