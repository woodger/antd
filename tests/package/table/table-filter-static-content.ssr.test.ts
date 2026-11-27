import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/TableFilterStaticContentFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-filter-static-content-reference.json';

/** Captures the server icon and row keys while Dropdown is closed. */
function snapshot(body: string) {
  const button = body.match(
    /<button\b([^>]*\sdata-ant-table-filter-part="trigger"[^>]*)>([\s\S]*?)<\/button>/
  );
  const trigger = button ? {
    text: button[2].replace(/<!--[\s\S]*?-->|<[^>]+>/g, '').trim(),
    marks: Array.from(button[2].matchAll(/\sdata-probe-node="([^"]+)"/g), ([, mark]) => mark),
    active: Boolean(button[1].match(/class="[^"]*\bactive\b/)),
    defaultIcon: /<svg\b/.test(button[2])
  } : null;
  const rows = Array.from(body.matchAll(/<tr\b[^>]*\bdata-row-key="([^"]+)"/g), ([, key]) => key);
  return { trigger, rows };
}

it('pins filter icon and panel observations to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(22);
});

for (const { profile, ssr } of source.cases) {
  it(`renders static filter content on the server for ${profile.id}`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });

    expect(snapshot(body)).toEqual(ssr);
    expect(body).not.toContain('data-ant-dropdown-popup');
    expect(body).toMatch(/<output[^>]*data-(open-events|filter-changes)[^>]*>\[\]<\/output>/);
    if (ssr.trigger) {
      expect(body).toContain('aria-label="Filter: Value" aria-haspopup="dialog" aria-expanded="false"');
    }
  });
}

it('renders the decorated trigger in SSR with forceRender enabled', () => {
  const { body } = render(Fixture, { props: { profileId: 'live' } });

  expect(snapshot(body)).toEqual({
    trigger: { text: 'Icon 0', marks: ['Icon'], active: false, defaultIcon: false },
    rows: ['b', 'a']
  });
  expect(body).not.toContain('popover="manual"');
  expect(body).not.toContain('aria-label="Panel draft"');
});
