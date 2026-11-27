import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '../../porting-registry';
import TableVirtualFixture from '../../browser/fixtures/TableVirtualFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-virtual-reference.json';

it('pins the two independent virtual Table runs to the supported Ant Design archive', () => {
  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    tableVersion: '1.11.1',
    repeat: 2
  });
  expect(source.cases).toHaveLength(10);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(44);
});

for (const id of ['fixed', 'defaults', 'tree', 'short', 'empty']) {
  it(`renders a semantic ${id} Table without any browser measurements or timers`, () => {
    const profile = source.cases.find(({ profile }) => profile.id === id);
    if (!profile) {
      throw new Error(`Missing source profile ${id}`);
    }

    vi.useFakeTimers();
    try {
      const { body } = render(TableVirtualFixture, { props: { profileId: id, captioned: true } });
      const rows = Array.from(body.matchAll(/<tr\b[^>]* data-row-key="([^"]+)"/g), match => match[1]);
      const expected = profile.states[0].state;

      expect(rows).toEqual(expected.rows.map(row => row.key));
      expect(body).toMatch(/<caption\b[^>]*>Virtual table<\/caption>/);
      expect(body).toContain('<thead');
      expect(body.includes('data-ant-table-virtual="true"')).toBe(expected.virtual);
      expect(body.includes('ant-table-placeholder')).toBe(expected.empty);
      if (id === 'fixed') {
        expect(body).toContain('aria-rowcount="81"');
        expect(body).toMatch(/<tr[^>]+aria-hidden="true"[^>]*><td[^>]+height:\s*2886px/);
      }
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}
