import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/ZIndexContextFixture.svelte';
import source from '../browser/fixtures/ant-design-z-index-context-reference.json';

/** Читает число с поверхности SSR, отмечая отсутствие узла отдельно от CSS fallback. */
function inlineLayer(body: string, className: string) {
  const node = body.match(new RegExp(`<[^>]+\\sclass="[^"]*\\b${className}\\b[^"]*"[^>]*>`))?.[0];
  if (node === undefined) {
    return undefined;
  }

  const style = node.match(/\sstyle="([^"]*)"/)?.[1];
  return style?.match(/(?:^|;)\s*z-index:\s*([+-]?\d+)\s*(?:;|$)/)?.[1] ?? null;
}

it('pins the overlay layers to the Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;

  expect(source.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(source.cases).toHaveLength(26);
});

const serverProfiles = new Set(['root', 'root-local-child', 'modal', 'modal-zero', 'drawer-zero']);
for (const { profile, initial } of source.cases.filter(entry => serverProfiles.has(entry.profile.id))) {
  it(`renders inline popup layers for ${profile.id} on the server`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });

    expect(inlineLayer(body, 'zi-child-dropdown')).toBe(initial.dropdown.inline);
    expect(inlineLayer(body, 'zi-child-tooltip')).toBe(initial.tooltip.inline);
    expect(inlineLayer(body, 'zi-child-popover')).toBe(initial.popover.inline);
    expect(inlineLayer(body, 'zi-child-popconfirm')).toBe(initial.popconfirm.inline);
    if (profile.id === 'drawer-zero') {
      expect(inlineLayer(body, 'zi-owner-drawer')).toBe('0');
    }
    else if (initial.modal) {
      expect(inlineLayer(body, 'zi-owner-modal')).toBe(initial.modal.inline);
    }
  });
}
