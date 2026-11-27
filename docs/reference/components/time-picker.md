# TimePicker

TimePicker selects a time. A nested panel inherits its owner layer. [Owner layer](../theme-context.md#layering-nested-panels)

```svelte
<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import { TimePicker } from '@woodger/antd';

  let value = $state<Dayjs | null>(dayjs('2024-09-15T10:30:15'));
</script>

<label for="meeting-time">Meeting time</label>
<TimePicker id="meeting-time" name="time" {value} onChange={next => { value = next; }} />
```

Value, open, and pickerValue are controlled through props and callbacks.
Without value or open, use defaultValue and defaultOpen. An empty value stays
empty. The panel starts at the current day with zero time. DefaultOpenValue
sets the panel and the OK candidate and leaves input and onCalendarChange
untouched until selection. DefaultPickerValue sets panel time on open.
PickerValue is independent of value.

Format defaults to HH:mm:ss. Use12Hours selects hh:mm:ss A. Format accepts a
string, an array of formats, or a display callback. A callback makes the input
readonly even with inputReadOnly={false}. ShowHour, showMinute, showSecond,
and showMillisecond set columns. Omitted flags follow rc-picker format rules.
Steps and disabledTime control units. HideDisabledOptions removes unavailable
options.

Panel selection aligns all four units, including hidden ones. MillisecondStep
defaults to 100. Alignment uses the nearest allowed value to the left or the
first allowed value. Set millisecondStep={1} for millisecond precision. Manual
entry uses strict parsing without rounding. Panel edits preserve input Dayjs
date, UTC mode, and timezone. Parser and getNow use the shared adapter.
Application serialization stays with the owner.

NeedConfirm defaults to true. Column selection updates only the calendar draft.
OK calls onOk before onChange. If onOk accepts the selected time or closes the
panel through open, the picker still reports the change and close request.
For ranges, closing belongs to the last confirmation. Enter and Tab accept
valid input without onOk. Double click confirms the first selected option
without onOk. If autoscroll moves the target between the second down and up,
the column handles confirmation. A new double click on empty space leaves
the old selection unconfirmed. The pinned upstream can select an adjacent
hour when autoscroll moves between clicks. The port keeps the first selection.
With needConfirm={false}, onChange runs when input finishes or the panel
closes. Escape cancels the draft, and outside close also cancels it when
needConfirm=true. Now and presets apply immediately. OnCalendarChange gets
an empty info object. Complete clear gives onChange(null, null) and
onCalendarChange(null, '', {}), as in SinglePicker. [Pinned upstream](../../../tests/browser/fixtures/ant-design-time-column-double-click-observation.json)

PreviewValue='hover' temporarily displays the hovered time, including
disabled units, without callbacks. False disables preview. ChangeOnScroll
selects the nearest allowed unit 300 ms after scrolling. Programmatic
alignment leaves user input untouched. Selection changes and panel removal
clear animation frames, scroll listeners, and delayed callbacks.

Locale uses the DatePickerLocale shape with lang and timePickerLocale.placeholder
and merges with ConfigProvider.locale.datePicker. RuRU is the default, and enUS
switches to English. ConfigProvider.timePicker sets variant, class, style, icons,
clear, and semantic configuration. A nested object replaces the parent.
ClassNames and styles support root, prefix, input, suffix, and popup root,
content, item, footer, and container. A local callback receives raw props with
resolved variant. Context follows both upstream TimePicker and SinglePicker
layers. Local style applies last to the root.

Prefix, suffixIcon, allowClear.clearIcon, cellRender, panelRender,
renderExtraFooter, and presets accept Svelte snippets. Cell info.originNode
is the native button snippet. Bind:nativeElement exposes the root div, and
bind:this exposes focus({ cursor, preventScroll }) and blur(). Native name,
id, required, and FormItem work without a hidden ISO input. FormData contains
the display string and the form model keeps Dayjs directly. [Types](../../../src/lib/picker/time-picker.types.ts)

`components.input` replaces the time editor. `components.button` gets the OK
label and normal confirmation attributes. [Editor and button context](date-picker.md#editor-and-confirmation-button)

`components.time` replaces the columns and keeps ordinary drafts and
confirmation. A panel can request a calendar mode through onModeChange.
Use TimePickerProps<DatePickerMode> for an owner with those transitions.
The default TimePickerProps mode type is 'time'. [Panel context](date-picker.md#custom-panels)

The accessibility adaptation uses native unit buttons, arrows, Home and End,
ArrowDown from input, Enter and Tab, and Escape with focus restoration.
Popup uses the library's native popover lifecycle. All four picker components
use classNames.popup.root for popup class. Other DatePicker and RangePicker
semantic slots are still outside the port. ShowNow controls Today and Now.
DisabledTime sets time constraints, and allowClear.clearIcon sets the clear
icon. The old popup aliases, showToday, direct disabled units, addon, onSelect,
and the second onKeyDown argument were removed. Themes, compact, RTL, status,
and size inherit current contexts.

The fixture is `?fixture=time-picker`. [Engine](../../../src/lib/picker/time-picker.engine.test.ts) · [SSR](../../../src/lib/picker/time-picker.ssr.test.ts) ·
[Public package](../../../tests/package/picker/time-picker.ssr.test.ts) · [Browser](../../../tests/browser/picker/time-picker.spec.ts)

Set shared component tokens in components.DatePicker. The DatePicker reference
covers token updates while the panel is open and the adapter for custom dates.
Use DatePicker.generatePicker(adapter).TimePicker for a custom date type.
[DatePicker reference](./date-picker.md#custom-date-type)

Multiple is available on DatePicker.TimePicker and Picker.TimePicker from
generatePicker. They take arrays of dates and confirm the set using the
multiple selection rules. [Multiple selection](./date-picker.md#multiple-selection)

Mask format, React diagnostics, and the full rc-trigger and motion API remain
outside the port. Date and time pickers share popupAlign and builtinPlacements.
[Panel placement](./date-picker.md#panel-placement)

Labels and time formats come from the ConfigProvider.locale dictionary.
[Locale setup](../themes.md#interface-language)

Use TimeRangePicker for a range. An overflowing 32-bit step throws RangeError
to avoid the upstream infinite loop.
