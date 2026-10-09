// @ts-nocheck
import { useSyncExternalStore } from 'react';
import { notify } from './notifications';

export interface AppPackage {
  id: string;
  name: string;
  summary: string;
  description: string;
  category: 'Development' | 'Productivity' | 'Graphics & Media' | 'Games' | 'Utilities';
  version: string;
  developer: string;
  license: string;
  size: string;
  iconName: string;
  rating: number;
  reviewsCount: number;
  isBuiltIn?: boolean;
}

export const CATALOG: AppPackage[] = [
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    summary: 'Code editing redefined',
    description: 'Visual Studio Code is a lightweight but powerful source code editor which runs on your desktop. It comes with built-in support for JavaScript, TypeScript and Node.js.',
    category: 'Development',
    version: '1.98.0',
    developer: 'Microsoft Corporation',
    license: 'MIT',
    size: '94.2 MB',
    iconName: 'Code',
    rating: 4.8,
    reviewsCount: 1420
  },
  {
    id: 'gimp',
    name: 'GNU Image Manipulation Program',
    summary: 'Create images and edit photographs',
    description: 'GIMP is an acronym for GNU Image Manipulation Program. It is a freely distributed program for such tasks as photo retouching, image composition and image authoring.',
    category: 'Graphics & Media',
    version: '2.10.38',
    developer: 'The GIMP Team',
    license: 'GPL-3.0',
    size: '128.5 MB',
    iconName: 'Palette',
    rating: 4.6,
    reviewsCount: 890
  },
  {
    id: 'vlc',
    name: 'VLC Media Player',
    summary: 'Play audio and video files and streams',
    description: 'VLC is the ultimate media player, capable of playing almost any video or audio format, discs, webcams, devices, and streams without codec packs.',
    category: 'Graphics & Media',
    version: '3.0.21',
    developer: 'VideoLAN Organization',
    license: 'GPL-2.0',
    size: '42.1 MB',
    iconName: 'Film',
    rating: 4.9,
    reviewsCount: 3100
  },
  {
    id: 'libreoffice',
    name: 'LibreOffice Suite',
    summary: 'Full-featured office productivity suite',
    description: 'LibreOffice is a powerful and free office suite, used by millions worldwide. Its clean interface and feature-rich tools help you unleash your creativity and productivity.',
    category: 'Productivity',
    version: '24.8.2',
    developer: 'The Document Foundation',
    license: 'MPL-2.0',
    size: '215.0 MB',
    iconName: 'BookOpen',
    rating: 4.5,
    reviewsCount: 740
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    summary: 'Sharpen your thinking with markdown notes',
    description: 'Obsidian is the private and flexible writing app that adapts to the way you think. Markdown notes with bi-directional linking and offline-first storage.',
    category: 'Productivity',
    version: '1.7.4',
    developer: 'Dynalist Inc.',
    license: 'Freeware',
    size: '86.4 MB',
    iconName: 'FileText',
    rating: 4.9,
    reviewsCount: 1250
  },
  {
    id: 'supertux',
    name: 'SuperTux',
    summary: 'Classic 2D jump’n run sidescroller game',
    description: 'Run and jump through worlds, fight off enemies, bounce on blocks and collect coins with Tux the friendly Linux penguin.',
    category: 'Games',
    version: '0.6.3',
    developer: 'SuperTux Team',
    license: 'GPL-3.0',
    size: '160.8 MB',
    iconName: 'Gamepad2',
    rating: 4.7,
    reviewsCount: 520
  },
  {
    id: 'mines',
    name: 'GNOME Mines',
    summary: 'Clear hidden mines from a minefield',
    description: 'The popular logic puzzle game where the objective is to clear a board containing hidden mines without detonating any of them.',
    category: 'Games',
    version: '40.1',
    developer: 'GNOME Project',
    license: 'GPL-3.0',
    size: '4.8 MB',
    iconName: 'Bomb',
    rating: 4.3,
    reviewsCount: 310
  },
  {
    id: 'calculator',
    name: 'GNOME Calculator',
    summary: 'Perform basic, financial, or scientific calculations',
    description: 'Calculator with financial, scientific, and programming modes. Handles unit conversions and history tracking.',
    category: 'Utilities',
    version: '46.0',
    developer: 'GNOME Project',
    license: 'GPL-3.0',
    size: '12.4 MB',
    iconName: 'Calculator',
    rating: 4.5,
    reviewsCount: 430
  },
  {
    id: 'disk-usage',
    name: 'Disk Usage Analyzer',
    summary: 'Inspect folder sizes and available disk space',
    description: 'Baobab is a graphical application to analyze disk usage in any directory hierarchy on the simulated filesystem.',
    category: 'Utilities',
    version: '46.0',
    developer: 'GNOME Project',
    license: 'GPL-3.0',
    size: '8.2 MB',
    iconName: 'HardDrive',
    rating: 4.4,
    reviewsCount: 220
  }
];

const STORAGE_KEY = 'ubuntu-software-v1';
const DEFAULT_INSTALLED = ['calculator', 'disk-usage'];

let installedCache: string[] | null = null;
const listeners = new Set<() => void>();

export function getInstalledApps(): string[] {
  if (installedCache) return installedCache;
  if (typeof window === 'undefined') return DEFAULT_INSTALLED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    installedCache = raw ? JSON.parse(raw) : DEFAULT_INSTALLED;
  } catch {
    installedCache = DEFAULT_INSTALLED;
  }
  return installedCache!;
}

function notifySubscribers() {
  listeners.forEach(fn => fn());
}

export function installApp(id: string) {
  const current = getInstalledApps();
  if (current.includes(id)) return;
  const next = [...current, id];
  installedCache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  notifySubscribers();
  const pkg = CATALOG.find(p => p.id === id);
  if (pkg) notify('App Center', 'Software installed', `“${pkg.name}” is ready to launch.`);
}

export function uninstallApp(id: string) {
  const current = getInstalledApps();
  const next = current.filter(x => x !== id);
  installedCache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  notifySubscribers();
  const pkg = CATALOG.find(p => p.id === id);
  if (pkg) notify('App Center', 'Software uninstalled', `“${pkg.name}” was removed from system.`);
}

export function useSoftware(): {
  installed: string[];
  install: (id: string) => void;
  uninstall: (id: string) => void;
  isInstalled: (id: string) => boolean;
} {
  const installed = useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getInstalledApps(),
    () => DEFAULT_INSTALLED
  );

  return {
    installed,
    install: installApp,
    uninstall: uninstallApp,
    isInstalled: (id: string) => installed.includes(id)
  };
}
