import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ThemeZeroRuntimeScope from '../../browser/fixtures/ThemeZeroRuntimeScope.svelte';
import registry from '../../porting-registry';
import reference from '../../reference/ant-design-theme-zero-runtime-observation.json';

describe('ConfigProvider zero-runtime styles in SSR', () => {
  it('pins the style and geometry measurements to the same upstream package', () => {
    expect(reference.reference).toMatchObject({
      revision: registry.upstream.revision,
      version: registry.upstream.version,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js',
      stylesheet: 'package/dist/antd.css'
    });
  });

  it('retains class prefixes, token declarations, and nonce with generated sheets suppressed', () => {
    const custom = render(ThemeZeroRuntimeScope, { props: { scenario: 'custom' } });
    const runtime = render(ThemeZeroRuntimeScope, { props: {
      scenario: 'custom', initialZeroRuntime: false
    } });

    expect(custom.head).toContain('data-ant-svelte-theme="zero-outer"');
    expect(custom.head).toContain('nonce="zero-runtime-nonce"');
    expect(custom.head).toContain('--suite-color-primary:var(--ant-svelte-theme-base-suite-color-primary)');
    expect(custom.head).not.toContain('button-prefix:suite-btn');
    expect(custom.head).not.toContain('input-prefix:suite-input');
    expect(runtime.head).toContain('button-prefix:suite-btn');
    expect(runtime.head).toContain('input-prefix:suite-input');
    expect(custom.body).toContain('data-ant-button-prefix="suite-btn"');
    expect(custom.body).toContain('data-ant-input-prefix="suite-input"');
    expect(custom.body).toContain('--suite-color-primary:#ab321f');
    expect(custom.body).toContain('--suite-button-content-font-size:21px');
  });

  it('inherits the flag through inherit=false and accepts an explicit false override', () => {
    const inherited = render(ThemeZeroRuntimeScope, { props: { scenario: 'nested' } });
    const enabled = render(ThemeZeroRuntimeScope, { props: {
      scenario: 'nested', overrideNested: true
    } });

    expect(inherited.head).toContain('data-ant-svelte-theme="zero-inner"');
    expect(inherited.head).not.toContain('button-prefix:inner-btn');
    expect(inherited.head).not.toContain('input-prefix:inner-input');
    expect(enabled.head).toContain('button-prefix:inner-btn');
    expect(enabled.head).toContain('input-prefix:inner-input');
    expect(inherited.body).toContain('data-ant-button-prefix="inner-btn"');
  });

  it('uses packaged media rules while keeping Modal width variables on its element', () => {
    const { body, head } = render(ThemeZeroRuntimeScope, { props: { scenario: 'layout' } });

    expect(head).not.toContain('ant-grid-media-');
    expect(head).not.toContain('antd-modal-layout-');
    expect(body).not.toContain('ant-grid-custom-media');
    expect(body).toContain('ant-col-md-12');
    expect(body).toContain('data-ant-modal-layout="static"');
    expect(body).toContain('--ant-modal-md-width:438px');
    expect(body).toContain('--ant-svelte-modal-width-md:var(--ant-modal-md-width)');
  });

  it('registers shared Grid media CSS when a nested provider enables runtime styles', () => {
    const { body, head } = render(ThemeZeroRuntimeScope, { props: {
      scenario: 'layout', overrideNested: true
    } });

    expect(head).toContain('@media (min-width: 960px)');
    expect(head).not.toContain('antd-modal-layout-');
    expect(body).toMatch(/id="zero-nested-grid-col"[^>]*ant-grid-custom-media/);
    expect(body).not.toMatch(/id="zero-grid-col"[^>]*ant-grid-custom-media/);
  });
});
