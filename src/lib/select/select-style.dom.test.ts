import { describe, expect, it } from 'vitest';
import { copySelectStyle, createSelectStyleWriter } from './select-style.dom';
import { resolveSelectStyleFrame, selectStyleName } from './select-style.engine';

function styleTarget(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const priorities = new Map<string, string>();
  const writes: { property: string; value: string; priority?: string }[] = [];
  const target = new Proxy({
    setProperty(property: string, value: string | null, priority = '') {
      writes.push({ property, value: value ?? '', priority });
      values.set(property, value ?? '');
      priorities.set(property, priority);
    },
    getPropertyValue(property: string) { return values.get(property) ?? ''; },
    getPropertyPriority(property: string) { return priorities.get(property) ?? ''; },
    removeProperty(property: string) {
      const previous = values.get(property) ?? '';
      values.delete(property);
      priorities.delete(property);
      return previous;
    },
    *[Symbol.iterator]() { yield* values.keys(); }
  }, {
    set(_, property, value: string) {
      const name = String(property);
      writes.push({ property: name, value });
      values.set(selectStyleName(name), value);
      priorities.set(selectStyleName(name), '');
      return true;
    }
  });
  return { target, writes, values };
}

describe('createSelectStyleWriter', () => {
  it('keeps measured Source width when the unchanged logical author width was cleared by query measurement', () => {
    const frame = (width: number | undefined, measured: number) => resolveSelectStyleFrame(
      { width }, [], [[['--select-input-width', String(measured)]]]);
    const { target, writes, values } = styleTarget();
    const writer = createSelectStyleWriter(target, frame(20, 45));
    Reflect.set(target, 'width', '');
    writes.length = 0;

    writer.update(frame(20, 45));

    expect(writes).toEqual([]);
    writer.update(frame(undefined, 45));
    writer.update(frame(20, 45));

    expect(values.get('width')).toBe('20px');
    Reflect.set(target, 'width', '');
    writes.length = 0;
    writer.update(frame(20, 67));

    expect(writes).toEqual([{ property: '--select-input-width', value: '67', priority: '' }]);
    expect(values.get('width')).toBe('');
  });
  it('initializes fresh CSR by ordered setters and leaves hydration seeding untouched', () => {
    const initial = resolveSelectStyleFrame({ borderColor: 'red', border: '1px solid black' });
    const fresh = styleTarget();
    const writer = createSelectStyleWriter(fresh.target, initial);
    writer.initialize();
    const hydrated = styleTarget();
    createSelectStyleWriter(hydrated.target, initial).update(initial);

    expect(fresh.writes).toEqual([{ property: 'borderColor', value: '' }, {
      property: 'border',
      value: ''
    },
      { property: 'borderColor', value: 'red' }, { property: 'border', value: '1px solid black' }]);
    expect(hydrated.writes).toEqual([]);
  });
  it('reconciles controller coordinates without replaying an unchanged owner shorthand', () => {
    const style = { borderColor: 'red', border: '1px solid black' };
    const initial = resolveSelectStyleFrame(style, [[['left', '3px']]]);
    const { target, writes } = styleTarget({
      left: '99px',
      'border-color': 'black',
      border: '1px solid black'
    });
    const writer = createSelectStyleWriter(target, initial);

    writer.update(
      resolveSelectStyleFrame({ ...style, borderColor: 'green' }, [[['left', '3px']]]),
      true
    );

    expect(writes).toEqual([{ property: 'borderColor', value: 'green' }, {
      property: 'left',
      value: '3px'
    }]);
  });
  it('carries raw logical history to another target after a conditional popup remount', () => {
    const border = '1px solid black';
    const first = styleTarget();
    const writer = createSelectStyleWriter(
      first.target,
      resolveSelectStyleFrame({ borderColor: 'red', border })
    );
    writer.update(resolveSelectStyleFrame({ borderColor: 'green', border }));
    const detached = styleTarget();
    writer.target(detached.target);
    writer.update(resolveSelectStyleFrame({ borderColor: undefined, border }));
    writer.update(resolveSelectStyleFrame({ borderColor: 'red', border }));
    const reopened = styleTarget({ 'border-color': 'red', border });
    writer.target(reopened.target);
    writer.update(resolveSelectStyleFrame({ borderColor: 'red', border }), true);

    expect(first.writes).toEqual([{ property: 'borderColor', value: 'green' }]);
    expect(detached.writes).toEqual([{ property: 'borderColor', value: '' }, {
      property: 'borderColor',
      value: 'red'
    }]);
    expect(reopened.writes).toEqual([]);
  });
  it('lets explicit own undefined clear framework width and does not reinstate it during reconciliation', () => {
    const initial = resolveSelectStyleFrame(undefined, [[['width', '37px']]]);
    const { target, writes, values } = styleTarget({ width: '37px' });
    const writer = createSelectStyleWriter(target, initial);
    const authored = resolveSelectStyleFrame({ width: undefined }, [[['width', '37px']]]);

    writer.update(authored, true);
    values.set('width', '');
    writer.update(authored, true);

    expect(writes).toEqual([{ property: 'width', value: '' }]);
  });
});

describe('copySelectStyle', () => {
  it('copies accepted declaration order without replaying logical shorthands or changing unrelated properties', () => {
    const accepted = styleTarget({
      'border-top-color': 'red',
      'border-top-width': '1px',
      'border-top-style': 'solid'
    });
    const recreated = styleTarget({
      'border-top-width': '1px',
      'border-top-style': 'solid',
      'border-top-color': 'red',
      '--external': 'kept'
    });

    copySelectStyle(
      accepted.target,
      recreated.target,
      { borderColor: 'red', border: '1px solid black' }
    );

    expect([...recreated.target]).toEqual(['--external', 'border-top-color', 'border-top-width', 'border-top-style']);
    expect(recreated.writes).toEqual([
      { property: 'border-top-color', value: 'red', priority: '' },
      { property: 'border-top-width', value: '1px', priority: '' },
      { property: 'border-top-style', value: 'solid', priority: '' }
    ]);
  });
});
