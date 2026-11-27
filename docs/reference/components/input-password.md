# InputPassword (Input.Password)

InputPassword adds a password visibility toggle to Input. It supports bind:value,
defaultValue, native attributes and events, clear and count, affixes, FormItem,
Compact, and ref methods. [Source types](../../../src/lib/input/input-password.types.ts)

```svelte
<script lang="ts">
  import { InputPassword } from '@woodger/antd';
  let password = $state('');
  let visible = $state(false);
</script>

<InputPassword bind:value={password} autoComplete="new-password"
  visibilityToggle={{ visible, onVisibleChange: next => { visible = next; } }}
  aria-label="Пароль" />
```

Without visibilityToggle.visible, the component owns visibility. In controlled
mode, the callback requests a new state and the external visible value decides
the result. Prop updates leave the callback untouched. Leaving controlled mode
keeps the last state. VisibilityToggle=false hides the button and keeps the
current visibility and suffix wrapper. Visibility controls the input type.

As upstream does, action=hover toggles on mouseover and leaves state unchanged on
mouseleave. Events bubbling from the icon also count. Replacing the SVG under
the pointer may toggle visibility again, as observed in React 6.6.8. Enter and
Space toggle once and ignore repeated keydown. Disabled blocks the toggle and
removes it from the Tab order. Readonly keeps it available. Mousedown and mouseup
preserve focus and caret position. The Svelte toggle is a native button with
type=button, equivalent interaction, and visible keyboard focus. It appears
after Input clear and count controls and before the suffix. The vendored MIT
license covers Eye and EyeInvisible from @ant-design/icons-svg 4.6.0.
IconRender returns a scalar or snippet. An empty result leaves an accessible button.

ConfigProvider.inputPassword supplies iconRender, variant, and semantic styles
on top of ConfigProvider.input. A nested inputPassword record replaces the parent
in full. Toggle labels use locale.global.show and hide. A partial global record
inherits the remaining fields. An explicit size adds an ant-input-password class
with the size suffix. An inherited size changes only Input as in upstream.

While the password is hidden, mount, input, focus, blur, and hiding remove the
value attribute without changing the value property. Showing the password restores
the attribute. Unmount clears timers. Input owns bind:inputElement, nativeElement,
and the focus, blur, select, and setSelectionRange methods exposed through bind:this.
SSR leaves timers and callbacks inactive. The `?fixture=input-password` fixture,
source SSR, and package checks cover these scenarios, themes, RTL, locale, and
FormItem. Input's component token engine and variant inheritance preserve the
agreed value and ref conventions.

PrefixCls sets Password and toggle icon classes. InputPrefixCls sets independent
classes on the nested Input. Empty and undefined values inherit the respective
ConfigProvider prefixes. Canonical token variables and the native toggle button
are preserved. Changing either prefix preserves DOM, refs, visibility, value,
selection, focus, and FormData.

In React 6.6.8, the icon CSS assumes the two names are linked, so independent
prefixes lose color and cursor styles. The four ported rules address both prefixes.
The reference keeps raw UMD measurements and the public paired-prefix counterpart
separate. The browser fixture is `?fixture=input-password-prefix`.
[Reference](../../../tests/browser/fixtures/ant-design-input-password-prefix-reference.json) · [Browser](../../../tests/browser/input/input-password-prefix.spec.ts) · [SSR](../../../tests/package/input/input-password-prefix.ssr.test.ts)
