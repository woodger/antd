// Stores the recordings of observations of individual scenarios, so that the browser-test can cause
// a real handle beyond the fixture-component life cycle.
import type { MessageHandle, MessageSemanticProps } from '@woodger/antd';

type MessageProbeEvent = (string | boolean)[];
type SemanticArguments = Partial<Pick<
  MessageSemanticProps, 'content' | 'duration' | 'top' | 'type' | 'rtl' | 'prefixCls'
>>;

export interface MessageProbe {
  events: MessageProbeEvent[];
  handles: Record<string, MessageHandle>;
  arguments: Record<string, SemanticArguments>;
  containerCalls: number[];
  motion: string[];
  finish(): void;
  move?: () => void | Promise<void>;
  original?: Element | null;
}

declare global {
  interface Window {
    messageProbe: MessageProbe;
  }
}
