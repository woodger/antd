# RangePicker (DatePicker.RangePicker)

RangePicker selects a date and time range. Draft selection, confirmed endpoints,
and the value accepted by the owner are stored separately.

TimeRangePicker also uses RangePickerCore. ConfigProvider.rangePicker supplies
shared variant, class, style, and separator. Local props take precedence.
A nested provider object replaces the parent in full. RangePicker inherits
semantic classes and styles, the suffix icon, and clear settings from
`ConfigProvider.datePicker`. Local `prefix`, `classNames`, and `styles` follow the
shared picker rules. [DatePicker rules](date-picker.md#semantic-styling-and-provider-settings)

```svelte
<script lang="ts">
  import dayjs from 'dayjs';
  import { RangePicker, type RangePickerValue } from '@woodger/antd';
  let period = $state<RangePickerValue | null>([dayjs('2026-10-10'), dayjs('2026-10-20')]);
</script>
<label for="period-start">Start</label><label for="period-end">End</label>
<RangePicker id={{start:'period-start',end:'period-end'}} name="period"
  value={period} onChange={next => { period = next; }} />
```

Value and defaultValue are pairs of Dayjs, null, or undefined. Missing endpoints
are normalized to null internally. Value=null clears both ends, and undefined
uses internal state. OnChange gets a Dayjs or null pair, or null on complete
clear. Its second argument is a pair of display strings, or null on complete
clear. This is rc-picker 1.12.2 runtime behavior, although its declaration only
lists a tuple. OnCalendarChange always gets a value pair, string pair, and
{ range: 'start' | 'end' } for the first changed endpoint. OnOk gets the
current calendar pair after each endpoint confirmation. The first confirmation
does not by itself trigger onChange.

Date uses two adjacent calendars. ShowTime shows the calendar and time for the
active endpoint. Moving to the next field, Tab, Enter, OK, Escape, and outside
dismissal follow separate upstream transitions. NeedConfirm defaults to enabled
for datetime. Unconfirmed changes are discarded. Controlled value and open
can decline proposed changes. DefaultPickerValue and pickerValue accept a
panel date or pair, and onPickerValueChange reports range, source, and mode.

`mode` accepts a `[start, end]` pair for the two endpoint panels.
`onPanelChange(dates, modes)` proposes a mode for the active endpoint and keeps
the other mode. Changing the active end uses its current mode. Replacing the pair
preserves the fields, entered value, selection, and focus. Removing mode returns
both panels to picker. Ant Design React 6.6.8 throws TypeError and removes the
field when the pair is removed. [React measurements](../../../tests/browser/fixtures/ant-design-date-picker-panel-mode-range-release.json.gz)

Order=true sorts the emitted pair when both endpoints are available. Order=false
preserves positions. Disabled and allowEmpty accept a boolean or [start,end].
Clearing preserves a disabled endpoint. DisabledDate receives { type, from },
and disabledTime receives (date, 'start' | 'end', { from }). From follows field
visit order as in rc-picker. Constraints check the endpoints. A disabled date
inside the range can still be spanned. MinDate and maxDate constrain selection
and navigation. Presets accept a pair or factory. PreviewValue defaults to
'hover', and false disables preview. ShowNow defaults to off for ranges.
Enabling it confirms the current endpoint.

Format, showTime units, steps, and defaultOpenValue, inputReadOnly,
preserveInvalidOnBlur, size, status, variant, Compact, locale, theme, and RTL
use shared DatePicker mechanisms. ShowTime.defaultOpenValue accepts a time
date pair. CellRender, panelRender, and renderExtraFooter use the DatePicker
snippet contract. Footer receives one mode and cell info.range identifies the
active endpoint. Calendar operations preserve the incoming Dayjs mode.
The application owns UTC and wire serialization. Native FormData.getAll(name)
gets both display strings under the same name. Form stores a pair of Dayjs
objects, copies the tuple in a snapshot, and restores the original dates
on reset. A string id applies to the first field, and id={{ start, end }}
sets both. Bind:nativeElement, startInput, and endInput expose DOM.
Bind:this provides focus({ index:0|1, preventScroll, cursor }) and blur().
Native onfocus and onblur apply to the input. The rest of the upstream semantic
event API remains outside the port.

`components.input` receives `range: 'start' | 'end'` for each endpoint.
Classes, mask, and form attributes go in attributes. StartInput and endInput
bindings still expose HTMLInputElement. Connect a custom textarea through
register. Replace OK through components.button. [Editor and button context](date-picker.md#editor-and-confirmation-button)

Both range calendars use the snippet for the current mode. Range identifies the
active endpoint. The second calendar's pickerValue is shifted to the next
period, and its onPickerValueChange converts it back to the first calendar's date.
HoverRangeValue contains the preview range. If highlighting only one candidate
date, it is passed as hoverValue. [Panel context](date-picker.md#custom-panels)

Checks cover SSR without browser APIs, input, errors, clear, focus transitions,
time confirmation, constraints and from, nullable endpoints, controlled
rejection, Form and native submission, and UTC across browser zones.
[Remaining coverage](../ant-design-porting/status.md)
