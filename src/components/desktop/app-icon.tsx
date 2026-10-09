// @ts-nocheck
import {
  FileText, Folder, Settings, Terminal, ShoppingBag,
  Calculator, Calendar, Bomb, Gamepad2, Code, Palette,
  Film, BookOpen, HardDrive
} from 'lucide-react';
import type { AppId } from './apps';

const ICON_MAP: Record<string, any> = {
  files: Folder,
  terminal: Terminal,
  editor: FileText,
  settings: Settings,
  software: ShoppingBag,
  calculator: Calculator,
  calendar: Calendar,
  mines: Bomb,
  supertux: Gamepad2,
  vscode: Code,
  gimp: Palette,
  vlc: Film,
  libreoffice: BookOpen,
  obsidian: FileText,
  'disk-usage': HardDrive
};

export function AppIcon({ app, small = false }: { app: AppId; small?: boolean }) {
  const Icon = ICON_MAP[app] || ShoppingBag;
  return (
    <span className={`app-icon app-icon-${app} ${small ? 'small' : ''}`}>
      <Icon strokeWidth={app === 'files' ? 1.3 : 1.7} />
    </span>
  );
}
