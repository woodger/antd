import type { TooltipRef } from '@woodger/antd';

export interface TooltipRefFixtureElement extends HTMLElement {
  readonly tooltipRef: TooltipRef | undefined;
  readonly savedTooltipRef: TooltipRef | undefined;
}
