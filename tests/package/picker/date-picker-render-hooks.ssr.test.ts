import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import Case from '../../browser/fixtures/DatePickerRenderHooksCase.svelte';
import type { RenderHooksCapture, RenderHooksOwner } from '../../browser/date-picker-render-hooks-native';

const profiles: Array<{ owner: RenderHooksOwner; values: string[] }> = [
  { owner: 'single-date', values: ['2024-06-13'] },
  { owner: 'single-datetime', values: ['2024-06-13 06:30:20.500 PM'] },
  { owner: 'range-date', values: ['2024-06-13', '2024-06-16'] },
  { owner: 'range-datetime', values: ['2024-06-13 06:15:20.500 AM', '2024-06-16 06:30:40.000 PM'] }
];

for (const { owner, values } of profiles) for (const initiallyOpen of [false, true]) {
  it(`keeps enabled render hooks SSR browser-free ${owner}/open=${initiallyOpen}`, () => {
    vi.useFakeTimers();
    const resource = vi.fn(() => {
      throw Error('DatePicker render hooks SSR must remain DOM-free');
    });
    for (const name of ['getComputedStyle', 'requestAnimationFrame', 'queueMicrotask'])
      vi.stubGlobal(name, resource);
    for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel'])
      vi.stubGlobal(name, class { constructor() { resource(); } });
    const timeout = vi.spyOn(globalThis, 'setTimeout'), interval = vi.spyOn(
      globalThis,
      'setInterval'
    );
    const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
    try {
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');
      const capture: RenderHooksCapture = {};
      const { head, body } = render(Case, {
        props: { owner, capture, initiallyOpen, hooksEnabled: true }
      });
      expect(typeof head).toBe('string');
      expect(capture.read).toBeTypeOf('function');
      const actual = capture.read!();
      expect(actual).toMatchObject({ owner, open: initiallyOpen, enabled: true, events: [] });
      const inputs = body.match(/<input\b[^>]*\bid="hook-field[^>]*>/g) ?? [];
      expect(inputs).toHaveLength(values.length);
      for (const [index, value] of values.entries()) {
        const id = values.length === 1 ? 'hook-field' : index ? 'hook-field-end' : 'hook-field-start';
        expect(inputs[index]).toContain(`id="${id}"`);
        expect(inputs[index]).toContain(`value="${value}"`);
        expect(inputs[index]).toContain(`aria-expanded="${initiallyOpen && index === 0}"`);
        expect(inputs[index]).not.toMatch(/\s(?:cellRender|panelRender|renderExtraFooter)(?:=|\s|>)/i);
      }
      if (initiallyOpen) {
        expect(body).toMatch(/<div\b[^>]*\bdata-picker-popup\b[^>]*\bhidden(?:[\s=>])/);
        expect(body).toContain('data-hook-panel="wrap"');
        expect(body).toContain('data-hook-cell="wrap"');
        expect(body).toContain('data-hook-footer-mode="date"');
        expect(actual.panels).toBeGreaterThan(0);
        expect(actual.cells.length).toBeGreaterThan(0);
        expect(actual.cells.some(cell => cell.type === 'time')).toBe(owner.endsWith('datetime'));
        expect(actual.footers.length).toBeGreaterThan(0);
        expect(actual.footers.every(mode => mode === 'date')).toBe(true);
      }
      else {
        expect(body).not.toContain('data-picker-popup');
        expect(body).not.toMatch(/data-hook-(?:cell|panel|footer)/);
        expect(actual.panels).toBe(0);
        expect(actual.cells).toEqual([]);
        expect(actual.footers).toEqual([]);
      }
      expect(resource).not.toHaveBeenCalled();
      expect(timeout).not.toHaveBeenCalled();
      expect(interval).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      timeout.mockRestore();
      interval.mockRestore();
      warn.mockRestore();
      error.mockRestore();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
}
