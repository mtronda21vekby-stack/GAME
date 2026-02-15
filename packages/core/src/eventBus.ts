type Handler<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private map = new Map<keyof Events, Set<Handler<any>>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    const set = this.map.get(event) ?? new Set();
    set.add(handler as any);
    this.map.set(event, set);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    const set = this.map.get(event);
    if (!set) return;
    set.delete(handler as any);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    const set = this.map.get(event);
    if (!set) return;
    for (const h of set) h(payload);
  }

  clear() {
    this.map.clear();
  }
}
