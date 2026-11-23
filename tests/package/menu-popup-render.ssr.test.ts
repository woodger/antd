import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import registry from '@woodger/antd/porting/registry.json';
import MenuPopupRenderFixtures from '../browser/fixtures/MenuPopupRenderFixtures.svelte';
import source from '../browser/fixtures/ant-design-menu-popup-render-reference.json';

describe('Menu popup content in the published SSR package', () => {
  it('pins the two original captures and the replacement keyboard observation', () => {
    expect(source.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js'
    });
    expect(source.capture.repeats).toBe(2);
    expect(source.cases).toHaveLength(8);
    expect(source.navigation.map(entry => entry.errors.length)).toEqual([3, 0]);
  });

  it('defers closed custom content and keeps the real inline tree', () => {
    const closed = render(MenuPopupRenderFixtures, { props: { kind: 'vertical-initial' } }).body;
    const inline = render(MenuPopupRenderFixtures, {
      props: { kind: 'inline', initiallyOpen: true }
    }).body;

    expect(closed).not.toContain('data-menu-render-path=');
    expect(closed).not.toContain('popover="manual"');
    expect(inline).toMatch(/class="[^"]*\bant-menu-sub ant-menu-inline\b/);
    expect(inline.replace(/<!--[\s\S]*?-->/g, '')).toContain('>Leaf</span>');
    expect(inline).not.toContain('data-menu-render-path=');
  });

  it('renders a reordered popup and its controls target without accessing the DOM', () => {
    const { body } = render(MenuPopupRenderFixtures, {
      props: { kind: 'replace-origin', initiallyOpen: true }
    });

    expect(body).toContain('data-menu-render-owner="branch"');
    expect(body).toContain('data-menu-render-path="branch/inner"');
    expect(body).toContain('popover="manual" hidden');
    expect(body.replace(/<!--[\s\S]*?-->/g, '')).toMatch(/>Inner<\/span>[\s\S]*>Child<\/span>/);
    const targetId = body.match(/aria-controls="([^"]+-branch-popup-content)"/)?.[1];
    expect(targetId).toBeDefined();
    expect(body).toContain(`id="${targetId}"`);
    expect(body).not.toMatch(/\bpopuprender=/i);
  });
});
