import { useEffect, useMemo, useRef, useState, type MouseEvent as RMouseEvent } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, ChevronRight, Clock, Download, FileText, Folder, Grid2X2, HardDrive, Home, List, Menu, Music, Plus, Search, Star, Trash2, Image, Video, Monitor, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as fs from '@/lib/vfs';
import { openWith, useVfs } from './use-vfs';

const RECENT = 'recent:', STARRED = 'starred:', OTHER = 'other:';
type Tab = { history: string[]; pos: number };
type Sort = 'name' | 'size' | 'mtime';
let clipboard: { ids: string[]; cut: boolean } = { ids: [], cut: false };
const places = [['Home', Home, fs.HOME], ['Desktop', Monitor, `${fs.HOME}/Desktop`], ['Documents', FileText, `${fs.HOME}/Documents`], ['Downloads', Download, `${fs.HOME}/Downloads`], ['Music', Music, `${fs.HOME}/Music`], ['Pictures', Image, `${fs.HOME}/Pictures`], ['Videos', Video, `${fs.HOME}/Videos`], ['Trash', Trash2, fs.TRASH]] as const;
const labelFor = (loc: string) => loc === RECENT ? 'Recent' : loc === STARRED ? 'Starred' : loc === OTHER ? 'Other Locations' : loc === fs.TRASH ? 'Trash' : loc === fs.HOME ? 'Home' : loc === '/' ? 'Computer' : loc.split('/').pop()!;

export function openNode(n: fs.FsNode) {
  fs.touchRecent(n.id);
  if (n.type === 'dir') openWith({ app: 'files', path: fs.pathOf(n.id) });
  else openWith({ app: 'editor', path: fs.pathOf(n.id) });
}

export function FilesApp({ path, setTitle }: { path?: string; setTitle: (t: string) => void }) {
  const { ready } = useVfs();
  const [tabs, setTabs] = useState<Tab[]>([{ history: [path ?? fs.HOME], pos: 0 }]);
  const [tabIndex, setTabIndex] = useState(0);
  const [list, setList] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sort, setSort] = useState<{ by: Sort; desc: boolean }>({ by: 'name', desc: false });
  const [query, setQuery] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; item: boolean } | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [properties, setProperties] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const root = useRef<HTMLDivElement>(null);

  const tab = tabs[tabIndex] ?? tabs[0];
  const loc = tab.history[tab.pos];
  const dirNode = loc.startsWith('/') ? fs.resolve(loc) : undefined;
  const inTrash = loc === fs.TRASH;
  useEffect(() => { setTitle(labelFor(loc)); }, [loc, setTitle]);
  useEffect(() => { if (loc.startsWith('/') && ready && !dirNode) setTab({ history: [...tab.history.slice(0, tab.pos + 1), fs.HOME], pos: tab.pos + 1 }); });
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(''), 3500); return () => clearTimeout(t); }, [message]);

  const setTab = (t: Tab) => setTabs(prev => prev.map((p, i) => i === tabIndex ? t : p));
  const navigate = (next: string) => { if (next === loc) return; setTab({ history: [...tab.history.slice(0, tab.pos + 1), next], pos: tab.pos + 1 }); setSelected([]); setQuery(null); setMenu(null); };
  const go = (delta: number) => { setTab({ ...tab, pos: tab.pos + delta }); setSelected([]); };
  const act = (fn: () => void) => { try { fn(); } catch (e) { setMessage((e as Error).message); } setMenu(null); };

  const items = useMemo(() => {
    if (!ready) return [];
    let raw: fs.FsNode[] = loc === RECENT ? fs.recent() : loc === STARRED ? fs.starred() : loc === OTHER ? [fs.resolve('/')!] : dirNode ? (query ? fs.search(dirNode.id, query, hidden) : fs.children(dirNode.id)) : [];
    if (!hidden) raw = raw.filter(n => !n.name.startsWith('.'));
    if (loc === RECENT) return raw;
    const dir = sort.desc ? -1 : 1;
    return [...raw].sort((a, b) => (a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : sort.by === 'size' ? fs.sizeOf(a.id) - fs.sizeOf(b.id) : sort.by === 'mtime' ? a.mtime - b.mtime : a.name.localeCompare(b.name, undefined, { numeric: true })) * (a.type !== b.type ? 1 : dir));
  });

  const clickItem = (e: RMouseEvent, id: string) => {
    e.stopPropagation(); root.current?.focus();
    if (e.ctrlKey || e.metaKey) setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    else if (e.shiftKey && anchor) { const ids = items.map(i => i.id); const [a, b] = [ids.indexOf(anchor), ids.indexOf(id)].sort((x, y) => x - y); setSelected(ids.slice(a, b + 1)); return; }
    else setSelected([id]);
    setAnchor(id);
  };
  const open = (n: fs.FsNode) => { if (n.type === 'dir') { fs.touchRecent(n.id); navigate(fs.pathOf(n.id)); } else openNode(n); };
  const paste = () => act(() => {
    if (!dirNode || !clipboard.ids.length) return;
    clipboard.ids.forEach(id => { if (!fs.node(id)) return; if (clipboard.cut) fs.move(id, dirNode.id, fs.node(id)!.parent === dirNode.id ? undefined : fs.uniqueName(dirNode.id, fs.node(id)!.name)); else fs.copy(id, dirNode.id); });
    if (clipboard.cut) clipboard = { ids: [], cut: false };
  });
  const trashSelected = () => act(() => { selected.forEach(id => inTrash ? fs.remove(id) : fs.trash(id)); setMessage(inTrash ? `Deleted ${selected.length} item(s) permanently` : `${selected.length} item(s) moved to Trash`); setSelected([]); });
  const newItem = (type: 'dir' | 'file') => act(() => { if (!dirNode) return; const n = type === 'dir' ? fs.mkdir(dirNode.id, fs.uniqueName(dirNode.id, 'New Folder')) : fs.createFile(dirNode.id, fs.uniqueName(dirNode.id, 'Untitled Document.txt')); setSelected([n.id]); setRenaming(n.id); });
  const canWrite = !!dirNode && !inTrash && fs.pathOf(dirNode.id).startsWith(fs.HOME) || loc === '/tmp';
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey && k === 'h') { e.preventDefault(); setHidden(h => !h); }
    else if (e.ctrlKey && k === 'a') { e.preventDefault(); setSelected(items.map(i => i.id)); }
    else if (e.ctrlKey && (k === 'c' || k === 'x') && selected.length) { clipboard = { ids: selected, cut: k === 'x' }; setMessage(`${selected.length} item(s) ${k === 'x' ? 'cut' : 'copied'}`); }
    else if (e.ctrlKey && k === 'v' && canWrite) paste();
    else if (e.ctrlKey && k === 'f') { e.preventDefault(); setQuery(''); }
    else if (e.ctrlKey && e.shiftKey && k === 'n' && canWrite) { e.preventDefault(); newItem('dir'); }
    else if (e.ctrlKey && k === 't') { e.preventDefault(); setTabs(t => [...t, { history: [loc], pos: 0 }]); setTabIndex(tabs.length); }
    else if (k === 'delete' && selected.length) trashSelected();
    else if (k === 'f2' && selected.length === 1 && !inTrash) setRenaming(selected[0]);
    else if (k === 'enter' && selected.length === 1) { const n = fs.node(selected[0]); if (n) open(n); }
    else if (k === 'backspace' || (e.altKey && k === 'arrowleft')) { if (tab.pos > 0) go(-1); }
    else if (e.altKey && k === 'arrowup' && dirNode?.parent) navigate(fs.pathOf(dirNode.parent));
  };
  const crumbs = loc.startsWith('/') ? (() => { const out: [string, string][] = []; const base = loc.startsWith(fs.HOME) ? fs.HOME : '/'; out.push([base === fs.HOME ? 'Home' : 'Computer', base]); loc.slice(base.length).split('/').filter(Boolean).reduce((acc, part) => { const p = `${acc === '/' ? '' : acc}/${part}`; out.push([part, p]); return p; }, base); return out; })() : [[labelFor(loc), loc] as [string, string]];
  const bookmarked = fs.bookmarks();
  const sidebarBtn = (key: string, label: string, Icon: typeof Home, target: string) => <Button key={key} variant="desktop" className={`sidebar-item ${loc === target ? 'selected' : ''}`} onClick={() => navigate(target)}
    onDragOver={e => { if (target.startsWith('/')) e.preventDefault(); }} onDrop={e => { e.preventDefault(); const dest = fs.resolve(target); const ids: string[] = JSON.parse(e.dataTransfer.getData('application/x-ubuntu-files') || '[]'); act(() => ids.forEach(id => target === fs.TRASH ? fs.trash(id) : dest && fs.move(id, dest.id, fs.uniqueName(dest.id, fs.node(id)!.name)))); }}><Icon />{label}</Button>;
  const prop = properties ? fs.node(properties) : undefined;

  return <div className="files-app" ref={root} tabIndex={-1} onKeyDown={onKey} onClick={() => { setMenu(null); setOptionsOpen(false); }}>
    <aside className="files-sidebar">
      {sidebarBtn('recent', 'Recent', Clock, RECENT)}{sidebarBtn('starred', 'Starred', Star, STARRED)}
      {places.map(([name, Icon, p]) => sidebarBtn(name, name, Icon, p))}
      {bookmarked.length > 0 && <div className="sidebar-divider" />}
      {bookmarked.map(b => sidebarBtn(b, labelFor(b), Bookmark, b))}
      <div className="sidebar-divider" />{sidebarBtn('other', 'Other Locations', HardDrive, OTHER)}
    </aside>
    <div className="files-main">
      <div className="files-toolbar">
        <Button variant="desktop" size="icon" aria-label="Back" disabled={tab.pos === 0} onClick={() => go(-1)}><ArrowLeft /></Button>
        <Button variant="desktop" size="icon" aria-label="Forward" disabled={tab.pos >= tab.history.length - 1} onClick={() => go(1)}><ArrowRight /></Button>
        {query !== null ? <input className="file-search" aria-label="Search files" placeholder={`Search ${labelFor(loc)}`} autoFocus value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setQuery(null); } }} />
          : <nav className="breadcrumb" aria-label="Location">{crumbs.map(([label, p], i) => <span key={p} className="crumb">{i > 0 && <ChevronRight size={13} />}<Button variant="desktop" className={i === crumbs.length - 1 ? 'current' : ''} onClick={() => navigate(p)}>{i === 0 && p === fs.HOME && <Home size={15} />}{label}</Button></span>)}</nav>}
        <Button variant="desktop" size="icon" aria-label="Search files" className={query !== null ? 'selected' : ''} onClick={() => setQuery(query === null ? '' : null)} disabled={!dirNode}><Search /></Button>
        <Button variant="desktop" size="icon" aria-label="Toggle file view" onClick={() => setList(!list)}>{list ? <Grid2X2 /> : <List />}</Button>
        <Button variant="desktop" size="icon" aria-label="File options" onClick={e => { e.stopPropagation(); setOptionsOpen(!optionsOpen); }}><Menu /></Button>
        {optionsOpen && <div className="file-menu" onClick={e => e.stopPropagation()}>
          <Button variant="desktop" onClick={() => { setTabs(t => [...t, { history: [loc], pos: 0 }]); setTabIndex(tabs.length); setOptionsOpen(false); }}>New Tab</Button>
          {canWrite && <Button variant="desktop" onClick={() => { newItem('dir'); setOptionsOpen(false); }}>New Folder</Button>}
          {loc.startsWith('/') && !inTrash && <Button variant="desktop" onClick={() => { fs.toggleBookmark(loc); setOptionsOpen(false); }}>{bookmarked.includes(loc) ? 'Remove Bookmark' : 'Bookmark this Location'}</Button>}
          <div className="context-divider" />
          <Button variant="desktop" onClick={() => setHidden(!hidden)}>{hidden ? '✓ ' : ''}Show Hidden Files</Button>
          {(['name', 'size', 'mtime'] as Sort[]).map(by => <Button key={by} variant="desktop" onClick={() => setSort({ by, desc: sort.by === by ? !sort.desc : false })}>{sort.by === by ? (sort.desc ? '↓ ' : '↑ ') : ''}Sort by {by === 'mtime' ? 'Modified' : by === 'name' ? 'Name' : 'Size'}</Button>)}
          {inTrash && <Button variant="desktop" onClick={() => { act(fs.emptyTrash); setOptionsOpen(false); }}>Empty Trash</Button>}
        </div>}
      </div>
      {tabs.length > 1 && <div className="files-tabs" role="tablist">{tabs.map((t, i) => <div key={i} role="tab" aria-selected={i === tabIndex} className={`files-tab ${i === tabIndex ? 'selected' : ''}`} onClick={() => { setTabIndex(i); setSelected([]); }}><span>{labelFor(t.history[t.pos])}</span><Button variant="desktop" size="icon" aria-label="Close tab" onClick={e => { e.stopPropagation(); setTabs(tabs.filter((_, j) => j !== i)); setTabIndex(Math.max(0, i <= tabIndex ? tabIndex - 1 : tabIndex)); }}><X /></Button></div>)}<Button variant="desktop" size="icon" aria-label="New tab" onClick={() => { setTabs([...tabs, { history: [loc], pos: 0 }]); setTabIndex(tabs.length); }}><Plus /></Button></div>}
      {inTrash && <div className="trash-bar"><span>Items in Trash can be restored or deleted permanently.</span><Button variant="desktop" disabled={!items.length} onClick={() => act(fs.emptyTrash)}>Empty…</Button></div>}
      {list && <div className="list-header"><Button variant="desktop" onClick={() => setSort({ by: 'name', desc: sort.by === 'name' && !sort.desc })}>Name</Button><Button variant="desktop" onClick={() => setSort({ by: 'size', desc: sort.by === 'size' && !sort.desc })}>Size</Button><Button variant="desktop" onClick={() => setSort({ by: 'mtime', desc: sort.by === 'mtime' && !sort.desc })}>Modified</Button></div>}
      <div className={`folder-grid ${list ? 'list-view' : ''}`} onClick={() => setSelected([])}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); const r = root.current!.getBoundingClientRect(); const item = !!(e.target as HTMLElement).closest('.folder-item'); if (!item) setSelected([]); setMenu({ x: Math.min(e.clientX - r.left, r.width - 210), y: Math.min(e.clientY - r.top, r.height - 300), item }); }}
        onDragOver={e => { if (canWrite) e.preventDefault(); }} onDrop={e => { if (!dirNode || !canWrite) return; e.preventDefault(); const ids: string[] = JSON.parse(e.dataTransfer.getData('application/x-ubuntu-files') || '[]'); act(() => ids.forEach(id => { const n = fs.node(id); if (n && n.parent !== dirNode.id) fs.move(id, dirNode.id, fs.uniqueName(dirNode.id, n.name)); })); }}>
        {items.map(n => <div key={n.id} role="button" tabIndex={0} aria-label={n.name} className={`folder-item ${selected.includes(n.id) ? 'selected' : ''} ${clipboard.cut && clipboard.ids.includes(n.id) ? 'cut' : ''}`} draggable={!inTrash && loc !== OTHER}
          onClick={e => clickItem(e, n.id)} onDoubleClick={() => open(n)} onContextMenu={e => { if (!selected.includes(n.id)) setSelected([n.id]); }}
          onDragStart={e => { const ids = selected.includes(n.id) ? selected : [n.id]; e.dataTransfer.setData('application/x-ubuntu-files', JSON.stringify(ids)); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={e => { if (n.type === 'dir') { e.preventDefault(); e.stopPropagation(); } }} onDrop={e => { if (n.type !== 'dir') return; e.preventDefault(); e.stopPropagation(); const ids: string[] = JSON.parse(e.dataTransfer.getData('application/x-ubuntu-files') || '[]'); act(() => ids.filter(id => id !== n.id).forEach(id => fs.move(id, n.id, fs.uniqueName(n.id, fs.node(id)!.name)))); }}>
          <span className={n.type === 'dir' ? 'folder-art' : 'file-art'}>{n.type === 'dir' ? <Folder fill="currentColor" strokeWidth={1.1} /> : <File strokeWidth={1.2} />}{n.starred && <Star className="star-badge" fill="currentColor" />}</span>
          {renaming === n.id ? <input className="rename-input" aria-label="Rename" autoFocus defaultValue={n.name} onClick={e => e.stopPropagation()} onFocus={e => { const dot = n.type === 'file' ? n.name.lastIndexOf('.') : -1; e.currentTarget.setSelectionRange(0, dot > 0 ? dot : n.name.length); }}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { const v = e.currentTarget.value.trim(); act(() => fs.rename(n.id, v)); setRenaming(null); } if (e.key === 'Escape') setRenaming(null); }} onBlur={e => { const v = e.currentTarget.value.trim(); if (v && v !== n.name) act(() => fs.rename(n.id, v)); setRenaming(null); }} />
            : <span className="item-name">{n.name}</span>}
          {list && <><span className="folder-kind">{n.type === 'dir' ? `${fs.children(n.id).length} items` : fs.formatSize(fs.sizeOf(n.id))}</span><span className="folder-kind">{inTrash ? n.trashedFrom?.replace(fs.HOME, '~') : new Date(n.mtime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></>}
        </div>)}
        {ready && items.length === 0 && <div className="empty-folder">{query ? <Search size={56} strokeWidth={1} /> : inTrash ? <Trash2 size={56} strokeWidth={1} /> : <Folder size={56} strokeWidth={1} />}<span>{query ? 'No results found' : inTrash ? 'Trash is empty' : 'Folder is empty'}</span></div>}
      </div>
      {menu && <div className="file-context shell-popover" style={{ left: menu.x, top: menu.y }} onClick={e => e.stopPropagation()}>
        {menu.item && selected.length ? <>
          {inTrash ? <><Button variant="desktop" onClick={() => act(() => { selected.forEach(fs.restore); setSelected([]); })}>Restore From Trash</Button><Button variant="desktop" onClick={trashSelected}>Delete Permanently</Button></> : <>
            <Button variant="desktop" onClick={() => act(() => selected.length === 1 && open(fs.node(selected[0])!))}>Open</Button>
            {selected.length === 1 && fs.node(selected[0])?.type === 'dir' && <Button variant="desktop" onClick={() => { setTabs([...tabs, { history: [fs.pathOf(selected[0])], pos: 0 }]); setTabIndex(tabs.length); setMenu(null); }}>Open in New Tab</Button>}
            {selected.length === 1 && fs.node(selected[0])?.type === 'dir' && <Button variant="desktop" onClick={() => act(() => openWith({ app: 'terminal', path: fs.pathOf(selected[0]) }))}>Open in Terminal</Button>}
            <div className="context-divider" />
            <Button variant="desktop" onClick={() => { clipboard = { ids: selected, cut: true }; setMenu(null); }}>Cut</Button>
            <Button variant="desktop" onClick={() => { clipboard = { ids: selected, cut: false }; setMenu(null); }}>Copy</Button>
            {selected.length === 1 && <Button variant="desktop" onClick={() => { setRenaming(selected[0]); setMenu(null); }}>Rename…</Button>}
            <Button variant="desktop" onClick={() => act(() => selected.forEach(fs.toggleStar))}>{fs.node(selected[0])?.starred ? 'Unstar' : 'Star'}</Button>
            <Button variant="desktop" onClick={trashSelected}>Move to Trash</Button>
          </>}
          <div className="context-divider" /><Button variant="desktop" onClick={() => { setProperties(selected[0]); setMenu(null); }}>Properties</Button>
        </> : <>
          {canWrite && <><Button variant="desktop" onClick={() => newItem('dir')}>New Folder…</Button><Button variant="desktop" onClick={() => newItem('file')}>New Document</Button><Button variant="desktop" disabled={!clipboard.ids.length} onClick={paste}>Paste</Button><div className="context-divider" /></>}
          <Button variant="desktop" onClick={() => { setSelected(items.map(i => i.id)); setMenu(null); }}>Select All</Button>
          {dirNode && <Button variant="desktop" onClick={() => act(() => openWith({ app: 'terminal', path: loc }))}>Open in Terminal</Button>}
          {inTrash && <Button variant="desktop" disabled={!items.length} onClick={() => act(fs.emptyTrash)}>Empty Trash</Button>}
          {dirNode && <Button variant="desktop" onClick={() => { setProperties(dirNode.id); setMenu(null); }}>Properties</Button>}
        </>}
      </div>}
      {prop && <div className="properties-backdrop" onClick={() => setProperties(null)}><div className="properties-dialog" role="dialog" aria-label="Properties" onClick={e => e.stopPropagation()}>
        <header><strong>{prop.name || 'Computer'}</strong><Button variant="desktop" size="icon" aria-label="Close properties" onClick={() => setProperties(null)}><X /></Button></header>
        <span className={prop.type === 'dir' ? 'folder-art' : 'file-art'}>{prop.type === 'dir' ? <Folder fill="currentColor" strokeWidth={1.1} /> : <File strokeWidth={1.2} />}</span>
        <dl>{[['Name', prop.name || '/'], ['Type', fs.kindOf(prop)], ['Contents', prop.type === 'dir' ? `${fs.children(prop.id).length} items, totalling ${fs.formatSize(fs.sizeOf(prop.id))}` : fs.formatSize(fs.sizeOf(prop.id))], ['Parent Folder', prop.parent ? fs.pathOf(prop.parent) : '—'], ['Modified', new Date(prop.mtime).toLocaleString()], ['Permissions', prop.type === 'dir' ? 'drwxr-xr-x ubuntu' : '-rw-r--r-- ubuntu'], ...(prop.trashedFrom ? [['Original Location', prop.trashedFrom]] : [])].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </div></div>}
      <footer className="files-status">{selected.length ? `${selected.length === 1 ? `“${fs.node(selected[0])?.name}”` : `${selected.length} items`} selected${selected.length === 1 ? ` (${fs.formatSize(fs.sizeOf(selected[0]))})` : ''}` : `${items.length} items${hidden ? ', hidden files shown' : ''}`}<span>{message || (dirNode ? `${fs.formatSize(fs.sizeOf(fs.resolve(fs.HOME)!.id))} used of browser storage` : '')}</span></footer>
    </div>
  </div>;
}
