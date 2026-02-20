const KEY = "bc_guest_id";

export function getOrCreateGuestId(): string {
  const existing = localStorage.getItem(KEY);
  if (existing && existing.length >= 10) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}
