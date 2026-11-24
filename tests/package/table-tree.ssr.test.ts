import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '@woodger/antd/porting/registry.json';
import TableTreeFixture from '../browser/fixtures/TableTreeFixture.svelte';
import source from '../browser/fixtures/ant-design-table-tree-reference.json';

it('pins the independent repeated tree observations to the supported Ant Design archive', () => {
  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    tableVersion: '1.11.1',
    repeat: 2
  });
  expect(source.cases).toHaveLength(9);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(57);
});

for (const { profile, states } of source.cases) {
  it(`renders the ${profile.id} tree page at SSR with valid expansion controls`, () => {
    vi.useFakeTimers();
    try {
      const { body } = render(TableTreeFixture, { props: { profileId: profile.id } });
      const rows = [...body.matchAll(/<tr\b[^>]* data-row-key="([^"]+)"/g)].map(match => match[1]);
      const expected = states[0].values.rows;

      expect(rows).toEqual(expected.map(row => row.key));
      for (const row of expected) {
        expect(body).toContain(row.rowClass);
      }
      for (const [, targets] of body.matchAll(/aria-controls="(ant-table-row-[^"]+)"/g)) {
        for (const target of targets.split(' ')) {
          expect(body).toContain(`id="${target}"`);
        }
      }
      expect(body).toContain('id="tree-events">[]');
      expect(body).not.toContain('row-expand-icon-cell');
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}
