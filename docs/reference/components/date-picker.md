# DatePicker

DatePicker selects a date, time, date and time, week, month, quarter,
or year. The value is a Day.js object, and clearing returns `null`.
`undefined` enables local state with `defaultValue`.
`onChange(value, dateString)` receives the date object and the
displayed string.

```svelte
<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import { DatePicker } from '@woodger/antd';
  let value = $state<Dayjs | null>(dayjs('2026-10-29T10:30:15'));
</script>
<label for="when">Дата и время</label>
<DatePicker id="when" name="when" {value} showTime onChange={next => { value = next; }} />
```

`value`, `open`, and `pickerValue` are controlled through callbacks.
The owner can reject a change, and a supplied value remains under
the owner's control. Without `value` or `open`, DatePicker uses
`defaultValue` or `defaultOpen` and local state. `defaultPickerValue`
sets the panel's starting date on every open. `picker` selects
`date`, `time`, `week`, `month`, `quarter`, or `year`. Decade is a
navigation screen. `bind:nativeElement` points to the root `div`.
`bind:this` supplies `focus({preventScroll,cursor:'start'|'end'|'all'})`
and `blur()`.

## Custom date type

`DatePicker.generatePicker(adapter)` creates a picker family for a
`GenerateConfig<DateType>`. The adapter provides calendar operations,
locale, formatting, and parsing.

```ts
import { DatePicker } from '@woodger/antd';

const Picker = DatePicker.generatePicker(dateAdapter);
const { WeekPicker, MonthPicker, YearPicker, TimePicker, RangePicker } = Picker;
```

`generatePicker` is also a named export. Use `picker="quarter"` on
`Picker` for quarters and `picker="time"` on the family's `Picker`
or `RangePicker` for time. `value`, `presets`, constraints, and
callbacks use the adapter's date type. In Svelte templates,
`Picker.RangePicker` infers that type for `value` and `onChange` in
calendar and time modes. Custom panels receive the original
`generateConfig`. The selected object reaches the owner with the
same reference.

In a generated `RangePicker` with `picker="time"`, entering hours and
minutes in a populated field preserves that endpoint's date. An
explicit date format such as `YYYY-MM-DD HH:mm` can change it. The
adapter parses the text.

## Time selection

`picker="time"` opens the time columns. Without an explicit `format`,
the editor uses the locale's time format. `showTime.format` sets the
column format independently of the input format. Confirmation is
enabled by default.

`DatePickerTimeProps` describes time mode. It uses
`ConfigProvider.datePicker` styles, passes `'time'` to
`renderExtraFooter` for the time panel, and reports
`{ source: 'time' }` in `onCalendarChange`. Generated
`Picker.TimePicker` takes slots and icons from
`ConfigProvider.timePicker`.

## Multiple selection

`multiple` enables selecting several dates, weeks, months, quarters,
years, or time values with `picker="time"`. `value` and
`defaultValue` accept an array of Day.js objects or `null`.
`onChange` receives arrays of dates and formatted strings.
Clearing all passes `null, null`. Removing the last tag with the
field closed passes `[], null`.
`DatePickerMultipleProps` and `DatePickerTagContext` are exported.
For imperative `mount` and `render`, specify array mode as
`DatePicker<true>`.

The calendar updates the draft and calls `onCalendarChange`. With
`needConfirm`, OK calls `onOk`, then `onChange`, and closes the panel.
Closing without confirmation restores the accepted set. Without
`needConfirm`, a changed nonempty set is published on close. A
preset changes the period immediately and leaves the panel open.
`order={false}` keeps selection order. A value rejected by the owner
remains a draft until close. If `onOk` immediately accepts the new
array or closes via `open`, the picker reports the changed selection
and close request within that same confirmation. `showTime` adds
columns to a single calendar.

For multiple times, the columns show the first selected tag.
Selecting a time matching to the second removes the first such tag.
The tag's remove button removes all matches. With an empty set, OK
can accept `defaultOpenValue`. Root DatePicker passes
`{ source: 'time' }` in `onCalendarChange`. Generated
`Picker.TimePicker` accepts `multiple` and three events with arrays.
Its type is exported as `TimePickerMultipleProps`. For `mount` and
`render`, use `Picker.TimePicker<true>`.

`maxTagCount` accepts a number or `'responsive'`. `tagRender` receives
the label, Day.js object, `disabled`, `closable`, and `onClose`.
`removeIcon` changes the remove button's contents. The field keeps
`id`, `name`, and its accessible name. ArrowDown moves focus into
the panel. FormData receives comma-separated value strings,
including hidden tags.

The measurements retain upstream cases. Package tests compare
values, action order, mode switching, and hydration.
[React browser measurements](../../../tests/browser/fixtures/ant-design-date-picker-multiple-browser.json.gz) · [SSR measurements](../../../tests/browser/fixtures/ant-design-date-picker-multiple-ssr.json.gz)

## Formatting and calendar modes

`picker` sets the field format and final selection type. `mode`
controls the open panel. `onPanelChange(viewDate, nextMode)` reports
the proposed date and mode. Keeping `mode` unchanged keeps the
panel at its current level. Intermediate selection updates the draft.
For `multiple`, it changes only the panel, and date selection
starts at the `picker` level.

`DatePickerMode` includes `date`, `week`, `month`, `quarter`, `year`,
`decade`, and `time`. Enable `showTime` for columns on the `time`
panel. `pickerValue` independently controls the panel's displayed
date. Removing `mode` returns the panel to `picker`. In 6.6.8, the
first selection after removing `mode` can jump to the decade panel.
[React measurements](../../../tests/browser/fixtures/ant-design-date-picker-panel-mode-browser.json.gz)

`format` accepts a string, an array of allowed formats, a display
callback, or an object `{ format: 'YYYY-MM-DD', type: 'mask' }`.
Without `type`, the object acts like a format string. Callback-only
format makes the input readonly. Date defaults to `YYYY-MM-DD` and
showTime to `YYYY-MM-DD HH:mm:ss`. Parsing is strict, so overflow and
invalid leap days are rejected. Invalid text preserves `value` and
reverts on blur. `preserveInvalidOnBlur` retains it.
`inputReadOnly` sets native readonly while keeping calendar and
clear. As in Ant Design, mask keys can change segments even when
readonly. `allowClear` defaults to `true`.

The mask supports `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`, and `SSS`
for date and datetime, RangePicker, TimePicker, and TimeRangePicker.
Arrows move selection or change the segment. Backspace and Delete
restore its template. Incomplete text stays in the field without
replacing the calendar date. With valid text, Enter applies the
stored Day.js object. Enter without edits preserves the hidden
time. Manual `SSS` input is independent of panel step rounding.
Changing format preserves the field, focus, and unconfirmed range
endpoints. For example,
`<DatePicker format={{ format: 'YYYY-MM-DD', type: 'mask' }} />`.
[Numeric mask reference and comparison limits](../../../tests/browser/fixtures/ant-design-date-picker-mask-source-notes.md)

`picker="month"` and `picker="year"` are supported on DatePicker
and RangePicker. Their default formats are `YYYY-MM` and `YYYY`.
Placeholders and formats come from their locale fields. Explicit
`format` takes precedence. `showTime` is ignored in both modes.
`needConfirm` defaults to `false`, and explicit confirmation
calls `onOk` before `onChange`. Period selection preserves hidden
day and month with upstream Day.js clamping. For example, January
31 becomes February 29 in a leap year. A calendar cell gets
zero time. Presets keep the full timestamp and reference.
Changing `picker` updates format and open panel mode while keeping
the field, focus, and value.

```svelte
<script lang="ts">
  import { DatePicker, RangePicker } from '@woodger/antd';
</script>
<DatePicker picker="month" />
<DatePicker picker="quarter" />
<DatePicker picker="week" />
<RangePicker picker="year" />
```

Range shows adjacent years for month and adjacent decades for
year. Moving up leaves one panel. Disabled cells check the
start and end of the period. Bounds and validation account for
the selected period. Sorting still compares full timestamps.
With a disabled endpoint, it leaves endpoint order intact and
allows reversed hidden dates within the same period.

`picker="quarter"` uses `YYYY-[Q]Q` and four quarters in a row.
Locale supplies `fieldQuarterFormat`, `cellQuarterFormat`,
`quarterPlaceholder`, and `rangeQuarterPlaceholder`. Range shows
adjacent years. `showTime` is ignored and `needConfirm` defaults to
`false`. Selection preserves the hidden day with upstream
clamping, so January 31 gives April 30. `disabledDate` gets the
actual cell date with `type=quarter`, without extra checks at
the first or last day of the quarter. `minDate` and `maxDate`
allow a quarter that only partially fits the bounds. Presets
and sorting retain full timestamps. A disabled endpoint
allows reversed hidden dates within one quarter. Native cell
buttons support Tab and arrow keys.

`picker="week"` uses the upstream `gggg-wo` format and highlights
week rows. Range shows neighboring months. The panel locale
determines week start and number, including at year boundaries.
December 31, 2020 gives `2021-1st` for `en_US` and `2020-53rd`
for `en_GB`. For `en_GB`, load `dayjs/locale/en-gb.js`. The global
Day.js locale can stay as set. Ordinal week input keeps the
adapter algorithm, which selects January 1 plus a whole
number of weeks and keeps that January 1 weekday. Clicking a
day preserves its weekday. Clicking the week number selects
the actual start of the row. `showWeek` defaults on for week
and off for date. Explicit `false` removes the number column.
For ordinary date mode, numbers are checked with `type=week`
and days with `type=date`. Week prefixes and days check their
actual candidates individually. Min and max allow a partial
boundary week. Sorting preserves full timestamps, and a
disabled endpoint allows reversed dates within one locale
week. `showTime` is ignored and `needConfirm` defaults to `false`.

For displayed date, week, and quarter fields, `disabledDate`
receives the original model or calendar Day.js object with
hidden time and identity. After an actual edit, it checks the
stored candidate without parsing the string again. In these
modes, Range field validation passes only `type`. On submitting
a full range, it validates the start without `from` and the end
with the actual start. Panel validation retains its own `from`.
The `mode` array in date-mode `onPickerValueChange` retains its
reference until the mode changes.

`showTime=true` or an object adds time columns. Visibility
flags, steps, `use12Hours`, `hideDisabledOptions`, `disabledTime`,
and `changeOnScroll` can go on the field or in `showTime`. Nested
settings take precedence. `showTime.format` sets the panel format.
`changeOnScroll` selects the nearest available cell 300ms after
manual scroll. `needConfirm` defaults on for datetime and off
for date. Selection changes the draft and calls
`onCalendarChange`. OK reports the draft via `onOk` before
`onChange` and closing. RangePicker calls `onOk` for each endpoint.
`onChange` publishes the changed range once all available endpoints
are confirmed. Calendar OK requires a valid date in the active
field even with `allowEmpty`. Enter in a single date field or in
a range field commits valid text without `onOk`. Escape and
outside click discard an unconfirmed draft. In a single field,
Now applies a valid current time immediately through the preset
path.

With empty datetime, `defaultOpenValue` on the field or in
`showTime` sets time. RangePicker takes a pair, one per endpoint.
Without a pair, empty endpoints use zero time. The date remains
the current panel date. Hovering over a date or time gives the
same preview result. The original `defaultPickerValue` and
the panel date passed on reset retain their full time and
identity.

Selecting a calendar cell or time option calls
`onCalendarChange` first, then reports a changed panel date
via `onPickerValueChange` with `source: 'panel'`. Comparison uses
year, month, and day, and all time units for datetime. Week
compares the year of the locale week start and its number.
Month compares year and month, quarter year and quarter, and
year the year. Calendar and change events retain the full
value. Reopening reports open first and then any actual panel
reset. A rejected controlled open leaves the panel as it was.
Escape in a DatePicker field reports cancellation of a
changed draft before closing, preserving public `null` and
empty string values and `info` with `{source}`. TimePicker and
TimeRangePicker keep their own event handling.

`presets` accepts ready Day.js objects or zero-argument functions.
Labels are strings or Snippets. The function runs separately on
hover and selection without a `this` binding.
`previewValue='hover'` temporarily displays the date under the
pointer without changing the selected `value`. `false` disables
preview while still evaluating lazy presets. Turning off an
active preview keeps its text until the popup closes.

Choosing a valid preset immediately applies its full Day.js
value and closes the popup, including with `showTime` or
`needConfirm`. `onOk` is skipped and time is independent of panel
step rounding. An invalid preset changes the calendar draft
and calls `onCalendarChange` before checking constraints. It
keeps the previous `value` and the popup open. Focus moves to
the panel container. Escape from the panel preserves this
draft. Escape from the input restores the committed value.
If the controlled owner rejects a valid preset, `value`
stays the same while calendar and text retain the submitted
date until reset.

`cellRender(current, info)` replaces calendar or time cell
content. Calendar `current` is a Day.js object. Time uses a
number or `am` or `pm`. `info` contains the effective
`prefixCls`, completed `locale`, `today`, and `originNode`.
Time also gives `subType`, including `millisecond`. RangePicker
`range` names the active field (`start` or `end`) and is
shared by both calendars. The calendar's `current` gets time
from `showTime.defaultOpenValue` or zero. Selected time is
stored separately. `today` and `locale` follow upstream panel
ownership. Calendar and time share the locale, while two
range calendars have separate locales. The default cell
uses `locale.cellDateFormat`, `monthFormat`, and
`cellYearFormat`. `info.locale` fallbacks use the original
`showTime` flags independently of visible column format.
Only setting `showTime.format='HH:mm'` retains
`fieldTimeFormat='HH:mm:ss'`.

`originNode` is a Snippet of the complete native default
button. It can be wrapped to retain selection and keyboard
navigation, or replaced entirely. A full replacement owns
its focusable elements. Mouse selection remains on the outer
cell and honors disabled state. A custom control can stop
click propagation to avoid selecting the date.

`panelRender(content)` receives the complete layout Snippet
for presets, calendar or time, and footer. A wrapper calling
`{@render content()}` retains the layout. Omitting that render
skips cells and footer. The library still owns the outer
popup, panel container, and range arrow.
`renderExtraFooter(mode)` receives the current panel mode
(`date`, `month`, `year`, or `decade`, including `date`
with `showTime`). An empty Snippet keeps the extra footer,
while an omitted prop removes it. Existing zero-argument
Snippets remain compatible. Today or Now appears in date mode.
With `needConfirm`, OK is available in other modes as well.
Custom inputs, textareas, selects, and contenteditable in
hooks receive focus on normal mouse press.

```svelte
<script lang="ts">
  import { DatePicker } from '@woodger/antd';
</script>

<DatePicker>
  {#snippet cellRender(current, info)}
    <span class="custom-date-cell">{@render info.originNode()}</span>
  {/snippet}

  {#snippet panelRender(content)}
    <section>{@render content()}</section>
  {/snippet}

  {#snippet renderExtraFooter(mode)}
    <small>Режим: {mode}</small>
  {/snippet}
</DatePicker>
```

Render hook tests compare arguments for four panel modes and
all 47 fields of `en_US` with unmodified React behavior. The
manifest contains two independent CSR runs, each with four
owners, 122 actions, and 126 states, plus eight closed SSR
serializations per run. Complete source parts are kept in gzip.
These comparisons retain the documented adaptation boundaries
for React's retained popup, native input focus hooks, and
Svelte Snippet lifecycle. [Render hook tests](../../../tests/browser/picker/date-picker-render-hooks.spec.ts) ·
[React reference](../../../tests/browser/fixtures/ant-design-date-picker-render-hooks-facts.json) · [Upstream manifest](../../../tests/browser/fixtures/ant-design-date-picker-render-hooks-source-manifest.json)

Preset and transition captures contain 19 profiles, 181 actions,
200 states, 42 closes, and both closed SSR serializations of
each profile. The complete raw parts are retained without
transformation. Native `HTMLInput` focus and blur handlers and
the third `onCalendarChange` argument `{source}` are preserved.
React composite focus callbacks have a different contract.
The removable native popup and Snippet lifecycle adapt the
retained React popup. Browser tests record these boundaries
separately. In 13 transition profiles, the initial unfocused
caret at the end of the text has direction `none` in Svelte
and `forward` in React. After interaction, direction is compared
strictly. [Upstream preset captures](../../../tests/browser/fixtures/ant-design-date-picker-presets-source-manifest.json) ·
[Transition captures](../../../tests/browser/fixtures/ant-design-date-picker-preset-transitions-source-manifest.json)

Datetime column scroll persists between openings when values,
time template, and rows stay the same. Changing the actual
popup container creates new columns. A different function
returning the same container keeps them. On datetime reset,
`onPickerValueChange` accounts for time and milliseconds.
Date-only compares calendar dates. If selected time is off
the step grid, changing constraints while closed preserves
manual column scrolling. The time template and container and
off-step cases use independent React measurements. The
off-step fixture retains observations from both runs and
points to the revision with the complete archive. Browser
tests compare states, arguments, CSS, and geometry. SSR
checks closed inputs and the absence of browser APIs.
[Time template and container](../../../tests/browser/picker/date-picker-time-scroll.spec.ts) · [Off-step value](../../../tests/browser/picker/date-picker-offgrid-scroll.spec.ts)
· [Browser tests](../../../tests/browser/picker/date-picker-presets.spec.ts) · [SSR tests](../../../tests/package/picker/date-picker-presets.ssr.test.ts)

DatePicker, RangePicker, TimePicker, and TimeRangePicker
confirmation buttons use the shared Button with `size=small`
and `type=primary` as in upstream PickerButton. They inherit
`ConfigProvider.button`, `components.Button`, and Wave. The
locale string preserves Button's `autoInsertSpace` and semantic
props. Native `disabled`, `type=button`, confirmation order,
Day.js precision, and focus restoration are preserved.
The fixture is `?fixture=picker-button`. [Picker button tests](../../../tests/browser/picker/picker-button.spec.ts)

Precision follows rc-picker. Panel selection aligns every time
unit, including hidden units. `millisecondStep` defaults to 100.
Alignment picks the nearest allowed value at or below the
current one, or the first allowed value. `showTime.format`
sets the time panel format. Input format comes from
`DatePicker.format` or `locale.lang.fieldDateTimeFormat` as
upstream. Columns resolve from `showTime.format`, then the
first `format` entry if a string, then the locale datetime
format. Explicit `showHour`, `showMinute`, `showSecond`, and
`showMillisecond` take precedence. `use12Hours` is inferred
from the format when omitted. A date-only input format keeps
ordinary hours, minutes, and seconds. Set
`showTime={{millisecondStep:1}}` for a one-millisecond step.
Manual input with `SSS` uses strict parsing without panel
rounding. The adapter leaves timezone policy to the owner.
Calendar operations preserve the input Day.js mode. The parser
uses `dayjs(text,format)`, and `getNow` respects a timezone
plugin loaded by the consumer as upstream. The library does
not enable UTC or timezone plugins automatically.

Bracketed format text does not enable time units. In Ant
Design 6.6.8, `YYYY-MM-DD [Hours]` incorrectly leaves only
hours and seconds. Svelte retains its normal hours, minutes,
and seconds fallback. The measurements retain the raw
case and browser tests check the difference.
[Datetime configuration measurements](../../../tests/browser/fixtures/ant-design-datetime-config-reference.json) ·
[Browser suite](../../../tests/browser/picker/datetime-config.spec.ts)

`minDate`, `maxDate`, and `disabledDate` restrict the calendar.
`disabledTime` returns disabled hours, minutes, seconds, and
milliseconds. Size, status, variant, disabled, Compact, RTL,
theme, `locale.lang`, and `ConfigProvider.locale.datePicker`
inherit their existing contexts. Upstream Russian and English
strings are built in. The input uses native `name`, `id`, and
`required`. FormData holds the displayed text, without a
hidden ISO copy. FormItem context provides ID, name, status,
and disabled. The Form model stores immutable Day.js objects
directly, for example `value={form.values.when}` and
`onChange={next => form.setFieldValue('when', next)}`.
`onFinish` gets the Day.js object and `resetFields` restores the
initial value. The consumer handles wire-format conversion,
as upstream.

Enter opens or commits valid input. ArrowDown moves focus
to the calendar. Arrows, PageUp, PageDown, Home, and End
navigate the grid. Escape closes and restores focus. Time
uses native buttons and arrows between column entries. The
surface uses the existing native popover lifecycle, including
Compact isolation, outside closing, and dialog top layer.

DatePicker, RangePicker, TimePicker, and TimeRangePicker
support local `getPopupContainer` with fallback to
`ConfigProvider.getPopupContainer`. `undefined` inherits the
provider. The getter receives the `div.ant-picker` root and
returns an `HTMLElement` or `ShadowRoot`. With `defaultOpen`, a
zero-argument function is called with `undefined` first, then
with the root. A function declaring a parameter waits for
the DOM ref, as in rc-trigger. SSR skips the getter. Native
placement applies when no getter is selected.

### Editor and confirmation button

`components.input` accepts `'input'`, `'textarea'`, or a Svelte
Snippet. The built-in `'textarea'` fits the field width and
uses the picker's colors, font, and size. A custom editor's
Snippet owns its styling. It receives field `attributes` and
`register` for the DOM element. Spread the attributes on
the field and register it with `{@attach register}`. For
`textarea`, pass `value` separately so Svelte writes the
initial value into the text node during SSR. `multiple` retains
the default readonly field as in Ant Design React.

```svelte
<script lang="ts">
  import { DatePicker, type DatePickerEditorContext } from '@woodger/antd';
</script>

{#snippet editor({ attributes, register }: DatePickerEditorContext)}
  <input {...attributes} {@attach register} />
{/snippet}

<DatePicker components={{ input: editor }} />
```

`components.button` replaces OK in a confirmation panel.
Pass `'button'` for a native button or a Snippet receiving
`DatePickerButtonContext`. The context exposes `attributes`
with `type="button"`, `disabled`, and `onclick`.
`children` contains the localized label.

In Ant Design React 6.6.8, Enter inserts a newline in the
`textarea` and can reopen the DatePicker calendar or alter
the second RangePicker endpoint's text. In Svelte, Enter
commits the input without a newline.
[React browser measurements](../../../tests/browser/fixtures/ant-design-picker-components-editors.json.gz)

### Custom panels

`components` accepts Snippets for `date`, `week`, `month`,
`quarter`, `year`, `decade`, `time`, and `datetime`.
`datetime` replaces the calendar and time columns together.
The default panel is used for an omitted slot.
`panelRender` still wraps the whole layout with panel,
presets, and footer.

`DatePickerPanelContext` contains the view date `pickerValue`,
draft `value` and `values`, locale, Day.js `generateConfig`
adapter, constraints, and time settings. `disabledDate`
accounts for `minDate` and `maxDate`. `onSelect` accepts a
Day.js object and passes it to standard selection and
confirmation. `onPickerValueChange` reports navigation and
`onModeChange` requests a mode. For controlled `mode` and
`pickerValue`, the owner accepts or rejects updates.
The `datetime` key maps to public mode `date`.

```svelte
<script lang="ts">
  import { DatePicker, type DatePickerPanelContext } from '@woodger/antd';
</script>

{#snippet month(context: DatePickerPanelContext)}
  {@const date = context.pickerValue.startOf('month')}
  <button type="button" onclick={() => context.onPickerValueChange(date.add(1, 'month'))}>
    Следующий месяц
  </button>
  <button type="button" disabled={context.disabledDate(date, { type: 'month' })}
    onclick={() => context.onSelect(date)}>
    Выбрать {date.format('YYYY-MM')}
  </button>
{/snippet}

<DatePicker picker="month" components={{ month }} />
```

The replacement owns accessible markup and `onHover` calls
for previews. The context exposes `cellRender`, which uses
the passed `originNode` when the owner supplied no renderer.
`prevIcon`, `nextIcon`, `superPrevIcon`, and `superNextIcon`
accept text or Snippets and apply to the default header
as well. Focus stays inside the popup if a focused button
disappears on a slot change.

### Semantic styling and provider settings

DatePicker and RangePicker accept `prefix`, `classNames`, and
`styles`. `prefix` renders a string, number, or Snippet
before the editor. `classNames` and `styles` support `root`,
`prefix`, `input`, `suffix`, and `popup` roles `root`, `header`,
`body`, `content`, `item`, `footer`, and `container`. A string
`popup` applies to `popup.root`. Styles are CSS strings.
Both props accept a slot object or a function
`({ props }) => slots`. The function sees local field props
with resolved `size` and `disabled` and can return `undefined`.
In datetime, `header`, `content`, and `item` style both calendar
and time columns, and `body` styles the calendar. Week numbers
are outside the `item` slot.

`ConfigProvider.datePicker` supplies shared `classNames`,
`styles`, `suffixIcon`, and `allowClear` for both fields and
`class`, `style`, and `variant` for single DatePicker.
RangePicker takes plain `class`, `style`, `variant`, and
`separator` from `ConfigProvider.rangePicker`. Classes combine.
The root applies provider `styles.root` and `style`, then
local `styles.root` and `style`. A nested provider inherits an
omitted setting. An explicit object, including `{}`, replaces
the parent setting in full.

`allowClear` accepts a boolean or `{ clearIcon }`. The local
value overrides the provider. When enabled, a local icon
takes precedence and an omitted icon inherits. Clearing is
enabled by default. The button retains an accessible name
from the locale.

DatePicker and RangePicker support `suffixIcon`. The local prop
overrides `ConfigProvider.datePicker.suffixIcon`. `true` or
`undefined` shows the calendar and Form feedback.
`null`, `false`, and the empty string hide the entire suffix.
A string, number including 0, or Snippet replaces the
generated suffix and feedback. TimePicker and TimeRangePicker
follow the same rules with a clock and
`ConfigProvider.timePicker`. RangePicker uses shared
`datePicker` configuration for the icon and `rangePicker`
for existing `class`, `style`, `variant`, and `separator`.
Suffix updates preserve the field and focus.

Semantic style updates preserve the field and open panel DOM,
focus, selection, and draft. Slot precedence is compared with
React 6.6.8. [Browser tests](../../../tests/browser/picker/date-picker-provider.spec.ts) · [SSR tests](../../../tests/package/picker/date-picker-provider.ssr.test.ts)

The upstream gap to the field is 4px. At unit scale,
coordinates are floored as in rc-trigger. The popup's minimum
width matches the selector. Placement defaults to
`bottomLeft` in LTR and `bottomRight` in RTL, with explicit
values taking precedence. A new getter returning the same
container preserves panel DOM, custom state, focus, selection,
and field draft. Changing the container recreates the panel
as with the upstream portal. Consumers supply ShadowRoot
styles. The getter leaves Day.js mode, UTC, precision,
FormData, and endpoint confirmation order intact.

The native panel is removed on close. Opening again recreates
custom footer and panel state. rc-trigger retains its popup.
The fixture `?fixture=picker-container` contains tests and 54
official UMD references. [Container tests and references](../../../tests/browser/picker/picker-container.spec.ts)

All four single and range date and time controls use
`ConfigProvider.theme.components.DatePicker` for component
tokens, as in Ant Design. Input, calendar, time columns,
presets, and popup use a shared theme. The confirmation
Button retains independent `components.Button` tokens. It
supports aliases, component algorithms, dark and compact,
nested providers, `inherit:false`, and a custom `cssVar`
prefix. Local `style` and existing semantic styles keep
precedence.

Token updates preserve field and open panel DOM, draft,
focus, selection, and the Day.js value. A time cell height
change preserves existing scroll in pixels as upstream.
Reopening aligns the selected time again. The datetime header
shows selected time in the panel format. An empty value leaves
the fallback date's time unhighlighted.
`?fixture=picker-theme` covers the checks and 15 UMD themes.
[Theme tests and references](../../../tests/browser/picker/picker-theme.spec.ts)

All four single and range date and time controls accept
`prefixCls`. The local owner overrides
`ConfigProvider.prefixCls` for the field, calendar, time
columns, and popup. The confirmation Button keeps the shared
namespace, internal affix color follows the shared prefix,
and component tokens and the theme marker remain canonical.
Time `cellRender` receives the resolved prefix. Generated
IDs retain the existing native format.

Prefix changes preserve open popup, DOM, refs, IDs, draft,
caret, focus, and pending datetime. DatePicker and RangePicker
synchronize text on a new `value` or a change in its display.
Context updates without these changes preserve the draft.
Actual `format` changes still update the field. UTC, precision,
endpoint confirmation, forms, and callback order are preserved.
`?fixture=picker-prefix` compares 33 variants in normal, nested,
and reset scopes, live drafts for all four controls, default
styling, and custom container cleanup.
[Official UMD comparison](../../../tests/browser/picker/picker-prefix.spec.ts)

Prefix stylesheet defaults have zero specificity. The
canonical native styling still sets background, focus shadow,
and size without an upstream theme. The comparison uses
`ant` with light/blue, dark/green, and compact/purple.
Internal Snippets, head, and popup boundaries add no text
beside controls. SSR also checks `defaultOpen`, and browser
tests check the shared prefix update.
[Default styling comparison](../../../tests/browser/config-provider/prefix-default-styling.spec.ts)

The registry tracks remaining events and upstream popup
lifecycle. [Porting registry](../ant-design-porting/status.md)

### Panel placement

Single and range date and time panel layers use the
shared popup rules. [Popup layer rules](../theme-context.md#layering-nested-panels)

DatePicker, RangePicker, TimePicker, and TimeRangePicker
accept `popupAlign` and `builtinPlacements`. The same
settings apply to the `generatePicker` factory.
`builtinPlacements` replaces the entire built-in map.
`popupAlign` overlays the `placement` entry and replaces
supplied fields, including `overflow`. If the combined
settings omit `points`, the panel's center is anchored
to the field center.

`points` sets a pair of panel and field points. For example,
`['tl', 'bl']` connects the panel's top left to the field's
bottom left. Numeric offsets are in pixels. Percentage
`offset` is relative to the panel size. `targetOffset`
is subtracted from the field's position and uses the field
size. `overflow` governs flipping and shifting, and
`htmlRegion` sets the area to check. With default settings,
the panel also shifts inside the viewport when its size
allows. Alignment respects scroll-container bounds and the
panel stays in the browser's top layer.

If the map has an entry for current `placement`, new offsets
apply on the next measurement, for example after field
resize or scroll. Without an entry, updating `popupAlign`
triggers measurement immediately. The placement class uses
the last measured point pair and current map. Replacing the
map can update the class before positions recalculate.
The tests compare 34 scenarios against Ant Design 6.6.8.
[Tests](../../../tests/browser/picker/picker-alignment.spec.ts)
