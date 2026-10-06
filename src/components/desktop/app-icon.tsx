import { FileText, Folder, Settings, Terminal } from 'lucide-react';
import type { AppId } from './apps';

export function AppIcon({ app, small = false }: { app: AppId; small?: boolean }) {
  const Icon = { files: Folder, terminal: Terminal, editor: FileText, settings: Settings }[app];
  return <span className={`app-icon app-icon-${app} ${small ? 'small' : ''}`}><Icon strokeWidth={app === 'files' ? 1.3 : 1.7} /></span>;
}