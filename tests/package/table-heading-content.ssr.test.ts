import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableHeadingContentFixture.svelte';
import source from '../browser/fixtures/ant-design-table-heading-content-reference.json';
import { expectedTableHeadingContent } from '../browser/fixtures/table-heading-content-observations';

/** Reads text and inline labels before attaching the DOM. */
function content(markup: string) {
  return {
    text: markup.replace(/<!--[\s\S]*?-->|<[^>]+>/g, '').trim(),
    marks: Array.from(markup.matchAll(/\bdata-probe-title="([^"]+)"/g), ([, id]) => id)
  };
}

/** Captures observable labels and utility controls in the server response. */
function snapshot(body: string) {
  const headers = Array.from(body.matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/g),
    ([, attrs, markup]) => {
      // The closed Dropdown is already present in SSR, but its items stay out of the header.
      const popup = markup.search(/<div\b[^>]*\sdata-ant-dropdown-popup\b/);
      const heading = popup === -1 ? markup : markup.slice(0, popup);
      return {
        ...content(heading),
        checkboxes: Array.from(heading.matchAll(/<input\b[^>]*type="checkbox"/g)).length,
        title: attrs.match(/\stitle="([^"]*)"/)?.[1] ?? null,
        menu: heading.includes('ant-table-selection-extra')
      };
    });
  const caption = body.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/)?.[1];
  const rows = Array.from(body.matchAll(/<tr\b[^>]*\bdata-row-key="([^"]+)"/g), ([, key]) => key);
  return { caption: caption === undefined ? null : content(caption), headers, rows };
}

it('pins the heading and command observations to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(16);
});

for (const { profile, ssr, command } of source.cases) {
  it(`renders Table headings, caption and controls on the server for ${profile.id}`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });

    expect(snapshot(body)).toEqual(expectedTableHeadingContent(profile, ssr));
    expect(body).toMatch(/<output[^>]*data-heading-events[^>]*>\[\]<\/output>/);
    if (command) {
      const popup = body.match(/<div\b[^>]*\sdata-ant-dropdown-popup\b[^>]*>/)?.[0];
      expect(popup).toMatch(/\shidden(?:="")?(?:\s|>)/);
      expect(body).toContain('data-probe-title="command"');
    }
  });
}
