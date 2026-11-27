# Input

Input is a text field with a value binding, prefix, suffix, and clear control.

```svelte
<script lang="ts">
  import { Input } from '@woodger/antd';
  let value = $state('example');
</script>
<Input bind:value prefix="https://" suffix=".org" allowClear
  count={{ show: true, max: 24 }} variant="filled" aria-label="Адрес" />
```

The string bind:value and defaultValue, onValueChange, native oninput, onchange,
and onblur, attributes, and FormItem associations keep their contracts. External
updates leave change callbacks untouched. DefaultValue is captured on creation.
Native name, required, maxlength, and readonly stay on the actual input. Class,
style, and hidden apply to the outermost element. ReadOnly, maxLength, autoComplete,
and autoFocus are additional camel-case aliases. Lowercase native attributes
remain available. Size accepts medium, and htmlSize sets native size separately.

Prefix and suffix accept scalars or snippets. Without affixes, clear, and count,
Input renders one input. Prefix, suffix, clear, and count add ant-input-affix-wrapper.
The suffix order is clear, count, then suffix content. Count and clear follow the
upstream useCount and resolveOnChange rules in input-count.engine.ts and
input-event.dom.ts. Root classes and semantic root styles stay on the outer
element. Clicking inside the affix wrapper focuses the input. Use SpaceCompact
or SpaceAddon for external composition.

AllowClear accepts a boolean or { disabled, clearIcon }. Omitted fields inherit
ConfigProvider.input.allowClear. Explicit false disables the control. The default
icon is the close-circle SVG. A scalar or snippet can replace it, and an explicit
falsy icon uses '✖'. Upstream line-height:0 is sized for SVG. Set dimensions and
line height on a text icon. The clear button stays mounted with a hidden class for
empty, readonly, or disabled values. Mousedown prevents blur. Clearing focuses
the field and calls onValueChange(''), onChange(click), and onClear without
dispatching an artificial native input event.

ShowCount and count use UTF-16 length by default and accept a custom strategy.
Count.show overrides showCount. MaxLength is a native hard limit. Count.max is
a soft limit that marks out-of-range values, with 0 disabling it. Only
count.exceedFormatter truncates user input after IME completion, preserving
selection. External values are kept intact. Formatter receives
{ value, count, maxLength } and returns a scalar or a Snippet<[info]> through
a function that returns the snippet. The counter adds no live region.

OnChange receives a native Event proxy with a stable cloned input in target and
currentTarget and the nativeEvent. An input event uses type=change, and clearing
uses click. Selection setters delegate to the actual input. Email and other
types without selection avoid unsupported setters. OnChange runs after
onValueChange and before oninput. Native onchange still runs on native commit.
An unchanged compositionend leaves onChange untouched. If exceedFormatter
changed the result, the change has type=compositionend. OnCompositionStart and
onCompositionEnd are available alongside native callbacks.

OnPressEnter runs once before keyup, is blocked by isComposing, and resets on
blur or disabled. OnKeyDown and onKeyUp extend the native handlers. For
type=password, as upstream, the value attribute is removed asynchronously on
mount, change, focus, and blur. The value property stays intact. Timers clear
on unmount.

Variant supports outlined, filled, borderless, and underlined. The priority is
explicit variant, Form.variant, ConfigProvider.input.variant, ConfigProvider.variant,
then outlined. ClassNames and styles support root, input, prefix, suffix, clear,
and count as objects or a callback({ props }) with size and disabled resolved
from context. Root priority is provider styles.root, provider style, local
styles.root, then local style. Without a wrapper, root styles follow styles.input.
ConfigProvider.input sets allowClear, autoComplete, variant, class, style,
classNames, and styles. A nested provider inherits or explicitly replaces the
entire record. Form and FormItem disabled, errors and reset, Compact, themes and
compact density, RTL, locale, and reduced motion keep their contracts.

Bind:inputElement exposes HTMLInputElement and bind:nativeElement exposes the outer
input or span, like upstream nativeElement. Bind:this exposes
focus({ cursor: 'start' | 'end' | 'all', preventScroll }), blur(), select(), and
setSelectionRange(start, end, direction). Refs clear on unmount. SSR leaves
callbacks and password timers inactive. As in the full 6.6.8 CSS, native hidden
stays on the root, where authored inline-block or inline-flex overrides the
UA display:none. Input adds no separate hiding override.

The `?fixture=input-features` fixture extends the existing Input and Select
integration. Unit, SSR, and browser tests cover count and IME, focus and Enter,
clear and event order, refs, FormData, FormItem, Compact, variants, semantic
styles, themes, and RTL.

Input and TextArea share the base prefixCls. A nonempty local prefix takes
precedence. Empty and undefined values inherit ConfigProvider. The root, affix,
sizes, variants, clear and count, and Compact use the chosen prefix. Canonical
token variables and markers stay in place. A prefix change preserves the leaf,
wrapper, value, refs, selection, focus, and FormData. TextArea keeps vertical
resize, autoSize, and the existing semantic style precedence. Compare with the
official UMD at `?fixture=input-prefix`. [Browser](../../../tests/browser/input/input-prefix.spec.ts) · [SSR](../../../tests/package/input/input-prefix.ssr.test.ts)

Input.Password, Input.Search, and Input.OTP are available as InputPassword,
InputSearch, and InputOTP. Local and shared prefixCls and component tokens apply
to all five exports. Deprecated internal classes and structures are outside the
port. The agreed contract uses a string bind:value, native DOM events, and
named Svelte bindings. React controlled rejection, broad value types,
SyntheticEvent, and ref objects remain upstream-specific. The family-wide Input
audit is still pending.
