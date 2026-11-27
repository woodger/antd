# Ant Design porting tools

> Type: Reference. The current coverage registry, CSS extraction, and browser fixtures.

The coverage summary is generated from registry.json. The component types and
documentation define public APIs and behavior. The registry records audit status
and agreed scope. A candidate entry is pending a scope decision. [Coverage summary](./status.md) ·
[Registry](./registry.json) · [Component types and documentation](../components/README.md)

## Project priorities

The owner sets the order based on application needs. The features below define
the first stages of work toward porting the current API. Compare behavior
against the pinned Ant Design and its dependencies.

1. **TextArea / Input.TextArea** covers native controlled values, name, rows,
   maxlength, required, disabled, readonly, errors, input, and selection events.
2. **Remote Select** covers controlled search, callbacks, loading and errors,
   disabling local filtering, loading more options, and selected values outside
   the current results. Consumers own network requests. Select itself already exists.
3. **DatePicker with time, followed by RangePicker** covers input and calendars,
   clearing, constraints, keyboard interaction, locale, and forms. Dayjs mode
   and precision follow upstream. Application UTC and ISO serialization are
   outside the component contract.
4. **Upload** covers multiple files, controlled lists, selection and drop, manual
   starts, errors, and removal. Compare upload behavior with upstream. Application
   server endpoints are outside the port.
5. **Tree, followed by TreeSelect** covers stable keys, expansion, selection,
   keyboard interaction, lazy children, loading, and errors.
6. **Menu** covers native links, selected items, horizontal and vertical modes,
   groups, submenus, and keyboard navigation.
7. **Later stages** cover AutoComplete, Mentions, and Image preview after core
   forms and selection.

## Registry

The development CLI lives in `tools/cli.mjs`. It uses the dev dependency
`icore` to parse command paths, positional arguments, and option schemas.
Project handlers validate the registry and extract CSS.

```sh
npm run cli -- --help
npm run cli -- registry --help
npm run cli -- css --help
```

Run project tools from the library repository root. Resolve local evidence
paths, CSS output, `.upstream`, and `--archive=path` relative to that root.

Run `node tools/ant-design-locales.mjs` to regenerate the locale catalog.
It reads the pinned archive and React UMD from `.upstream/artifacts`. Use
`--artifacts` for a different directory. The script verifies the archive
SHA-256 and repeats extraction before writing the submodules and test summary.

The owner authorized autonomous porting of the current Ant Design 6.6.8 API.
Dependencies and reference readiness determine the component order. The goal
is a complete Svelte 5 port with minimal structural and behavioral differences
from React. Before implementation, move a candidate to target with specific
scope and evidence. Save each completed stage in its own Git commit after
relevant checks. Completed in-scope tasks can proceed without intermediate
approval.

Preserve current Svelte contracts and agreed adaptations. The target library
excludes deprecated APIs. Remove deprecated components, props, methods, values,
and token aliases, including existing implementations. Remove their
compatibility code, separate styles, tests, fixtures, and documentation.
Keep current replacements. Use the pinned Ant Design 6.6.8 and applicable
dependencies to establish deprecation. API age and an internal legacy name
alone are insufficient.

V1-ready assesses the first agreed scope. The final report separately accounts
for the entire upstream API, remaining gaps, behavior differences, and checks
actually run. Pushing and publishing are separate from this workflow.

Keep clear upstream defects out of the port. In the feature's `note`, record
the pinned version and revision, reproduction, observed defect, and selected
Svelte behavior. Record disputed cases as observations for separate review
with the owner. Unexpected behavior alone is insufficient evidence of a bug.
Preserve existing public contracts unless the change requires otherwise.

Each entry represents one catalog family. Avatar and Avatar.Group are grouped
with their Avatar and AvatarGroup export mappings. The same applies to
Checkbox.Group, Radio.Group, Tag.CheckableTag, and Form.Item. The createForm,
createMessage, and createNotification factories count toward the API and leave
the component count unchanged. Default exports from *.component are Svelte
component facades with static APIs and count like direct *.svelte exports.
Theme API and useToken belong to ConfigProvider and add no Svelte component.

The pinned 6.6.8 catalog has 73 entries, including Icon, Util, and deprecated
List. External Pro Components are outside the catalog. Row and Col belong to
Grid. Deprecated BackTop is grouped within the catalog. Scope target marks
an agreed scope, candidate marks a pending decision, and excluded requires
an explanation. Avatar, Select, and DatePicker are detailed pilot entries.
Other entries list public exports and known limitations, and use unreviewed
for an outstanding detailed audit. An unreviewed entry can still have a
working v1 implementation.

Shared upstream fields define version, Git revision, npm archive URL, and
SHA-256. An entry includes upstreamPath, exports, known dependencies,
evidence references, priority, and effort. UpstreamPackages records the range
from package.json. ReferenceVersion stays null until an exact version has
been selected for review. Empty dependencies means no relationships have
been recorded.

Features describe functional groups beyond individual TypeScript props.

| State | Meaning |
| --- | --- |
| unreviewed | Detailed audit pending |
| missing | Feature absent from the public port |
| partial | Implementation exists with documented limitations |
| supported | Supported scope is verified and linked to evidence |

RequiredForV1 marks criteria for the chosen first scope. V1-ready requires
all of them to be supported and reviewedRevision to match the target
revision. Future extensions remain visible as gaps. Changing the reference
revision marks previously reviewed implementations needs-review. Families
without a public export are shown separately as not-started.

```sh
npm run cli -- registry check
npm run cli -- registry check --upstream
npm run cli -- registry show avatar
npm run cli -- registry report
```

Check validates identifiers, states, dependencies and cycles, public exports,
existence of local evidence, and whether the generated summary is current.
The standard check runs offline and without an upstream checkout. It reports
a missing clone explicitly. With --upstream it requires a clean checkout of
the pinned revision. Report deterministically overwrites only status.md.
Show prints one entry. Run test commands separately to verify execution
and results.

## Storing test reference data

Large Select and AutoComplete JSON measurements in `tests/browser/fixtures`
are read from gzip files. Checksums of upstream measurements cover the
decompressed JSON bytes. For the two independent Select own-style repetitions
(CSR and hydration), the repository stores only changed fragments. The package
test reconstructs both byte streams from the first measurement and checks
their original SHA-256 values.

The week DatePicker audit reports, full Select own-style repetitions, and raw
ColorPicker short-page and DatePicker offgrid-scroll archives are available
in commit `76123ad6`. Run this command from the repository root to extract
the original week report.

```sh
git show 76123ad6:tests/browser/fixtures/ant-design-date-picker-week-semantic-review.json > /tmp/week-review.json
```

Pinned React records retain their file names and hashes at measurement time.
The registry lists the current check and reference paths.

## CSS extraction

The recipes reproduce the existing CSS for avatar, avatar-group, badge, divider,
flex, statistic, segmented, grid, grid-responsive.css.js, layout, descriptions,
card, breadcrumb, space, space-compact, space-addon, input-number-compact,
affix, anchor, steps, timeline, float-button, date-picker, menu, mentions, image,
rate, otp, border-beam, masonry, splitter, qrcode, radio-button, calendar,
transfer, and pagination in vendor/. [Recipes](../../../tools/ant-design-css-recipes.json)

Spin and spin-prefix extract 35 Spin rules, including fullscreen and percent.
Spin keeps two keyframes, and spin-prefix produces the local prefix template.
Progress and progress-prefix extract 40 rules for line and circle, steps,
success, and percentPosition. Progress keeps one keyframe, and progress-prefix
produces a CSS data module. Skeleton and skeleton-prefix extract 48 rules for
the main Skeleton and five primitives. Skeleton keeps one keyframe, and
skeleton-prefix produces a CSS data module for a local prefix.

Listy, typography, tour, and carousel reproduce their named vendor styles.
Slider-range reproduces range CSS independently of the existing single-control
slider.css. Slider-prefix produces a CSS data module with 54 rules for both
modes. Defaults are scoped to the root, and the shared marker and CSS variable
names stay in place. Divider-prefix does the same with 27 rules scoped to
Divider and excludes the ColorPicker integration.

Button-prefix produces 113 Button rules for variants, sizes, loading, and
Compact. It excludes deprecated ButtonGroup and token declarations. Component
defaults have zero specificity to preserve the legacy theme bridge. Runtime
keeps local classes independent of the shared internal variable namespace.

Float-button-prefix produces 42 rules for FloatButton, Group, and BackTop.
Runtime retains component tokens and separates local classes from the shared
Button and progress namespace. The root selector preserves upstream
FloatButton precedence after Button in either head stylesheet order.
The existing scoped WAAPI fade stays in the native implementation.

Radio-prefix produces 99 rules for Radio, RadioButton, and RadioGroup.
Component token namespaces stay in place, and Badge selectors use the shared
prefix. The ineffective upstream button-wrapper selector is excluded.
The defaultChecked wrapper observation is stored raw and with a public
checked=true counterpart. Radio-button restores three omitted Group and
Badge rules for vertical width and margin and count z-index. Normal radio.css
stays in place.

Checkbox-prefix produces 31 Checkbox and Group rules, including hover media
queries, mixed and disabled states, and Row integration. Runtime keeps token
markers and the shared Row namespace. Raw and fresh Inner measurements
record the upstream shared-local-class cache separately. Native input, form,
and fieldset contracts remain intact.

Switch-prefix produces 47 Switch rules in a CSS module for local and shared
prefixes. Runtime changes root, state, handle, and caption classes while
preserving component variables, the external anticon namespace, and the
existing native max-width adapter.

Input-prefix produces 142 Input and TextArea rules, including textarea
selectors, resize and autoSize, affixes, clear and count, variants and sizes,
and Compact. It excludes deprecated Group and the InputNumber, Search, and OTP
families. Runtime preserves canonical token variables and markers and scopes
defaults to the owner. Password, Search, and OTP have separate prefix APIs
and recipes.

Input-password-prefix produces four upstream icon rules. Runtime addresses
the Input root and Password icon independently, correcting the upstream
assumption of a shared name. Browser reference data retains raw and public
paired-prefix counterparts. Native toggle reset, variables, and events are
preserved.

Input-search-prefix produces 16 Search rules. Runtime preserves component
variables and separates local Search classes from shared Button and private
variables. The root gets Input component tokens, including small-button
min-height. Upstream Compact remount, empty content, and shared-class cache
observations are recorded raw and with public or fresh counterparts. Native
DOM and state and the existing icon-only button are preserved.

Input-otp-prefix produces 16 OTP rules. Runtime passes the owner prefix to
wrappers, mask, input, and separators. Nested Input uses the shared namespace.
Canonical variables and markers are preserved, and Input tokens apply to the
group. The upstream omission of the local mask prefix is recorded with raw
and matched public ConfigProvider measurements. Native values, keyboard,
refs, and selection keep their contracts.

Input-number-prefix produces 124 upstream rules covering both modes, variants,
sizes, affixes and actions, and Compact. Deprecated addons and token declarations
are excluded. Canonical component variables and markers and native geometry
adapters are retained.

Segmented-prefix produces a data module with 38 rules for local prefixCls.
Runtime preserves CSS variables and markers and scopes defaults to the root.
Flex-prefix produces 32 Flex rules without a typography reset and scopes each
selector to its own root. Statistic-prefix produces 14 rules. Runtime retains
the token namespace and isolates overlapping prefixes by root marker.
Qrcode-prefix produces an 11-rule CSS data module. Root and borderless defaults
are scoped by marker, and Button, Spin, and token namespaces remain intact.

Timeline-prefix produces 43 Timeline rules on top of Steps dot. Local prefix
changes Timeline selectors and preserves Steps and token namespaces.
Steps-prefix produces 137 rules including layouts and progress. Runtime
isolates root states and preserves the token namespace and deprecated
exclusions.

Col local and shared prefixes reuse the 1027 grid-responsive rules without
a stylesheet copy. Runtime changes Col classes and the shared namespace for
private Col and Grid variables. Scope accounts for both prefixes and media
thresholds. Native Form selectors keep their specificity and support span and
breakpoint attributes. The FormItem display bridge preserves default layout.
The upstream private-flex cache with a shared local class is recorded as raw
and fresh measurements. Form prefix and media styles are connected separately.

Form-prefix produces 99 upstream rules without collapse motion. Canonical
Form CSS excludes parts with separate scopes and keeps specificity. Runtime
connects local Form and Item classes, shared Col and private Form and Grid
namespaces, and global screen*Max. Col span and breakpoint metadata stay in
place. Raw and fresh measurements isolate upstream cache defects. Store,
validation, refs, focus, and native ErrorList motion keep their contracts.

Rate-prefix produces the same 21 Rate rules with a native >button adapter.
Runtime changes root, state, and part selectors and the character prefix
while preserving canonical token markers and variables. Tooltip uses an
independent shared namespace.

Listy-prefix produces 16 rules for raw and virtual parts, grouped and sticky
headers, and the scrollbar. Canonical component tokens and the rc-virtual-list
variable stay in place. The canonical root marker keeps the shared link reset
active.

Tour-prefix produces 61 rules for panels, mask, primary state, and arrows.
Runtime separates local Tour classes, shared Button selectors, and private
Tooltip variables. Canonical tokens and existing portal, layout, and zIndex
contracts are preserved.

Mentions-prefix produces 102 editor, variant, and dropdown rules without
rc-motion. Runtime separates local classes from the shared cmp-mentions
variable namespace and Form feedback selector. Native measurement, triggers,
clear, ARIA, and popup lifecycle are preserved.

Image-prefix produces 48 thumbnail, cover, viewer, and action rules without
progress and rc-motion. Runtime changes the base Image namespace and preserves
canonical token variables and native dialog, focus, and movement selectors.
PreviewGroup.previewPrefixCls supplies the viewer base prefix. Child Image
instances keep independent prefixes. A standalone Image.previewPrefixCls sets
the entire viewer namespace, including the empty string. CSS is scoped to
the base and viewer pair. Separate public upstream counterparts show the
styled result. Raw measurements preserve the upstream stylesheet omission.

Dropdown-prefix produces 77 trigger, menu, arrow, and status rules without
rc-motion or upstream title flex:auto. The existing native label flex and
min-width are preserved. Runtime separates Dropdown and menu owner namespaces
from the shared Button prefix. Canonical markers and variables, native popover
and controller, links, and typeahead stay in place.

Menu-prefix and menu-theme-prefix produce 201 base and 77 scoped theme rules
with the previous deprecated exclusions. Runtime preserves canonical variables
and the link reset and isolates Menu and popup namespaces and the shared
Typography prefix. The raw dashed Divider owner omission is recorded separately
from public per-divider prefixCls counterparts.

Pagination-prefix produces 111 rules without shared Input Group selectors.
Runtime separates local classes, actual shared metrics, and canonical tokens.
Native buttons, active colors, wireframe, media, and the separate Select namespace
are preserved. Raw button font results are separate from public itemRender
counterparts.

Drawer-prefix produces 32 panel, mask, header, body, and footer rules without
motion, pure, inline, resizable, and skeleton. Runtime changes local classes and
preserves canonical tokens and native dialog and size markers. WAA panel and
mask animation and backdrop dismissal use stable attributes. Button's namespace
is independent.

Modal-prefix produces 58 Modal and Confirm rules without zoom, fade, pure, and
skeleton. Runtime preserves canonical tokens and native dialog, centering, and
close-space selectors. Button's namespace is independent. Responsive width
variables follow the local prefix. The extra raw Confirm header with a local
prefix is kept separate from the public styles.header counterpart. The native
implementation keeps one confirmation heading. Raw and fresh measurements
record the upstream cache that loses footer Button margin. The existing native
disabled-loading behavior is compared separately with public button props and
an SVG counterpart.

Message-prefix produces 21 rules for the top list and messages. CSS bodies
match the previous vendor file. Motion, stack, pure, and actions are excluded.
Runtime separates local classes and private shared Notification metrics.
Canonical tokens and native popover, viewport, and timing stay in place.
Upstream stale status classes on a live prefix change are recorded separately
from public same-key refresh counterparts.

Notification-prefix produces 45 rules for all six placements and cards. CSS
bodies match the previous vendor file. Motion, stack, progress, and pure are
excluded. Runtime separates local classes from private shared icon and title
metrics. Component tokens, the status background bridge, and native viewport,
motion, focus, and timing are preserved. Raw measurements stay separate from
public close, wrapping, and same-key refresh counterparts.

Upload-prefix produces the same 91 rules and four keyframes as upload, as a
CSS data module. Unused collapse selectors are excluded. Runtime isolates
wrapper and RTL scopes and changes owner classes for every control and list
state. Canonical tokens, link reset, and Button, Progress, and Tooltip namespaces
stay in place. Native file input, refs, focus, and in-flight requests are
independent of public classes.

Tree-prefix produces 99 Tree, checkbox, line, RTL, and collapse rules and one
keyframe for drag feedback. Runtime isolates local and shared scopes and
preserves canonical tokens and a separate Row namespace. Native focus, IDs,
state, and load and the TreeSelect CSS adapter are retained. Raw style and
readonly-selection observations stay separate from public counterparts.

Tree expandAction compares 22 raw UMD cases and a separate counterpart with
two clicks 100 ms apart. Checks cover modifier guards, click and doubleClick,
controlled hold and accept, checkbox, lazy title collapse, and synchronous
selection updates in onClick. The node snapshot precedes onExpand, onClick,
onSelect, and onCheck. The previous default without title expansion is kept.
Upstream rapid double click separately shows a state and callback discrepancy.
SetExpandedKeys runs before the listChanging guard. The native path reports
both transitions, and the raw upstream outcome stays intact.

Transfer-prefix produces the same 54 rules as transfer, as a CSS data module.
Owner classes, including box-sizing selectors, are independent of shared
Button, Input, Pagination, and Table namespaces. Canonical tokens are preserved.
Private Checkbox and Pagination use their prefix engines while retaining
native controls.

Select-prefix produces 158 rules for single, multiple, tags, variants, options,
and compact, including hover:none. Slide-up motion selectors are excluded.
Owner classes and internal variables have independent namespaces. Canonical
tokens, native wrapper and option buttons, the compact bridge, form and reset,
and popup lifecycle stay in place. AutoComplete uses this template and a
separate shared Input namespace for custom controls. Upstream has no
AutoComplete style hook of its own.

Tree-select-prefix produces the same 92 dropdown, tree, checkbox, and RTL
rules as tree-select. The internal tree selectors keep the existing native
adapter. The Select control and TreeSelect dropdown have separate scopes
and a shared private variable namespace. Raw omission of local tree styles
is recorded separately from a public counterpart without the local override.
Tree and node comparisons account for distinct classes.

Tree-select-popup-motion produces 110 rules and eight keyframes for upstream
Select slide and move transitions in the canonical styles export.
Tree-select-popup-motion-prefix produces the same CSS module for other
namespaces. Runtime scopes both to the TreeSelect popup and substitutes local
dropdown and shared motion prefixes independently. The native fixed top layer
preserves phases, CSS clocks, and alignment cache. The projected geometry
transition exposes a real WAAPI Animation as the counterpart to upstream
CSSTransition without dispatching artificial DOM end events.

Cascader-prefix produces the same 108 rules as cascader, as a CSS data module.
Select control and Cascader columns and Panel have independent owner scopes.
The Row selector follows the shared prefix. Native input width overrides the
unitless upstream formula after dynamic CSS insertion. Raw local padding
omission and Panel root direction are recorded separately from public
styles.popup.root.padding=0 and a regular HTML wrapper with dir=rtl.

Layout-prefix produces 35 flat Layout and Sider rules. Runtime selects the
group for the component's role, preserves the Menu namespace, and scopes
defaults and state selectors to the root. Header, Content, and Footer use
the same template with their role selectors. Scoped defaults are added only
for standalone sections.

The color-picker recipe extracts the trigger, palette, sliders, inputs,
presets, and compact styles. Color-picker-prefix produces the same 94 rules
as a CSS data module. Owner scopes are isolated by local and shared prefix.
Popover, Collapse, and other child namespaces resolve separately, and
canonical variables and markers are preserved. Raw upstream cache omission
of child selectors is recorded separately from a public counterpart with a
unique local prefixCls. Native controls and state are preserved.

Calendar-prefix produces the same 123 rules as calendar, including the 480px
media rules. Picker owner and Calendar root states are scoped to their owner.
Canonical variables and markers are preserved. Header Select and Radio use
independent shared namespaces. Raw constrained-header wrapping is recorded
separately from a public width=400px counterpart. The counterpart is used only
for three control heights. The native implementation keeps nowrap.
Calendar-prefix defaults have zero specificity to preserve the native dark
and compact bridge after late insertion into head.

Date-picker-prefix produces the same 262 single and range date and time rules
as date-picker, as a CSS data module. Owner scopes are separated by local and
shared prefix. Only private affix-color follows the shared namespace.
Component tokens and markers stay canonical. Time columns and arrows use
stable DOM hooks. Footer Button keeps its shared prefix. Value and display
guards preserve drafts on context changes and synchronize on a real value
or format change. Date-picker-prefix defaults also have zero specificity.
Default appearance is compared with canonical ant in three combinations of
mode, primary, and compact. Upstream token overrides and aliases keep precedence.

The DatePicker and TimePicker head stylesheet appears right before the root,
after snippet declarations. Snippet boundaries and NoCompactStyle add no
outer text nodes. SSR also covers defaultOpen, and browser tests cover shared
prefix changes and preserved adjacent text.

In upstream, a local dropdownPrefixCls leaves the filter Menu without matching
CSS. The raw transparent background is recorded separately from the public
inherited-prefix counterpart. Svelte retains the prior list appearance.
Only menu background compares with the counterpart. Other properties compare
with raw upstream data.

Modal and Drawer keep the head style condition outside the keyed range of
a portaled dialog. A mixed range with a comment anchor left in the original
parent broke the insertion anchor when target changed. The new dialog then
used itself as theme origin and the observer repeatedly reacted to its own
style writes. Existing container and motion contracts are preserved. The
regression covers default and custom shared prefixes and moving Drawer during
leave, with the existing timeout and console checks.

Upload error Tooltip compares ten raw UMD cases and four transitions covering
string response, error.statusText, error.message, empty values, response objects,
Error and ProgressEvent, and locale fallback. Sample metadata stores strings.
Open Tooltip text updates without replacing the row. SSR preserves the hidden
popover.

Upload list motion compares 12 raw UMD cases covering an initial list without
motion, addition and removal for text, picture, card, and circle, motion=false,
prefixCls, duration, and RTL. Intermediate computed sizes stay in raw data
as timing observations. Browser checks compare classes, target inline styles,
keyframes, duration, and easing. The CSS end event completes motion only on
its own container. The 2000 ms deadline, a returning uid, reduced motion, and
unmount preserve cleanup. Nine raw diffKeys cases define retention order.
Two more record duplicates for inherited uid names in @rc-component/motion 1.3.3.
The native implementation uses Map to avoid that upstream defect.

Upload trigger keeps the forceRender input with empty children. Dragger
omits appendAction select in card and circle. Sixteen raw cases define the
controls, id, hidden state, and four list types. Six motion cases record the
initial skip of appear, leave and enter, input and root identity, and style
precedence. Motion pointer-events:none precedes ordinary style. Explicit
display can override the hidden class. The native implementation preserves
the selected FileList through hide and return without a change event, external
draft, focus, and selection, and cleanup after the deadline or unmount.

UploadRef ports onBatchStart, onProgress, onSuccess, onError, current fileList,
native refs, and upload.abort. Dragger supplies the same API. Eighteen raw
UMD cases cover manual and mixed batches, LIST_IGNORE, maxCount, controlled
hold and accept, membership guards, JSON and plain responses, progress, and
errors. Imperative completion leaves transport active and abortable. Two more
raw cases check actual customRequest, repeated abort, and later progress.
Direct abort and previous bindable DOM refs are preserved. SSR leaves lifecycle
callbacks inactive. React.Component, saveUploader, and React-specific render
boundaries remain separate limitations.

Two upstream measurements report the second file's callback after a synchronous
unmount in the first onChange. The native implementation stops processing the
remaining entries, including status changes and transport, and preserves
cleanup. The browser regression covers a public ref batch and the native
multiple picker for Upload and Dragger. A unit test checks stopping within
onChange.

Upload progress motion compares 12 raw UMD cases covering four list types,
missing and undefined percent, motion=false, local and shared prefixes,
global and component duration, and the first enter after done. Samples set
aria-label explicitly and leave the native name fallback unchanged.
Upstream fade lasts motionDurationMid after a 300 ms delay and keeps the
wrapper through exit. Explicit percent: undefined renders a zero bar,
whereas omitting the property renders only the wrapper. The shared fade
namespace is independent of the local Upload prefix. The CSS template takes
both namespaces. Sibling providers with the same local prefix keep their own
fade classes and tokens.

Upload thumbnail fallback compares 24 raw cases and five transitions covering
picture, card, and circle, absent, empty, and supplied thumbUrl, URL priority,
empty sources, and non-image files. Empty thumbUrl keeps image or preview URL
and disables previewFile even with originFileObj. Updates preserve the row,
input, and external draft, focus, and selection. The thumbnail anchor survives
until its source disappears.

Upload action icon snippets compare 21 raw UMD cases, two action traces, and
five transitions. Empty and zero samples use a React Fragment corresponding to
opaque snippet content. The fallback for a falsy render result and ReactElement
clone and onClick forwarding remain outside the port. Own snippet handlers
preserve native DOM event order. The reader compares control text without
outer whitespace and preserves raw upstream measurements, SVG paths, and all
other fields.

Upload semantic root, list, item, and trigger compare 16 raw cases and five
transitions covering object and callback settings, resolved defaults, style
priority, list types, drag, disabled, hidden, error, and root and trigger
variables. The callback receives original props without bindable DOM refs
and separate resolved defaults. Ordinary style stays on the trigger. Root
variables inherit through the internal theme bridge.

ConfigProvider.upload sets shared class, style, slots, accept, customRequest,
and progress. Thirteen raw cases, four progress samples, and four live
transitions check whole-record inheritance and reset, sibling scopes, and
precedence. Raw synchronous request traces include rc-upload aborting a
completed request. PublicRequests with deferred completion follow all raw
measurements. The native implementation keeps its completion guard and
cancels unfinished transport.

Upload.progress passes the current line API from Progress and excludes
deprecated strokeWidth. Sixteen raw UMD cases and six transitions cover the
300 ms delay, defaults and an empty object, size, colors and gradient, status,
success, steps, formatter, semantic styles, and ARIA. Each sample sets a file
name explicitly. The native implementation keeps its localized fallback for
missing names. List exit motion remains a separate gap.

UploadFile.linkProps compares 19 raw cases and five transitions covering
object and JSON attributes, file URL priority, class replacement, click
callback order and cancellation, and exclusion from thumbnail and preview
actions. Svelte uses native class and onclick and a string style. The reader
ignores only generated Svelte scope classes. Raw upstream results are preserved.

Upload itemRender receives an opaque originNode snippet with the error Tooltip,
the file and current fileList, and file-specific actions. Nineteen raw cases,
two action sets, and five transitions cover wrap, replace, empty, and default,
list order, and preview event cancellation. The renderer changes inner content
and preserves the outer container and file input.

Upload iconRender uses a Svelte snippet with file and listType. Twenty-five raw
cases cover status and list types, empty, zero, and default, and thumbnail
priority. Four transitions change the renderer. The comparison covers visible
content. React render invocation side effects remain outside the snippet contract.

Upload directory compares 12 raw cases with a controlled FileSystemEntry API
covering breadth-first traversal, directory reader batches, input, drop, paste,
accept, and relative paths. The adapter provides platform callback data. The
implementation determines traversal order and the result. Upstream omits a
file-read error callback and blocks the queue. The native path settles the
failure and continues. A separate public sample without the unreadable file
follows all raw cases. SSR preserves boolean webkitdirectory semantics.

Upload pastable compares 11 raw cases, three prop transitions, and unmount,
including file and text paste, multiple, accept, native and custom filters,
and document scope. Upstream still handles paste while disabled. The native
guard blocks it. The raw reference retains this observation and leaves the
upstream UMD and expected result intact.

Masonry and Pagination share the global breakpoint resolver. Thirty-six raw
viewport frames cover columns, both gutter axes, mini class, explicit size,
responsive=false, independent SMMin and SM, and nested and reset scopes.
Tokens update native subscriptions without remounting. The upstream stale
observer and a fresh public mount are recorded separately.

Descriptions responsive columns and spans use the same validated global
breakpoint resolver as Row. Fifty-two raw viewport frames and separate live
and fresh frames cover thresholds, nested and reset scopes, default columns,
and packing spans. Upstream useBreakpoint keeps stale subscriptions after
token changes. The native implementation replaces them while preserving editor,
refs, focus, and selection. SSR uses screens={} and fallback3.

Table-prefix extracts 187 Table rules. Owner classes are independent of shared
Checkbox, Pagination, and Descriptions namespaces. Private nested-border-top
uses the shared prefix. Component tokens and markers are canonical. Defaults
have zero specificity. Raw UMD measurements cover 23 cases in normal, nested,
and reset scopes and three live prefix updates with preserved editor, selection,
focus, and DOM. Both controls use the current medium size. DropdownPrefixCls
applies to the filter list. Its shell and controls resolve the shared prefix
independently. Native popover and expanded viewport keep their existing
structure. Without an upstream theme, paint is compared separately with
canonical ant.

Input-number-features extracts variants, spinner, prefix and suffix, and addon.
Existing outlined and compact files stay in place.

The switch recipe reproduces the previous 47 rules byte for byte, including
reduced motion, with only the original CSS variable root selector replaced.

Overlay-color preserves 65 upstream Tooltip and Popover preset rules.
Popconfirm uses Popover classes. Upstream inverse classes for these components
have no color fill. Custom colors and native isolation of nested contrast
belong to the components.

Tooltip-prefix, popover-prefix, and popconfirm-prefix produce CSS data modules
with 58, 72, and 11 rules, respectively. Local substitution changes component
classes and retains variable names, markers, and Popconfirm's outer Popover.
Motion and unique styles are excluded. Viewport and focus adapters stay in
the Svelte components.

This version of the tool leaves the other current vendor files intact. Each
new component gets a verified recipe with selector includes and excludes,
replacements, keyframes, expected rule count, provenance header, and output
path. Optional declarationReplacements change only ordinary rule bodies
and preserve selectors and keyframes. ExcludeAtRules removes the selected
at-rule scopes and their children. Steps excludes deprecated descriptionMaxWidth
containers and has 137 rules. Recipes list removed token declarations.
The original vendor/antd.css still has no complete recipe. The same old
declarations are removed there, and disabled Button reads colorBorderDisabled
with a native colorBorder fallback.

```sh
npm run cli -- css --list
npm run cli -- css all --check --fetch
npm run cli -- css badge
npm run cli -- css all --check
```

Pass the archive path as `--archive=path` or `--archive path`. Use `--list`
separately from recipe selection and extraction options. Exit status is 0 on
success and 1 for invalid arguments or execution errors. JSON and CSS go to
stdout. Diagnostics and extraction progress go to stderr. A recipe with
format="module" outputs an ES module at vendor/*.css.js whose default export
contains the same CSS. The library can use CSS at runtime without Vite-specific
imports and keep the hash, selector, and keyframe checks and --check and --write.

Without --check or --write, stdout receives a CSS or module preview. An all
preview is combined CSS, including CSS from module recipes. The --check
option compares output with the current vendor file. The --write option
explicitly writes it. Recipes and extraction are checked before any selected
file is written. The command fetches the npm archive only with --fetch and
from the pinned official URL. The offline cache at `.upstream/artifacts/antd-6.6.8.tgz`
is excluded from Git. Pass --archive=path for another local file. SHA-256
verification always applies. The tool performs no package installation.

Parsing preserves declaration bodies, filters entries in selector lists,
and keeps media, supports, container, and layer scopes. Explicit keyframes
stay in place. AppendRootKeyframes can move only root keyframes to the end,
as Badge does. Recipes list selector transformations. An optional scope
sets the prelude of an outer @scope for selected rules. ExpectedRules
counts original style rules. Declaration bodies and nested media, supports,
container, and layer rules are preserved. Menu-theme-scope adds scoped light
and dark rules for nested native popovers. Ordinary Menu CSS remains the
base styling. A replacement with :where(:scope) preserves specificity.

Hash mismatches, lost keyframes, and unexpected rule counts fail the command.
It reads only package/dist/antd.css from the archive and extracts no files
to disk. Supporting other at-rules requires a recipe or parser extension.
The tool covers the CSS syntax used by its recipes.

## Integration evidence

In schemaVersion 2, local evidence remains relative to the library.
References such as `integration:button` and `integration:button/compact-context`
identify stable consumer contracts. An identifier must refer to an existing
family and, when specified, its feature. Local validation reports the number
of those contracts without reading files from another repository.

Consumers map the contracts to examples, SSR and e2e tests, and fixture modules
in their own manifest and validate them in their own repository. Renaming
consumer files preserves the stable identifier and needs no library registry
change. [Repository registry](./registry.json)

Component SSR and browser evidence uses local paths in tests/package and
tests/browser. Consumer application scenarios and fixture catalogs stay in
the consumer's manifest. This separation preserves audit states, requiredForV1,
and known gaps. Consumer files and test execution are checked separately
from local registry validation.

The `?fixture=config-provider` route checks direction and locale inheritance
for Select and Modal. It uses the same BasicFixtures and createControls as the
shared page. The scenario preserves control and dialog checks. Before bulk
DOM operations, the tests wait for a lazy fixture to mount because evaluateAll
does not wait for elements. [Fixture](../../../tests/browser/fixtures/ConfigProviderFixtures.svelte) · [Scenario](../../../tests/browser/config-provider/config-provider.spec.ts)

The shared Input and Select suite uses `?fixture=input-select`. Its fixture
combines BasicFixtures input, select, and select-numeric with one createControls.
Label and input IDs, events, and the model are shared with the prior page.
Root IDs are prefixed to isolate the catalog. The scenarios preserve checks
for keyboard, search, disabled overrides, numeric zero, and FormData.
[Fixture](../../../tests/browser/fixtures/InputSelectFixtures.svelte) · [Scenarios](../../../tests/browser/input/input-select.spec.ts)

Complete stage validation includes the library's own checks and consumer
integration with the installed package. The library owns the component
browser app. Consumers own their gallery and application scenarios. Each
repository installs and builds independently of the other's test app.

Deprecated Input and InputNumber addons are excluded from runtime and CSS.
The original vendor/antd.css removes 48 grouping rules. Mixed selectors lose
only old classes and preserve current selectors and declarations.
Input-number-features excludes the old addon selector and contains 64 rules.
