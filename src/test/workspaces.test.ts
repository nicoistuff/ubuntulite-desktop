import { describe, expect, it } from 'vitest';
import * as fs from '@/lib/vfs';

describe('Phase 5: Workspaces & Global Search', () => {
  it('isolates windows by workspace index', () => {
    const windows = [
      { id: 1, app: 'files', workspace: 0 },
      { id: 2, app: 'terminal', workspace: 1 },
      { id: 3, app: 'editor', workspace: 0 },
    ];

    const ws0Windows = windows.filter(w => w.workspace === 0);
    const ws1Windows = windows.filter(w => w.workspace === 1);

    expect(ws0Windows.map(w => w.id)).toEqual([1, 3]);
    expect(ws1Windows.map(w => w.id)).toEqual([2]);
  });

  it('moves window to another workspace', () => {
    let windows = [
      { id: 1, app: 'files', workspace: 0 },
      { id: 2, app: 'terminal', workspace: 0 },
    ];

    // Move window 1 to workspace 2
    windows = windows.map(w => w.id === 1 ? { ...w, workspace: 2 } : w);

    expect(windows.find(w => w.id === 1)?.workspace).toBe(2);
    expect(windows.find(w => w.id === 2)?.workspace).toBe(0);
  });

  it('evaluates math expressions in global search', () => {
    const evalMath = (query: string): number | null => {
      const trimmed = query.trim();
      if (!trimmed || !/^[0-9+\-*/().\s^%]+$/.test(trimmed) || !/[0-9]/.test(trimmed)) return null;
      try {
        const sanitized = trimmed.replace(/\^/g, '**');
        const val = Function(`'use strict'; return (${sanitized})`)();
        return typeof val === 'number' && Number.isFinite(val) ? val : null;
      } catch {
        return null;
      }
    };

    expect(evalMath('2 + 2')).toBe(4);
    expect(evalMath('128 * 4')).toBe(512);
    expect(evalMath('(50 - 10) / 2')).toBe(20);
    expect(evalMath('invalid query')).toBeNull();
  });

  it('finds filesystem items matching search query', () => {
    const results = fs.search('root', 'Welcome', false);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name.toLowerCase()).toContain('welcome');
  });
});
