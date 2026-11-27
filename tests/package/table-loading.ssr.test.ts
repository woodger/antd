import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableLoadingFixture.svelte';
import source from '../browser/fixtures/ant-design-table-loading-reference.json';

/** Returns cell text without hydration markers or the nonbreaking space. */
function emptyText(body: string) {
  const match = body.match(/<tr\b[^>]*ant-table-placeholder[^>]*>([\s\S]*?)<\/tr>/);
  return match ? match[1].replace(/<!--[\s\S]*?-->|<[^>]*>|&nbsp;/g, '').trim() : null;
}

it('pins the loading observations to the current upstream release', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(source.cases).toHaveLength(14);
});

for (const { profile, server } of source.cases) {
  it(`renders Table loading ${profile.id} without scheduling timers`, () => {
    vi.useFakeTimers();
    try {
      const { body } = render(Fixture, { props: { profileId: profile.id } });
      const prefix = typeof profile.loading === 'object' ? profile.loading.prefixCls ?? 'ant-spin'
        : 'ant-spin';
      const simpleLoading = profile.loading === true;
      const requested = typeof profile.loading === 'object' ? profile.loading.spinning ?? true
        : simpleLoading;
      const content = body.match(/<div\b[^>]*data-ant-spin-part="container"[^>]*>/)?.[0];

      expect(body.includes(`${prefix}-spinning`)).toBe(server.spinning);
      expect(body.includes(`${prefix}-fullscreen`)).toBe(server.fullscreen);
      expect(body.includes('data-ant-spin-part="section"')).toBe(server.section && !simpleLoading);
      expect(body.includes('role="status"')).toBe(server.spinning);
      expect(body.includes('aria-busy="true"')).toBe(requested);
      expect(content).toBeDefined();
      expect(content?.includes(' inert=""')).toBe(requested && !simpleLoading);
      expect(emptyText(body)).toBe(simpleLoading ? '' : server.empty);
      if (server.description) expect(body).toContain(server.description);
      if (server.customIndicator) expect(body).toContain(server.customIndicator);
      for (const className of server.semantic) expect(body).toContain(className);
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}
