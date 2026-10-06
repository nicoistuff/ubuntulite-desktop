import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HOME } from '@/lib/vfs';
import { complete, displayPath, run } from '@/lib/shell';

type Line = { prompt?: string; text: string };
const HISTORY_KEY = 'ubuntu2604.bash_history';

function colorize(text: string): ReactNode[] {
  return text.split('\n').map((row, r) => {
    const parts: ReactNode[] = []; let cls = ''; let buf = '';
    const flush = (i: number) => { if (buf) parts.push(cls ? <span key={i} className={cls}>{buf}</span> : buf); buf = ''; };
    [...row].forEach((ch, i) => {
      if (ch === '\u0001') { flush(i); cls = 'term-dir'; return; }
      if (ch === '\u0002') { flush(i); cls = 'term-label'; return; }
      if (ch === '\u0004') { flush(i); cls = 'term-logo'; return; }
      if (ch === '\u0003' || ch === '\u0005') { flush(i); cls = ''; return; }
      if (cls === 'term-dir' && /\s/.test(ch)) { flush(i); cls = ''; }
      buf += ch;
    });
    flush(row.length);
    return <div key={r}>{parts.length ? parts : '\u00a0'}</div>;
  });
}

export function TerminalApp({ setTitle }: { setTitle: (t: string) => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [command, setCommand] = useState('');
  const [cwd, setCwd] = useState(HOME);
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const end = useRef<HTMLFormElement>(null);
  useEffect(() => { try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')); } catch { /* ignore corrupt history */ } }, []);
  useEffect(() => { setTitle(`ubuntu@ubuntu: ${displayPath(cwd)}`); }, [cwd, setTitle]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [lines]);
  const prompt = `ubuntu@ubuntu:${displayPath(cwd)}$ `;
  const submit = () => {
    const nextHistory = command.trim() ? [...history, command].slice(-500) : history;
    const result = run(command, cwd, nextHistory);
    setHistory(nextHistory); localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    setLines(result.clear ? [] : [...lines, { prompt: displayPath(cwd), text: command }, ...(result.output ? [{ text: result.output }] : [])].slice(-400));
    setCwd(result.cwd); setCommand(''); setCursor(-1);
  };
  return <div className="terminal-app" onClick={e => { if (!window.getSelection()?.toString()) e.currentTarget.querySelector('input')?.focus(); }}>
    {lines.map((line, i) => line.prompt !== undefined
      ? <div key={i}><span className="terminal-prompt">ubuntu@ubuntu</span>:<span className="terminal-path">{line.prompt}</span>$ {line.text}</div>
      : <div key={i}>{colorize(line.text)}</div>)}
    <form ref={end} onSubmit={e => { e.preventDefault(); submit(); }} aria-label={prompt}>
      <span className="terminal-prompt">ubuntu@ubuntu</span><span>:<span className="terminal-path">{displayPath(cwd)}</span>$ </span>
      <input aria-label="Terminal command" autoFocus value={command} spellCheck={false} autoComplete="off" onChange={e => setCommand(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Tab') { e.preventDefault(); setCommand(complete(command, cwd)); }
          else if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); const c = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1); setCursor(c); setCommand(history[c]); }
          else if (e.key === 'ArrowDown' && cursor >= 0) { e.preventDefault(); const c = cursor + 1; if (c >= history.length) { setCursor(-1); setCommand(''); } else { setCursor(c); setCommand(history[c]); } }
          else if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); setLines([]); }
          else if (e.ctrlKey && e.key.toLowerCase() === 'c') { e.preventDefault(); setLines([...lines, { prompt: displayPath(cwd), text: command + '^C' }]); setCommand(''); }
        }} />
    </form>
  </div>;
}
