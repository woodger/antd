# InputOTP (Input.OTP)

InputOTP splits a code across individual Input cells. The group uses role=group.
Cells are named “OTP Input 1”, “OTP Input 2”, and so on by default.
[Props and settings](../../../src/lib/input/input-otp.types.ts)

```svelte
<script lang="ts">
  import { InputOTP } from '@woodger/antd';
  let code = $state('');
</script>

<InputOTP value={code} onChange={next => { code = next; }}
  formatter={text => text.replace(/\D/g, '')} autoComplete="one-time-code"
  aria-label="Verification code" />
```

There are six cells by default, with type=text and arbitrary text content.
Each cell holds one UTF-16 code unit, as in upstream split(''). Filtering digits
requires a formatter. Native size=1 sets the width. There is no maxlength=1,
so pasting several characters distributes them across the cells and replaces
the tail. Formatter receives the full string with spaces for empty positions
before truncation to length. Empty positions in the middle are preserved, and
the empty tail is removed.

OnInput runs for every native input with the array of cells. OnChange follows only
for a full code that changed. Clearing, partial codes, and repeated events with
the same full code leave onChange untouched. As upstream does, the component
processes composing input immediately without a separate IME buffer. Prop changes
leave onInput and onChange untouched.

Value synchronizes when the prop changes. An unchanged value lets the local draft
stand, and leaving controlled mode keeps the current cells. Use onChange for the
complete value and onInput for a partial value. The API does not provide bind:value.
DefaultValue is captured at creation and runs through formatter. External value
skips formatter. As upstream does, SSR uses defaultValue and applies value after
mount. Supply both for an initial code in SSR.

Focus cannot skip earlier empty cells. ArrowLeft and ArrowRight move between
physical indexes, including in RTL. Backspace in an empty cell returns to the
previous cell. Ctrl or Meta+z is blocked as in upstream. Focus, mouse, and keyboard
actions restore selection through an animation frame. Unmount cancels pending
selection updates. AutoFocus and focus() select the first cell, blur() removes
focus, and bind:nativeElement exposes the group div.

Mask=true displays •. A string sets a custom symbol, including emoji. The real
value stays in the input. A mask defaults to type=password, with explicit type
taking precedence. Separator accepts a scalar or factory(index). The factory can
return Snippet<[number]>, for example through () => snippet. Numeric 0 is preserved.
False, null, undefined, and an empty string omit the separator. True leaves an
empty wrapper as in upstream isReactRenderable.

ConfigProvider.otp sets class, style, semantic root, input, and separator slots,
and variant. A nested object replaces the parent in full. Variant inherits from
otp, then input. Shared Input config still applies to the cells. The inherited
Input clear control leaves OTP alone because it listens to native input and
the clear action uses onChange(click). The group size inherits componentSize.
Compact still applies to the inner Input components. FormItem id, label, and error
description apply to the group. Status and disabled reach the cells. Reset follows
Form.resetKey, including partial codes that do not trigger onChange.

The otp recipe extracts 16 rules without keyframes into vendor/otp.css and
verifies the source npm archive SHA-256. The `?fixture=input-otp` fixture, engine,
SSR, and package checks cover these scenarios. The family-wide Input audit is
pending, and React development diagnostics, including the long mask warning,
remain outside the port. Input component tokens apply to both cells and group,
including gap and padding aliases. Semantic styles and style keep precedence.

PrefixCls changes the group, size and RTL states, input, wrappers, mask, and
separators. A nonempty local prefix takes priority. Empty or undefined values
inherit ConfigProvider. Nested Input uses the shared input namespace independently
of the local OTP prefix. Canonical token variables and markers are preserved.
Changing the prefix preserves group, cells, wrappers, code, callbacks, refs,
focused index, and selection.

In React 6.6.8, wrappers and mask use the shared OTP prefix even with a local one.
The native implementation passes the owner prefix throughout OTP and keeps the
shared Input namespace independent. The reference keeps raw UMD results separate
from the public counterpart with a nested ConfigProvider aligned to the local
prefix. The `?fixture=input-otp-prefix` checks also compare default and shared
prefixes with the native light, dark, and compact themes. [Reference](../../../tests/browser/fixtures/ant-design-input-otp-prefix-reference.json) ·
[Browser](../../../tests/browser/input/input-otp-prefix.spec.ts) · [SSR](../../../tests/package/input/input-otp-prefix.ssr.test.ts)
