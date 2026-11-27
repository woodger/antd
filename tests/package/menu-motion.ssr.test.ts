import { Menu, type MenuItemType, type MenuProps } from '@woodger/antd';
import registry from '../porting-registry';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import source from '../browser/fixtures/ant-design-menu-motion-ssr-reference.json';

const profiles: Record<string, Pick<MenuProps,
  'mode' | 'openKeys' | 'inlineCollapsed' | 'forceSubMenuRender'>> = {
  'inline-closed': { mode: 'inline', openKeys: [] },
  'inline-open': { mode: 'inline', openKeys: ['branch'] },
  'inline-open-nested': { mode: 'inline', openKeys: ['branch', 'nested'] },
  'inline-forced': { mode: 'inline', openKeys: [], forceSubMenuRender: true },
  collapsed: { mode: 'inline', inlineCollapsed: true, openKeys: ['branch'] },
  'vertical-open': { mode: 'vertical', openKeys: ['branch'] },
  'horizontal-forced': { mode: 'horizontal', openKeys: [], forceSubMenuRender: true }
};

const items: MenuItemType[] = [{ key: 'branch', label: 'Branch', children: [
  { key: 'leaf', label: 'Leaf' },
  { key: 'nested', label: 'Nested', children: [{ key: 'deep', label: 'Deep' }] }
] }];

describe('Menu motion in the published SSR package', () => {
  it('pins the DOM-free captures to the official release', () => {
    expect(source.revision).toBe(registry.upstream.revision);
    expect(source.archiveHash).toBe(registry.upstream.archiveSha256);
    expect(source.results.map(sample => sample.id)).toEqual(Object.keys(profiles));
  });

  for (const sample of source.results) {
    it(`keeps SSR markup stable without running motion for ${sample.id}`, () => {
      const visible = vi.fn();
      const prepare = vi.fn();
      const props = { id: 'motion', items, ...profiles[sample.id] };
      const referenceLists = sample.html.match(/\bant-menu-sub ant-menu-inline\b/g) ?? [];

      vi.useFakeTimers();
      try {
        const { body } = render(Menu, { props: {
          ...props,
          motion: {
            motionName: 'probe-motion', visible: true, motionDeadline: 500,
            onAppearPrepare: prepare, onEnterPrepare: prepare, onLeavePrepare: prepare,
            onVisibleChanged: visible
          },
          defaultMotions: { horizontal: { motionName: 'probe-horizontal' } }
        } });
        const inlineLists = body.match(/<ul\b[^>]*\bdata-ant-menu-inline-list(?=[\s=>])/g) ?? [];
        const popupShells = body.match(/<div\b[^>]*\bpopover="manual"[^>]*>/g) ?? [];

        expect(sample.events).toEqual([]);
        expect(sample.diagnostics).toEqual([]);
        expect(sample.html).not.toContain('ant-menu-submenu-popup');
        expect(inlineLists).toHaveLength(referenceLists.length);
        if (props.inlineCollapsed || props.mode === 'vertical' || props.mode === 'horizontal') {
          expect(popupShells.length).toBeGreaterThan(0);
        }
        // Existing Svelte popup containers stay hidden until client positioning.
        for (const shell of popupShells) {
          expect(shell).toMatch(/\bhidden(?=[\s=>])/);
        }
        expect(body).toBe(render(Menu, { props }).body);
        expect(prepare).not.toHaveBeenCalled();
        expect(visible).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
      }
      finally {
        vi.useRealTimers();
      }
    });
  }
});
