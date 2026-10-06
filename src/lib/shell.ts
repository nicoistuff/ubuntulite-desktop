// Bash-like interpreter operating on the simulated filesystem.
import * as fs from './vfs';

export type ShellResult = { output: string; cwd: string; clear?: boolean };
const COMMANDS = ['cat', 'cd', 'clear', 'cp', 'date', 'echo', 'help', 'history', 'hostname', 'ls', 'mkdir', 'mv', 'neofetch', 'pwd', 'rm', 'rmdir', 'touch', 'tree', 'uname', 'whoami'];
export const commandNames = COMMANDS;

export function tokenize(line: string): string[] {
  const out: string[] = []; let cur = ''; let quote: string | null = null; let has = false;
  for (const ch of line) {
    if (quote) { if (ch === quote) quote = null; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; has = true; continue; }
    if (/\s/.test(ch)) { if (cur || has) out.push(cur); cur = ''; has = false; continue; }
    if (ch === '>') { if (cur || has) out.push(cur); cur = ''; has = false; out.push(out.at(-1) === '>' ? (out.pop(), '>>') : '>'); continue; }
    cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}
const split = (args: string[]) => ({ flags: args.filter(a => /^-[a-zA-Z]+$/.test(a)).join('').replace(/-/g, ''), rest: args.filter(a => !/^-[a-zA-Z]+$/.test(a)) });
export const displayPath = (p: string) => p === fs.HOME ? '~' : p.startsWith(fs.HOME + '/') ? '~' + p.slice(fs.HOME.length) : p;
const parentAndName = (path: string, cwd: string) => { const full = fs.normalize(path, cwd); const i = full.lastIndexOf('/'); return { dir: fs.resolve(full.slice(0, i) || '/'), name: full.slice(i + 1), full }; };
const sorted = (id: string, all: boolean) => fs.children(id).filter(c => all || !c.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name));
const fmtDate = (t: number) => new Date(t).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');

export function run(line: string, cwd: string, history: string[]): ShellResult {
  const tokens = tokenize(line.trim());
  if (!tokens.length) return { output: '', cwd };
  let redirect: { path: string; append: boolean } | null = null;
  const ri = tokens.findIndex(t => t === '>' || t === '>>');
  if (ri >= 0) { if (!tokens[ri + 1]) return { output: 'bash: syntax error near unexpected token `newline\'', cwd }; redirect = { path: tokens[ri + 1], append: tokens[ri] === '>>' }; tokens.splice(ri, 2); }
  const [cmd, ...args] = tokens;
  let result: ShellResult;
  try { result = exec(cmd, args, cwd, history); } catch (e) { result = { output: `${cmd}: ${(e as Error).message}`, cwd }; }
  if (redirect && !result.clear) {
    const { dir, name } = parentAndName(redirect.path, cwd);
    if (!dir || dir.type !== 'dir') return { output: `bash: ${redirect.path}: No such file or directory`, cwd: result.cwd };
    const existing = fs.children(dir.id).find(c => c.name === name);
    const text = result.output ? result.output + '\n' : '';
    if (existing?.type === 'dir') return { output: `bash: ${redirect.path}: Is a directory`, cwd: result.cwd };
    if (existing) fs.writeFile(existing.id, redirect.append ? (existing.content ?? '') + text : text); else fs.createFile(dir.id, name, text);
    return { output: '', cwd: result.cwd };
  }
  return result;
}

function exec(cmd: string, args: string[], cwd: string, history: string[]): ShellResult {
  const out = (output: string, nextCwd = cwd): ShellResult => ({ output, cwd: nextCwd });
  const { flags, rest } = split(args);
  switch (cmd) {
    case 'help': return out(`GNU bash, version 5.2 (simulated) — available commands:\n${COMMANDS.join('  ')}\nRedirection with > and >> is supported. Use ↑/↓ for history and Tab to complete.`);
    case 'clear': return { output: '', cwd, clear: true };
    case 'echo': return out(args.join(' '));
    case 'whoami': return out('ubuntu');
    case 'hostname': return out('ubuntu');
    case 'pwd': return out(cwd);
    case 'date': return out(new Date().toString().replace(/ \(.+\)$/, ''));
    case 'uname': return out(flags.includes('a') ? 'Linux ubuntu 6.17.0-ubuntu #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux' : flags.includes('r') ? '6.17.0-ubuntu' : 'Linux');
    case 'history': return out(history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n'));
    case 'cd': {
      const target = fs.normalize(rest[0] ?? '~', cwd); const n = fs.resolve(target);
      if (!n) return out(`bash: cd: ${rest[0]}: No such file or directory`);
      if (n.type !== 'dir') return out(`bash: cd: ${rest[0]}: Not a directory`);
      return out('', target);
    }
    case 'ls': {
      const targets = rest.length ? rest : ['.'];
      return out(targets.map(t => {
        const n = fs.resolve(t, cwd);
        if (!n) return `ls: cannot access '${t}': No such file or directory`;
        const items = n.type === 'dir' ? sorted(n.id, flags.includes('a')) : [n];
        const body = flags.includes('l')
          ? [`total ${items.length}`, ...items.map(i => `${i.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'} 1 ubuntu ubuntu ${String(fs.sizeOf(i.id)).padStart(6)} ${fmtDate(i.mtime)} ${i.name}${i.type === 'dir' ? '/' : ''}`)].join('\n')
          : items.map(i => i.type === 'dir' ? `\u0001${i.name}` : i.name).join('  ');
        return targets.length > 1 ? `${t}:\n${body}` : body;
      }).join('\n\n'));
    }
    case 'cat': {
      if (!rest.length) return out('cat: missing file operand');
      return out(rest.map(p => { const n = fs.resolve(p, cwd); return !n ? `cat: ${p}: No such file or directory` : n.type === 'dir' ? `cat: ${p}: Is a directory` : (n.content ?? '').replace(/\n$/, ''); }).join('\n'));
    }
    case 'mkdir': {
      if (!rest.length) return out('mkdir: missing operand');
      const errors: string[] = [];
      for (const p of rest) {
        const full = fs.normalize(p, cwd);
        if (flags.includes('p')) { let cur = fs.resolve('/')!; for (const part of full.split('/').filter(Boolean)) { const next = fs.children(cur.id).find(c => c.name === part); if (next && next.type !== 'dir') { errors.push(`mkdir: cannot create directory '${p}': Not a directory`); break; } cur = next ?? fs.mkdir(cur.id, part); } continue; }
        const { dir, name } = parentAndName(p, cwd);
        if (!dir) errors.push(`mkdir: cannot create directory '${p}': No such file or directory`);
        else if (fs.children(dir.id).some(c => c.name === name)) errors.push(`mkdir: cannot create directory '${p}': File exists`);
        else fs.mkdir(dir.id, name);
      }
      return out(errors.join('\n'));
    }
    case 'touch': {
      if (!rest.length) return out('touch: missing file operand');
      const errors: string[] = [];
      for (const p of rest) { const n = fs.resolve(p, cwd); if (n) { if (n.type === 'file') fs.writeFile(n.id, n.content ?? ''); continue; } const { dir, name } = parentAndName(p, cwd); if (!dir) errors.push(`touch: cannot touch '${p}': No such file or directory`); else fs.createFile(dir.id, name); }
      return out(errors.join('\n'));
    }
    case 'rm': case 'rmdir': {
      if (!rest.length) return out(`${cmd}: missing operand`);
      const errors: string[] = [];
      for (const p of rest) {
        const n = fs.resolve(p, cwd);
        if (!n) { if (!flags.includes('f')) errors.push(`${cmd}: cannot remove '${p}': No such file or directory`); continue; }
        if (!n.parent) { errors.push(`${cmd}: it is dangerous to operate recursively on '/'`); continue; }
        if (cmd === 'rmdir') { if (n.type !== 'dir') errors.push(`rmdir: failed to remove '${p}': Not a directory`); else if (fs.children(n.id).length) errors.push(`rmdir: failed to remove '${p}': Directory not empty`); else fs.remove(n.id); continue; }
        if (n.type === 'dir' && !/[rR]/.test(flags)) { errors.push(`rm: cannot remove '${p}': Is a directory`); continue; }
        if (fs.normalize(cwd).startsWith(fs.pathOf(n.id) + '/') || fs.normalize(cwd) === fs.pathOf(n.id)) { errors.push(`rm: refusing to remove '${p}': current directory`); continue; }
        fs.remove(n.id);
      }
      return out(errors.join('\n'));
    }
    case 'cp': case 'mv': {
      if (rest.length < 2) return out(`${cmd}: missing destination file operand after '${rest[0] ?? ''}'`);
      const destPath = rest.at(-1)!; const sources = rest.slice(0, -1); const dest = fs.resolve(destPath, cwd);
      if (sources.length > 1 && dest?.type !== 'dir') return out(`${cmd}: target '${destPath}' is not a directory`);
      const errors: string[] = [];
      for (const s of sources) {
        const src = fs.resolve(s, cwd);
        if (!src) { errors.push(`${cmd}: cannot stat '${s}': No such file or directory`); continue; }
        if (cmd === 'cp' && src.type === 'dir' && !/[rR]/.test(flags)) { errors.push(`cp: -r not specified; omitting directory '${s}'`); continue; }
        let parent: string; let name: string;
        if (dest?.type === 'dir') { parent = dest.id; name = src.name; }
        else { const pn = parentAndName(destPath, cwd); if (!pn.dir || pn.dir.type !== 'dir') { errors.push(`${cmd}: cannot create '${destPath}': No such file or directory`); continue; } parent = pn.dir.id; name = pn.name; }
        try { if (cmd === 'cp') fs.copy(src.id, parent, name); else fs.move(src.id, parent, name); } catch (e) { errors.push(`${cmd}: ${(e as Error).message}`); }
      }
      return out(errors.join('\n'));
    }
    case 'tree': {
      const root = fs.resolve(rest[0] ?? '.', cwd);
      if (!root || root.type !== 'dir') return out(`${rest[0] ?? '.'} [error opening dir]`);
      let dirs = 0, files = 0; const lines = [rest[0] ?? '.'];
      const walk = (id: string, prefix: string) => { const items = sorted(id, flags.includes('a')); items.forEach((c, i) => { const last = i === items.length - 1; lines.push(`${prefix}${last ? '└── ' : '├── '}${c.type === 'dir' ? '\u0001' : ''}${c.name}`); if (c.type === 'dir') { dirs++; walk(c.id, prefix + (last ? '    ' : '│   ')); } else files++; }); };
      walk(root.id, ''); lines.push('', `${dirs} directories, ${files} files`); return out(lines.join('\n'));
    }
    case 'neofetch': {
      const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const info = [`\u0002ubuntu\u0003@\u0002ubuntu`, '-------------', `\u0002OS\u0003: Ubuntu 26.04 LTS x86_64`, `\u0002Host\u0003: Browser Virtual Machine`, `\u0002Kernel\u0003: 6.17.0-ubuntu`, `\u0002Uptime\u0003: ${Math.floor(performance.now() / 60000)} mins`, `\u0002Packages\u0003: 1873 (dpkg), 9 (snap)`, `\u0002Shell\u0003: bash 5.2`, `\u0002Resolution\u0003: ${screen.width}x${screen.height}`, `\u0002DE\u0003: GNOME 50`, `\u0002WM\u0003: Mutter`, `\u0002Theme\u0003: Yaru [GTK3/4]`, `\u0002Terminal\u0003: ptyxis`, `\u0002CPU\u0003: ${navigator.hardwareConcurrency || 4} logical cores`, `\u0002Memory\u0003: ${mem ? `${mem} GiB (reported)` : 'unavailable'}`];
      const logo = ['            .-/+oossssoo+/-.', '        `:+ssssssssssssssssss+:`', '      -+ssssssssssssssssssyyssss+-', '    .ossssssssssssssssssdMMMNysssso.', '   /ssssssssssshdmmNNmmyNMMMMhssssss/', '  +ssssssssshmydMMMMMMMNddddyssssssss+', ' /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/', '.ssssssssdMMMNhsssssssssshNMMMdssssssss.', '+sssshhhyNMMNyssssssssssssyNMMMysssssss+', 'ossyNMMMNyMMhsssssssssssssshmmmhssssssso', '+sssshhhyNMMNyssssssssssssyNMMMysssssss+', '.ssssssssdMMMNhsssssssssshNMMMdssssssss.', ' /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/', '  +sssssssssdmydMMMMMMMMddddyssssssss+', '   /ssssssssssshdmNNNNmyNMMMMhssssss/', '    .ossssssssssssssssssdMMMNysssso.', '      -+sssssssssssssssssyyyssss+-', '        `:+ssssssssssssssssss+:`', '            .-/+oossssoo+/-.'];
      return out(logo.map((l, i) => `\u0004${l.padEnd(42)}\u0005${info[i] ?? ''}`).join('\n'));
    }
    default: return out(`${cmd}: command not found`);
  }
}

export function complete(line: string, cwd: string): string {
  const parts = line.split(' '); const word = parts.at(-1) ?? '';
  if (parts.length === 1) { const m = COMMANDS.filter(c => c.startsWith(word)); return m.length === 1 ? m[0] + ' ' : line; }
  const slash = word.lastIndexOf('/'); const base = slash >= 0 ? word.slice(0, slash + 1) : ''; const frag = word.slice(slash + 1);
  const dir = fs.resolve(base || '.', cwd); if (!dir || dir.type !== 'dir') return line;
  const m = fs.children(dir.id).filter(c => c.name.startsWith(frag) && (frag.startsWith('.') || !c.name.startsWith('.')));
  if (m.length !== 1) return line;
  parts[parts.length - 1] = base + m[0].name + (m[0].type === 'dir' ? '/' : ' ');
  return parts.join(' ');
}
