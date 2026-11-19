import { expect, it } from 'vitest';
import { readModalLoadingSourceCSR, readModalLoadingSourceCase } from '../browser/modal-loading-reference';

it('loads the complete independently byte-equal Modal.loading Source capture with unmeasured resource counters', () => {
  const source = readModalLoadingSourceCSR();

  expect(source.reference.protocolSha256).toBe('4d3e2a1fbfbc4e13a11fecc5d4157701dd692c96e6db0b0c7864a9f475af4ee7');
  expect(source.cases.map(entry => entry.id)).toEqual(['default-footer', 'custom-footer-local-prefix']);
  expect(source.cases.flatMap(entry => entry.steps)).toHaveLength(10);
  for (const entry of source.cases) {
    expect(entry.initial.owner.rawProps).toBeTruthy();
    expect(entry.beforeUnmount.owner.rawEvents).toHaveLength(2);
    expect(entry.cleanup.browserOwnedResourceCounters).toEqual({
      measured: false,
      observers: null,
      mutations: null,
      frames: null,
      timers: null,
      ports: null
    });
    expect(entry.cleanup).toEqual(entry.late);
    expect(entry.cleanup.owner.alive).toBe(false);
    expect(Object.values(entry.cleanup.refs).every(Boolean)).toBe(true);
    expect(entry.cleanup.retained.every(node => !node.connected)).toBe(true);
    expect([entry.cleanup.ownerCount, entry.cleanup.dialogCount]).toEqual([0, 0]);
  }
});

it('preserves loading body/footer replacement, physical four-row Skeleton, stable chrome and cancel ordering', () => {
  for (const entry of readModalLoadingSourceCSR().cases) {
    const [filled, loading, restored, reloading, closed] = entry.steps.map(step => step.actual);
    expect(entry.initial.nodes.editor?.value).toBe('Body draft');
    expect(filled.nodes.editor?.value).toBe('Edited body draft');
    expect(restored.nodes.editor?.value).toBe('Body draft');
    expect(restored.nodes.editor?.identity).not.toBe(entry.initial.nodes.editor?.identity);
    expect(restored.nodes.authoredBody?.identity).not.toBe(entry.initial.nodes.authoredBody?.identity);
    expect(restored.nodes.footer?.identity).not.toBe(entry.initial.nodes.footer?.identity);
    for (const point of [entry.initial, ...entry.steps.map(step => step.actual)]) {
      for (const role of ['dialog', 'header', 'title', 'close', 'body'] as const) expect(point.initialIdentity[role]).toBe(true);
    }
    for (const [point, previous] of [[loading, filled], [reloading, restored]] as const) {
      expect(point.owner.activity).toEqual(previous.owner.activity);
      expect([point.nodes.authoredBody, point.nodes.editor, point.nodes.footer, point.nodes.authoredFooter]).toEqual([null, null, null, null]);
      expect(point.nodes.skeleton?.attributes).toEqual([['class', 'ant-skeleton ant-skeleton-active ' + entry.sample.prefixCls + '-body-skeleton css-dev-only-do-not-override-1y106cm css-var-r0']]);
      expect(point.nodes.skeleton?.name).toBe('DIV');
      expect(point.nodes.skeleton?.box).toEqual({ x: 404, y: 160, width: 472, height: 140 });
      expect(point.nodes.skeletonTitle).toBeNull();
      expect(point.skeletonRows.map(node => node.name)).toEqual(['LI', 'LI', 'LI', 'LI']);
      const css = Object.fromEntries(point.nodes.skeleton!.computed!);
      expect([css.display, css.width, css.height, css['justify-content'], css['align-items'], css['margin-top'], css['margin-bottom']])
        .toEqual(['flex', '472px', '140px', 'center', 'center', '16px', '16px']);
    }
    const count = (slot: string, event: string) => entry.cleanup.owner.lifecycle.filter(row => row.slot === slot && row.event === event).length;
    for (const event of ['mount', 'unmount', 'attach', 'detach']) expect(count('body', event)).toBe(2);
    for (const event of ['mount', 'unmount', 'attach', 'detach']) expect(count('footer', event)).toBe(entry.sample.footer === 'custom-node' ? 2 : 0);
    expect(closed.owner.open).toBe(false);
    expect(closed.owner.loading).toBe(true);
    expect(closed.nodes.skeleton?.identity).toBe(reloading.nodes.skeleton?.identity);
    expect(closed.owner.events).toEqual(['cancel', 'after-close'].map(value => ({
      $: 'array',
      properties: [{ key: '0', value }, { key: 'length', value: 1 }]
    })));
  }
});

it('rejects an unmeasured Modal.loading sample', () => {
  expect(() => readModalLoadingSourceCase('unmeasured')).toThrow('Unknown measured Modal.loading case');
});
