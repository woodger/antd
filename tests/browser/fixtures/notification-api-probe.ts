import type { NotificationSemanticProps } from '@woodger/antd';

export interface NotificationProbe {
  events: (string | string[])[];
  containers: [target: string, arity: number][];
  arguments: Record<string, Partial<Pick<NotificationSemanticProps,
    'title' | 'key' | 'duration' | 'placement' | 'top' | 'showProgress'
  >>>;
  move?: () => void | Promise<void>;
  finish(): void;
}

declare global {
  interface Window {
    notificationProbe: NotificationProbe;
  }
}
