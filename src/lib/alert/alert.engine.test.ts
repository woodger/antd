import { describe, expect, it } from 'vitest';
import { resolveAlertClose } from './alert.engine';
import type { AlertConfig, AlertProps } from './alert.types';

describe('resolveAlertClose', () => {
  const cases: [string, AlertProps, AlertConfig | undefined, boolean, unknown][] = [
    ['default', {}, undefined, false, undefined],
    ['local icon', { closable: { closeIcon: 'Local' } }, undefined, true, 'Local'],
    ['explicit false', { closable: false }, { closable: { closeIcon: 'Context' } },
      false, 'Context'],
    ['local icon priority', { closable: { closeIcon: 'Local' } },
      { closable: { closeIcon: 'Context' } }, true, 'Local'],
    ['zero object icon fallback', { closable: { closeIcon: 0 } },
      { closable: { closeIcon: 'Context' } }, true, 'Context'],
    ['false object icon fallback', { closable: { closeIcon: false } },
      { closable: { closeIcon: 'Context' } }, true, 'Context'],
    ['local empty icon overrides context', { closable: { closeIcon: '' } },
      { closable: { closeIcon: 'Context' } }, true, ''],
    ['context object icon', {}, { closable: { closeIcon: 'Object' } }, true, 'Object'],
    ['context empty icon fallback', {}, { closable: { closeIcon: '' } }, true, undefined],
    ['context zero icon fallback', {}, { closable: { closeIcon: 0 } }, true, undefined]
  ];

  it.each(cases)('resolves %s without losing explicit values', (_, props, config, enabled, icon) => {
    const result = resolveAlertClose(props, config);

    expect(result.enabled).toBe(enabled);
    expect(result.icon).toBe(icon);
  });

  it('keeps local callbacks and context ARIA separate', () => {
    const localClose = () => {};
    const afterClose = () => {};
    const props: AlertProps = {
      closable: {
        disabled: true,
        onClose: localClose,
        afterClose,
        role: 'button',
        'aria-describedby': 'close-help',
        'data-owner': 'local'
      }
    };
    const result = resolveAlertClose(props, { closable: { 'aria-label': 'Context close' } });

    expect(result.onClose).toBe(localClose);
    expect(result.afterClose).toBe(afterClose);
    expect(result.disabled).toBe(true);
    expect(result.attributes).toEqual({
      role: 'button',
      'aria-describedby': 'close-help',
      'data-owner': 'local'
    });
  });

  it('resets context ARIA and inherits the icon when the button is explicitly enabled', () => {
    const config: AlertConfig = {
      closable: { closeIcon: 'Context', 'aria-label': 'Context close' }
    };
    const inherited = resolveAlertClose({}, config);
    const reset = resolveAlertClose({ closable: true }, config);

    expect(inherited.attributes).toEqual({ 'aria-label': 'Context close' });
    expect(reset.enabled).toBe(true);
    expect(reset.attributes).toEqual({});
    expect(reset.icon).toBe('Context');
  });
});
