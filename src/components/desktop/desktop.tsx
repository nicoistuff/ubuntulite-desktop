import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { BatteryFull, Bell, BellOff, Bluetooth, ChevronDown, ChevronLeft, ChevronRight, File, Folder, Gauge, Grid3X3, Home, Lock, LogOut, Moon, Plane, Power, RotateCcw, Search, Settings, Sun, Trash2, Volume2, VolumeX, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import wallpaper from '@/assets/ubuntu-wallpaper.jpg';
import * as fs from '@/lib/vfs';
import { ACCENTS, localeOf, setSettings, useSettings, wallpaperCss } from '@/lib/settings';
import { clearAll, dismiss, hideBanner, notify, useNotifications } from '@/lib/notifications';
import { AppIcon } from './app-icon';
import { apps, type AppId } from './apps';
import { Window, type DesktopWindow } from './window';
import { AppContent } from './app-content';
import { openNode } from './files-app';
import { useVfs, type OpenRequest } from './use-vfs';
import { SessionScreen, type SessionMode } from './session-screen';

const ago = (t: number, now: number) => { const m = Math.floor((now - t) / 60000); return m < 1 ? 'Just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`; };

export function Desktop() {
  const s = useSettings();
  const notices = useNotifications();
  const locale = localeOf(s);
  const [windows, setWindows] = useState<DesktopWindow[]>([{ id: 1, app: 'files', title: 'Home', x: 180, y: 125, width: 860, height: 530, z: 2, minimized: false, maximized: false }]);
  const [active, setActive] = useState(1);
  const [overview, setOverview] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [popover, setPopover] = useState<'calendar' | 'system' | null>(null);
  const [powerMenu, setPowerMenu] = useState(false);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [clock, setClock] = useState<Date | null>(null); // null until mounted: keeps SSR and first client render identical
  const [monthOffset, setMonthOffset] = useState(0);
  const [session, setSession] = useState<SessionMode>('active');
  const lastActivity = useRef(Date.now());
  const closeMenus = () => { setOverview(false); setPopover(null); setContext(null); setPowerMenu(false); };
  const focus = (id: number) => { setActive(id); setWindows(prev => prev.map(w => w.id === id ? { ...w, z: Math.max(...prev.map(p => p.z), 1) + 1, minimized: false } : w)); };
  const launch = (app: AppId, newWindow = false, path?: string) => {
    const existing = windows.find(w => w.app === app);
    if (existing && app === 'settings' && path) { setWindows(prev => prev.map(w => w.id === existing.id ? { ...w, path } : w)); focus(existing.id); }
    else if (existing && !newWindow && !path) focus(existing.id);
    else { const id = Date.now() + Math.random(); const appInfo = apps.find(a => a.id === app); setWindows(prev => [...prev, { id, app, path, title: app === 'files' ? 'Home' : appInfo?.name ?? app, x: Math.max(76, Math.min(window.innerWidth - 460, 200 + prev.length * 24)), y: 100 + (prev.length % 5) * 30, width: Math.min(app === 'terminal' ? 730 : app === 'settings' ? 900 : 860, window.innerWidth - 96), height: Math.min(app === 'settings' ? 600 : 530, window.innerHeight - 130), z: Math.max(...prev.map(w => w.z), 1) + 1, minimized: false, maximized: false }]); setActive(id); }
    closeMenus();
  };
  const launchRef = useRef(launch); launchRef.current = launch;
  useEffect(() => { const onOpen = (e: Event) => { const d = (e as CustomEvent<OpenRequest>).detail; launchRef.current(d.app, true, d.path); }; window.addEventListener('ubuntu:open', onOpen); return () => window.removeEventListener('ubuntu:open', onOpen); }, []);
  const titleSetters = useRef(new Map<number, (t: string) => void>());
  const titleFor = (id: number) => { let f = titleSetters.current.get(id); if (!f) { f = (t: string) => setWindows(prev => prev.map(w => w.id === id && w.title !== t ? { ...w, title: t } : w)); titleSetters.current.set(id, f); } return f; };
  const { ready } = useVfs();
  const deskDir = ready ? fs.resolve(`${fs.HOME}/Desktop`) : undefined;
  const deskItems = deskDir ? fs.children(deskDir.id).filter(n => !n.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const newDesktopFolder = () => { const d = fs.resolve(`${fs.HOME}/Desktop`); if (d) { const n = fs.mkdir(d.id, fs.uniqueName(d.id, 'New Folder')); notify('Files', 'Folder created', `“${n.name}” was added to the Desktop.`); } setContext(null); };
  useEffect(() => { setClock(new Date()); const timer = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(timer); }, []);
  // Automatic screen lock after idle time (Privacy & Security setting).
  useEffect(() => {
    const touch = () => { lastActivity.current = Date.now(); };
    window.addEventListener('pointermove', touch); window.addEventListener('keydown', touch);
    return () => { window.removeEventListener('pointermove', touch); window.removeEventListener('keydown', touch); };
  }, []);
  useEffect(() => { if (session === 'active' && s.lockDelay > 0 && Date.now() - lastActivity.current > s.lockDelay * 60000) setSession('locked'); }, [clock, s.lockDelay, session]);
  // Natural scrolling (Mouse & Touchpad setting) inverts wheel direction inside app windows.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = mainRef.current; if (!el || !s.naturalScroll) return;
    const onWheel = (e: WheelEvent) => {
      let t = e.target as HTMLElement | null;
      while (t && t !== el) { const o = getComputedStyle(t).overflowY; if ((o === 'auto' || o === 'scroll') && t.scrollHeight > t.clientHeight) { e.preventDefault(); t.scrollBy(-e.deltaX, -e.deltaY); return; } t = t.parentElement; }
    };
    el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel);
  }, [s.naturalScroll]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (session !== 'active') return;
      if (e.key === 'Escape') closeMenus();
      if (e.key === 'Meta' || (e.altKey && e.key === 'F1')) { e.preventDefault(); setOverview(v => !v); }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); launch('terminal', true); }
      if (e.altKey && e.key === 'F4') { e.preventDefault(); setWindows(prev => prev.filter(w => w.id !== active)); }
      if (e.altKey && e.key === 'Tab') { e.preventDefault(); const ordered = [...windows].sort((a, b) => b.z - a.z); const next = ordered.length > 1 ? ordered[1] : ordered[0]; if (next) focus(next.id); }
    };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  });
  const sessionAction = (mode: SessionMode) => { closeMenus(); if (mode !== 'locked') setWindows([]); setSession(mode); };
  const booted = useCallback(() => setSession('loggedout'), []);

  const accent = ACCENTS[s.accent];
  const wp = wallpaperCss(s);
  const wpStyle: CSSProperties = wp ? { background: wp } : { background: `center / cover no-repeat url(${wallpaper})` };
  const style = { '--primary': accent, '--ring': accent, '--folder': accent, '--folder-edge': `color-mix(in oklch, ${accent}, black 22%)`, '--dock-icon': `${s.iconSize}px` } as CSSProperties;
  const cls = ['ubuntu-desktop', overview && 'overview-shown', s.theme === 'dark' && 'theme-dark', s.largeText && 'large-text', s.reduceMotion && 'reduce-motion', s.highContrast && 'high-contrast', s.dockAutohide && 'dock-autohide'].filter(Boolean).join(' ');
  const wifiOn = s.wifi && !s.airplane; const btOn = s.bluetooth && !s.airplane;
  const timeStr = clock ? clock.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', ...(s.clockSeconds ? { second: '2-digit' } : {}), hour12: !s.clock24 }) : '';
  const dateStr = clock ? clock.toLocaleDateString(locale, { ...(s.showWeekday ? { weekday: 'short' } : {}), month: 'short', day: 'numeric' }) : '';
  const calBase = clock ?? new Date();
  const calendarDate = new Date(calBase.getFullYear(), calBase.getMonth() + monthOffset, 1);
  const calendarStart = (calendarDate.getDay() + 6) % 7;
  const days = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const banners = notices.filter(n => n.popup).slice(0, 3);
  const activeApp = windows.find(w => w.id === active && !w.minimized)?.app;
  const tiles = [
    { label: 'Wi-Fi', sub: wifiOn ? s.wifiNetwork : 'Off', on: wifiOn, Icon: wifiOn ? Wifi : WifiOff, act: () => setSettings({ wifi: !wifiOn, airplane: false }) },
    { label: 'Bluetooth', sub: btOn ? (s.pairedDevices.length ? `${s.pairedDevices.length} connected` : 'On') : 'Off', on: btOn, Icon: Bluetooth, act: () => setSettings({ bluetooth: !btOn, airplane: false }) },
    { label: 'Power Mode', sub: s.powerMode === 'saver' ? 'Power Saver' : s.powerMode === 'performance' ? 'Performance' : 'Balanced', on: s.powerMode !== 'balanced', Icon: Gauge, act: () => setSettings({ powerMode: s.powerMode === 'balanced' ? 'saver' : s.powerMode === 'saver' ? 'performance' : 'balanced' }) },
    { label: 'Night Light', sub: s.nightLight ? 'On' : 'Off', on: s.nightLight, Icon: Sun, act: () => setSettings({ nightLight: !s.nightLight }) },
    { label: 'Dark Style', sub: s.theme === 'dark' ? 'On' : 'Off', on: s.theme === 'dark', Icon: Moon, act: () => setSettings({ theme: s.theme === 'dark' ? 'light' : 'dark' }) },
    { label: 'Airplane Mode', sub: s.airplane ? 'On' : 'Off', on: s.airplane, Icon: Plane, act: () => setSettings({ airplane: !s.airplane }) },
    { label: 'Do Not Disturb', sub: s.dnd ? 'On' : 'Off', on: s.dnd, Icon: BellOff, act: () => setSettings({ dnd: !s.dnd }) },
  ];

  return <main ref={mainRef} className={cls} style={style} onContextMenu={e => { if ((e.target as HTMLElement).closest('.app-window,.dock,.top-panel,.overview,.session-screen')) return; e.preventDefault(); setContext({ x: Math.min(e.clientX, window.innerWidth - 240), y: Math.min(e.clientY, window.innerHeight - 290) }); setPopover(null); }}>
    {wp ? <div className="desktop-wallpaper" style={{ background: wp }} /> : <img className="desktop-wallpaper" src={wallpaper} width={1920} height={1088} alt="Original purple Resolute Raccoon desktop wallpaper" />}
    <div className="desktop-surface" onClick={() => { setPopover(null); setContext(null); }} />
    <header className="top-panel"><div className="panel-left"><Button variant="panel" className="activities-button" aria-label="Activities overview" onClick={() => { setOverview(!overview); setPopover(null); }}><span className="workspace-mark"><i /><i /></span></Button><span className="panel-app-name">{overview ? 'Activities' : apps.find(a => a.id === activeApp)?.name ?? 'Ubuntu Desktop'}</span></div>
      <Button variant="panel" className="clock-button" onClick={() => { setPopover(popover === 'calendar' ? null : 'calendar'); setOverview(false); }}>{dateStr}<span>{timeStr}</span>{s.dnd && <BellOff size={13} />}{!s.dnd && notices.length > 0 && <i className="clock-dot" />}</Button>
      <Button variant="panel" className="system-button" aria-label="System menu" onClick={() => { setPopover(popover === 'system' ? null : 'system'); setOverview(false); setPowerMenu(false); }}>{s.airplane ? <Plane /> : wifiOn ? <Wifi /> : <WifiOff />}{btOn && <Bluetooth />}{s.muted || s.volume === 0 ? <VolumeX /> : <Volume2 />}<BatteryFull />{s.showBatteryPercent && <small>100%</small>}<ChevronDown /></Button></header>
    <div className="dock-hotzone" />
    <nav className="dock" aria-label="Favorite applications">{apps.map(app => <Button key={app.id} variant="dock" size="icon" title={app.name} aria-label={`Open ${app.name}`} className={windows.some(w => w.app === app.id) ? 'running' : ''} onClick={e => launch(app.id, e.shiftKey)}><AppIcon app={app.id} />{windows.some(w => w.app === app.id && w.id === active && !w.minimized) && <span className="dock-active" />}</Button>)}<div className="dock-divider" /><Button variant="dock" size="icon" title="Trash" aria-label="Open Trash" onClick={() => launch('files', true, fs.TRASH)}><span className="trash-icon"><Trash2 /></span></Button><div className="dock-spacer" /><Button variant="dock" size="icon" className={overview ? 'overview-active' : ''} title="Show Applications" aria-label="Show Applications" onClick={() => { setOverview(!overview); setPopover(null); }}><Grid3X3 className="show-apps-icon" /></Button></nav>
    <div className="desktop-icons"><Button variant="desktop" className="desktop-icon" onDoubleClick={() => launch('files')} onKeyDown={e => { if (e.key === 'Enter') launch('files'); }}><span className="home-folder"><Home /></span><span>Home</span></Button>{deskItems.map(n => <Button key={n.id} variant="desktop" className="desktop-icon" title={n.name} onDoubleClick={() => openNode(n)} onKeyDown={e => { if (e.key === 'Enter') openNode(n); }}><span className={n.type === 'dir' ? 'home-folder' : 'desktop-file'}>{n.type === 'dir' ? <Folder fill="currentColor" strokeWidth={1.1} /> : <File strokeWidth={1.2} />}</span><span>{n.name}</span></Button>)}</div>
    {windows.map(win => <Window key={win.id} win={win} active={active === win.id} focus={() => focus(win.id)} update={patch => setWindows(prev => prev.map(w => w.id === win.id ? { ...w, ...patch } : w))} close={() => setWindows(prev => prev.filter(w => w.id !== win.id))}><AppContent app={win.app} path={win.path} setTitle={titleFor(win.id)} /></Window>)}
    {overview && <section className="overview" aria-label="Application overview"><div className="overview-search"><Search size={19} /><input autoFocus aria-label="Search applications" placeholder="Type to search" value={query} onChange={e => setQuery(e.target.value)} />{query && <Button variant="desktop" size="icon" aria-label="Clear search" onClick={() => setQuery('')}><X /></Button>}</div><div className="overview-workspaces"><div className="workspace-preview" style={wpStyle}>{windows.filter(w => !w.minimized).slice(0, 3).map(w => <Button variant="desktop" key={w.id} className="preview-window" onClick={() => { focus(w.id); setOverview(false); }}><AppIcon app={w.app} small />{w.title}</Button>)}</div></div><div className="launcher-categories">{['All', 'Utilities', 'System'].map(c => <Button variant="desktop" key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</Button>)}</div><div className="application-grid">{apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || a.category === category)).map(app => <Button variant="desktop" key={app.id} className="application-tile" onClick={() => launch(app.id)}><AppIcon app={app.id} /><span>{app.name}</span>{windows.some(w => w.app === app.id) && <i />}</Button>)}</div>{apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || a.category === category)).length === 0 && <p className="no-results">No applications found</p>}<div className="overview-page-dot" /></section>}
    {popover === 'calendar' && <section className="calendar-popover shell-popover">
      <div className="notification-list">{notices.length === 0 ? <div className="notification-empty"><Bell size={36} strokeWidth={1} /><span>No Notifications</span></div>
        : <div className="notification-items">{notices.map(n => <article key={n.id} className="notice-card"><div><b>{n.app}</b><small>{ago(n.time, calBase.getTime())}</small><Button variant="desktop" size="icon" aria-label="Dismiss notification" onClick={() => dismiss(n.id)}><X /></Button></div><strong>{n.title}</strong>{n.body && <p>{n.body}</p>}</article>)}</div>}
        <div className="notification-footer"><label><span>Do Not Disturb</span><button type="button" role="switch" aria-checked={s.dnd} aria-label="Do Not Disturb" className={`set-switch ${s.dnd ? 'on' : ''}`} onClick={() => setSettings({ dnd: !s.dnd })}><i /></button></label><Button variant="desktop" disabled={!notices.length} onClick={clearAll}>Clear</Button></div></div>
      <div className="calendar-content"><strong>{calBase.toLocaleDateString(locale, { weekday: 'long' })}</strong><h2>{calBase.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}</h2><div className="calendar-heading"><Button variant="desktop" size="icon" aria-label="Previous month" onClick={() => setMonthOffset(monthOffset - 1)}><ChevronLeft /></Button><strong>{calendarDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</strong><Button variant="desktop" size="icon" aria-label="Next month" onClick={() => setMonthOffset(monthOffset + 1)}><ChevronRight /></Button></div><div className="calendar-grid">{Array.from({ length: 7 }, (_, i) => <b key={i}>{new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' })}</b>)}{Array.from({ length: calendarStart }, (_, i) => <span key={`empty${i}`} />)}{Array.from({ length: days }, (_, i) => <span className={monthOffset === 0 && calBase.getDate() === i + 1 ? 'today' : ''} key={i}>{i + 1}</span>)}</div></div></section>}
    {popover === 'system' && <section className="system-popover shell-popover">
      <div className="system-header"><span><BatteryFull size={18} />100%</span><div><Button variant="desktop" size="icon" aria-label="Settings" onClick={() => launch('settings')}><Settings /></Button><Button variant="desktop" size="icon" aria-label="Lock" onClick={() => sessionAction('locked')}><Lock /></Button><Button variant="desktop" size="icon" aria-label="Power Off / Log Out" aria-expanded={powerMenu} className={powerMenu ? 'selected' : ''} onClick={() => setPowerMenu(!powerMenu)}><Power /></Button></div></div>
      {powerMenu && <div className="power-menu"><Button variant="desktop" onClick={() => sessionAction('boot')}><RotateCcw />Restart…</Button><Button variant="desktop" onClick={() => sessionAction('off')}><Power />Power Off…</Button><div className="context-divider" /><Button variant="desktop" onClick={() => sessionAction('loggedout')}><LogOut />Log Out…</Button></div>}
      <div className="volume-row"><Button variant="desktop" size="icon" aria-label={s.muted ? 'Unmute' : 'Mute'} onClick={() => setSettings({ muted: !s.muted })}>{s.muted || s.volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</Button><input aria-label="Volume" type="range" min="0" max="100" value={s.muted ? 0 : s.volume} onChange={e => setSettings({ volume: Number(e.target.value), muted: false })} /></div>
      <div className="volume-row"><span className="row-icon"><Sun size={20} /></span><input aria-label="Brightness" type="range" min="20" max="100" value={s.brightness} onChange={e => setSettings({ brightness: Number(e.target.value) })} /></div>
      <div className="quick-tiles">{tiles.map(t => <Button key={t.label} variant="desktop" aria-pressed={t.on} className={`quick-tile ${t.on ? 'selected' : ''}`} onClick={t.act}><t.Icon /><span>{t.label}<small>{t.sub}</small></span></Button>)}</div>
    </section>}
    {context && <div className="desktop-context shell-popover" style={{ left: context.x, top: context.y }}><Button variant="desktop" onClick={newDesktopFolder}>New Folder</Button><div className="context-divider" /><Button variant="desktop" onClick={() => launch('files', true, `${fs.HOME}/Desktop`)}>Show Desktop in Files</Button><Button variant="desktop" onClick={() => launch('terminal', true, `${fs.HOME}/Desktop`)}>Open in Terminal</Button><div className="context-divider" /><Button variant="desktop" onClick={() => launch('settings', false, 'wallpaper')}>Change Background…</Button><Button variant="desktop" onClick={() => launch('settings', false, 'displays')}>Display Settings</Button><Button variant="desktop" onClick={() => launch('settings', false, 'wifi')}>Settings</Button><div className="context-divider" /><Button variant="desktop" onClick={() => { setWindows(prev => prev.map(w => ({ ...w, minimized: true }))); setContext(null); }}>Show Desktop</Button></div>}
    {banners.length > 0 && session === 'active' && <div className="notice-tray" aria-live="polite">{banners.map(n => <article key={n.id} className="notice-banner shell-popover" onClick={() => hideBanner(n.id)}><Bell size={18} /><div><strong>{n.title}</strong>{n.body && <p>{n.body}</p>}<small>{n.app}</small></div><Button variant="desktop" size="icon" aria-label="Dismiss notification" onClick={e => { e.stopPropagation(); dismiss(n.id); }}><X /></Button></article>)}</div>}
    <div className="desktop-version">Ubuntu 26.04 LTS</div>
    <div className="screen-dim" style={{ opacity: ((100 - s.brightness) / 100) * 0.75 }} />
    {s.nightLight && <div className="night-light" />}
    {session !== 'active' && <SessionScreen mode={session} userName={s.userName} clock={calBase} locale={locale} h24={s.clock24} notices={s.notifyLock ? notices.length : 0} wallpaper={wpStyle} onUnlock={() => { lastActivity.current = Date.now(); setSession('active'); }} onPowerOn={() => setSession('boot')} onBooted={booted} />}
  </main>;
}
