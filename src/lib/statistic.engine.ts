import type { StatisticValue } from './statistic.types';

export function formatStatisticValue(
  value: StatisticValue,
  precision?: number,
  decimalSeparator = '.',
  groupSeparator = ','
): { integer: string; decimal: string; } | { text: string; } {
  const text = String(value);
  const cells = text.match(/^(-?)(\d*)(\.(\d+))?$/);
  if (!cells || text === '-') {
    return { text };
  }

  const integer = (cells[2] || '0').replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  let decimal = cells[4] || '';
  // Matches upstream Number.tsx. precision pads or truncates the string without rounding.
  if (typeof precision === 'number' && !Number.isNaN(precision))
    decimal = decimal.padEnd(precision, '0').slice(0, precision > 0 ? precision : 0);

  return {
    integer: `${cells[1]}${integer}`,
    decimal: decimal
      ? `${decimalSeparator}${decimal}`
      : ''
  };
}
