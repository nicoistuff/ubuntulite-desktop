// @ts-nocheck
import { useEffect, useState, type ReactNode } from 'react';
import { Accessibility, AppWindow, Bell, Bluetooth, Clock, Globe, HardDrive, Info, Keyboard, Lock, Monitor, Mouse, Network, Palette, Image, Search, Users, Volume2, Wifi, BatteryFull, LayoutPanelLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ACCENTS, LANGUAGES, WALLPAPERS, localeOf, resetSettings, setSettings, useSettings, wallpaperCss, type Accent, type Settings } from '@/lib/settings';
import { notify } from '@/lib/notifications';
import * as fs from '@/lib/vfs';
import wallpaper from '@/assets/ubuntu-wallpaper.jpg';
import { apps } from './apps';
import { AppIcon } from './app-icon';

export const PANELS = [
  ['wifi', 'Wi-Fi', Wifi], ['network', 'Network', Network], ['bluetooth', 'Bluetooth', Bluetooth], ['displays', 'Displays', Monitor],
  ['sound', 'Sound', Volume2], ['power', 'Power', BatteryFull], ['appearance', 'Appearance', Palette], ['wallpaper', 'Wallpaper', Image],
  ['desktop', 'Ubuntu Desktop', LayoutPanelLeft], ['notifications', 'Notifications', Bell], ['applications', 'Apps', AppWindow],
  ['privacy', 'Privacy & Security', Lock], ['keyboard', 'Keyboard', Keyboard], ['mouse', 'Mouse & Touchpad', Mouse],
  ['accessibility', 'Accessibility', Accessibility], ['users', 'Users', Users], ['language', 'Region & Language', Globe],
  ['datetime', 'Date & Time', Clock], ['storage', 'Storage', HardDrive], ['about', 'About', Info],
] as const;
type PanelId = (typeof PANELS)[number][0];

const set = (patch: Partial<Settings>) => setSettings(patch);

function Row({ label, sub, children }: { label: string; sub?: string; children?: ReactNode }) {
  return <div className="set-row"><div><span>{label}</span>{sub && <small>{sub}</small>}</div>{children}</div>;
}
function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`set-switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i /></button>;
}
function Group({ title, children }: { title?: string; children: ReactNode }) {
  return <section className="set-group">{title && <h3>{title}</h3>}<div className="set-list">{children}</div></section>;
}
function Choice<T extends string | number>({ value, options, label, onChange }: { value: T; options: [T, string][]; label: string; onChange: (v: T) => void }) {
  return <select aria-label={label} className="set-select" value={String(value)} onChange={e => { const o = options.find(([v]) => String(v) === e.target.value); if (o) onChange(o[0]); }}>{options.map(([v, l]) => <option key={String(v)} value={String(v)}>{l}</option>)}</select>;
}

const NETWORKS = [['Home-5G', 92], ['Raccoon Café', 70], ['Office Guest', 55], ['Library', 34]] as const;
const DEVICES = ['WH-1000 Headphones', 'Logitech Keyboard', 'Pixel 9'];

export function SettingsApp({ panel, setTitle }: { panel?: string | undefined; setTitle: (t: string) => void }) {
  const s = useSettings();
  const [current, setCurrent] = useState<PanelId>(() => (PANELS.find(p => p[0] === panel)?.[0] ?? 'wifi'));
  const [filter, setFilter] = useState('');
  useEffect(() => { const p = PANELS.find(p => p[0] === panel); if (p) setCurrent(p[0]); }, [panel]);
  const name = PANELS.find(p => p[0] === current)?.[1] ?? 'Settings';
  useEffect(() => setTitle(name), [name, setTitle]);
  const list = PANELS.filter(p => p[1].toLowerCase().includes(filter.toLowerCase()));
  return <div className="settings-app">
    <aside className="settings-sidebar">
      <label className="settings-search"><Search size={15} /><input aria-label="Search settings" placeholder="Search" value={filter} onChange={e => setFilter(e.target.value)} /></label>
      {list.map(([id, label, Icon]) => <Button key={id} variant="desktop" className={`sidebar-item ${current === id ? 'selected' : ''}`} onClick={() => setCurrent(id)}><Icon size={17} />{label}</Button>)}
    </aside>
    <div className="settings-page"><div className="settings-inner"><h2>{name}</h2><Panel id={current} s={s} /></div></div>
  </div>;
}

function Panel({ id, s }: { id: PanelId; s: Settings }) {
  switch (id) {
    case 'wifi': return <>
      <Group><Row label="Wi-Fi"><Switch label="Wi-Fi" on={s.wifi && !s.airplane} onChange={v => set({ wifi: v, airplane: v ? false : s.airplane })} /></Row>
        <Row label="Airplane Mode" sub="Disables Wi-Fi and Bluetooth"><Switch label="Airplane Mode" on={s.airplane} onChange={v => set({ airplane: v })} /></Row></Group>
      {s.wifi && !s.airplane && <Group title="Visible Networks">{NETWORKS.map(([n, sig]) => <button key={n} type="button" className="set-row set-click" onClick={() => { set({ wifiNetwork: n }); notify('Network', 'Connection Established', `You are now connected to “${n}”.`); }}><div><span>{n}</span><small>Signal {sig}%</small></div>{s.wifiNetwork === n && <Check size={17} />}</button>)}</Group>}
    </>;
    case 'network': return <NetworkPanel s={s} />;
    case 'bluetooth': {
      const on = s.bluetooth && !s.airplane;
      return <><Group><Row label="Bluetooth" sub={on ? `Visible as “${s.deviceName}”` : 'Off'}><Switch label="Bluetooth" on={on} onChange={v => set({ bluetooth: v, airplane: v ? false : s.airplane })} /></Row></Group>
        {on && <Group title="Devices">{DEVICES.map(d => { const paired = s.pairedDevices.includes(d); return <Row key={d} label={d} sub={paired ? 'Connected' : 'Not Set Up'}><Button variant="outline" size="sm" onClick={() => { set({ pairedDevices: paired ? s.pairedDevices.filter(x => x !== d) : [...s.pairedDevices, d] }); if (!paired) notify('Bluetooth', 'Device Connected', d); }}>{paired ? 'Disconnect' : 'Connect'}</Button></Row>; })}</Group>}</>;
    }
    case 'displays': return <Group>
      <Row label="Resolution" sub="Reported by your browser">{typeof window !== 'undefined' ? `${window.screen.width} × ${window.screen.height}` : ''}</Row>
      <Row label="Brightness"><input className="set-range" aria-label="Brightness" type="range" min={20} max={100} value={s.brightness} onChange={e => set({ brightness: Number(e.target.value) })} /></Row>
      <Row label="Night Light" sub="Makes the screen warmer"><Switch label="Night Light" on={s.nightLight} onChange={v => set({ nightLight: v })} /></Row>
    </Group>;
    case 'sound': return <Group>
      <Row label="Output Volume"><input className="set-range" aria-label="Output volume" type="range" min={0} max={100} value={s.volume} onChange={e => set({ volume: Number(e.target.value), muted: false })} /></Row>
      <Row label="Mute"><Switch label="Mute" on={s.muted} onChange={v => set({ muted: v })} /></Row>
      <Row label="Test Speakers" sub="Plays a short tone at the current volume"><Button variant="outline" size="sm" onClick={() => playTone(s)}>Test</Button></Row>
    </Group>;
    case 'power': return <PowerPanel s={s} />;
    case 'appearance': return <>
      <Group title="Style"><div className="theme-choices">{(['light', 'dark'] as const).map(t => <button key={t} type="button" aria-pressed={s.theme === t} className={`theme-choice ${t} ${s.theme === t ? 'selected' : ''}`} onClick={() => set({ theme: t })}><span /><b>{t === 'light' ? 'Default' : 'Dark'}</b></button>)}</div></Group>
      <Group title="Accent Color"><div className="accent-choices">{(Object.keys(ACCENTS) as Accent[]).map(a => <button key={a} type="button" title={a} aria-label={`${a} accent`} aria-pressed={s.accent === a} className={s.accent === a ? 'selected' : ''} style={{ background: ACCENTS[a] }} onClick={() => set({ accent: a })} />)}</div></Group>
    </>;
    case 'wallpaper': return <WallpaperPanel s={s} />;
    case 'desktop': return <Group>
      <Row label="Auto-hide the Dock" sub="The dock hides when a window overlaps it"><Switch label="Auto-hide the Dock" on={s.dockAutohide} onChange={v => set({ dockAutohide: v })} /></Row>
      <Row label="Icon Size"><input className="set-range" aria-label="Dock icon size" type="range" min={32} max={64} step={4} value={s.iconSize} onChange={e => set({ iconSize: Number(e.target.value) })} /></Row>
    </Group>;
    case 'notifications': return <>
      <Group><Row label="Do Not Disturb" sub="Banners are hidden; notifications stay in the list"><Switch label="Do Not Disturb" on={s.dnd} onChange={v => set({ dnd: v })} /></Row>
        <Row label="Lock Screen Notifications"><Switch label="Lock Screen Notifications" on={s.notifyLock} onChange={v => set({ notifyLock: v })} /></Row>
        <Row label="Send Test Notification"><Button variant="outline" size="sm" onClick={() => notify('Settings', 'Test Notification', 'Notifications are working.')}>Send</Button></Row></Group>
      <AppsGroup s={s} />
    </>;
    case 'applications': return <AppsGroup s={s} />;
    case 'privacy': return <Group>
      <Row label="Automatic Screen Lock" sub="Lock after the session is idle"><Choice label="Automatic screen lock delay" value={s.lockDelay} options={[[0, 'Never'], [1, '1 minute'], [5, '5 minutes'], [15, '15 minutes'], [30, '30 minutes']]} onChange={v => set({ lockDelay: v })} /></Row>
      <Row label="File History" sub="Remember recently used files"><Switch label="File History" on={s.recentFiles} onChange={v => set({ recentFiles: v })} /></Row>
      <Row label="Clear File History"><Button variant="outline" size="sm" onClick={() => { fs.clearRecent(); notify('Settings', 'File history cleared'); }}>Clear</Button></Row>
    </Group>;
    case 'keyboard': return <Group title="Keyboard Shortcuts">{[['Activities overview', 'Super'], ['Open Terminal', 'Ctrl + Alt + T'], ['Switch windows', 'Alt + Tab'], ['Close window', 'Alt + F4'], ['Close menus', 'Escape']].map(([a, k]) => <Row key={a} label={a}><kbd className="set-kbd">{k}</kbd></Row>)}</Group>;
    case 'mouse': return <Group>
      <Row label="Natural Scrolling" sub="Scrolling moves the content, not the view"><Switch label="Natural Scrolling" on={s.naturalScroll} onChange={v => set({ naturalScroll: v })} /></Row>
      <div className="scroll-test" aria-label="Scroll test area">{Array.from({ length: 12 }, (_, i) => <p key={i}>Scroll test line {i + 1}</p>)}</div>
    </Group>;
    case 'accessibility': return <Group>
      <Row label="Large Text"><Switch label="Large Text" on={s.largeText} onChange={v => set({ largeText: v })} /></Row>
      <Row label="High Contrast"><Switch label="High Contrast" on={s.highContrast} onChange={v => set({ highContrast: v })} /></Row>
      <Row label="Reduce Animation"><Switch label="Reduce Animation" on={s.reduceMotion} onChange={v => set({ reduceMotion: v })} /></Row>
    </Group>;
    case 'users': return <><div className="user-avatar">{s.userName.slice(0, 1).toUpperCase()}</div><Group>
      <Row label="Full Name"><input className="set-input" aria-label="Full name" value={s.userName} maxLength={32} onChange={e => set({ userName: e.target.value || 'ubuntu' })} /></Row>
      <Row label="Account Type">Administrator</Row></Group></>;
    case 'language': return <Group>
      <Row label="Language" sub={`Formats dates as ${new Date().toLocaleDateString(localeOf(s), { dateStyle: 'medium' })}`}><Choice label="Language" value={s.language} options={Object.keys(LANGUAGES).map(l => [l, l] as [string, string])} onChange={v => set({ language: v })} /></Row>
    </Group>;
    case 'datetime': return <Group>
      <Row label="Time Zone" sub="From your browser">{Intl.DateTimeFormat().resolvedOptions().timeZone}</Row>
      <Row label="Time Format"><Choice label="Time format" value={s.clock24 ? '24' : '12'} options={[['24', '24-hour'], ['12', 'AM / PM']]} onChange={v => set({ clock24: v === '24' })} /></Row>
      <Row label="Weekday"><Switch label="Show weekday" on={s.showWeekday} onChange={v => set({ showWeekday: v })} /></Row>
      <Row label="Seconds"><Switch label="Show seconds" on={s.clockSeconds} onChange={v => set({ clockSeconds: v })} /></Row>
    </Group>;
    case 'storage': return <StoragePanel />;
    case 'about': return <Group>
      <Row label="Device Name"><input className="set-input" aria-label="Device name" value={s.deviceName} maxLength={32} onChange={e => set({ deviceName: e.target.value || 'ubuntu' })} /></Row>
      {[['OS Name', 'Ubuntu 26.04 LTS (Resolute Raccoon)'], ['OS Type', '64-bit'], ['GNOME Version', '50'], ['Windowing System', 'Browser (simulated Wayland)'], ['Processor', typeof navigator !== 'undefined' ? `${navigator.hardwareConcurrency ?? '?'} threads` : '']].map(([k, v]) => <Row key={k} label={k}>{v}</Row>)}
    </Group>;
  }
}

function AppsGroup({ s }: { s: Settings }) {
  return <Group title="App Notifications">{[...apps.map(a => a.name), 'Network', 'Bluetooth'].map(n => <Row key={n} label={n}><Switch label={`${n} notifications`} on={!s.mutedApps.includes(n)} onChange={v => set({ mutedApps: v ? s.mutedApps.filter(x => x !== n) : [...s.mutedApps, n] })} /></Row>)}
    <div className="set-apps">{apps.map(a => <span key={a.id}><AppIcon app={a.id} small />{a.name}</span>)}</div></Group>;
}

function NetworkPanel({ s }: { s: Settings }) {
  const [online, setOnline] = useState(true);
  useEffect(() => { const u = () => setOnline(navigator.onLine); u(); window.addEventListener('online', u); window.addEventListener('offline', u); return () => { window.removeEventListener('online', u); window.removeEventListener('offline', u); }; }, []);
  const type = typeof navigator !== 'undefined' ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType : undefined;
  return <Group title="Wired"><Row label="Browser connection" sub="Reported by your browser">{online ? `Connected${type ? ` (${type})` : ''}` : 'Offline'}</Row><Row label="Wi-Fi">{s.wifi && !s.airplane ? s.wifiNetwork : 'Off'}</Row></Group>;
}

type Battery = { level: number; charging: boolean };
function PowerPanel({ s }: { s: Settings }) {
  const [bat, setBat] = useState<Battery | null>(null);
  useEffect(() => { const n = navigator as Navigator & { getBattery?: () => Promise<Battery> }; n.getBattery?.().then(b => setBat({ level: b.level, charging: b.charging })).catch(() => {}); }, []);
  return <><Group><Row label="Battery" sub={bat ? (bat.charging ? 'Charging' : 'On battery') : 'Not reported by this browser — simulated'}>{bat ? `${Math.round(bat.level * 100)}%` : '100%'}</Row>
    <Row label="Show Battery Percentage"><Switch label="Show Battery Percentage" on={s.showBatteryPercent} onChange={v => set({ showBatteryPercent: v })} /></Row></Group>
    <Group title="Power Mode">{([['performance', 'Performance'], ['balanced', 'Balanced'], ['saver', 'Power Saver']] as const).map(([m, l]) => <button key={m} type="button" className="set-row set-click" onClick={() => set({ powerMode: m, ...(m === 'saver' ? { reduceMotion: true, brightness: Math.min(s.brightness, 70) } : {}) })}><div><span>{l}</span>{m === 'saver' && <small>Dims the screen and reduces animation</small>}</div>{s.powerMode === m && <Check size={17} />}</button>)}</Group></>;
}

function WallpaperPanel({ s }: { s: Settings }) {
  const [err, setErr] = useState('');
  const cur = wallpaperCss(s);
  return <>
    <div className="wallpaper-current" style={cur ? { background: cur } : { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover' }} />
    <div className="wallpaper-grid">{WALLPAPERS.map(w => <button key={w.id} type="button" aria-label={w.name} title={w.name} className={s.wallpaper === w.id ? 'selected' : ''} style={w.css ? { background: w.css } : { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover' }} onClick={() => set({ wallpaper: w.id })} />)}
      {s.customWallpaper && <button type="button" aria-label="Custom picture" className={s.wallpaper === 'custom' ? 'selected' : ''} style={{ background: `center / cover url("${s.customWallpaper}")` }} onClick={() => set({ wallpaper: 'custom' })} />}</div>
    <label className="wallpaper-add">Add Picture…<input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 2_500_000) { setErr('Pick an image under 2.5 MB.'); return; } setErr(''); const r = new FileReader(); r.onload = () => set({ customWallpaper: String(r.result), wallpaper: 'custom' }); r.readAsDataURL(f); }} /></label>
    {err && <p className="set-error">{err}</p>}
  </>;
}

function StoragePanel() {
  const [est, setEst] = useState<{ usage?: number; quota?: number } | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { navigator.storage?.estimate?.().then(setEst).catch(() => {}); }, []);
  const home = fs.resolve(fs.HOME);
  return <><Group>
    <Row label="Home folder" sub="Files stored in this browser">{fs.formatSize(home ? fs.sizeOf(home.id) : 0)}</Row>
    <Row label="Browser storage used">{est?.usage != null ? fs.formatSize(est.usage) : 'Unavailable'}</Row>
    <Row label="Browser storage available">{est?.quota != null ? fs.formatSize(est.quota) : 'Unavailable'}</Row>
  </Group>
    <Group title="Reset System"><Row label="Restore Defaults" sub="Erase all files and settings stored by this desktop">{confirm
      ? <span className="set-actions"><Button variant="outline" size="sm" onClick={() => setConfirm(false)}>Cancel</Button><Button size="sm" onClick={() => { fs.resetFilesystem(); resetSettings(); setConfirm(false); notify('Settings', 'System reset', 'Files and settings were restored to defaults.'); }}>Erase</Button></span>
      : <Button variant="outline" size="sm" onClick={() => setConfirm(true)}>Reset…</Button>}</Row></Group></>;
}

let audio: AudioContext | null = null;
function playTone(s: Settings) {
  if (s.muted || s.volume === 0) return;
  audio ??= new AudioContext();
  const o = audio.createOscillator(); const g = audio.createGain();
  g.gain.value = (s.volume / 100) * 0.25; o.frequency.value = 660; o.connect(g).connect(audio.destination);
  o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.5); o.stop(audio.currentTime + 0.5);
}

