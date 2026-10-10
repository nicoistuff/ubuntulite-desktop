// @ts-nocheck
import { useEffect, useState } from 'react';
import * as fs from '@/lib/vfs';

const PROCS = ['systemd', 'gnome-shell', 'Xwayland', 'pipewire', 'gnome-terminal-server', 'nautilus', 'snapd', 'NetworkManager', 'gdm', 'tracker-miner-fs-3', 'firefox', 'evolution-data-server'];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** System Monitor: processes, resource graphs, and filesystem usage measured from the simulated disk. */
export function SystemMonitorApp() {
  const [tab, setTab] = useState<'processes' | 'resources' | 'filesystems'>('resources');
  const [cpu, setCpu] = useState<number[]>(() => Array(40).fill(8));
  const [procs, setProcs] = useState(() => PROCS.map((name, i) => ({ pid: 1 + i * 137, name, cpu: rand(0, 4), mem: rand(20, 400) })));
  useEffect(() => {
    const t = setInterval(() => {
      setCpu(c => [...c.slice(1), Math.max(2, Math.min(95, c[c.length - 1] + rand(-10, 10)))]);
      setProcs(p => p.map(x => ({ ...x, cpu: Math.max(0, x.cpu + rand(-1, 1)) })));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const heap = (performance as any).memory;
  const memUsed = heap ? heap.usedJSHeapSize / 1e6 : 2400;
  const used = fs.sizeOf('root');
  const points = cpu.map((v, i) => `${(i / 39) * 400},${100 - v}`).join(' ');
  return <div className="suite-app sysmon">
    <nav className="sysmon-tabs">{(['processes', 'resources', 'filesystems'] as const).map(t =>
      <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</nav>
    {tab === 'processes' && <table className="sysmon-table"><thead><tr><th>Process Name</th><th>ID</th><th>% CPU</th><th>Memory</th><th /></tr></thead>
      <tbody>{procs.map(p => <tr key={p.pid}><td>{p.name}</td><td>{p.pid}</td><td>{p.cpu.toFixed(1)}</td><td>{p.mem.toFixed(1)} MB</td>
        <td><button aria-label={`End ${p.name}`} disabled={p.pid === 1} onClick={() => setProcs(ps => ps.filter(x => x.pid !== p.pid))}>End</button></td></tr>)}</tbody></table>}
    {tab === 'resources' && <div className="sysmon-res">
      <h4>CPU — {cpu[cpu.length - 1].toFixed(1)}% ({navigator.hardwareConcurrency || 4} threads)</h4>
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="sysmon-graph"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      <h4>Memory — {memUsed.toFixed(0)} MB used</h4>
      <div className="sysmon-bar"><span style={{ width: `${Math.min(100, memUsed / 80)}%` }} /></div>
    </div>}
    {tab === 'filesystems' && <table className="sysmon-table"><thead><tr><th>Device</th><th>Directory</th><th>Type</th><th>Used</th></tr></thead>
      <tbody><tr><td>/dev/nvme0n1p2</td><td>/</td><td>ext4</td><td>{fs.formatSize(used)}</td></tr></tbody></table>}
  </div>;
}
