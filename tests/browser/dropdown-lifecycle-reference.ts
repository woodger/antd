// Типизирует записи публичной панели Dropdown из неизменённого Ant Design 6.6.8.
import lifecycle from './fixtures/ant-design-dropdown-lifecycle-reference.json' with { type: 'json' };
import replacement from './fixtures/ant-design-dropdown-replacement-reference.json' with { type: 'json' };
import motion from './fixtures/ant-design-dropdown-motion-reference.json' with { type: 'json' };
import toggles from './fixtures/ant-design-dropdown-lifecycle-toggle-reference.json' with { type: 'json' };
import type { DropdownPlacement } from '@woodger/antd';

type ContentMode = 'wrap' | 'replace' | 'standalone' | 'empty' | 'text' | 'zero';

interface ContentProfile {
  id: string;
  mode: ContentMode;
  noMenu?: boolean;
  force?: boolean;
  destroy?: boolean;
  portal?: boolean;
  autoFocus?: boolean;
}

interface OriginalNode {
  identity: number;
  tag: string;
  id: string | null;
  visible: boolean;
  value: string | null;
  selection: [number, number] | null;
}

export interface ContentFrame {
  action: string;
  state: {
    events: unknown[][];
    popup: OriginalNode | null;
    body: OriginalNode | null;
    draft: OriginalNode | null;
    menu: OriginalNode | null;
    focus: OriginalNode;
    target: string | null;
    text: string | null;
  };
}

interface ContentCase { profile: ContentProfile; frames: ContentFrame[]; }

interface ReplacementProfile {
  id: string;
  siblings?: boolean;
  selectable?: boolean;
  multiple?: boolean;
}

interface ReplacementFrame {
  focused: string;
  visible: boolean;
  menus: { id: string; className: string; items: {
    label: string; className: string; isFocused: boolean;
  }[]; }[];
  events: unknown[][];
}

interface ReplacementCase {
  profile: ReplacementProfile;
  open: ReplacementFrame;
  afterClick: ReplacementFrame;
  afterUnmount: ReplacementFrame;
}

interface MotionProfile {
  id: string;
  placement?: DropdownPlacement;
  transitionName?: string;
  nearBottom?: boolean;
  forceRender?: boolean;
  destroyOnHidden?: boolean;
}

interface MotionSnapshot {
  popup: { identity: number; classes: string[]; visible: boolean; hiddenClass: boolean; } | null;
  events: [boolean, string][];
}

interface MotionFrame {
  step: string;
  state: MotionSnapshot;
  animation?: {
    name: string;
    duration: number;
    delay: number;
    easing: string;
    fill: string;
    keyframes: { offset: number; opacity: string; transform?: string; }[];
    state: MotionSnapshot;
  } | null;
}

interface MotionCase { profile: MotionProfile; frames: MotionFrame[]; }

// JSON не сохраняет literal unions. Package test фиксирует одинаковые повторы и pin пакета.
export const dropdownContentCases = lifecycle.passes[0] as unknown as readonly ContentCase[];
export const dropdownReplacementCases = replacement.passes[0] as unknown as readonly ReplacementCase[];
export const dropdownMotionCases = motion.passes[0] as unknown as readonly MotionCase[];
export const dropdownToggleCases = toggles.passes[0];
