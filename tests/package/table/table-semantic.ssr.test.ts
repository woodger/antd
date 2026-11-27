import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/TableSemanticFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-semantic-reference.json';
import { expectedTableSemantics } from '../../browser/fixtures/table-semantic-reference';

/** Reads the last declaration of the measured CSS property from the inline style. */
function slotValue(style: string, name: '--observed-slot' | '--observed-provider-slot') {
  const values = Array.from(style.matchAll(new RegExp('(?:^|;)\\s*' + name + ':\\s*([^;]+)', 'g')));
  return values.at(-1)?.[1].trim() ?? '';
}

/** Reads only style markers in server markup. */
function renderedSlots(body: string) {
  const slots: { tag: string; classes: string[]; value: string; providerValue: string; }[] = [];
  for (const [, tag, attributes] of body.matchAll(/<([a-z]+)\b([^>]*)>/g)) {
    const classes = attributes.match(/(?:^|\s)class="([^"]*)"/)?.[1]
      .split(/\s+/).filter(value => value.startsWith('observed-')) ?? [];
    const style = attributes.match(/(?:^|\s)style="([^"]*)"/)?.[1] ?? '';
    const value = slotValue(style, '--observed-slot');
    const providerValue = slotValue(style, '--observed-provider-slot');
    if (classes.length || value) {
      slots.push({ tag, classes, value, providerValue });
    }
  }

  return slots;
}

it('pins the independent table semantic snapshots to the Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(13);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(17);
});

for (const { profile, server } of source.cases) {
  it(`renders semantic classes and winning inline styles for ${profile.id} at SSR`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const reference = expectedTableSemantics(profile.id, server);
    const expected = reference.semantic.map(({ tag, classes, value, providerValue }) => ({
      tag, classes, value, providerValue
    }));

    expect(renderedSlots(body)).toEqual(expected);
  });
}
