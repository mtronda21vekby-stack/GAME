export type ContentBlock = {
  id: string;
  kind: string;
  title?: string | null;
  data?: unknown;
  updatedAt?: number | null;
};

export type PublicContent = {
  blocks: ContentBlock[];
};

export async function fetchContent(signal?: AbortSignal): Promise<PublicContent> {
  const res = await fetch("/api/content", { method: "GET", signal, headers: { "accept": "application/json" } });
  if (!res.ok) throw new Error(`content ${res.status}`);
  return (await res.json()) as PublicContent;
}
