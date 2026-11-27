# Calendar

Calendar defaults to a full month with six rows of dates. Set
`fullscreen={false}` for a mini calendar. Year mode shows 12 months and
remains active after a month is selected.

```svelte
<script lang="ts">
  import dayjs from 'dayjs';
  import { Calendar } from '@woodger/antd';

  let value = $state(dayjs('2024-09-15'));
</script>

<Calendar {value} onChange={next => { value = next; }}>
  {#snippet cellRender(date, info)}
    {#if info.type === 'date' && date.date() === 15}<span>Событие</span>{/if}
  {/snippet}
</Calendar>
```

Without `value`, Calendar uses `defaultValue` or `getNow()`.
`defaultValue` is read once. The owner controls supplied `value` and
`mode` through callbacks, without `bind:value` or `bind:mode`. Keeping
the prop unchanged preserves the selection and mode. As in PickerPanel,
clicking a neighboring date moves the panel's visible month even when the
owner rejects the new `value`. The header still shows the selected
value. Removing a controlled prop clears the local value without
returning to `defaultValue` or `month`, following the studied
`useControlledState` implementation.

The selection order is `onPanelChange` when the panel month or year
changes, `onChange` when the calendar day changes, then `onSelect`.
Selecting the same day again calls only `onSelect`.
`CalendarSelectInfo.source` distinguishes `date`, `month`, `year`,
and `customize`. The mode switch calls only `onPanelChange`. Calendar
uses the shared Day.js adapter without application-level serialization
or normalization. UTC, timezone offset, time, and milliseconds are
covered by tests.

`validRange` compares full timestamps inclusively before calling
`disabledDate`. Whether a month is disabled is calculated from its
first and last days with their time preserved. Dates within the month
are not scanned. A range inside one month can therefore disable the
entire month, as in rc-picker. Years and months in the header are
limited by `validRange`. Header actions bypass `disabledDate` and do
not clamp the day of the month to the range boundaries.

`headerRender` receives `value`, `type`, `onChange`, and
`onTypeChange` and replaces the entire header. `fullCellRender` replaces
the cell contents and takes precedence over `cellRender`, which adds
content to the standard date content. `originNode` in
`CalendarCellRenderInfo` is a Svelte Snippet for the original rc-picker
inner content. For a date, `info.locale` contains the completed formats.
For a month, it contains the original `lang`. `showWeek` adds separate
cells without rendering Snippets. They select the start of the row with
`source=date`. Cells are preserved by row and column position as
upstream.

Locale comes from `ConfigProvider.locale.calendar`, independent of
DatePicker. The built-in `enUS` and `ruRU` and Ant Design dictionaries
include Calendar. The default is `ruRU`. The Calendar dictionary in
ConfigProvider replaces the previous one in full, as for DatePicker. A
local `Calendar.locale` merges its `lang` fields with the base
dictionary and context. The consumer loads other Day.js locales.
[Locale setup](../themes.md#interface-language)

`classNames` and `styles` accept objects or callbacks for `root`,
`header`, `body`, `content`, `item`, and `itemContent`. Callback props
preserve the supplied `mode` and `showWeek`, with `fullscreen`
defaulting to `true`. After the component theme, root styles apply in
this order: context `styles.root`, context `style`, local `styles.root`,
and local `style`. Nested `ConfigProvider.calendar` replaces the
component configuration in full. `bind:nativeElement` returns the root
`div` and clears on unmount. Calendar adds no hidden serialized date
field. Its header controls do not receive FormItem's `name`, `id`, or
`required`.

`generateCalendar(adapter)` is a separate export in place of React's
static `Calendar.generateCalendar`. The factory returns a Svelte
component with the same props, reactive `value` and `mode`, and
`bind:nativeElement`. `CalendarGenerateConfig` defines the upstream date
operations. [Types and defaults](../../../src/lib/calendar/calendar.types.ts)

For accessibility, the table has `role=grid`. Its cells have
`role=gridcell`, selected, disabled, and today states, and one Tab stop.
Arrow keys, Home, and End move focus only. Enter and Space select. Standalone
rc-picker omits these keyboard handlers. Nested inputs and buttons
retain their own keyboard behavior. `stopPropagation` on a custom
control prevents selection of its parent cell. The header uses the
existing native Select and RadioGroup with accessible names.

The pinned bundle provides 123 Calendar CSS rules, including full and
mini modes, week cells, and the mobile header. Themes, primary color,
compact mode, and RTL use the library's current tokens. On desktop,
without an upstream theme, the header's Select wrappers retain their
80px and 70px widths. With an upstream theme,
`yearControlWidth` and `monthControlWidth` set minimum widths as
upstream. A hidden text sizer preserves the readonly input's intrinsic
size even at 0px or 10px. The mode switch keeps individual buttons
from wrapping. In viewports up to 480px, the year and month controls
sit side by side above the mode switch, as in upstream Calendar. A
CSS margin sets the gap between selectors. The header test covers field
and button bounds in 300px and 360px mini calendars, mobile and RTL
layouts, the dropdown, and keyboard behavior. [Calendar header test](../../../tests/browser/calendar/calendar-header.spec.ts)

`ConfigProvider.theme.components.Calendar` applies all six public
tokens, alias overrides, and global and component algorithms. The
shared picker panel helper reproduces 21 internal defaults without
exposing TimePicker or multiple selection APIs in Calendar. Local CSS
variables and configuration, semantic, and local styles retain
precedence. The internal Select and Radio use their own themes.
Intrinsic sizing is enabled only for the upstream-styled Calendar
header. The public Select default is unchanged.

The reference covers 17 themes and 136 sets for eight scopes. Full and
mini month and year panels are compared in normal, RTL, and priority
scopes. Mini month is also compared in variable, nested, reset, sibling,
and outside scopes. Additional measurements use a 400px viewport.
Comparisons cover colors, cell and header metrics, string, zero, and
undefined sizes, and independent child themes. [UMD reference](../../../tests/browser/fixtures/ant-design-calendar-theme-reference.json)

Browser tests cover focus and date selection, exact callback timestamps,
open options and input DOM on theme change, inheritance reset, and
return to default styling. Unit tests compare declarations against
the UMD. SSR tests ensure rendering creates no browser resources.
[Browser tests](../../../tests/browser/calendar/calendar-theme.spec.ts) · [Unit tests](../../../src/lib/theme/theme-calendar-tokens-reference.test.ts) · [SSR tests](../../../tests/package/calendar/calendar-theme.ssr.test.ts)

Calendar accepts a local Picker `prefixCls` and appends `-calendar` to
the root class. Without an override, it uses `ConfigProvider.prefixCls`.
Cells, `originNode`, and `cellRender.info.prefixCls` use the same Picker
prefix. Header Select and Radio retain their independent shared
namespaces. Canonical tokens and the theme marker keep their names. CSS
selectors escape characters such as `+` in the prefix. DOM classes and
`cellRender.info.prefixCls` use the original value. Changing the prefix
preserves DOM, refs, IDs, the date and timestamp, text selection, focus,
open options, and keyboard navigation. The official UMD comparison at
`?fixture=calendar-prefix` covers full and mini, month and year, week, RTL,
aliases and styles, nested and reset scopes, and the 480px and 481px
responsive boundary. Prefix stylesheet defaults leave the native bridge
in effect. Dark backgrounds and compact metrics persist when switching
from the canonical `ant` prefix to a shared prefix. [Official UMD comparison](../../../tests/browser/calendar/calendar-prefix.spec.ts)

The existing rule keeping individual mode buttons from wrapping is
preserved. With enlarged tokens at 320px, the raw upstream layout wraps
buttons and stretches controls to 48px. For three header heights, there
is a separate comparison with public `style.width=400px`. Other metrics
are compared with the raw 320px layout. The native readonly Select shows
the year label in the input. Upstream places it next to an empty search
input. Native input value and selection are checked against their existing
contract.

React warnings and Select and Radio features yet to be ported are outside
the verified scope of this stage.
