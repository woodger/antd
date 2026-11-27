import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../../porting-registry';
import MenuTooltipFixtures from '../../browser/fixtures/MenuTooltipFixtures.svelte';
import source from '../../browser/fixtures/ant-design-menu-tooltip-reference.json';

it('renders collapsed menu items without a Tooltip trigger wrapper', () => {
  const initial = render(MenuTooltipFixtures).body;
  const open = render(MenuTooltipFixtures, { props: { sampleId: 'open-controlled' } }).body;
  const expanded = render(MenuTooltipFixtures, {
    props: { sampleId: 'open-controlled', initiallyCollapsed: false }
  }).body;

  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  expect(initial).toMatch(/<li[^>]+role="menuitem"[^>]+aria-label="Warehouse"/);
  expect(initial).not.toContain('role="tooltip"');
  expect(open).toMatch(/role="tooltip" popover="manual" hidden/);
  expect(open).toContain('ant-menu-inline-collapsed-tooltip');
  expect(open).not.toMatch(/<ul\b[^>]*\stooltip(?=[=\s>])/);
  expect(open).not.toContain('ant-tooltip-trigger');
  expect(expanded).not.toContain('role="tooltip"');
});
