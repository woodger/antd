import { expect, it } from 'vitest';
import { treeSelectMotionName } from './tree-select-motion.engine';

it('resolves the global default independently of the local Select prefix', () => {
  expect(treeSelectMotionName(undefined, undefined, 'local-choice', 'demo')).toBe('demo-slide-up');
  expect(treeSelectMotionName('', undefined, 'local-choice', 'demo')).toBe('demo-slide-up');
});

it('preserves explicit empty names and arbitrary consumer transition names', () => {
  expect(treeSelectMotionName(undefined, '', 'local-choice', 'demo')).toBe('');
  expect(treeSelectMotionName('', '', 'local-choice', 'demo')).toBe('');
  expect(treeSelectMotionName(undefined, 'custom-phase', 'local-choice', 'demo')).toBe('custom-phase');
});

it('gives every truthy animation string precedence using the local dropdown prefix', () => {
  expect(treeSelectMotionName('spin', 'custom-phase', 'local-choice', 'demo'))
    .toBe('local-choice-dropdown-spin');
  expect(treeSelectMotionName(' ', '', 'local-choice', 'demo')).toBe('local-choice-dropdown- ');
});
