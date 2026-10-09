// @ts-nocheck
import { beforeEach, describe, expect, it } from 'vitest';
import { getSettings, setSettings, resetSettings, DEFAULTS, ACCENTS, WALLPAPERS, wallpaperCss, localeOf } from '../lib/settings';
import { notify, dismiss, clearAll, listNotifications } from '../lib/notifications';

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
    expect(Object.keys(ACCENTS).length).toBeGreaterThanOrEqual(8);
    expect(WALLPAPERS.length).toBeGreaterThanOrEqual(5);
    expect(wallpaperCss(getSettings())).toBeTruthy();
  });

  it('maps languages to locales', () => {
    expect(localeOf({ ...getSettings(), language: 'English (United Kingdom)' })).toBe('en-GB');
    expect(localeOf({ ...getSettings(), language: 'Deutsch' })).toBe('de-DE');
  });
});

describe('notifications', () => {
  beforeEach(() => { localStorage.clear(); resetSettings(); clearAll(); });

  it('creates and dismisses notifications', () => {
    const id = notify('Terminal', 'Hello', 'World');
    expect(listNotifications().some(n => n.id === id)).toBe(true);
    dismiss(id);
    expect(listNotifications().some(n => n.id === id)).toBe(false);
  });

  it('suppresses popups when Do Not Disturb is on', () => {
    setSettings({ dnd: true });
    const quietId = notify('Terminal', 'Quiet');
    expect(listNotifications().find(n => n.id === quietId).popup).toBe(false);
    setSettings({ dnd: false });
    const loudId = notify('Terminal', 'Loud');
    expect(listNotifications().find(n => n.id === loudId).popup).toBe(true);
  });

  it('suppresses popups for muted apps', () => {
    setSettings({ mutedApps: ['Terminal'] });
    const mutedId = notify('Terminal', 'Muted');
    const otherId = notify('Files', 'Not muted');
    expect(listNotifications().find(n => n.id === mutedId).popup).toBe(false);
    expect(listNotifications().find(n => n.id === otherId).popup).toBe(true);
  });

  it('clearAll empties the list', () => {
    notify('A', '1'); notify('B', '2');
    clearAll();
    expect(listNotifications()).toHaveLength(0);
  });
});
