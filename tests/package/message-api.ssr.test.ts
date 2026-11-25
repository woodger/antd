import {
  MessageHolder, createMessage, type AppMessageConfig, type MessageConfig,
  type MessageHandle, type MessageHolderProps, type MessageOptions
} from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import reference from '../browser/fixtures/ant-design-message-api-reference.json';

it('exports context Message options and verifies which upstream archive was measured', () => {
  expectTypeOf<Parameters<typeof createMessage>>().toEqualTypeOf<[initial?: MessageOptions]>();
  expectTypeOf<Parameters<ReturnType<typeof createMessage>['open']>>()
    .toEqualTypeOf<[MessageConfig]>();
  expectTypeOf<ReturnType<ReturnType<typeof createMessage>['open']>>().toEqualTypeOf<MessageHandle>();
  expectTypeOf<MessageHolderProps['getContainer']>().toEqualTypeOf<MessageOptions['getContainer']>();
  expectTypeOf<AppMessageConfig['stack']>().toEqualTypeOf<MessageOptions['stack']>();

  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  expect(reference.cases).toHaveLength(11);
});

it('keeps Message request-local in SSR and skips browser callbacks and timers', () => {
  const getContainer = vi.fn(() => undefined);
  const onClose = vi.fn();
  vi.useFakeTimers();
  try {
    const scoped = createMessage({ getContainer, top: 0, classNames: { list: 'request-message' } });
    const other = createMessage();
    scoped.open({ content: 'Request-only', type: null, onClose });
    other.info('Other request');

    const { body } = render(MessageHolder, { props: { message: scoped } });

    expect(body).toContain('Request-only');
    expect(body).toContain('request-message');
    expect(body).toContain('role="status"');
    expect(body).toContain('--notification-top:0px');
    expect(body).not.toContain('Other request');
    expect(body).not.toContain('data-ant-message-wrapper');
    expect(body).not.toContain('data-ant-message-icon');
    expect(getContainer).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  }
  finally {
    vi.useRealTimers();
  }
});
