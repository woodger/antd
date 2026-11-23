import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '@woodger/antd/porting/registry.json';
import MenuHoverFixtures from '../browser/fixtures/MenuHoverFixtures.svelte';
import hover from '../browser/fixtures/ant-design-menu-hover-reference.json';
import portals from '../browser/fixtures/ant-design-menu-hover-portal-reference.json';
import horizontal from '../browser/fixtures/ant-design-menu-hover-horizontal-reference.json';
import ssr from '../browser/fixtures/ant-design-menu-item-ssr-reference.json';

it('pins the independent Menu row observations to the official bundle', () => {
  for (const source of [hover, portals, horizontal, ssr]) {
    expect(source).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256
    });
  }
  expect(hover.passes[1]).toEqual(hover.passes[0]);
  expect(portals.passes[1]).toEqual(portals.passes[0]);
  expect(horizontal.passes[1]).toEqual(horizontal.passes[0]);
  expect(hover.passes[0]).toHaveLength(6);
  expect(portals.passes[0]).toHaveLength(5);
  expect(horizontal.passes[0].map(sample => sample.inPopup)).toEqual([false, true]);
});

for (const [id, providerDirection, requestedDirection] of [
  ['rtl-local-in-ltr-provider', 'ltr', 'rtl'],
  ['ltr-local-in-rtl-provider', 'rtl', 'ltr'],
  ['rtl-provider', 'rtl', undefined]
] as const) {
  it(`exposes row data and provider direction during SSR for ${id}`, () => {
    const source = ssr.results.find(value => value.id === id);
    if (!source) throw new Error(`Missing official Menu SSR capture ${id}`);

    const { body } = render(MenuHoverFixtures, { props: { providerDirection, requestedDirection } });
    const side = providerDirection === 'rtl' ? 'right' : 'left';

    expect(source.events).toEqual([]);
    expect(source.html).toContain(`dir="${providerDirection}"`);
    expect(source.html).toContain('data-item-token="kept"');
    expect(source.html).toContain('rootClassName="sub-menu-branch-token"');
    expect(body).toContain(`dir="${providerDirection}"`);
    expect(body).toContain(`padding-${side}:24px`);
    expect(body).toContain(`padding-${side}:48px`);
    expect(body).toContain('data-item-token="kept"');
    expect(body).toContain('data-extra-flag="false"');
    expect(body).not.toMatch(/\s(?:direction|rootClassName|customPayload|on(?:title)?mouse\w+)=/i);
  });
}
