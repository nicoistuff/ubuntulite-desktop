import { useEffect, useState, useSyncExternalStore } from 'react';
import { getVersion, subscribe } from '@/lib/vfs';
import type { AppId } from './apps';

/** Re-renders on filesystem changes; `ready` is false during SSR/hydration so stored data never mismatches server HTML. */
export function useVfs() {
  const version = useSyncExternalStore(subscribe, getVersion, () => 0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return { version, ready };
}

export type OpenRequest = { app: AppId; path?: string | undefined };
export const openWith = (detail: OpenRequest) => window.dispatchEvent(new CustomEvent<OpenRequest>('ubuntu:open', { detail }));
