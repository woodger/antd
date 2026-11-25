import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/TableElementComponentsFixture.svelte';
import source from '../browser/fixtures/ant-design-table-element-components-reference.json';

it('pins the element override observations to the current Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(8);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(19);
});

for (const { profile, ssr } of source.cases) {
  it(`renders the corresponding element overrides for ${profile.id}`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const elements = [...body.matchAll(/<([a-z]+)\b[^>]*data-probe-slot="([^"]+)"/g)]
      .map(([, tag, slot]) => [slot, tag]);
    const expected = ssr.nodes.map(({ slot, tag, scope }) => [
      slot,
      tag === 'div' ? slot === 'body.wrapper' ? 'tbody' : slot === 'body.row' ? 'tr'
        : scope ? 'th' : 'td' : tag
    ]);

    expect(elements).toEqual(expected);
    expect(body).toContain('data-table-element-events');
    if (profile.count) {
      expect(body).toMatch(/data-row-key="0"[^>]*data-probe-slot="body.row"/);
      expect(body).toMatch(/data-probe-data="value-0"[^>]*data-probe-slot="body.cell"/);
    }
  });
}
