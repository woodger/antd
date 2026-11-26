import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableSorterTooltipFixture.svelte';
import source from '../browser/fixtures/ant-design-table-sorter-tooltip-reference.json';

it('matches the pinned archive for the independent sorter tooltip states', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(source.cases).toHaveLength(14);
  expect(source.cases.reduce((count, entry) => count + entry.states.length, 0)).toBe(50);
});

it.each(['default', 'disabled', 'icon-target'])(
  'renders the %s sort button without mounting a closed tooltip',
  profileId => {
    const { body } = render(Fixture, { props: { profileId } });

    expect(body.match(/<button\b/g)).toHaveLength(1);
    expect(body).toContain('ant-table-column-sorter');
    expect(body).not.toContain('role="tooltip"');
    const descriptionId = body.match(/<button\b[^>]*aria-describedby="([^"]+)"/)?.[1];
    expect(descriptionId).toBeTruthy();
    expect(body).toContain(
      `<span id="${descriptionId}" role="note" aria-label="Ascending" hidden=""></span>`
    );
  }
);

it('renders the initial controlled hint hidden for hydration', () => {
  const { body } = render(Fixture, { props: { profileId: 'controlled' } });

  expect(body.match(/<button\b/g)).toHaveLength(1);
  expect(body).toContain('role="tooltip" popover="manual" hidden=""');
  expect(body).toContain('Ascending');
  expect(body).toContain('ant-table-column-sorters-tooltip-target-sorter');
});
