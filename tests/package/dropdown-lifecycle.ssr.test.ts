import { createRawSnippet, type Snippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import { Dropdown, type DropdownProps } from '@woodger/antd';
import registry from '../porting-registry';
import lifecycle from '../browser/fixtures/ant-design-dropdown-lifecycle-reference.json';
import replacement from '../browser/fixtures/ant-design-dropdown-replacement-reference.json';
import motion from '../browser/fixtures/ant-design-dropdown-motion-reference.json';
import ssr from '../browser/fixtures/ant-design-dropdown-lifecycle-ssr-reference.json';
import form from '../browser/fixtures/ant-design-dropdown-form-context-reference.json';
import toggles from '../browser/fixtures/ant-design-dropdown-lifecycle-toggle-reference.json';

it('pins the original rendering, motion and menu context across independent runs', () => {
  for (const capture of [lifecycle, replacement, motion, ssr.pin, form, toggles]) {
    expect(capture.revision).toBe(registry.upstream.revision);
    expect(capture.archiveSha256).toBe(registry.upstream.archiveSha256);
  }
  for (const [capture, count] of [
    [lifecycle, 10], [replacement, 4], [motion, 8], [ssr, 14], [toggles, 2]
  ] as const) {
    expect(capture.passes[0]).toHaveLength(count);
    expect(capture.passes[0]).toEqual(capture.passes[1]);
  }
  for (const entry of ssr.passes[0]) {
    expect(entry.calls).toEqual([]);
    expect(entry.diagnostics).toEqual([]);
    expect(entry.html).not.toContain('role="menu"');
  }
  expect(form.passes).toHaveLength(2);
  expect(form.passes[0]).toEqual(form.passes[1]);
});

it.each([{}, { open: true }, { forceRender: true }, { forceRender: true, destroyOnHidden: true }])(
  'renders the trigger without calling a custom renderer on the server %j', options => {
    const invoked = vi.fn();
    const getPopupContainer = vi.fn<() => HTMLElement>();
    const children = createRawSnippet(() => ({ render: () => '<button>Actions</button>' }));
    const popupRender = createRawSnippet<[origin?: Snippet]>(() => {
      invoked();
      return { render: () => '<div id="custom">Injected</div>' };
    });
    const props: DropdownProps = { ...options, children, popupRender, getPopupContainer };

    const { body } = render(Dropdown, { props });

    expect(body).toContain('<button>Actions</button>');
    expect(body).not.toContain('popover="manual"');
    expect(invoked).not.toHaveBeenCalled();
    expect(getPopupContainer).not.toHaveBeenCalled();
  }
);
