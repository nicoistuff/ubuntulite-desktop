// @ts-nocheck
import { beforeEach, describe, expect, it } from 'vitest';
import { getSettings, setSettings, resetSettings, DEFAULTS, ACCENTS, WALLPAPERS, wallpaperCss, localeOf } from '../lib/settings';
import { notify, dismiss, clearAll, useNotifications, _store } from '../lib/notifications';

describe('settings store', () => {
  beforeEach(() => { localStorage.clear(); resetSettings(); });

  it('returns defaults after reset', () => {
    expect(getSettings().theme).toBe(DEFAULTS.theme);
    expect(getSettings().accent).toBe(DEFAULTS.accent);
  });

  it('persists changes to localStorage', () => {
    setSettings({ theme: 'dark', wifi: false });
    expect(getSettings().theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem('ubuntu-settings-v1')!).theme).toBe('dark');
    expect(getSettings().wifi).toBe(false);
  });

  it('offers accents and wallpapers with valid css', () => {
    expect(ACCENTS.length).toBeGreaterThanOrEqual(8);
    expect(WALLPAPERS.length).toBeGreaterThanOrEqual(5);
    expect(wallpaperCss(WALLPAPERS[0].id)).toBeTruthy();
  });

  it('maps languages to locales', () => {
    expect(localeOf('English (UK)')).toBe('en-GB');
    expect(localeOf('Deutsch')).toBe('de-DE');
  });
});

describe('notifications', () => {
  beforeEach(() => { localStorage.clear(); resetSettings(); clearAll(); });

  it('creates and dismisses notifications', () => {
    const n = notify('Terminal', 'Hello', 'World');
    expect(_store.list().some(x => x.id === n.id)).toBe(true);
    dismiss(n.id);
    expect(_store.list().some(x => x.id === n.id)).toBe(false);
  });

  it('suppresses popups when Do Not Disturb is on', () => {
    setSettings({ dnd: true });
    const n = notify('Terminal', 'Quiet');
    expect(n.popup).toBe(false);
    setSettings({ dnd: false });
    const m = notify('Terminal', 'Loud');
    expect(m.popup).toBe(true);
  });

  it('suppresses popups for muted apps', () => {
    setSettings({ mutedApps: ['Terminal'] });
    expect(notify('Terminal', 'Muted').popup).toBe(false);
    expect(notify('Files', 'Not muted').popup).toBe(true);
  });

  it('clearAll empties the list', () => {
    notify('A', '1'); notify('B', '2');
    clearAll();
    expect(_store.list()).toHaveLength(0);
  });
});
