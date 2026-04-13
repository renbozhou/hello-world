import type { Tag, Ticket, TicketListResponse } from "@/types";

const API_BASE = "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = `request failed: ${res.status}`;
    try {
      const data = await res.json();
      message = data?.error?.message ?? message;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export type TicketQuery = {
  q?: string;
  completed?: "all" | "true" | "false";
  tag?: string;
};

export async function fetchTags(): Promise<Tag[]> {
  return request<Tag[]>("/tags");
}

export async function createTag(name: string): Promise<Tag> {
  return request<Tag>("/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function fetchTickets(query: TicketQuery): Promise<TicketListResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.completed && query.completed !== "all") params.set("completed", query.completed);
  if (query.tag === "untagged") params.set("untagged", "true");
  else if (query.tag && query.tag !== "all") params.set("tag_id", query.tag);
  return request<TicketListResponse>(`/tickets?${params.toString()}`);
}

export async function createTicket(payload: { title: string; description?: string | null }): Promise<Ticket> {
  return request<Ticket>("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTicket(id: string, payload: { title?: string; description?: string | null }): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTicket(id: string): Promise<void> {
  return request<void>(`/tickets/${id}`, { method: "DELETE" });
}

export async function completeTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}/complete`, { method: "POST" });
}

export async function uncompleteTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}/uncomplete`, { method: "POST" });
}

export async function bindTagToTicket(ticketId: string, input: { tag_id?: string; tag_name?: string }): Promise<Tag> {
  return request<Tag>(`/tickets/${ticketId}/tags`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function unbindTagFromTicket(ticketId: string, tagId: string): Promise<void> {
  return request<void>(`/tickets/${ticketId}/tags/${tagId}`, { method: "DELETE" });
}
