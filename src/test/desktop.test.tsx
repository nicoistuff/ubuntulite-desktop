import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppContent } from '@/components/desktop/app-content';
import { Window, type DesktopWindow } from '@/components/desktop/window';

describe('Phase 1 desktop applications', () => {
  it('executes the basic terminal commands', () => {
    render(<AppContent app="terminal" />);
    const input = screen.getByLabelText('Terminal command');
    fireEvent.change(input, { target: { value: 'echo hello' } });
    const form = input.closest('form');
    if (!form) throw new Error('Terminal form is missing');
    fireEvent.submit(form);
    expect(screen.getByText('hello', { exact: true })).toBeInTheDocument();
  });
  it('keeps document contents mounted while a window is minimized', () => {
    const win: DesktopWindow = { id: 1, app: 'editor', title: 'Text Editor', x: 80, y: 80, width: 600, height: 400, z: 1, minimized: false, maximized: false };
    const props = { active: true, update: () => {}, focus: () => {}, close: () => {} };
    const view = render(<Window win={win} {...props}><AppContent app="editor" /></Window>);
    fireEvent.change(screen.getByLabelText('Document text'), { target: { value: 'Keep this text' } });
    view.rerender(<Window win={{ ...win, minimized: true }} {...props}><AppContent app="editor" /></Window>);
    expect(screen.getByLabelText('Document text')).toHaveValue('Keep this text');
    view.rerender(<Window win={win} {...props}><AppContent app="editor" /></Window>);
    expect(screen.getByLabelText('Document text')).toHaveValue('Keep this text');
  });
});