import { expect, it } from 'vitest';
import {
  comparableSelectComponentCSS,
  verifySelectComponentMetrics
} from '../../browser/select-components-layout-assertions';
import { verifyOwnStyleComputed } from '../../browser/select-components-own-style-init-assertions';

it('compares INPUT layout with both measured forms of native width reporting', () => {
  const source = { offsetWidth: 101, clientWidth: 97, scrollWidth: 102, scrollLeft: 2 };
  const actual = { ...source, clientWidth: 83, scrollWidth: 88 };

  expect(() => verifySelectComponentMetrics(actual, source, 'INPUT', 'layout')).not.toThrow();
  expect(() => verifySelectComponentMetrics(actual, source, 'TEXTAREA', 'layout')).toThrow();
});

it('reports changes in INPUT width, overflow and scroll position', () => {
  const source = { offsetWidth: 101, clientWidth: 97, scrollWidth: 102, scrollLeft: 2 };
  const actual = { ...source, clientWidth: 83, scrollWidth: 88 };

  for (const change of [{ offsetWidth: 102 }, { scrollWidth: 89 }, { scrollLeft: 3 }]) {
    expect(() => verifySelectComponentMetrics(
      { ...actual, ...change },
      source,
      'INPUT',
      'layout'
    )).toThrow(/layout/);
  }
});

it('compares the same flex alignment while retaining the other computed styles', () => {
  const source = { display: 'flex', alignItems: 'flex-start', padding: '7px' };
  const actual = { ...source, alignItems: 'flow-start' };

  expect(comparableSelectComponentCSS(actual)).toEqual(source);
  expect(actual.alignItems).toBe('flow-start');
  expect(comparableSelectComponentCSS({ ...actual, display: 'grid' }).alignItems).toBe('flow-start');
  expect(comparableSelectComponentCSS({ ...actual, alignItems: 'center' }).alignItems).toBe('center');

  const computed = [
    { name: 'align-items', value: 'flex-start', priority: '' },
    { name: 'display', value: 'flex', priority: '' }
  ];
  const differentSpelling = { ...computed[0], value: 'flow-start' };

  expect(() => verifyOwnStyleComputed(
    [differentSpelling, computed[1]],
    computed,
    'alignment'
  )).not.toThrow();
  expect(() => verifyOwnStyleComputed(
    [{ ...differentSpelling, value: 'flow-end' }, computed[1]],
    computed,
    'alignment'
  )).toThrow(/alignment/);
});
