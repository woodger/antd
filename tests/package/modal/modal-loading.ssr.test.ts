import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import { Modal, type ModalProps } from '@woodger/antd';
import Case from '../../browser/fixtures/ModalLoadingSSRCase.svelte';
import { modalLoadingSamples } from '../../browser/modal-loading-cases.mjs';
import type { ModalLoadingActivity } from '../../browser/modal-loading-metrics.mjs';
for (const sample of modalLoadingSamples) for (const loading of [false, true]) it(`keeps Native closed SSR body/footer producers and browser traps ${sample.id}/loading=${loading}`, () => {
  vi.useFakeTimers();
  const resource = vi.fn(() => {
    throw Error('Modal.loading SSR must stay DOM-free');
  });
  for (const name of ['getComputedStyle', 'requestAnimationFrame', 'queueMicrotask']) {
    vi.stubGlobal(
      name,
      resource
    );
  }
  for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel']) {
    vi.stubGlobal(name, class { constructor() {
      resource();
    } });
  }
  const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
  const timeout = vi.spyOn(globalThis, 'setTimeout'), interval = vi.spyOn(globalThis, 'setInterval');
  try {
    expectTypeOf<ModalProps['loading']>().toEqualTypeOf<boolean | undefined>();
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const activity: ModalLoadingActivity[] = [], rendered = render(
      Case,
      { props: { sample, loading, activity } }
    );
    const head = rendered.head, body = rendered.body;
    expect(typeof head).toBe('string');
    expect(body).toContain('<dialog');
    expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
    expect(body).not.toMatch(/\sloading(?:[\s=>])/);
    expect(body).toContain('Loading panel');
    expect(body).toContain(sample.prefixCls + '-close');
    if (loading) {
      const placeholder = /<div\b(?=[^>]*\bdata-ant-skeleton-main\b)[^>]*>/.exec(body)?.[0];
      expect(placeholder).toBeTruthy();
      expect(placeholder).toContain(sample.prefixCls + '-body-skeleton');
      expect(placeholder).toContain('ant-skeleton-active');
      expect(body.match(/<li\b/g)).toHaveLength(4);
      expect(body).not.toMatch(/class="[^"]*\bant-skeleton-title\b/);
      expect(body).not.toContain('data-ant-modal-footer=');
      expect(body).not.toContain('data-modal-loading-body');
      expect(body).not.toContain('Custom footer action');
      expect(activity).toEqual([]);
    }
    else {
      expect(body).not.toContain('data-ant-skeleton-main');
      expect(body).toContain('data-modal-loading-body');
      expect(body).toContain('value="Body draft"');
      expect(body).toContain('data-ant-modal-footer=');
      expect(activity).toEqual([{ kind: 'body-render' }, ...(sample.footer === 'custom-node' ? [{ kind: 'footer-render' }] : [])]);
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
it('keeps confirmLoading independent from the new body loading prop', () => {
  const body = render(
    Modal,
    { props: { title: 'Confirm loading', confirmLoading: true, loading: false } }
  ).body;

  expect(body).toContain('ant-modal-footer');
  expect(body).toContain('ant-btn-loading');
  expect(body).not.toContain('data-ant-skeleton-main');
});
