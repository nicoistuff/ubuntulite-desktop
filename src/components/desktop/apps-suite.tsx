// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, HardDrive,
  Calendar as CalIcon, Plus, Check, RefreshCw, Flag, Bomb
} from 'lucide-react';
import * as fs from '@/lib/vfs';

/* 1. Calendar Application */
export function CalendarApp() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<{ id: number; title: string; time: string }[]>([
    { id: 1, title: 'Ubuntu 26.04 Release Party', time: '14:00' },
    { id: 2, title: 'Kernel Team Sync', time: '16:30' }
  ]);
  const [newEvent, setNewEvent] = useState('');

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.trim()) return;
    setEvents([...events, { id: Date.now(), title: newEvent.trim(), time: '12:00' }]);
    setNewEvent('');
  };

  return (
    <div className="suite-app calendar-suite">
      <div className="cal-sidebar">
        <h3>Today</h3>
        <p className="cal-today-num">{date.getDate()}</p>
        <p className="cal-today-day">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long' })}</p>
        <hr />
        <h4>Upcoming Events</h4>
        <ul>
          {events.map(ev => (
            <li key={ev.id}>
              <span>{ev.time}</span>
              <strong>{ev.title}</strong>
            </li>
          ))}
        </ul>
        <form onSubmit={addEvent} className="add-event-form">
          <input
            placeholder="Add new event..."
            value={newEvent}
            onChange={e => setNewEvent(e.target.value)}
          />
          <button type="submit"><Plus size={15} /></button>
        </form>
      </div>
      <div className="cal-grid-view">
        <div className="cal-month-header">
          <h2>{date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="cal-days-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="cal-day-label">{d}</div>
          ))}
          {Array.from({ length: 35 }, (_, i) => {
            const dayNum = (i % 31) + 1;
            const isToday = dayNum === date.getDate();
            return (
              <div key={i} className={`cal-cell ${isToday ? 'today' : ''}`}>
                <span>{dayNum}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* 2. Playable Minesweeper */
export function MinesApp() {
  const ROWS = 8;
  const COLS = 8;
  const MINES = 10;

  const [grid, setGrid] = useState<any[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const initGame = () => {
    let cells = Array.from({ length: ROWS * COLS }, (_, idx) => ({
      id: idx,
      row: Math.floor(idx / COLS),
      col: idx % COLS,
      mine: false,
      revealed: false,
      flagged: false,
      count: 0
    }));

    let planted = 0;
    while (planted < MINES) {
      const r = Math.floor(Math.random() * cells.length);
      if (!cells[r].mine) {
        cells[r].mine = true;
        planted++;
      }
    }

    cells = cells.map(c => {
      if (c.mine) return c;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = c.row + dr;
          const nc = c.col + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            if (cells[nr * COLS + nc].mine) count++;
          }
        }
      }
      return { ...c, count };
    });

    setGrid(cells);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => { initGame(); }, []);

  const reveal = (idx: number) => {
    if (gameOver || won || grid[idx].revealed || grid[idx].flagged) return;
    if (grid[idx].mine) {
      setGrid(prev => prev.map(c => c.mine ? { ...c, revealed: true } : c));
      setGameOver(true);
      return;
    }

    const next = [...grid];
    const queue = [idx];
    next[idx].revealed = true;

    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (next[cur].count === 0) {
        const r = next[cur].row;
        const c = next[cur].col;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              const ni = nr * COLS + nc;
              if (!next[ni].revealed && !next[ni].mine) {
                next[ni].revealed = true;
                if (next[ni].count === 0) queue.push(ni);
              }
            }
          }
        }
      }
    }

    const unrevealed = next.filter(c => !c.revealed && !c.mine);
    if (unrevealed.length === 0) setWon(true);
    setGrid(next);
  };

  const toggleFlag = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    if (gameOver || won || grid[idx].revealed) return;
    setGrid(prev => prev.map((c, i) => i === idx ? { ...c, flagged: !c.flagged } : c));
  };

  return (
    <div className="suite-app mines-app">
      <div className="mines-header">
        <span>💣 Mines: {MINES}</span>
        <button onClick={initGame} className="mines-reset">
          <RefreshCw size={15} /> {gameOver ? 'Dead! Restart' : won ? 'Won! Restart' : 'Reset'}
        </button>
      </div>
      <div className="mines-grid">
        {grid.map((c, idx) => (
          <button
            key={idx}
            className={`mines-cell ${c.revealed ? 'revealed' : ''}`}
            onClick={() => reveal(idx)}
            onContextMenu={e => toggleFlag(e, idx)}
          >
            {c.revealed ? (c.mine ? '💥' : c.count > 0 ? c.count : '') : (c.flagged ? '🚩' : '')}
          </button>
        ))}
      </div>
    </div>
  );
}

/* 3. Disk Usage Analyzer (Baobab) */
export function DiskUsageApp() {
  const root = fs.resolve('/');
  const home = fs.resolve(fs.HOME);
  const total = 50 * 1024 * 1024 * 1024; // 50 GB simulated
  const used = 12.8 * 1024 * 1024 * 1024;
  const free = total - used;

  return (
    <div className="suite-app disk-app">
      <div className="disk-hero">
        <HardDrive size={48} />
        <div>
          <h2>Ubuntu System Disk</h2>
          <p>Filesystem: ext4 on /dev/nvme0n1p2</p>
        </div>
      </div>
      <div className="disk-bar">
        <div className="disk-bar-fill" style={{ width: '25.6%' }} />
      </div>
      <div className="disk-stats">
        <span>Used: 12.8 GB (25.6%)</span>
        <span>Free: 37.2 GB</span>
        <span>Capacity: 50.0 GB</span>
      </div>
      <table className="disk-table">
        <thead>
          <tr><th>Folder</th><th>Usage</th><th>Type</th></tr>
        </thead>
        <tbody>
          <tr><td>/usr</td><td>7.4 GB</td><td>System Binaries</td></tr>
          <tr><td>/home/ubuntu</td><td>3.2 GB</td><td>User Data</td></tr>
          <tr><td>/var</td><td>1.6 GB</td><td>Logs & Cache</td></tr>
          <tr><td>/etc</td><td>24.5 MB</td><td>Configuration</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/* 4. VLC Media Player */
export function VlcApp() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  return (
    <div className="suite-app vlc-app">
      <div className="vlc-screen">
        <div className="vlc-cone" />
        <p>{playing ? 'Now Playing: Ubuntu 26.04 Soundscape.flac' : 'VLC Media Player'}</p>
      </div>
      <div className="vlc-controls">
        <button onClick={() => setPlaying(!playing)} className="vlc-play-btn">
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={e => setProgress(Number(e.target.value))}
          className="vlc-slider"
        />
        <Volume2 size={18} />
      </div>
    </div>
  );
}

/* 5. GIMP Image Editor */
export function GimpApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#e95420');
  const [brushSize, setBrushSize] = useState(6);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const draw = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="suite-app gimp-app">
      <div className="gimp-toolbar">
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />
        <label>Brush: {brushSize}px</label>
        <input
          type="range"
          min="2"
          max="30"
          value={brushSize}
          onChange={e => setBrushSize(Number(e.target.value))}
        />
        <button onClick={clear}>Clear Canvas</button>
      </div>
      <div className="gimp-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          onMouseMove={draw}
          className="gimp-canvas"
        />
      </div>
    </div>
  );
}

/* 6. VS Code / Code Editor */
export function VsCodeApp() {
  const [code, setCode] = useState(
    `// Welcome to Visual Studio Code on Ubuntu 26.04 LTS\nfunction greet(user: string) {\n  return \`Hello, \${user}! Welcome to the browser OS.\`;\n}\n\nconsole.log(greet("ubuntu"));`
  );

  return (
    <div className="suite-app vscode-app">
      <div className="vscode-sidebar">
        <small>EXPLORER</small>
        <p className="active-file">📄 app.ts</p>
        <p>📄 package.json</p>
        <p>📄 README.md</p>
      </div>
      <div className="vscode-editor">
        <div className="vscode-tabs">
          <span>app.ts</span>
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
          className="vscode-code"
        />
      </div>
    </div>
  );
}

/* 7. LibreOffice Suite */
export function LibreOfficeApp() {
  const [doc, setDoc] = useState(
    "Ubuntu 26.04 LTS Project Report\n\nThis browser operating system provides full window management, simulated storage, package management, and authentic desktop styling."
  );

  return (
    <div className="suite-app office-app">
      <div className="office-toolbar">
        <button><strong>B</strong></button>
        <button><em>I</em></button>
        <button><u>U</u></button>
        <span className="divider" />
        <select><option>Liberation Sans</option><option>Ubuntu</option></select>
        <select><option>12 pt</option><option>14 pt</option></select>
      </div>
      <div className="office-page-wrapper">
        <textarea
          value={doc}
          onChange={e => setDoc(e.target.value)}
          className="office-page"
        />
      </div>
    </div>
  );
}

/* 8. SuperTux Runner */
export function SuperTuxApp() {
  const [pos, setPos] = useState(50);
  const [jumping, setJumping] = useState(false);
  const [score, setScore] = useState(0);

  const jump = () => {
    if (jumping) return;
    setJumping(true);
    setScore(s => s + 10);
    setTimeout(() => setJumping(false), 500);
  };

  return (
    <div className="suite-app supertux-app" onClick={jump}>
      <div className="tux-sky">
        <div className="tux-score">Coins: {score}</div>
        <div className={`tux-player ${jumping ? 'jumping' : ''}`}>🐧</div>
        <div className="tux-ground" />
      </div>
      <p className="tux-hint">Click anywhere or press Space to jump!</p>
    </div>
  );
}
