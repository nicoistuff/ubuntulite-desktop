import { useRef, type ReactNode } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AppId } from './apps';

export type DesktopWindow = { id: number; app: AppId; title: string; x: number; y: number; width: number; height: number; z: number; minimized: boolean; maximized: boolean; path?: string | undefined; workspace?: number };

export function Window({ win, active, update, focus, close, children }: {
  win: DesktopWindow; active: boolean; update: (patch: Partial<DesktopWindow>) => void; focus: () => void; close: () => void; children: ReactNode;
}) {
  const move = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const resize = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  return <section role="dialog" aria-label={win.title} className={`app-window ${active ? 'focused' : ''} ${win.maximized ? 'maximized' : ''} ${win.minimized ? 'minimized' : ''}`}
    style={{ left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.z }} onPointerDown={focus}>
    <header className="window-titlebar" onDoubleClick={() => update({ maximized: !win.maximized })}
      onPointerDown={e => { if ((e.target as HTMLElement).closest('button') || win.maximized) return; e.currentTarget.setPointerCapture(e.pointerId); move.current = { x: e.clientX, y: e.clientY, ox: win.x, oy: win.y }; }}
      onPointerMove={e => { const m = move.current; if (m) update({ x: Math.min(window.innerWidth - 160, Math.max(68, m.ox + e.clientX - m.x)), y: Math.min(window.innerHeight - 70, Math.max(34, m.oy + e.clientY - m.y)) }); }}
      onPointerUp={e => { if (!move.current) return; move.current = null; if (e.clientY < 45) update({ maximized: true }); else if (e.clientX < 85) update({ x: 68, y: 34, width: (window.innerWidth - 68) / 2, height: window.innerHeight - 34 }); else if (e.clientX > window.innerWidth - 15) update({ x: 68 + (window.innerWidth - 68) / 2, y: 34, width: (window.innerWidth - 68) / 2, height: window.innerHeight - 34 }); }}>
      <span className="window-title">{win.title}</span>
      <div className="window-controls">
        <Button variant="window" size="icon" title="Minimize" aria-label={`Minimize ${win.title}`} onClick={() => update({ minimized: true })}><Minus /></Button>
        <Button variant="window" size="icon" title={win.maximized ? 'Restore' : 'Maximize'} aria-label={`Maximize ${win.title}`} onClick={() => update({ maximized: !win.maximized })}>{win.maximized ? <Copy /> : <Square />}</Button>
        <Button variant="window" size="icon" className="close-control" title="Close" aria-label={`Close ${win.title}`} onClick={close}><X /></Button>
      </div>
    </header>
    <div className="window-content">{children}</div>
    {!win.maximized && <div className="resize-handle" aria-label="Resize window" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); resize.current = { x: e.clientX, y: e.clientY, width: win.width, height: win.height }; }} onPointerMove={e => { const r = resize.current; if (r) update({ width: Math.max(360, Math.min(window.innerWidth - win.x, r.width + e.clientX - r.x)), height: Math.max(250, Math.min(window.innerHeight - win.y, r.height + e.clientY - r.y)) }); }} onPointerUp={() => { resize.current = null; }} />}
  </section>;
}
