import { useEffect, useState } from 'react';
import { BatteryFull, ChevronDown, CircleHelp, Grid3X3, Home, Monitor, Search, Settings, Trash2, Volume2, Wifi, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import wallpaper from '@/assets/ubuntu-wallpaper.jpg';
import { AppIcon } from './app-icon';
import { apps, type AppId } from './apps';
import { Window, type DesktopWindow } from './window';
import { AppContent } from './app-content';

export function Desktop() {
  const [windows, setWindows] = useState<DesktopWindow[]>([{ id: 1, app: 'files', title: 'Home', x: 180, y: 125, width: 860, height: 530, z: 2, minimized: false, maximized: false }]);
  const [active, setActive] = useState(1);
  const [overview, setOverview] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [popover, setPopover] = useState<'calendar' | 'system' | null>(null);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [clock, setClock] = useState(new Date());
  const [monthOffset, setMonthOffset] = useState(0);
  const [wifi, setWifi] = useState(true);
  const [volume, setVolume] = useState(65);
  const [notice, setNotice] = useState('');
  const focus = (id: number) => { setActive(id); setWindows(prev => prev.map(w => w.id === id ? { ...w, z: Math.max(...prev.map(p => p.z), 1) + 1, minimized: false } : w)); };
  const launch = (app: AppId, newWindow = false) => {
    const existing = windows.find(w => w.app === app);
    if (existing && !newWindow) focus(existing.id);
    else { const id = Date.now(); const appInfo = apps.find(a => a.id === app); setWindows(prev => [...prev, { id, app, title: app === 'files' ? 'Home' : appInfo?.name ?? app, x: Math.max(76, Math.min(window.innerWidth - 460, 200 + prev.length * 24)), y: 100 + (prev.length % 5) * 30, width: Math.min(app === 'terminal' ? 730 : 860, window.innerWidth - 96), height: Math.min(530, window.innerHeight - 130), z: Math.max(...prev.map(w => w.z), 1) + 1, minimized: false, maximized: false }]); setActive(id); }
    setOverview(false); setPopover(null); setContext(null);
  };
  useEffect(() => { const timer = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOverview(false); setPopover(null); setContext(null); }
      if (e.key === 'Meta' || (e.altKey && e.key === 'F1')) { e.preventDefault(); setOverview(v => !v); }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); launch('terminal', true); }
      if (e.altKey && e.key === 'F4') { e.preventDefault(); setWindows(prev => prev.filter(w => w.id !== active)); }
      if (e.altKey && e.key === 'Tab') { e.preventDefault(); const ordered = [...windows].sort((a, b) => b.z - a.z); const next = ordered.length > 1 ? ordered[1] : ordered[0]; if (next) focus(next.id); }
    };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  });
  const calendarDate = new Date(clock.getFullYear(), clock.getMonth() + monthOffset, 1);
  const calendarStart = (calendarDate.getDay() + 6) % 7;
  const days = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  return <main className="ubuntu-desktop" onContextMenu={e => { if ((e.target as HTMLElement).closest('.app-window,.dock,.top-panel,.overview')) return; e.preventDefault(); setContext({ x: Math.min(e.clientX, window.innerWidth - 240), y: Math.min(e.clientY, window.innerHeight - 190) }); setPopover(null); }}>
    <img className="desktop-wallpaper" src={wallpaper} width={1920} height={1088} alt="Original purple Resolute Raccoon desktop wallpaper" />
    <div className="desktop-surface" onClick={() => { setPopover(null); setContext(null); }} />
    <header className="top-panel"><div className="panel-left"><Button variant="panel" className="activities-button" aria-label="Activities overview" onClick={() => { setOverview(!overview); setPopover(null); }}><span className="workspace-mark"><i /><i /></span></Button><span className="panel-app-name">{overview ? 'Activities' : windows.find(w => w.id === active && !w.minimized)?.app === 'files' ? 'Files' : apps.find(a => a.id === windows.find(w => w.id === active && !w.minimized)?.app)?.name ?? 'Ubuntu Desktop'}</span></div><Button variant="panel" className="clock-button" onClick={() => { setPopover(popover === 'calendar' ? null : 'calendar'); setOverview(false); }}>{clock.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<span>{clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></Button><Button variant="panel" className="system-button" aria-label="System menu" onClick={() => { setPopover(popover === 'system' ? null : 'system'); setOverview(false); }}><Wifi /><Volume2 /><BatteryFull /><ChevronDown /></Button></header>
    <nav className="dock" aria-label="Favorite applications">{apps.map(app => <Button key={app.id} variant="dock" size="icon" title={app.name} aria-label={`Open ${app.name}`} className={windows.some(w => w.app === app.id) ? 'running' : ''} onClick={e => launch(app.id, e.shiftKey)}><AppIcon app={app.id} />{windows.some(w => w.app === app.id && w.id === active && !w.minimized) && <span className="dock-active" />}</Button>)}<div className="dock-divider" /><Button variant="dock" size="icon" title="Trash" aria-label="Open Trash" onClick={() => { launch('files'); setNotice('Trash is empty'); }}><span className="trash-icon"><Trash2 /></span></Button><div className="dock-spacer" /><Button variant="dock" size="icon" className={overview ? 'overview-active' : ''} title="Show Applications" aria-label="Show Applications" onClick={() => { setOverview(!overview); setPopover(null); }}><Grid3X3 className="show-apps-icon" /></Button></nav>
    <div className="desktop-icons"><Button variant="desktop" className="desktop-icon" onDoubleClick={() => launch('files')} onKeyDown={e => { if (e.key === 'Enter') launch('files'); }}><span className="home-folder"><Home /></span><span>Home</span></Button></div>
    {!overview && windows.map(win => <Window key={win.id} win={win} active={active === win.id} focus={() => focus(win.id)} update={patch => setWindows(prev => prev.map(w => w.id === win.id ? { ...w, ...patch } : w))} close={() => setWindows(prev => prev.filter(w => w.id !== win.id))}><AppContent app={win.app} /></Window>)}
    {overview && <section className="overview" aria-label="Application overview"><div className="overview-search"><Search size={19} /><input autoFocus aria-label="Search applications" placeholder="Type to search" value={query} onChange={e => setQuery(e.target.value)} />{query && <Button variant="desktop" size="icon" aria-label="Clear search" onClick={() => setQuery('')}><X /></Button>}</div><div className="overview-workspaces"><div className="workspace-preview"><img src={wallpaper} alt="Current desktop" />{windows.filter(w => !w.minimized).slice(0, 3).map(w => <Button variant="desktop" key={w.id} className="preview-window" onClick={() => { focus(w.id); setOverview(false); }}><AppIcon app={w.app} small />{w.title}</Button>)}</div></div><div className="launcher-categories">{['All', 'Utilities', 'System'].map(c => <Button variant="desktop" key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</Button>)}</div><div className="application-grid">{apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || a.category === category)).map(app => <Button variant="desktop" key={app.id} className="application-tile" onClick={() => launch(app.id)}><AppIcon app={app.id} /><span>{app.name}</span>{windows.some(w => w.app === app.id) && <i />}</Button>)}</div>{apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || a.category === category)).length === 0 && <p className="no-results">No applications found</p>}<div className="overview-page-dot" /></section>}
    {popover === 'calendar' && <section className="calendar-popover shell-popover"><div className="notification-empty"><CircleHelp size={36} strokeWidth={1} /><span>No Notifications</span></div><div className="calendar-content"><strong>{clock.toLocaleDateString('en-US', { weekday: 'long' })}</strong><h2>{clock.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2><div className="calendar-heading"><Button variant="desktop" size="icon" aria-label="Previous month" onClick={() => setMonthOffset(monthOffset - 1)}><ChevronLeft /></Button><strong>{calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong><Button variant="desktop" size="icon" aria-label="Next month" onClick={() => setMonthOffset(monthOffset + 1)}><ChevronRight /></Button></div><div className="calendar-grid">{['M','T','W','T','F','S','S'].map((d,i) => <b key={i}>{d}</b>)}{Array.from({ length: calendarStart }, (_, i) => <span key={`empty${i}`} />)}{Array.from({ length: days }, (_, i) => <span className={monthOffset === 0 && clock.getDate() === i + 1 ? 'today' : ''} key={i}>{i + 1}</span>)}</div></div></section>}
    {popover === 'system' && <section className="system-popover shell-popover"><div className="system-header"><span><BatteryFull size={18} />100%</span><Button variant="desktop" size="icon" aria-label="Open system settings" onClick={() => launch('settings')}><Settings /></Button></div><div className="volume-row"><Volume2 size={20} /><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} /></div><Button variant="desktop" className={`wifi-toggle ${wifi ? 'selected' : ''}`} onClick={() => setWifi(!wifi)}><Wifi /><span>Wi-Fi<small>{wifi ? 'Connected' : 'Off'}</small></span><ChevronDown /></Button><Button variant="desktop" className="system-settings-link" onClick={() => launch('settings')}><Monitor />About this System</Button></section>}
    {context && <div className="desktop-context shell-popover" style={{ left: context.x, top: context.y }}><Button variant="desktop" onClick={() => launch('files')}>Open Home</Button><Button variant="desktop" onClick={() => launch('terminal', true)}>Open in Terminal</Button><div className="context-divider" /><Button variant="desktop" onClick={() => launch('settings')}>About this System</Button><Button variant="desktop" onClick={() => { setWindows(prev => prev.map(w => ({ ...w, minimized: true }))); setContext(null); }}>Show Desktop</Button></div>}
    {notice && <div className="desktop-notice">{notice}</div>}
    <div className="desktop-version">Ubuntu 26.04 LTS</div>
  </main>;
}