import { App, type AppInstance } from '@woodger/antd';
import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, expectTypeOf, it } from 'vitest';
import Fixture from '../browser/fixtures/AppCustomRootFixture.svelte';

describe('App custom root public package', () => {
  it('renders the root with its own props and the App context on the server', () => {
    expectTypeOf<ComponentProps<typeof App<{ label: string; }>>>()
      .toHaveProperty('label').toEqualTypeOf<string>();
    expectTypeOf<ReturnType<typeof App.useApp>>().toEqualTypeOf<AppInstance>();
    const { body } = render(Fixture);

    expect(body).toMatch(/<main[^>]*id="custom-root"/);
    expect(body).toContain('aria-label="Custom App"');
    expect(body).toContain('data-root-owner="app"');
    expect(body).toContain('data-root-api="message,modal,notification"');
    expect(body).toContain('context-app local-app root-class custom-shell');
    expect(body).toContain('padding-top:5px;color:#abcdef;padding-top:7px');
    expect(body).toContain('ant-message-anchor');
    expect(body).toContain('ant-notification-anchor');
    expect(body).not.toContain('nativeelement=');
  });
});
