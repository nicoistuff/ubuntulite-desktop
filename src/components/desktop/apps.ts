export type AppId = 'files' | 'terminal' | 'editor' | 'settings';
export const apps: { id: AppId; name: string; category: string }[] = [
  { id: 'files', name: 'Files', category: 'Utilities' },
  { id: 'terminal', name: 'Terminal', category: 'Utilities' },
  { id: 'editor', name: 'Text Editor', category: 'Utilities' },
  { id: 'settings', name: 'Settings', category: 'System' },
];
export const folders = ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'];