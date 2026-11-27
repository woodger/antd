# Timeline

Timeline uses the shared Steps renderer with type=dot, as in Ant Design. The
defaults are orientation=vertical, variant=outlined, and mode=start. The root
is a passive ol and li structure without selection buttons, current-step ARIA,
or localized Steps statuses. Class, rootClassName, native attributes, and
bind:nativeElement apply to the ol. Title and content accept block snippets.
Inputs and links inside content retain native keyboard behavior. Keyed
reversal preserves DOM, value, and focus. On unmount, focus from the active
control moves to an available neighbor.

```svelte
<Timeline titleSpan="80px" items={[
  { key: 'created', title: '09:00', content: 'Created', color: 'green' },
  { key: 'processing', title: '09:30', content: 'Processing' },
  { key: 'waiting', content: 'Waiting for confirmation', loading: true }
]} />
```

Items support key, title, content, icon, loading, color, placement, class,
style, and local semantic classNames and styles. Title, content, and icon
accept text, numbers, booleans, or snippets. Zero is visible, and a boolean is
present but empty. React Timeline.Item served as JSX shorthand without its
own runtime. In Svelte, supply items directly. Use stable keys to control
state preservation.

Mode accepts start, end, or alternate. Item.placement takes precedence over mode.
Alternate assigns sides before reverse. In vertical orientation, at least
one truthy title selects a two-column layout even in start or end mode.
Zero alone leaves the single-column layout. TitleSpan accepts a number out of 24
or a CSS string such as 100px or 25%. Alternate mode ignores it. Its computed
variable takes priority over the same key in styles.root or style as upstream does.

Loading sets process and adds a spinner only when icon is falsy. Other items
use finish. Show a pending event through a separate loading item. Reverse reverses
the whole events array. The rail inherits the previous event's status with
reverse, and the next event's status otherwise.

Preset colors are blue, red, green, and gray. A custom CSS color sets the item
icon variable. Item.style can override it. ClassNames and styles use root,
item, itemWrapper, itemIcon, itemSection, itemHeader, itemTitle, itemContent,
and itemRail. They accept an object or a function of { props } with transformed
items. Local item.classNames and styles use root, wrapper, icon, section, header,
title, content, and rail. Local styles override shared styles, with item.style
last. Root style overrides styles.root before titleSpan applies. Tail, dot,
and spacing use theme tokens, including dark and compact modes and RTL.

ConfigProvider.timeline sets shared class, style, classNames, and styles. Provider
and local classes accumulate. Root style order is config.styles.root, config.style,
local styles.root, local style, then titleSpan. Item-specific styles retain
their priority. Callbacks receive the same native props, resolved mode,
orientation, and variant, transformed items, and the existing reverse=false.
Undefined inherits the timeline record. Any local object, including {}, replaces
it. Configuration and prop updates preserve the ol, and sibling providers stay
isolated. The fixture is `?fixture=timeline-config`. [24 upstream cases and four updates](../../../tests/browser/fixtures/ant-design-timeline-config-reference.json) ·
[Browser](../../../tests/browser/timeline/timeline-config.spec.ts) · [Public types and SSR](../../../tests/package/timeline/timeline-config.ssr.test.ts)

Horizontal preserves upstream Steps behavior. Below xs=576, it gets
ant-steps-vertical while keeping the explicit ant-timeline-horizontal class.
Standalone Steps keeps its agreed v1 threshold of 532px. SSR preserves the
declared orientation and defers DOM and viewport measurements.

Local prefixCls changes the root and Timeline item, state, and color classes.
An empty string inherits ConfigProvider.prefixCls, giving ant-timeline by
default. Nested Steps inherits the shared prefix independently of the local
Timeline prefix. Timeline and Steps CSS variable names and markers stay in
place. Neighboring timelines stay isolated, including prefix collisions with
ant-timeline-item or ant-timeline-css-var. A prefix change preserves the ol,
theme, semantics, titleSpan, and placement assignment before reverse.
Timeline-prefix reproduces the 43 upstream rules as a CSS data module.
Fallback variables preserve earlier adaptive theme defaults. The fixture is
`?fixture=timeline-prefix`. [28 upstream cases and four updates](../../../tests/browser/fixtures/ant-design-timeline-prefix-reference.json) ·
[CSS and item classes](../../../src/lib/timeline/timeline-prefix.test.ts) · [Browser](../../../tests/browser/timeline/timeline-prefix.spec.ts) · [Public package and SSR](../../../tests/package/timeline/timeline-prefix.ssr.test.ts)

Upstream `theme.components.Timeline` prepares six defaults for tail, dot, and
spacing and supports aliases, separate algorithms, CSS prefixes and hashes,
and zero and undefined values. On the shared root, Timeline aliases apply after
Steps as in upstream. Icon sizes in Steps and dot sizes in Timeline retain
separate variables. Styles.root and style override tokens, and titleSpan remains
last. The `?fixture=steps-theme` checks reference metrics for both orientations
and theme updates.

The main fixture is `?fixture=timeline`. Engine, SSR, and Chromium checks cover
aliases, order and statuses, titleSpan geometry, themes and RTL, preserved field
state and focus, and production hydration. The timeline recipe reproduces 43
rules from the pinned CSS archive and shares the existing Steps rules.
