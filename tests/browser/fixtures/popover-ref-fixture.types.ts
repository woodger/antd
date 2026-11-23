import type { PopoverRef } from '@woodger/antd';

export interface PopoverRefFixtureElement extends HTMLElement {
  readonly popupRef: PopoverRef | undefined;
  readonly savedPopupRef: PopoverRef | undefined;
  readonly alignCalls: number;
}
