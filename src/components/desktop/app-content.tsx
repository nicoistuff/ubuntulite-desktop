import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Clock, Download, FileText, Folder, Grid2X2, HardDrive, Home, List, Menu, Music, Search, Star, Trash2, Image, Video, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { folders, type AppId } from './apps';

export function AppContent({ app }: { app: AppId }) {
  if (app === 'files') return <Files />;
  if (app === 'terminal') return <TerminalShell />;
  if (app === 'editor') return <Editor />;
  return <About />;
}
function Files() {
  const [path, setPath] = useState('Home');
  const [history, setHistory] = useState(['Home']);
  const [position, setPosition] = useState(0);
  const [list, setList] = useState(false);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState('');
  const [menu, setMenu] = useState(false);
  const navigate = (next: string) => { setPath(next); setHistory([...history.slice(0, position + 1), next]); setPosition(position + 1); setSelected(''); };
  const entries = path === 'Home' ? folders : path === 'Other Locations' ? ['Computer'] : path === 'Computer' ? ['home'] : path === 'home' ? ['ubuntu'] : path === 'ubuntu' ? folders : [];
  const sidebar = [ ['Recent', Clock], ['Starred', Star], ['Home', Home], ['Desktop', Monitor], ['Documents', FileText], ['Downloads', Download], ['Music', Music], ['Pictures', Image], ['Videos', Video], ['Trash', Trash2] ] as const;
  return <div className="files-app">
    <aside className="files-sidebar">{sidebar.map(([name, Icon]) => <Button key={name} variant="desktop" className={`sidebar-item ${path === name ? 'selected' : ''}`} onClick={() => navigate(name)}><Icon />{name}</Button>)}<div className="sidebar-divider" /><Button variant="desktop" className={`sidebar-item ${path === 'Other Locations' ? 'selected' : ''}`} onClick={() => navigate('Other Locations')}><HardDrive />Other Locations</Button></aside>
    <div className="files-main"><div className="files-toolbar"><Button variant="desktop" size="icon" aria-label="Back" disabled={position === 0} onClick={() => { setPosition(position - 1); setPath(history[position - 1] ?? 'Home'); }}><ArrowLeft /></Button><Button variant="desktop" size="icon" aria-label="Forward" disabled={position === history.length - 1} onClick={() => { setPosition(position + 1); setPath(history[position + 1] ?? 'Home'); }}><ArrowRight /></Button><div className="breadcrumb"><Home size={15} /><Button variant="desktop" onClick={() => navigate('Home')}>Home</Button>{path !== 'Home' && <><ChevronRight size={13} /><span>{path}</span></>}</div><Button variant="desktop" size="icon" aria-label="Search files" onClick={() => setSearching(!searching)}><Search /></Button><Button variant="desktop" size="icon" aria-label="Toggle file view" onClick={() => setList(!list)}>{list ? <Grid2X2 /> : <List />}</Button><Button variant="desktop" size="icon" aria-label="File options" onClick={() => setMenu(!menu)}><Menu /></Button>{menu && <div className="file-menu"><Button variant="desktop" onClick={() => { setList(!list); setMenu(false); }}>{list ? 'Grid view' : 'List view'}</Button><Button variant="desktop" onClick={() => { navigate('Home'); setMenu(false); }}>Go to Home</Button></div>}</div>
    {searching && <input className="file-search" aria-label="Search folders" placeholder="Search folders" autoFocus value={search} onChange={e => setSearch(e.target.value)} />}
    <div className={`folder-grid ${list ? 'list-view' : ''}`}>{entries.filter(name => name.toLowerCase().includes(search.toLowerCase())).map(name => <Button key={name} variant="desktop" className={`folder-item ${selected === name ? 'selected' : ''}`} onClick={() => setSelected(name)} onDoubleClick={() => navigate(name)} onKeyDown={e => { if (e.key === 'Enter') navigate(name); }}><span className="folder-art"><Folder fill="currentColor" strokeWidth={1.1} /></span><span>{name}</span>{list && <span className="folder-kind">Folder</span>}</Button>)}{entries.length === 0 && <div className="empty-folder"><Folder size={56} strokeWidth={1} /><span>Folder is empty</span></div>}</div>
    <footer className="files-status">{selected ? `“${selected}” selected` : `${entries.length} folders`}<span>42.8 GB available</span></footer></div>
  </div>;
}
function TerminalShell() {
  const [lines, setLines] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  return <div className="terminal-app" onClick={e => e.currentTarget.querySelector('input')?.focus()}><div className="terminal-greeting">Ubuntu 26.04 LTS</div>{lines.map((line, i) => <div key={i}>{line}</div>)}<form onSubmit={e => { e.preventDefault(); if (command.trim() === 'clear') setLines([]); else setLines([...lines, `ubuntu@ubuntu:~$ ${command}`, command.trim() === 'help' ? 'Shell commands available in this phase: help, clear, echo, whoami, pwd.' : command.trim() === 'whoami' ? 'ubuntu' : command.trim() === 'pwd' ? '/home/ubuntu' : command.startsWith('echo ') ? command.slice(5) : command.trim() ? `${command.split(' ')[0]}: command not available in the desktop shell` : '']); setCommand(''); }}><span className="terminal-prompt">ubuntu@ubuntu</span><span>:<span className="terminal-path">~</span>$ </span><input aria-label="Terminal command" autoFocus value={command} onChange={e => setCommand(e.target.value)} spellCheck={false} autoComplete="off" /></form></div>;
}
function Editor() {
  const [text, setText] = useState('');
  return <div className="editor-app"><div className="editor-toolbar"><span>Untitled Document</span><Button variant="desktop" disabled={!text} onClick={() => { const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'Untitled.txt'; a.click(); URL.revokeObjectURL(url); }}>Save</Button></div><textarea aria-label="Document text" value={text} onChange={e => setText(e.target.value)} spellCheck={false} /><footer>Plain Text<span>Ln {text.split('\n').length}, Col {(text.split('\n').at(-1)?.length ?? 0) + 1}</span></footer></div>;
}
function About() {
  return <div className="about-app"><div className="ubuntu-symbol" aria-hidden="true">◌</div><h1>Ubuntu 26.04 LTS</h1><p>Resolute Raccoon</p><div className="about-details">{[['Device Name', 'ubuntu'], ['OS Name', 'Ubuntu 26.04 LTS'], ['OS Type', '64-bit'], ['GNOME Version', '50'], ['Windowing System', 'Browser'], ['Session', 'Ubuntu Desktop']].map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div></div>;
}