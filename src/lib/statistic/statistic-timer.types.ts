import type { StatisticProps } from './statistic.types';

export type StatisticTimerType = 'countdown' | 'countup';
/** Timer Statistic; value sets the original time mark in milliseconds. */
export interface StatisticTimerProps extends StatisticProps {
  type: StatisticTimerType;
  /** @defaultValue 'HH:mm:ss' */
  format?: string;
  /** Current duration in milliseconds. */
  onChange?: (value: number) => void;
  /** Is caused when you achieve zero countdown. */
  onFinish?: () => void;
}
