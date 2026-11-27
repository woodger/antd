# Numeric mask / scalar object-format Source preparation

Preparation only. No browser, Source CSR/SSR, Native code, library build, dependency or tracked runtime change is performed. Root must finish the week stage/commit, review this exact proposal, freeze it and grant a separate exclusive lease before execution. Original week/date+showWeek sources, shared mechanisms and final Native8 stay unchanged.

## Authored matrix

Five ordinary public owners: DatePicker date, DatePicker showTime, DatePicker.RangePicker date, TimePicker, TimePicker.RangePicker. All start controlled with stable Dec31 2020 16:37:59.456; Range end is Jan15 2021 19:41:23.789. Controlled callbacks accept their actual payload objects. A separate explicit value-only owner action restores the same original authored Date/tuple before the mask pristine probe; it does not call a picker callback or change format. Format-only controls change one public prop. Dates, panel/id/style/theme/config/format objects and functions keep stable authored references.

| Owner | String and scalar object without type | Explicit mask object | Ordinary text / numeric key sequence |
| --- | --- | --- | --- |
| Single date | YYYY-MM-DD | YYYY-MM-DD | 2021-01-18 / 20210120 |
| Single datetime | YYYY-MM-DD HH:mm | YYYY-MM-DD HH:mm:ss.SSS | 2021-01-18 18:19 / 20240229111213345 |
| Range date | YYYY-MM-DD | YYYY-MM-DD | 2021-01-18 / 20210120 |
| Single Time | HH:mm | HH:mm:ss.SSS | 18:19 / 202122345 |
| TimeRange | HH:mm | HH:mm:ss.SSS | 18:19 / 202122345 |

Each owner has exactly15 authored macro actions:
0 input-open start;1 Enter(pristine string);2 format-object;3 input-open Single0/Range1;4 Enter(pristine object);5 ordinary typing Single0/Range1 with real Control+A and listed characters;6 Enter(typed object);7 restore-authored-value only;8 format-mask only;9 input-open start;10 Enter(pristine mask);11 mask-edit Single0/Range1;12 Enter(typed mask);13 incomplete-enter Single0/Range1;14 Escape in that field followed by actual+1000 read regardless of outcome.

Mask-edit physically clicks near the actual text start, then presses ArrowRight, ArrowUp, ArrowDown, ArrowLeft, Delete and each listed digit separately. Incomplete-enter physically clicks near the text start, presses Backspace, retains complete before/afterCall/settled reads, then presses Enter and again retains all three reads. Input Escape also uses a real click before the key. The seven numeric tokens are addressed through actual arrows/digits and browser selection; no setSelectionRange, selection injection, forced event, changed disabled attribute, fake callback or private picker call is used. Text-start coordinates derive from actual input box/CSS padding/border/text-indent plus2px, with an actual hit check. Pristine opens use center clicks.

These strings/keys describe user input, not selected-date expectations. The Source first/repeat outcomes determine valid/invalid behavior, hidden fields, candidate/calendar/change/model identities, callback counts/order, confirmation/close and caret positions. In particular, `next-source-observation.md` identifies a future Enter question; its code-derived expectation is not substituted for a new Source observation.

## Honest physical counts and whole storage

75 authored macros are not75 physical states. There are167 explicit Playwright keyboard.press calls (five are Control+A chords),35 mouse moves,35 mousedowns,35 mouseups and15 DOM owner button.click operations:287 explicit substeps. Actual keydown/keyup counts, implicit modifier events and selectionchange events are observed, not predicted from API call counts.

Every explicit substep has its own whole UI JSON/gzip part with complete scoped before/afterCall/settled reads and its own complete producer delta/cursors. Mouse-down is observed while the physical button is held; mouse-up is separately observed. Each macro has a separate whole part binding its child references. The manifest also lists all child UI references directly with their macro/substep indexes and commands, so no original part is undiscoverable. Macro afterCall preserves the actual final child's immediate afterCall snapshot and cites that child part; it never replaces it with settled. It is a repeated reference to that snapshot, not a new read or a later clock position. The macro producer tail carries aggregate macro window boundaries that can precede its cursor because earlier child chunks already contain those calls; every row itself remains in one contiguous producer chunk.

Per CSR:100 macro/lifecycle UI parts +287 child UI parts =387 UI parts;392 producer parts including five terminal tails;779 whole parts. There are80 initial+macro-settled slots,1111 retained full phase positions, including75 explicit references to final-child afterCall snapshots;1036 distinct retained full reads. Intermediate stability polls are not included in those retained counts. Five real unmount/cleanup/late sequences and five Escape+1000 reads remain separate.

Closed SSR has three declared initial format profiles string/object-without-type/mask for each of five owners, each through renderToString and renderToStaticMarkup in a fresh original DOM-free VM:30 serializers per run. The only owner-baseline override is initialFormatProfile. CSR starts string; SSR object/mask are separately labelled initial profiles. US locale only. SSR uses actual VM wall clock; CSR uses Date-only fixed2024-06-10T08:23:45.678Z with real RAF/timers. Four future serial runs therefore preserve1618 original parts. No open popup is simulated in SSR.

## Observation and limits

The unchanged Source physical reader retains full owner/root/popup/header/table/TR/TH/TD/time-column HTML/attributes/CSS/rects, fields/carets/focus/refs/connectivity, all raw/encoded callback arguments, actual arity/receiver, Date paths/all wall fields/ISO/offset/locale/authored and within-argument aliases. The ordinary owner also retains actual format object graphs and value-reset controls. Stable disabledDate returns false; stable disabledTime (time/datetime only) returns a stable empty object, logging every real argument/from/return graph. They create no restrictions and are never manually called by the collector. Default millisecondStep100 remains; SSS field input is still observed exactly, without introducing1000 time rows for step1.

The removable document capture observer adds actual mousedown/mouseup/keyup/selectionchange/beforeinput and composition observations to the known event journal. It records actual input value/selection at event capture, trust, key/modifiers, coordinates and producer/callback cursors. It changes no global timer/selection/event APIs. Every physical substep remains a full point even when event-capture state is only a pre-handler snapshot. Browser resource counters remain unmeasured; network/errors/console/ResourceTiming remain actual.

Clipboard paste is excluded: no existing real clipboard roundtrip was confirmed and no permissions will be granted. No ClipboardEvent or pasted value is fabricated. This first bounded contour also does not claim all preserveInvalidOnBlur=true/IME/custom-editor/locale/unsupported-token/multiple combinations; composition events are passive observations only. Existing native full-button calendar, Today-button and native focus/blur boundaries remain separate from mask/object-format work.

Only known unchanged codec/shared script/whole-part writer/physical reader and the original CSR/SSR loading/settling mechanisms are reused. New code is a bounded ordinary caller and explicit command coordinator, not a generic framework. All failure parts/frozen inputs remain immutable; no automatic retry or amendment. Root reviews each actual process terminal before the next, and records release after all four. Read-only audits then verify every original whole byte and report phase variances without normalizing IDs or arguments.
