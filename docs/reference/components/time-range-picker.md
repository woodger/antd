# TimeRangePicker (TimePicker.RangePicker)

TimeRangePicker selects a time range.

```svelte
<script lang="ts">
  import dayjs from 'dayjs';
  import { TimeRangePicker, type RangePickerValue } from '@woodger/antd';

  let value = $state<RangePickerValue | null>([
    dayjs('2024-09-15T09:00:00'), dayjs('2024-09-15T18:00:00')
  ]);
</script>

<TimeRangePicker name="interval" {value} onChange={next => { value = next; }} />
```

Value and open are controlled props. DefaultValue and defaultOpen are read
at creation. Removing controlled value clears the local range. The calendar draft,
confirmed endpoints, and owner value are stored separately. Changing `prefixCls`
with the same value preserves the draft and text selection. OnCalendarChange
reports the pair and info.range in field order. OnChange receives the final
result after both endpoints finish. Order=true sorts before emitting, and
a disabled endpoint disables sorting. Comparison follows Dayjs and rc-picker,
including the calendar date.

NeedConfirm defaults to true. OK confirms the active endpoint and moves focus
to the next one. OnOk runs before the transition and onChange. Enter, Tab, and
double click confirm without onOk. An unconfirmed endpoint keeps focus when
moving to the other field. Without needConfirm, column selection is still
a draft. Finishing the first endpoint moves to the second. Closing after
that choice can reopen the second panel as in upstream useFocusLock.

Escape cancels the calendar draft. Unparsed text with unchanged calendar value
persists until blur. PreserveInvalidOnBlur controls restoration. AllowEmpty permits
a null endpoint and Tab confirmation while keeping OK disabled for an empty
panel. Clearing both calls onChange(null, null). A disabled endpoint is preserved.
Now with explicit showNow confirms only the active field without onOk.
Presets apply the whole pair immediately.

Format, 12-hour mode, show flags, steps, disabled units, hover preview, and
changeOnScroll follow TimePicker. DefaultOpenValue supplies separate candidates
for both panels without filling inputs. A single Dayjs applies only to start.
PickerValue controls time templates independently of value. DefaultPickerValue
is restored on open and field switch. DisabledTime receives (date, partial,
{ from }). During final validation, end receives start, including null for an
allowed empty endpoint.

Panel edits preserve the input Dayjs date, UTC mode, and timezone. The default
millisecondStep is 100 and applies even to hidden units. A step of 1 preserves
milliseconds. Manual entry uses the shared strict Day.js parser without panel
rounding or forced UTC. Native name produces two fields with the display
strings. The form model and onFinish get Dayjs objects without an ISO copy.

Configuration follows upstream. ConfigProvider.timePicker supplies icons,
allowClear, and semantic classNames and styles. ConfigProvider.rangePicker
supplies variant, separator, class, and ordinary style. Single TimePicker
style, class, and variant stay off the range wrapper. A nested rangePicker
record replaces the parent. The semantic callback runs in one layer with
resolved size and disabled and the original variant. The local callback is
typed TimeRangePickerProps. Shared classNames and styles receive single, range,
or multiple-picker props. Check arrays with Array.isArray and date instances
with dayjs.isDayjs before using Dayjs methods because the factory can use
another adapter. Root style order is timePicker styles.root, rangePicker style,
local styles.root, then local style.

Prefix and icons, cellRender with info.range and originNode, panelRender,
presets, and footer use Svelte snippets. Footer receives mode='time'.
Bind:nativeElement, startInput, and endInput expose native refs and clear on
unmount. Focus accepts index, cursor, and preventScroll in an object or an
index 0 or 1, defaulting to 0. Focusing alone leaves a closed panel closed.
Keyboard and native popover follow the agreed Svelte adaptation. Unmount
clears deferred focus, geometry animation frames, scroll timers, and observers.
[Types](../../../src/lib/picker/time-range-picker.types.ts)

`components.input` provides editors for both endpoints. `components.button`
renders OK for the active endpoint. StartInput and endInput retain
HTMLInputElement types. [Editor and button context](date-picker.md#editor-and-confirmation-button)

`components.time` replaces the active endpoint panel. Snippet actions affect
that endpoint, and OK uses normal range confirmation. Other panel modes are
reported in the onPanelChange pair. Use TimeRangePickerProps<DatePickerMode>
for those panels. [Panel context](date-picker.md#custom-panels)

The popup inherits the shared DatePicker container API. It keeps the selector's
minimum width and shifts a narrow time panel with an arrow under the active
field. Set placement through popupAlign and builtinPlacements. RTL keeps the
upstream hours, minutes, and seconds column order and changes direction inside
the columns. Theme, compact, size, locale, and status use current library
contexts. [Panel placement](./date-picker.md#panel-placement)

The fixture is `?fixture=time-range-picker`. [Engine](../../../src/lib/picker/time-range-picker.engine.test.ts) · [SSR](../../../src/lib/picker/time-range-picker.ssr.test.ts) ·
[Public package](../../../tests/package/picker/time-range-picker.ssr.test.ts) · [Browser](../../../tests/browser/picker/time-range-picker.spec.ts)
For a custom date type, use the DatePicker factory's RangePicker with
`picker="time"`. The full mask, trigger, and token APIs and React diagnostics
remain future work. V1-ready applies to the agreed scope. [DatePicker factory](./date-picker.md#custom-date-type)
