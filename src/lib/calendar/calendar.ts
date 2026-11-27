import type { Component } from 'svelte';
import CalendarCore from './CalendarCore.svelte';
import type { CalendarGenerateConfig, CalendarProps } from './calendar.types';

/** Calendar.generateCalendar factory. Returns a Svelte component with a fixed date adapter. */
export function generateCalendar<DateType extends object>(
  generateConfig: CalendarGenerateConfig<DateType>
): Component<CalendarProps<DateType>, {}, 'nativeElement'> {
  return (anchor, props) => CalendarCore<DateType>(anchor, new Proxy(props, {
    // Props and binding setters stay reactive. Spreading them would capture an initial snapshot.
    get(target, key, receiver) {
      return key === 'generateConfig' ? generateConfig : Reflect.get(target, key, receiver);
    }
  }) as CalendarProps<DateType> & { generateConfig: CalendarGenerateConfig<DateType>; });
}
