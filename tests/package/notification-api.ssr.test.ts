import {
  NotificationHolder, createNotification, type AppNotificationConfig,
  type NotificationConfig, type NotificationOptions
} from '@woodger/antd';
import registry from '../porting-registry';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import reference from '../browser/fixtures/ant-design-notification-api-reference.json';

it('publishes the contextual API and identifies the measured Source archive', () => {
  expectTypeOf<Parameters<ReturnType<typeof createNotification>['open']>>()
    .toEqualTypeOf<[NotificationConfig]>();
  expectTypeOf<ReturnType<ReturnType<typeof createNotification>['open']>>().toEqualTypeOf<void>();
  expectTypeOf<AppNotificationConfig['getContainer']>()
    .toEqualTypeOf<NotificationOptions['getContainer']>();
  expectTypeOf<AppNotificationConfig['showProgress']>()
    .toEqualTypeOf<NotificationOptions['showProgress']>();
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  expect(reference.cases).toHaveLength(8);
});

it('renders request-owned contents and progress shells without DOM getters or timers', () => {
  const getContainer = vi.fn(() => null);
  const onAllRemoved = vi.fn();
  const onClose = vi.fn();
  const notification = createNotification({ showProgress: true, getContainer, onAllRemoved });
  notification.info({
    title: 0, duration: 2, onClose,
    props: { id: 'timed-root', 'data-profile': 'timed', 'aria-label': 'Timed' },
    classNames: { progress: 'notice-clock' }, styles: { progress: '--hint:timed' }
  });
  notification.open({ title: 'Persistent', duration: false });
  const another = createNotification();
  another.info({ title: 'Separate request' });

  vi.useFakeTimers();
  try {
    const { body } = render(NotificationHolder, { props: { notification } });

    expect(body).toMatch(/data-ant-notification-notice-title[^>]*>.*0.*<\/div>/);
    expect(body).toContain('id="timed-root"');
    expect(body).toContain('data-profile="timed"');
    expect(body).toContain('aria-label="Timed"');
    expect(body.match(/<progress\b/g)).toHaveLength(1);
    expect(body).toContain('notice-clock');
    expect(body).toContain('--hint:timed');
    expect(body).toContain('Persistent');
    expect(body).not.toContain('Separate request');
    expect(body).not.toContain('popover-open');
    expect(getContainer).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(onAllRemoved).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  }
  finally {
    vi.useRealTimers();
  }
});
