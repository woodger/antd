import { expect, it } from 'vitest';
import { readSelectComponentsResponsiveSource, readSelectComponentsResponsiveSSR } from '../browser/select-components-responsive-reference';
import { readSelectComponentsResponsiveSSR as readSSRLayout } from '../browser/select-components-responsive-ssr-metrics';
import { decodeSelectSurface } from '../browser/select-surface-receipts';
it('retains complete Source caller/context ledgers without forwarding owner widths across all14 points', () => {
  const source = readSelectComponentsResponsiveSource(); let points = 0;
  for (const owner of source.cases) {
    for (const point of [owner.initial, ...owner.steps]) {
      points++; const props = decodeSelectSurface(point.owner.authoredProps) as Record<string, unknown>;
      expect(Object.hasOwn(props, 'containerWidth')).toBe(false); expect(Object.hasOwn(props, 'adornmentWidth')).toBe(false);
      expect(props.maxTagCount).toBe('responsive'); expect(point.overflow.rootHasSamePublicEditor).toBe(true);
      expect(point.overflow.suffixContainsEditor).toBe(true); expect(point.overflow.editorIsDirectSuffixChild).toBe(true);
    }
    for (const call of owner.producerCalls.filter(call => call.kind === 'components.input')) {
      const { props } = decodeSelectSurface(call.argument) as { props: Record<string, unknown> };
      expect(Object.hasOwn(props, 'containerWidth')).toBe(false); expect(Object.hasOwn(props, 'adornmentWidth')).toBe(false);
      expect(call.rawArgument).toBeTruthy(); expect(call.rawResult).toBeTruthy();
    }
  }
  expect(points).toBe(14);
});
it('records the full responsive Fragment footprint independently of the4px editor', () => {
  const source = readSelectComponentsResponsiveSource(), owner = source.cases[1];
  expect(owner.initial.overflow.editor?.box.width).toBe(4); expect(owner.initial.overflow.suffix?.box.width).toBe(40);
  expect(owner.steps[1].action).toEqual({ type: 'props', set: { adornmentWidth: 76 } });
  expect(owner.steps[1].overflow.editor?.box.width).toBe(4); expect(owner.steps[1].overflow.suffix?.box.width).toBe(80);
  expect(owner.steps[2].overflow.suffix?.box).toEqual({ x: 304, y: 230, width: 182, height: 42.25 });
  expect(owner.steps[2].overflow.content?.box.height).toBe(70.25);
  expect(owner.initial.overflow.suffix?.childNodes).toEqual([{ type: 1, tag: 'INPUT', text: null }, { type: 1, tag: 'SPAN', text: null }]);
  const initial = owner.initial.overflow.rests[0], restored = owner.steps.at(-1)!.overflow.rests[0];
  expect(initial.attributes.map(([key]) => key)).toEqual(['class', 'aria-hidden', 'style']);
  expect(restored.attributes.map(([key]) => key)).toEqual(['class', 'style', 'aria-hidden']);
  expect(initial.inlineProperties.map(item => item.name)).toEqual(['opacity', 'height', 'overflow-y', 'order', 'pointer-events', 'position']);
  expect(restored.inlineProperties.map(item => item.name)).toEqual(['opacity', 'order', 'height', 'overflow-y', 'pointer-events', 'position']);
});
it('retains both complete initial Source SSR rest/suffix trees and zero resources/refs', () => {
  const source = readSelectComponentsResponsiveSSR();
  for (const owner of source.cases) {
    const state = owner.states[0], view = readSSRLayout(state.rawHtml), content = view.contents[0];
    expect(view.contents).toHaveLength(1); expect(content.children).toHaveLength(2);
    const [rest, suffix] = content.children; if (typeof rest === 'string' || typeof suffix === 'string') throw Error('Source SSR wrappers missing');
    expect(rest.attributes).toEqual([['class', 'ant-select-content-item ant-select-content-item-rest'],
      ['style', 'opacity:0;height:0;overflow-y:hidden;order:9007199254740991;pointer-events:none;position:absolute'], ['aria-hidden', 'true']]);
    expect(suffix.attributes).toEqual([['class', 'ant-select-content-item ant-select-content-item-suffix'], ['style', 'opacity:1;order:0']]);
    expect(state.resources).toEqual({ timers: 0, frames: 0, microtasks: 0, measurements: 0 }); expect(Object.values(state.refs).every(Boolean)).toBe(true);
  }
});
