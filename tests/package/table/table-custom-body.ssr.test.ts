import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/TableCustomBodyFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-custom-body-reference.json';
import wideGutter from '../../browser/fixtures/ant-design-table-custom-body-gutter-reference.json';

it('pins both scrollbar captures to the Ant Design release under test', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  for (const bundle of [source, wideGutter]) {
    expect(bundle.reference).toMatchObject({
      version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
    });
  }
  expect(source.cases).toHaveLength(10);
  expect(source.cases.reduce((sum, sample) => sum + sample.states.length, 0)).toBe(34);
  expect(wideGutter.cases[0].states).toHaveLength(2);
});

for (const { profile, ssr } of source.cases) {
  it(`renders the initial Table body for ${profile.id} without DOM registration`, () => {
    vi.useFakeTimers();
    try {
      const { body } = render(Fixture, { props: { profileId: profile.id } });
      const keys = Array.from(body.matchAll(/\bdata-row-key="([^"]+)"/g), ([, key]) => key);

      expect(body.includes('data-probe-body')).toBe(ssr.custom);
      expect(body.includes('ant-table-placeholder')).toBe(ssr.empty);
      expect(keys).toEqual(ssr.keys);
      if (ssr.custom) {
        expect(body).toContain('data-scrollbar="0"');
      }
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}
