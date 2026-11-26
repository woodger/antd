import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import DropdownAppearanceFixtures from '../browser/fixtures/DropdownAppearanceFixtures.svelte';
import appearance from '../browser/fixtures/ant-design-dropdown-appearance-reference.json';
import providers from '../browser/fixtures/ant-design-dropdown-provider-reference.json';

it('pins repeated provider and trigger captures to the official npm package', () => {
  for (const [capture, count] of [[appearance, 6], [providers, 5]] as const) {
    expect(capture.version).toBe(registry.upstream.version);
    expect(capture.revision).toBe(registry.upstream.revision);
    expect(capture.archiveSha256).toBe(registry.upstream.archiveSha256);
    expect(capture.passes).toHaveLength(2);
    expect(capture.passes[0]).toHaveLength(count);
    expect(capture.passes[0]).toEqual(capture.passes[1]);
  }
});

it('renders inherited popup styles without a client ref and preserves whole-record reset', () => {
  const { body } = render(DropdownAppearanceFixtures, { props: { initial: 'local' } });
  const reset = render(DropdownAppearanceFixtures, { props: { initial: 'reset' } });

  expect(body).toMatch(/class="[^"]*provider-study[^"]*outer-config[^"]*outer-root local-root/);
  expect(body).toMatch(/class="[^"]*outer-item local-item/);
  expect(body).toContain('padding: 7px');
  expect(body).not.toContain('discarded-menu-item');
  expect(body).toMatch(/id="trigger-reference" data-alias="false">none<\/output>/);
  expect(body).toMatch(/id="trigger" type="button" class="owned"/);
  expect(reset.body).toContain('provider-study');
  expect(reset.body).not.toContain('outer-root');
  expect(reset.body).not.toContain('outer-item');
});
