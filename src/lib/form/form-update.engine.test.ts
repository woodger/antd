import { describe, expect, it, vi } from 'vitest';
import { acceptsFormItemUpdate, resetsFormItem } from './form-update.engine';

describe('FormItem store update rules', () => {
  it('refreshes a child for a value write to its parent path', () => {
    const values = { user: { name: 'Anna' } };
    const shouldUpdate = vi.fn(() => false);
    const item = { path: ['user', 'name'], shouldUpdate };

    expect(acceptsFormItemUpdate(values, values, {
      type: 'setField', name: 'user', hasValue: true
    }, item)).toBe(true);
    expect(acceptsFormItemUpdate(values, values, {
      type: 'setField', name: 'user', hasValue: false
    }, item)).toBe(false);
    expect(shouldUpdate).not.toHaveBeenCalled();
  });

  it('matches dependency paths without conflating a row index and a string key', () => {
    const values = { rows: [] };
    const item = { dependencies: [['rows', 0, 'name']] };

    expect(acceptsFormItemUpdate(values, values, {
      type: 'dependenciesUpdate', names: [['rows', 0, 'name']]
    }, item)).toBe(true);
    expect(acceptsFormItemUpdate(values, values, {
      type: 'dependenciesUpdate', names: [['rows', '0', 'name']]
    }, item)).toBe(false);
  });

  it('distinguishes an empty reset list from a reset of the unnamed root', () => {
    expect(resetsFormItem({ type: 'reset', names: [] }, [])).toBe(false);
    expect(resetsFormItem({ type: 'reset', names: [[]] }, [])).toBe(true);
    expect(resetsFormItem({ type: 'reset' }, [])).toBe(true);
  });
});
