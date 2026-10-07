import { useSyncExternalStore } from 'react';

export const ACCENTS = {
  orange: 'oklch(0.65 0.2 37)', bark: 'oklch(0.55 0.06 70)', sage: 'oklch(0.62 0.09 150)', olive: 'oklch(0.6 0.11 120)',
  viridian: 'oklch(0.6 0.1 175)', prussian: 'oklch(0.55 0.1 230)', blue: 'oklch(0.6 0.15 255)', purple: 'oklch(0.55 0.17 300)',
  magenta: 'oklch(0.58 0.2 345)', red: 'oklch(0.58 0.2 25)',
} as const;
export type Accent = keyof typeof ACCENTS;

export const WALLPAPERS = [
  { id: 'raccoon', name: 'Resolute Raccoon', css: '' },
  { id: 'dusk', name: 'Aubergine Dusk', css: 'radial-gradient(circle at 70% 40%, oklch(0.55 0.2 330), oklch(0.22 0.1 310) 60%, oklch(0.12 0.04 300))' },
  { id: 'ember', name: 'Ember', css: 'linear-gradient(135deg, oklch(0.3 0.12 20), oklch(0.62 0.2 40) 55%, oklch(0.82 0.13 75))' },
  { id: 'lagoon', name: 'Lagoon', css: 'linear-gradient(160deg, oklch(0.25 0.06 250), oklch(0.5 0.11 200) 60%, oklch(0.75 0.1 170))' },
  { id: 'graphite', name: 'Graphite', css: 'linear-gradient(180deg, oklch(0.3 0 0), oklch(0.16 0 0))' },
] as const;

export type Settings = {
  theme: 'light' | 'dark'; accent: Accent; wallpaper: string; customWallpaper: string;
  wifi: boolean; bluetooth: boolean; airplane: boolean; volume: number; muted: boolean; brightness: number;
  nightLight: boolean; powerMode: 'saver' | 'balanced' | 'performance'; dnd: boolean; notifyLock: boolean;
  dockAutohide: boolean; iconSize: number; clockSeconds: boolean; clock24: boolean; showWeekday: boolean;
  largeText: boolean; reduceMotion: boolean; highContrast: boolean; scale: number;
  userName: string; deviceName: string; language: string; mouseSpeed: number; naturalScroll: boolean;
  keyRepeat: boolean; recentFiles: boolean; location: boolean;
};

export const DEFAULTS: Settings = {
  theme: 'light', accent: 'orange', wallpaper: 'raccoon', customWallpaper: '',
  wifi: true, bluetooth: true, airplane: false, volume: 65, muted: false, brightness: 100,
  nightLight: false, powerMode: 'balanced', dnd: false, notifyLock: true,
  dockAutohide: false, iconSize: 48, clockSeconds: false, clock24: false, showWeekday: false,
  largeText: false, reduceMotion: false, highContrast: false, scale: 100,
  userName: 'ubuntu', deviceName: 'ubuntu', language: 'English (United States)', mouseSpeed: 50, naturalScroll: false,
  keyRepeat: true, recentFiles: true, location: false,
};

const KEY = 'ubuntu-settings-v1';
let state: Settings = DEFAULTS;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...DEFAULTS, ...JSON.parse(raw) }; } catch { state = DEFAULTS; }
}

export function getSettings() { load(); return state; }
export function setSettings(patch: Partial<Settings>) {
  load();
  state = { ...state, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full: keep in memory */ }
  subs.forEach(f => f());
}
export function resetSettings() { state = DEFAULTS; try { localStorage.removeItem(KEY); } catch { /* ignore */ } subs.forEach(f => f()); }
function subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULTS);
}

export function wallpaperCss(s: Settings): string | null {
  if (s.wallpaper === 'custom' && s.customWallpaper) return `center / cover no-repeat url("${s.customWallpaper}")`;
  const w = WALLPAPERS.find(w => w.id === s.wallpaper);
  return w && w.css ? w.css : null;
}
