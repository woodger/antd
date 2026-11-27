import type {
  ConfigProvider,
  TimePickerMultipleProps,
  TimePickerProps,
  TimeRangePickerProps
} from '@woodger/antd';
import dayjs from 'dayjs';
import type { ComponentProps } from 'svelte';

export const sharedTimePicker: ComponentProps<typeof ConfigProvider>['timePicker'] = {
  classNames({ props }) {
    const value = props.value;
    // @ts-expect-error A shared provider can receive an array or a date from another adapter.
    value?.format('HH:mm');
    const first = Array.isArray(value) ? value[0] : value;
    return { root: dayjs.isDayjs(first) ? first.format('HH-mm') : undefined };
  }
};

export const singleTimeStyle: TimePickerProps['styles'] = ({ props }) => ({
  root: props.value?.format('HH:mm')
});

export const rangeTimeStyle: TimeRangePickerProps['styles'] = ({ props }) => ({
  root: props.value?.[1]?.format('HH:mm')
});

export const multipleTimeStyle: TimePickerMultipleProps<{ hour: number }>['styles'] =
  ({ props }) => ({ root: props.value?.map(date => date.hour).join('-') });
