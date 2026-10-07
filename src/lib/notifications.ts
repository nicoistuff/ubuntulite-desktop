import { useSyncExternalStore } from 'react';
import { getSettings } from './settings';

export type Notice = { id: number; app: string; title: string; body: string; time: number; popup: boolean };
let list: Notice[] = [];
const subs = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const emit = () => subs.forEach(f => f());

/** Post a desktop notification. Shown as a banner unless Do Not Disturb is on; always kept in the notification list. */
export function notify(app: string, title: string, body = '') {
  const id = Date.now() + Math.random();
  const popup = !getSettings().dnd;
  list = [{ id, app, title, body, time: Date.now(), popup }, ...list].slice(0, 50);
  if (popup) timers.set(id, setTimeout(() => hideBanner(id), 5000));
  emit();
  return id;
}
export function hideBanner(id: number) { const t = timers.get(id); if (t) clearTimeout(t); timers.delete(id); list = list.map(n => n.id === id ? { ...n, popup: false } : n); emit(); }
export function dismiss(id: number) { hideBanner(id); list = list.filter(n => n.id !== id); emit(); }
export function clearAll() { timers.forEach(clearTimeout); timers.clear(); list = []; emit(); }
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const snap = () => list;
const empty: Notice[] = [];
export function useNotifications() { return useSyncExternalStore(subscribe, snap, () => empty); }
