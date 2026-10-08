// @ts-nocheck -- strict index typing pending Phase 2 cleanup
// Simulated Ubuntu filesystem: a flat node table persisted to localStorage.
export type FsNode = {
  id: string; name: string; type: 'dir' | 'file'; parent: string | null;
  content?: string; mtime: number; trashedFrom?: string; starred?: boolean;
};
type FsState = { nodes: Record<string, FsNode>; recent: string[]; bookmarks: string[] };

export const HOME = '/home/ubuntu';
export const TRASH = '/home/ubuntu/.local/share/Trash/files';
const KEY = 'ubuntu2604.fs.v1';
let state: FsState;
let version = 0;
const listeners = new Set<() => void>();
let seq = 0;
const newId = () => `n${Date.now().toString(36)}${(seq++).toString(36)}`;

function seed(): FsState {
  const nodes: Record<string, FsNode> = {};
  const now = Date.now();
  const add = (path: string, type: 'dir' | 'file', content?: string) => {
    const parts = path.split('/').filter(Boolean);
    let parent = 'root';
    parts.forEach((name, i) => {
      const last = i === parts.length - 1;
      const existing = Object.values(nodes).find(n => n.parent === parent && n.name === name);
      if (existing) { parent = existing.id; return; }
      const id = newId();
      nodes[id] = { id, name, parent, type: last ? type : 'dir', mtime: now, ...(last && type === 'file' ? { content: content ?? '' } : {}) };
      parent = id;
    });
  };
  nodes.root = { id: 'root', name: '', type: 'dir', parent: null, mtime: now };
  ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos', 'Public', 'Templates'].forEach(d => add(`${HOME}/${d}`, 'dir'));
  add(TRASH, 'dir');
  add(`${HOME}/.config`, 'dir');
  add(`${HOME}/.bashrc`, 'file', '# ~/.bashrc: executed by bash for non-login shells.\nexport PS1="\\u@\\h:\\w\\$ "\nalias ll="ls -l"\n');
  add(`${HOME}/.profile`, 'file', '# ~/.profile: executed by the command interpreter for login shells.\n');
  add(`${HOME}/Documents/Welcome.txt`, 'file', 'Welcome to Ubuntu 26.04 LTS "Resolute Raccoon".\n\nThis desktop runs entirely in your browser. Files you create here are saved on this device.\n');
  add(`${HOME}/Documents/Notes.md`, 'file', '# Notes\n\n- Try the Terminal: ls, cd, mkdir, touch, tree, neofetch\n- Right-click files in Files for more actions\n');
  add(`${HOME}/Desktop/Readme.txt`, 'file', 'Files placed in ~/Desktop appear on the desktop.\n');
  add('/etc/os-release', 'file', 'PRETTY_NAME="Ubuntu 26.04 LTS"\nNAME="Ubuntu"\nVERSION_ID="26.04"\nVERSION="26.04 LTS (Resolute Raccoon)"\nVERSION_CODENAME=resolute\nID=ubuntu\nID_LIKE=debian\nHOME_URL="https://www.ubuntu.com/"\n');
  add('/etc/hostname', 'file', 'ubuntu\n');
  ['/usr/bin', '/usr/lib', '/usr/share', '/var/log', '/tmp', '/opt', '/boot', '/root', '/mnt', '/media', '/srv', '/dev', '/proc', '/sys'].forEach(d => add(d, 'dir'));
  return { nodes, recent: [], bookmarks: [] };
}

function load(): FsState {
  if (state) return state;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    state = raw ? JSON.parse(raw) : seed();
    if (!state.nodes?.root) state = seed();
  } catch { state = seed(); }
  return state;
}
function commit() {
  version++;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or unavailable: keep in memory */ }
  listeners.forEach(l => l());
}
export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const getVersion = () => version;
export function resetFilesystem() { state = seed(); commit(); }

export class FsError extends Error {}
export const node = (id: string) => load().nodes[id];
export const children = (id: string) => Object.values(load().nodes).filter(n => n.parent === id);

export function pathOf(id: string): string {
  const parts: string[] = [];
  let n: FsNode | undefined = node(id);
  while (n && n.parent) { parts.unshift(n.name); n = node(n.parent); }
  return '/' + parts.join('/');
}
export function normalize(path: string, cwd = HOME): string {
  const p = path.replace(/^~(?=$|\/)/, HOME);
  const parts = (p.startsWith('/') ? p : `${cwd}/${p}`).split('/');
  const out: string[] = [];
  for (const part of parts) { if (!part || part === '.') continue; if (part === '..') out.pop(); else out.push(part); }
  return '/' + out.join('/');
}
export function resolve(path: string, cwd = HOME): FsNode | undefined {
  let cur: FsNode | undefined = node('root');
  for (const part of normalize(path, cwd).split('/').filter(Boolean)) {
    if (!cur) return undefined;
    const curId: string = cur.id;
    cur = children(curId).find(c => c.name === part);
  }
  return cur;
}
const validName = (name: string) => {
  if (!name || name === '.' || name === '..' || name.includes('/')) throw new FsError(`Invalid name “${name}”`);
};
export function uniqueName(parent: string, name: string) {
  const taken = new Set(children(parent).map(c => c.name));
  if (!taken.has(name)) return name;
  const dot = name.lastIndexOf('.');
  const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
  for (let i = 2; ; i++) { const c = `${base} (${i})${ext}`; if (!taken.has(c)) return c; }
}
function create(parent: string, name: string, type: 'dir' | 'file', content = '') {
  validName(name);
  const p = node(parent);
  if (!p || p.type !== 'dir') throw new FsError('Not a directory');
  if (children(parent).some(c => c.name === name)) throw new FsError(`“${name}” already exists`);
  const id = newId();
  state.nodes[id] = { id, name, parent, type, mtime: Date.now(), ...(type === 'file' ? { content } : {}) };
  p.mtime = Date.now();
  commit();
  return state.nodes[id];
}
export const mkdir = (parent: string, name: string) => create(parent, name, 'dir');
export const createFile = (parent: string, name: string, content = '') => create(parent, name, 'file', content);
export function writeFile(id: string, content: string) {
  const n = node(id); if (!n || n.type !== 'file') throw new FsError('Not a file');
  n.content = content; n.mtime = Date.now(); commit();
}
export function rename(id: string, name: string) {
  validName(name);
  const n = node(id); if (!n || !n.parent) throw new FsError('Cannot rename');
  if (n.name === name) return;
  if (children(n.parent).some(c => c.name === name)) throw new FsError(`“${name}” already exists`);
  n.name = name; n.mtime = Date.now(); commit();
}
const isInside = (id: string, ancestor: string) => { for (let n = node(id); n; n = n.parent ? node(n.parent) : undefined) if (n.id === ancestor) return true; return false; };
export function move(id: string, parent: string, name?: string) {
  const n = node(id); const p = node(parent);
  if (!n || !n.parent || !p || p.type !== 'dir') throw new FsError('Invalid destination');
  if (isInside(parent, id)) throw new FsError('Cannot move a folder into itself');
  const target = name ?? n.name; validName(target);
  if (n.parent === parent && n.name === target) return n;
  const clash = children(parent).find(c => c.name === target);
  if (clash) { if (clash.type === 'dir') throw new FsError(`“${target}” already exists`); removeTree(clash.id); }
  n.parent = parent; n.name = target; n.mtime = Date.now(); commit(); return n;
}
export function copy(id: string, parent: string, name?: string): FsNode {
  const n = node(id); if (!n) throw new FsError('Missing source');
  if (n.type === 'dir' && isInside(parent, id)) throw new FsError('Cannot copy a folder into itself');
  const clone = (src: FsNode, dest: string, nm: string): FsNode => {
    const nid = newId();
    state.nodes[nid] = { ...src, id: nid, parent: dest, name: nm, mtime: Date.now(), trashedFrom: undefined, starred: false };
    if (src.type === 'dir') children(src.id).forEach(c => clone(c, nid, c.name));
    return state.nodes[nid];
  };
  const target = name ?? uniqueName(parent, n.name);
  const clash = children(parent).find(c => c.name === target);
  if (clash) { if (clash.type === 'dir') throw new FsError(`“${target}” already exists`); removeTree(clash.id); }
  const result = clone(n, parent, target); commit(); return result;
}
function removeTree(id: string) { children(id).forEach(c => removeTree(c.id)); delete state.nodes[id]; }
export function remove(id: string) {
  const n = node(id); if (!n || !n.parent) throw new FsError('Cannot remove');
  removeTree(id); state.recent = state.recent.filter(r => node(r)); commit();
}
export function trash(id: string) {
  const n = node(id); const t = resolve(TRASH);
  if (!n || !t || !n.parent) throw new FsError('Cannot move to trash');
  if (isInside(id, t.id)) return remove(id);
  n.trashedFrom = pathOf(n.parent); n.parent = t.id; n.name = uniqueName(t.id, n.name); n.mtime = Date.now(); commit();
}
export function restore(id: string) {
  const n = node(id); if (!n) return;
  let dest = resolve(n.trashedFrom ?? HOME);
  if (!dest || dest.type !== 'dir') dest = resolve(HOME)!;
  n.parent = dest.id; n.name = uniqueName(dest.id, n.name); n.trashedFrom = undefined; commit();
}
export function emptyTrash() { const t = resolve(TRASH); if (t) { children(t.id).forEach(c => removeTree(c.id)); commit(); } }
export function toggleStar(id: string) { const n = node(id); if (n) { n.starred = !n.starred; commit(); } }
export const starred = () => Object.values(load().nodes).filter(n => n.starred);
export function touchRecent(id: string) { load(); state.recent = [id, ...state.recent.filter(r => r !== id)].slice(0, 20); commit(); }
export function clearRecent() { load(); state.recent = []; commit(); }
export const recent = () => load().recent.map(node).filter((n): n is FsNode => !!n);
export const bookmarks = () => load().bookmarks;
export function toggleBookmark(path: string) { load(); state.bookmarks = state.bookmarks.includes(path) ? state.bookmarks.filter(b => b !== path) : [...state.bookmarks, path]; commit(); }
export function sizeOf(id: string): number { const n = node(id); if (!n) return 0; return n.type === 'file' ? new Blob([n.content ?? '']).size : children(id).reduce((s, c) => s + sizeOf(c.id), 0); }
export const formatSize = (b: number) => b < 1000 ? `${b} bytes` : b < 1e6 ? `${(b / 1000).toFixed(1)} kB` : `${(b / 1e6).toFixed(1)} MB`;
export function kindOf(n: FsNode) {
  if (n.type === 'dir') return 'Folder';
  const ext = n.name.split('.').pop()?.toLowerCase();
  return ({ txt: 'Plain text', md: 'Markdown', sh: 'Shell script', json: 'JSON', html: 'HTML document', css: 'CSS', js: 'JavaScript', png: 'PNG image', jpg: 'JPEG image', mp3: 'MP3 audio', mp4: 'MP4 video' } as Record<string, string>)[ext ?? ''] ?? (n.name.startsWith('.') ? 'Configuration' : 'Document');
}
export function search(rootId: string, q: string, hidden: boolean): FsNode[] {
  const out: FsNode[] = []; const lq = q.toLowerCase();
  const walk = (id: string) => children(id).forEach(c => { if (!hidden && c.name.startsWith('.')) return; if (c.name.toLowerCase().includes(lq)) out.push(c); if (c.type === 'dir') walk(c.id); });
  walk(rootId); return out;
}
load();
