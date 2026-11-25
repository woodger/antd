// Хранит записи наблюдений отдельных сценариев, чтобы browser-тест мог вызвать
// настоящий handle за пределами жизненного цикла fixture-компонента.
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
