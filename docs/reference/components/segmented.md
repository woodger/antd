# Segmented

`Segmented` selects one option. Keep the selected value in component state.

```svelte
<script lang="ts">
  import { Segmented } from '@woodger/antd';

  let period = $state('Week');
</script>

<Segmented options={['Day', 'Week', 'Month']} bind:value={period} />
```

Options are strings, numbers, or objects with value, label, icon, title, tooltip,
disabled, and class. Values must be unique. The number 0 and string "0" are distinct.
Label accepts a string, number, or snippet, and icon accepts a snippet. Set title
or an option aria-label for icon-only options. An empty string beside an icon
is treated as icon-only and omits the text span. Numeric 0 is visible.
CSS margin sets icon and label spacing. Title defaults to the scalar label
when there is no icon, as in Ant Design. ClassNames and styles accept root, item,
label, and icon through an object or a ({ props }) callback. Styles are CSS strings,
and style overrides styles.root.

ConfigProvider.segmented sets class and style and classNames and styles for all
four slots. Undefined inherits the parent record. An explicit record, including
{}, replaces it in full. Provider classes come before local classes. Root style
order is context styles.root, context style, local styles.root, then local style.
Callbacks may return undefined. They retain native props such as generated name
and disabled, block, and vertical defaults. Size stays local in the callback,
including with inherited componentSize. The global callback is typed across
different values and options and leaves selection intact. The fixture is
`?fixture=segmented-config`. [UMD](../../../tests/browser/fixtures/ant-design-segmented-config-reference.json) · [SSR](../../../tests/package/segmented/segmented-config.ssr.test.ts) · [Browser](../../../tests/browser/segmented/segmented-config.spec.ts)

ConfigProvider.theme.components.Segmented applies all eight component tokens for
track padding and background, regular, selected, and hover text, and selected,
hover, and active backgrounds. Numeric 0, CSS length strings for trackPadding,
aliases, global and component algorithms, cssVar.prefix, and nested providers
are supported. The theme changes sizes and states while preserving selection,
focus, and radio DOM. A geometry change ends the existing thumb through
ResizeObserver. Theme variables precede semantic and user styles. The native
light, dark, and compact colors and dimensions remain available.
The fixture is `?fixture=segmented-theme`. [Official CSS tokens](../../../tests/reference/ant-design-segmented-tokens-reference.json) ·
[Sizes and pseudo-states](../../../tests/browser/fixtures/ant-design-segmented-theme-reference.json) · [SSR](../../../tests/package/segmented/segmented-theme.ssr.test.ts) · [Browser](../../../tests/browser/segmented/segmented-theme.spec.ts)

Value supports binding. DefaultValue is read at creation. When omitted, the first
option is selected even if disabled. External value changes leave onChange(value)
untouched. Removing the selected option leaves its value in the model. Restoring
the option checks it again. Size inherits ConfigProvider. Orientation takes
priority over vertical, and block and shape=round follow reference styling.
Disabled applies to all radios, and option.disabled to one. Pass disabled
explicitly because Segmented follows Ant Design 6.6.8 and reads no
ConfigProvider.componentDisabled.

The radiogroup contains native label, input[type=radio], and div labels. Name
is shared by the inputs and unique between instances by default. The root has
tabindex=0 when enabled. Native Tab also reaches the selected radio. Arrow keys
cycle through enabled options in array order regardless of RTL and orientation.
An arrow selection suppresses the second native toggle and focuses the selected
radio. Bind:nativeElement exposes the root div.

The upstream FormData contract is preserved. The radio omits its value attribute,
so the selected enabled option submits "on" under name. Read the typed value
through binding or onChange. Native reset leaves the model and onChange intact.
Checked is reconciled with the current value after reset. FormItem integration
and option.value serialization remain outside this contract.

A change between existing visible options creates the standard thumb. Layout
geometry uses label offsets and client sizes after the DOM update and avoids
applying CSS scale again. Web Animations API moves the indicator with the token
duration and easing. Selected text stays styled during motion, and the normal
selected background returns when it ends. A new value change cancels the previous
animation. ResizeObserver, axis or RTL changes, option updates, and unmount
clean up animation and observation. Reduced motion skips or ends the movement.
The thumb, observers, and animations run only in the browser.

Option.tooltip accepts a string or existing Svelte Tooltip props without children.
Hover, focus, and Escape also work for disabled options. A local Tooltip adds
a display:contents span and a native popover, keeping the label a flex item for
block and thumb measurements. A custom tooltip.style may override display and
explicitly change layout.

Local prefixCls changes the root, option, icon, and thumb classes and connects
extracted CSS. An empty string inherits ConfigProvider.prefixCls, giving
ant-segmented by default. CSS variable names and the shared marker stay the same.
Defaults are scoped to the component root. Prefix changes preserve radio DOM,
value, focus, and ref and cancel the old thumb. Unmount removes the local
stylesheet. Native and token themes, sizes, block, round, vertical, RTL, disabled,
semantic styles, and option Tooltip are supported. The fixture is
`?fixture=segmented-prefix`. [UMD](../../../tests/browser/fixtures/ant-design-segmented-prefix-reference.json) · [SSR](../../../tests/package/segmented/segmented-prefix.ssr.test.ts) · [Browser](../../../tests/browser/segmented/segmented-prefix.spec.ts)
Segmented inherits ConfigProvider.prefixCls, and a nonempty local prefix takes priority.
