import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import {
  Dropdown, type DropdownArrowOptions, type DropdownPlacement, type DropdownTrigger
} from '@woodger/antd';
import registry from '../porting-registry';
import context from '../browser/fixtures/ant-design-dropdown-context-reference.json';
import interactions from '../browser/fixtures/ant-design-dropdown-interactions-reference.json';
import placement from '../browser/fixtures/ant-design-dropdown-placement-reference.json';

it('pins the repeated original context and alignment browser recordings', () => {
  for (const capture of [context, placement, interactions]) {
    expect(capture.pin).toMatchObject({
      version: registry.upstream.version, revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256, react: '18.3.1',
      dropdown: '1.0.3', trigger: '3.10.1', documentMode: 'CSS1Compat'
    });
    expect(capture.passes[1]).toEqual(capture.passes[0]);
    expect(capture.passes[0].every(entry => !entry.errors.length)).toBe(true);
  }
  expect(context.passes[0]).toHaveLength(20);
  expect(placement.passes[0]).toHaveLength(19);
  expect(interactions.passes[0]).toHaveLength(4);
});

it('renders a hidden context menu with lateral placement and an arrow object without reading DOM', () => {
  const getPopupContainer = vi.fn<() => HTMLElement>();
  const onOpenChange = vi.fn();
  const trigger: DropdownTrigger = 'contextMenu';
  const placement: DropdownPlacement = 'rightTop';
  const arrow: DropdownArrowOptions = { pointAtCenter: true };
  const children = createRawSnippet(() => ({ render: () => '<button>Actions</button>' }));

  const { body } = render(Dropdown, { props: {
    trigger, children, placement, arrow, open: true, getPopupContainer, onOpenChange,
    align: { offset: ['10%', 4] },
    autoAdjustOverflow: { adjustX: 0, adjustY: 1 },
    menu: { items: [{ key: 'one', label: 'Command' }] }
  } });

  expect(body).toContain('ant-dropdown-placement-rightTop');
  expect(body).toContain('class="ant-dropdown-arrow');
  expect(body).toMatch(/popover="manual"[^>]*\shidden(?:[\s=>])/);
  expect(body).toContain('role="menuitem"');
  expect(getPopupContainer).not.toHaveBeenCalled();
  expect(onOpenChange).not.toHaveBeenCalled();
});
