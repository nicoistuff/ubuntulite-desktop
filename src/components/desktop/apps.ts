// @ts-nocheck
import { CATALOG } from '@/lib/software';

export type AppId =
  | 'files'
  | 'terminal'
  | 'editor'
  | 'settings'
  | 'software'
  | 'calculator'
  | 'calendar'
  | 'mines'
  | 'supertux'
  | 'vscode'
  | 'gimp'
  | 'vlc'
  | 'libreoffice'
  | 'obsidian'
  | 'disk-usage'
  | 'system-monitor';

export interface AppMetadata {
  id: AppId;
  name: string;
  category: string;
}

export const builtInApps: AppMetadata[] = [
  { id: 'files', name: 'Files', category: 'Utilities' },
  { id: 'terminal', name: 'Terminal', category: 'Utilities' },
  { id: 'editor', name: 'Text Editor', category: 'Utilities' },
  { id: 'calculator', name: 'Calculator', category: 'Utilities' },
  { id: 'calendar', name: 'Calendar', category: 'Utilities' },
  { id: 'system-monitor', name: 'System Monitor', category: 'System' },
  { id: 'software', name: 'App Center', category: 'System' },
  { id: 'settings', name: 'Settings', category: 'System' },
];

export function getFullAppList(installedIds: string[]): AppMetadata[] {
  const storeApps: AppMetadata[] = CATALOG
    .filter(pkg => installedIds.includes(pkg.id) && !builtInApps.some(b => b.id === pkg.id))
    .map(pkg => ({
      id: pkg.id as AppId,
      name: pkg.name,
      category: pkg.category === 'Graphics & Media' ? 'Utilities' : pkg.category
    }));

  return [...builtInApps, ...storeApps];
}

export const apps = builtInApps;
export const folders = ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'];
