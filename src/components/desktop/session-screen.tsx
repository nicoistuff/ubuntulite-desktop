import { useEffect, useState } from 'react';
import { ArrowRight, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SessionMode = 'active' | 'locked' | 'loggedout' | 'off' | 'boot';

/** Simulated session screens: lock, logged out, powered off and boot splash. Nothing here touches the host machine. */
export function SessionScreen({ mode, userName, clock, locale, h24, notices, wallpaper, onUnlock, onPowerOn, onBooted }: {
  mode: Exclude<SessionMode, 'active'>; userName: string; clock: Date; locale: string; h24: boolean; notices: number; wallpaper: React.CSSProperties;
  onUnlock: () => void; onPowerOn: () => void; onBooted: () => void;
}) {
  const [prompt, setPrompt] = useState(mode === 'loggedout');
  const [password, setPassword] = useState('');
  useEffect(() => { setPrompt(mode === 'loggedout'); setPassword(''); }, [mode]);
  useEffect(() => { if (mode !== 'boot') return; const t = setTimeout(onBooted, 2200); return () => clearTimeout(t); }, [mode, onBooted]);
  if (mode === 'off') return <div className="session-screen session-off"><Button variant="desktop" className="power-on" aria-label="Power on" onClick={onPowerOn}><Power /></Button><span>Powered off (simulated)</span></div>;
  if (mode === 'boot') return <div className="session-screen session-boot"><div className="boot-logo">ubuntu</div><div className="boot-dots"><i /><i /><i /><i /><i /></div></div>;
  const time = clock.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: !h24 });
  const date = clock.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const submit = (e: React.FormEvent) => { e.preventDefault(); onUnlock(); };
  return <div className="session-screen session-lock" style={wallpaper} onClick={() => setPrompt(true)} onKeyDown={() => setPrompt(true)} tabIndex={-1}>
    {!prompt ? <div className="lock-clock"><strong>{time}</strong><span>{date}</span>{notices > 0 && <small>{notices} notification{notices > 1 ? 's' : ''}</small>}<em>Click or press a key to unlock</em></div>
      : <form className="lock-form" onSubmit={submit} onClick={e => e.stopPropagation()}>
        <div className="user-avatar">{userName.slice(0, 1).toUpperCase()}</div><h2>{userName}</h2>
        <div className="lock-input"><input autoFocus type="password" aria-label="Password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><Button type="submit" variant="desktop" size="icon" aria-label={mode === 'loggedout' ? 'Log in' : 'Unlock'}><ArrowRight /></Button></div>
        <small>Simulated session — any password works</small>
      </form>}
  </div>;
}
