# Steps

```svelte
<script lang="ts">
  import { Steps } from '@woodger/antd';
  let current = $state(0);
</script>

<Steps {current} onChange={index => { current = index; }} items={[
  { key: 'data', title: 'Данные', content: 'Заполните форму' },
  { key: 'review', title: 'Проверка', subTitle: 'Перед отправкой' },
  { key: 'send', title: 'Отправка', disabled: true }
]} />
```

Steps shows the stages of a process. The owner controls the zero-based
`current` index. `onChange` reports the requested index and leaves
`current` to the owner, which can validate fields before accepting the
transition. Selecting the current step again, disabled steps, and
external updates leave the callback uncalled. Without `onChange`, the
list is passive and adds no Tab stops. There is no `bind:current`.

The existing `StepsItem` type retains a stable string `key` and a
`title`. `StepsDataItem` also accepts an optional or numeric key and
optional title. Missing keys use positions. The first occurrence of a
repeated string key wins, and indices refer to this normalized list.
An empty list is valid. Finite `current` is rounded down and clamped to
`0..items.length`. `NaN` and `Infinity` give 0.
`current=items.length` marks all automatic steps complete without an
`aria-current` step. Normalization leaves the owner's value and callbacks
untouched.

Automatic statuses are `finish` before `current`, `process` at `current`,
and `wait` after it. `status` sets the current step to `wait`, `process`,
`finish`, or `error`. `items.status` overrides the calculated status.
`disabled` prevents selection while preserving status and `current`.
Root `disabled` inherits `ConfigProvider.componentDisabled`. Explicit
`false` overrides that while preserving `items.disabled`.

The existing `StepsItem` accepts strings or Snippets for `title`,
`subTitle`, and `content`. `StepsDataItem` also accepts numbers,
booleans, and `null`. Zero is displayed and booleans produce no text.
`icon` can be text, a number, or a decorative Snippet. Strings are
escaped. Title and subtitle are inside the native selection button.
Use only text or phrasing content without nested controls for them.
`content` is separate and accepts block markup. The owner handles
panels with fields and actions. Icons and lines are `aria-hidden`,
and the icon is also `inert`. Check and close use the existing Icon.
The selected step has `aria-current="step"`. Its button's accessible
description includes the localized status and content. Steps adds
no live region or autofocus.

The list uses `ol` with list semantics. Buttons use native Tab,
Shift+Tab, Enter, and Space. The owner controls content and transitions,
and the list has no tablist role. When the focused step is removed or
disabled, focus moves to the next enabled step or the previous one.
Keyed reordering preserves the focused button. If there are no steps
or buttons left or Steps unmounts, focus moves to an accessible neighbor
in the current dialog or document. Focus explicitly chosen by the
owner is preserved.

`orientation` accepts `horizontal` and `vertical`, defaulting to
`horizontal`. `responsive=true` switches a horizontal list to vertical
below a viewport width of 532px. Before hydration, SSR uses
`orientation` without measuring the viewport. With
`responsive=false`, the list remains horizontal with internal
scrolling when space is limited. `size` is `medium` or `small`. An
omitted size inherits `small` from ConfigProvider and uses `medium`
for other shared sizes. Theme, compact mode, primary color, and
RTL use tokens. Reduced motion disables built-in transitions.
`id`, `class`, `style`, and `aria-describedby` apply to the `ol`.
`aria-label` or `aria-labelledby` supplies the name, which defaults
to `locale.steps.label`.

`locale.steps` contains `label`, `wait`, `process`, `finish`, and
`error`. `ruRU` and `enUS` supply all strings. Nested partial
translations retain values from the parent ConfigProvider. Any
remaining missing value uses `ruRU`. The owner supplies item text.

`type` supports `default`, `dot`, `inline`, `navigation`, and `panel`.
`variant` is `filled` or `outlined`. Panel is always horizontal.
Dot and inline use vertical title placement in a horizontal list.
Navigation retains horizontal titles. `orientation` controls list
direction, and `titlePlacement` controls title placement. Inline
hides content in the row and shows it in a Tooltip on hover or focus.
A title Snippet preserves rich content. Escape closes the tooltip
without moving focus. The Tooltip wrapper sits inside the `li` to
preserve native list semantics.

`initial` shifts numbering, `current`, and `onChange` into the upstream
index space. Existing normalization of `current` and first-wins keys
is preserved. `maxCount>=3` limits the actual visible steps. It keeps
the first, last, current, and closest neighboring steps in upstream
priority order. Disabled ellipses fill gaps and do not count toward
`maxCount`. The number and callback refer to the original item.
An ellipsis status preserves `error` in the hidden range or uses
`finish` or `wait` based on `current`. `ellipsis=true` separately
enables CSS truncation. `offset` sets an initial inline flex cell.

`percent` adds an SVG progressbar to the `process` number using the
upstream dash array formula. Inline mode ignores it. The progressbar
is exposed to assistive technology. Decorative icons and panel arrows
are hidden. The new ellipsis icon is the exact SVG from
`@ant-design/icons-svg` 4.6.0 (git
`7f2516ac91226d2b41f93b35cb5197c8d94f7189`).
The MIT license is included in `vendor/LICENSE.ant-design-icons`.

`classNames` and `styles` accept an object or a function of `{ props }`.
Root and `item*` slots match upstream. Item `classNames` and `styles`
use `root`, `wrapper`, `icon`, `section`, `header`, `title`,
`subtitle`, `content`, and `rail`. Local layers override shared
layers, and `item.style` overrides `styles.root`. Root `style` takes
precedence over `styles.root`. Navigation arrows inherit
`colorTextDisabled` from the active theme. A direct
`--ant-steps-nav-arrow-color` takes precedence. `item.onClick` runs
before `onChange`, including when the current step is selected
again. Both callbacks are suppressed when disabled. Supply step
content through `content`.

`ConfigProvider.steps` sets shared `class`, `style`, `classNames`, and
`styles` for ten slots. Configuration and local classes accumulate.
Root styles apply in order: `config.styles.root`, `config.style`,
local `styles.root`, and local `style`. Item layers retain precedence.
Callbacks receive the existing native props with calculated layout,
`type`, `titlePlacement`, and `percent`. The current defaults, status,
size, and `current` rules apply. `undefined` inherits the steps record.
Any explicit object, including `{}`, replaces it. When composed in
Timeline, as with upstream `InternalContext`, only plain `class` and
`style` apply. The semantic `classNames` and `styles` for Steps are
unused and their callbacks stay uncalled.

Local `prefixCls` changes root, layout, item, and progress classes.
The empty string inherits `ConfigProvider.prefixCls` (`ant-steps` by
default). The `steps-prefix` recipe extracts CSS from the pinned
bundle. The `--ant-steps-*` and `--ant-cmp-steps-*` namespaces and
the shared `ant-steps-css-var` marker are preserved. Prefix changes
keep the `ol` and buttons, their IDs, selection, and focus.
`components.Icon` in `iconRender` inherits the same prefix. Focus
recovery after removing a step is independent of classes. Neighboring
Steps are isolated. Local and semantic styles and component tokens
retain precedence. The shared ConfigProvider prefix also applies
inside Timeline. `ConfigProvider.timeline` settings and local Timeline
layers retain precedence. The fixture is `?fixture=steps-config`.
[36 upstream cases and four updates](../../../tests/browser/fixtures/ant-design-steps-config-reference.json) · [Browser tests](../../../tests/browser/steps/steps-config.spec.ts)
· [Public types and SSR](../../../tests/package/steps/steps-config.ssr.test.ts)

`iconRender` is a `Snippet<[originalIcon, info]>`. `info` contains
`index`, `active`, `item`, and `components.Icon`. Render the original
Snippet or the supplied Svelte Icon component. `bind:nativeElement`
returns the `ol`. `rootClassName` joins its class.

The agreed v1 differences from React remain: native buttons in a
named list, keyed focus recovery, a clamped `current`, the 532px
responsive threshold (upstream 6.6.8 uses `xs` in `useBreakpoint`),
`componentDisabled`, and `locale.steps`. Support for arbitrary
`prefixCls` remains pending. Wave runs for enabled items when a
shared `onChange` is supplied. New scenarios are in
`?fixture=steps-variants` and the second `#steps` example. Unit,
SSR, and Chromium tests cover layouts, collapsing and index mapping,
rendering Snippets, rich tooltips, and accessible percentages.

Upstream `theme.components.Steps` applies source defaults, aliases,
and separate algorithms to icon and dot sizes, fonts, colors, and
navigation. CSS prefix and hash, zero and undefined values, and
runtime CSS lengths are supported. Semantic root styles and plain
`style` retain precedence. `customIconSize`, `customIconTop`, and
`iconTop` produce variables without affecting visuals, as in 6.6.8.
The same applies to legacy `waitIcon*` and `finishIcon*` defaults.
Variant and Timeline composition metrics are compared with the
official UMD in `?fixture=steps-theme`. Native-only themes retain
their styling.
