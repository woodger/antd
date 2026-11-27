// Tipping the original settings and browser observations Dropdown 6.6.8.
import type { DropdownProps } from '@woodger/antd';
import context from './fixtures/ant-design-dropdown-context-reference.json' with { type: 'json' };
import interactions from './fixtures/ant-design-dropdown-interactions-reference.json' with { type: 'json' };
import placement from './fixtures/ant-design-dropdown-placement-reference.json' with { type: 'json' };

type PlacementProps = Pick<DropdownProps, 'trigger' | 'placement' | 'arrow' | 'align'
  | 'autoAdjustOverflow' | 'mouseEnterDelay' | 'autoFocus'>;

export interface DropdownPlacementProfile extends PlacementProps {
  id: string;
  cancelChild?: boolean;
  controlled?: boolean;
  initial?: boolean;
  disabled?: boolean;
  rtl?: boolean;
  portal?: boolean;
  corner?: boolean;
  centered?: boolean;
  short?: boolean;
  minWidth?: number;
  manyItems?: boolean;
  scrollingAnchor?: boolean;
  scrollingPortal?: boolean;
  touch?: boolean;
}

export type PlacementAction =
  | ['initial' | 'unmount' | 'choose' | 'Escape' | 'Shift+F10' | 'ContextMenu']
  | ['outside' | 'outside-context' | 'away']
  | ['click' | 'context' | 'move' | 'resize' | 'tap', [number, number]]
  | ['scroll-parent', string]
  | ['scroll' | 'clock', number]
  | ['owner', boolean];

interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PlacementFrame {
  action: PlacementAction;
  state: {
    events: unknown[][];
    focus: string | null;
    focusedRole?: string | null;
    menuScroll?: number | null;
    popup: {
      visible: boolean;
      geometry: Bounds;
      className: string;
      minWidth: string;
      container: string;
      arrow: Bounds | null;
    } | null;
  };
}

export interface PlacementCase {
  profile: DropdownPlacementProfile;
  frames: PlacementFrame[];
}

// JSON does not retain literal tuple types. The hull is fixed by package/SSR- verification.
export const dropdownPlacementCases = [
  ...context.passes[0], ...placement.passes[0], ...interactions.passes[0]
] as unknown as readonly PlacementCase[];
