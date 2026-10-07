import type { AppId } from './apps';
import { FilesApp } from './files-app';
import { TerminalApp } from './terminal-app';
import { EditorApp } from './editor-app';

const noop = () => {};

export function AppContent({ app, path, setTitle = noop }: { app: AppId; path?: string; setTitle?: (t: string) => void }) {
  if (app === 'files') return <FilesApp path={path} setTitle={setTitle} />;
  if (app === 'terminal') return <TerminalApp path={path} setTitle={setTitle} />;
  if (app === 'editor') return <EditorApp path={path} setTitle={setTitle} />;
  return <About />;
}

function About() {
  return <div className="about-app"><div className="ubuntu-symbol" aria-hidden="true">◌</div><h1>Ubuntu 26.04 LTS</h1><p>Resolute Raccoon</p><div className="about-details">{[['Device Name', 'ubuntu'], ['OS Name', 'Ubuntu 26.04 LTS'], ['OS Type', '64-bit'], ['GNOME Version', '50'], ['Windowing System', 'Browser'], ['Session', 'Ubuntu Desktop']].map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div></div>;
}
