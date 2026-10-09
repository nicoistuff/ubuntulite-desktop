import type { AppId } from './apps';
import { FilesApp } from './files-app';
import { TerminalApp } from './terminal-app';
import { EditorApp } from './editor-app';
import { SettingsApp } from './settings-app';
import { SoftwareApp } from './software-app';
import { CalculatorApp } from './calculator-app';

const noop = () => {};

export function AppContent({ app, path, setTitle = noop }: { app: AppId; path?: string | undefined; setTitle?: (t: string) => void }) {
  if (app === 'files') return <FilesApp path={path} setTitle={setTitle} />;
  if (app === 'terminal') return <TerminalApp path={path} setTitle={setTitle} />;
  if (app === 'editor') return <EditorApp path={path} setTitle={setTitle} />;
  if (app === 'software') return <SoftwareApp setTitle={setTitle} />;
  if (app === 'calculator') return <CalculatorApp setTitle={setTitle} />;
  return <SettingsApp panel={path} setTitle={setTitle} />;
}
