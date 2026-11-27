import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-select-icons-edges-reference.json' with { type: 'json' };
import stopReference from '../fixtures/ant-design-select-icons-stop-reference.json' with { type: 'json' };
import menuReference from '../fixtures/ant-design-select-icons-menu-focused-reference.json' with { type: 'json' };
import unfocusedMenuReference from '../fixtures/ant-design-select-icons-menu-reference.json' with { type: 'json' };

expect(createHash('sha256').update(readFileSync(new URL(
  '../fixtures/ant-design-select-icons-edges-reference.json',
  import.meta.url
))).digest('hex'))
  .toBe('cdba9aad852ab404b2d8b836a4157ffa660beab8e1fed37add05b477d47ead8f');
expect(reference.reference.protocolSHA256).toBe('2f10e8d5e711ad9f404f154e64026e4233b08a371316c8dde41bb17efebeb423');
expect(reference.reference.errors).toEqual([]);
expect(reference.reference.diagnostics).toEqual([]);
for (const [name, sha, protocol, source] of [
  ['stop', '38f52a92e16ad3bcda670e305e910a901e161f5f272c6a20e98e3b2bba772806', 'd7a8a51eb78860ceca41010877b339212adef5d756f40984bc2b2065a38f042f', stopReference],
  ['menu', '6160ac68d7b4630962d3e2fa9f33d48857a3b95e5be2751add81a8292f715d44', 'e3e779677d636c6fd3559bbe0295e618edadf08581bb4edd6460ef2470962fae', unfocusedMenuReference],
  ['menu-focused', '0a55a0399ab8faec321b0a7d9ac6e6f5a29d028ac5960c81314e852a383e171f', '72b5054ce13b787bbab0ae6e02dd7792199028e00cc1eb87de7a8dee32700c32', menuReference]
] as const) {
  expect(createHash('sha256').update(readFileSync(new URL(
    '../fixtures/ant-design-select-icons-' + name + '-reference.json',
    import.meta.url
  ))).digest('hex')).toBe(sha);
  expect(source.reference.protocolSHA256).toBe(protocol);
  expect(source.reference.errors).toEqual([]);
  expect(source.reference.diagnostics).toEqual([]);
}
type Snapshot = Omit<(typeof reference.cases)[number]['initial'], 'events'> & { events: unknown[] };
for (const entry of [...reference.cases, ...stopReference.cases, ...menuReference.cases]) test(`icon API edge follows Original ${entry.sample.id}`, async (
  { page },
  testInfo
) => {
  const trace: unknown[] = [];
  await page.goto('/?fixture=select-icons-edge');
  await page.getByRole('combobox', { name: 'Icon edge sample', exact: true }).selectOption(entry.sample.id);
  const read = () => page.evaluate(() => {
    const detail = {} as { read?: () => Snapshot };
    document.querySelector('[data-icon-edge]')!.dispatchEvent(new CustomEvent(
      'iconedgecapture',
      { detail }
    ));
    if (!detail.read) {
      throw Error('Actual icon edge owner absent');
    }
    return detail.read();
  });
  const verify = async (source: Snapshot, phase: string) => {
    const expected = structuredClone(source);
    if (entry.sample.control === 'select' && !('mode' in entry.sample) && source.input?.expanded === 'false') {
      expect(source.input.value).toBe('');
      expected.input!.value = source.model === 'a' ? 'Alpha' : source.model === 'b' ? 'Beta' : '';
    }
    if (source.input?.active === 'icon-edge-value_list_-1') {
      expect(entry.sample.control).toBe('autocomplete');
      // Native keeps the established valid ARIA boundary for no active row.
      expected.input!.active = null;
    }
    await expect.poll(async () => {
      const actual = await read();
      return { model: actual.model, open: actual.open, events: actual.events, input: actual.input,
        info: actual.infos.at(-1) };
    }).toEqual({ model: expected.model, open: expected.open, events: expected.events, input: expected.input,
      info: expected.infos.at(-1) });
    const actual = await read();
    trace.push({ phase, actual });
    for (const info of actual.infos) {
      expect(info.keys).toEqual(['searchValue', 'open', 'focused', 'showSearch', 'loading']);
      expect(info.argumentCount).toBe(1);
    }
  };
  try {
    await verify(entry.initial, 'initial');
    if ('menu' in entry.sample && entry.sample.menu) {
      if ('menuFocused' in entry.sample && entry.sample.menuFocused)
        await page.getByRole('combobox', { name: 'Icon edge value', exact: true }).focus();
      await page.locator('[data-icon-edge-menu=b]').click();
    }
    else if ('clear' in entry.sample && entry.sample.clear) {
      await page.locator('.ant-select-clear').click();
    }
    else if ('key' in entry.sample && entry.sample.key) {
      const editor = page.getByRole('combobox', { name: 'Icon edge value', exact: true });
      await editor.focus();
      await editor.press(entry.sample.key);
    }
    await verify(entry.after, 'after');
  } finally {
    trace.push({ phase: 'final', actual: await read() });
    await testInfo.attach(
      'actual-icon-edge-owner',
      { body: JSON.stringify({ sample: entry.sample, trace }), contentType: 'application/json' }
    );
  }
});
