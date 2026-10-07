// @ts-nocheck -- strict index typing pending Phase 2 cleanup
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import * as fs from '@/lib/vfs';

export function EditorApp({ path, setTitle }: { path?: string | undefined; setTitle: (t: string) => void }) {
  const [fileId, setFileId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');
  const [saveAs, setSaveAs] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { const n = path ? fs.resolve(path) : undefined; if (n?.type === 'file') { setFileId(n.id); setText(n.content ?? ''); setSaved(n.content ?? ''); fs.touchRecent(n.id); } }, [path]);
  const current = fileId ? fs.node(fileId) : undefined;
  const dirty = text !== saved;
  useEffect(() => { setTitle(`${dirty ? '•' : ''}${current?.name ?? 'Untitled Document 1'}`); }, [dirty, current?.name, setTitle]);
  const save = () => {
    if (current) { fs.writeFile(current.id, text); setSaved(text); return; }
    setSaveAs('~/Documents/Untitled Document 1.txt');
  };
  const confirmSaveAs = () => {
    if (!saveAs) return;
    const full = fs.normalize(saveAs); const i = full.lastIndexOf('/'); const dir = fs.resolve(full.slice(0, i) || '/'); const name = full.slice(i + 1);
    try {
      if (!dir || dir.type !== 'dir') throw new fs.FsError('Folder does not exist');
      const existing = fs.children(dir.id).find(c => c.name === name);
      if (existing?.type === 'dir') throw new fs.FsError('A folder with that name exists');
      const n = existing ? (fs.writeFile(existing.id, text), existing) : fs.createFile(dir.id, name, text);
      setFileId(n.id); setSaved(text); setSaveAs(null); setError(''); fs.touchRecent(n.id);
    } catch (e) { setError((e as Error).message); }
  };
  const lines = text.split('\n');
  return <div className="editor-app" onKeyDown={e => { if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } }}>
    <div className="editor-toolbar"><span>{current ? fs.pathOf(current.id).replace(fs.HOME, '~') : 'Unsaved document'}</span><Button variant="desktop" disabled={!dirty && !!current} onClick={save}>Save</Button></div>
    {saveAs !== null && <form className="editor-saveas" onSubmit={e => { e.preventDefault(); confirmSaveAs(); }}><label>Save as<input aria-label="Save as path" autoFocus value={saveAs} onChange={e => setSaveAs(e.target.value)} /></label><Button variant="desktop" type="submit">Save</Button><Button variant="desktop" type="button" onClick={() => { setSaveAs(null); setError(''); }}>Cancel</Button>{error && <span className="editor-error">{error}</span>}</form>}
    <textarea aria-label="Document text" value={text} onChange={e => setText(e.target.value)} spellCheck={false} />
    <footer>{current ? fs.kindOf(current) : 'Plain Text'}<span>Ln {lines.length}, Col {(lines.at(-1)?.length ?? 0) + 1}</span></footer>
  </div>;
}
