# TextArea (Input.TextArea)

TextArea is a separate export corresponding to React Input.TextArea. The basic
API includes string bind:value, defaultValue, name, rows, cols, maxlength,
minlength, required, disabled, readonly, placeholder, autocomplete, and native
textarea attributes. As upstream does, the browser enforces maxlength on user
input. Programmatic values can exceed it. DefaultValue is captured on creation
and value takes precedence. After an edit, value=undefined clears the field as
in the local Input.

OnValueChange receives a string on each input before native oninput. Onchange
is the native change event at commit. Onselect, onbeforeinput, composition,
and keyboard events reach the textarea. OnPressEnter precedes onkeydown except
when Enter has isComposing=true. The default newline is inserted unless the
callback calls preventDefault(). Bind:nativeElement exposes HTMLTextAreaElement
for focus, blur, select, setSelectionRange, and reading selectionStart,
selectionEnd, and selectionDirection.

Size and status=error or warning, Compact, RTL, themes, Form and FormItem disabled,
name and id, required, aria-invalid, and error descriptions inherit existing
contexts. Explicit props take priority. Form.resetFields restores the bound
field through the form model. Without allowClear, showCount, or count.show,
the field is one native textarea. AutoSize alone adds no wrapper. Count and
clear use the upstream ant-input-affix-wrapper and ant-input-textarea-affix-wrapper.

```svelte
<script lang="ts">
  import { TextArea } from '@woodger/antd';
  let description = $state('');
</script>
<label for="description">Описание</label>
<TextArea id="description" name="description" rows={4} maxlength={2000} required bind:value={description} />
```

AutoSize=true measures the value or placeholder. { minRows, maxRows } constrains
height. Measurement accounts for box sizing, padding, borders, font, width,
and wrapping. Vertical scrolling starts at the maxRows limit. Below it,
overflowY is hidden. AutoSize sets resize:none. Disabling it restores authored
styles. One hidden textarea per document reproduces upstream measurement.
Svelte gives it native tabIndex=-1 and removes it after the last consumer.
ResizeObserver deduplicates floor and offset sizes, calls onResize({ width, height }),
and schedules measurement in an animation frame. Frames, observers, a mouseup
listener, and ref bindings are cleaned up. Mousedown with manual resize:both
marks the wrapper dirty. OnResize also preserves upstream height:auto for a
nonempty wrapper after setting textarea.height.

ShowCount=true displays UTF-16 length, with two units for a surrogate pair.
Native maxLength or maxlength stays a browser limit. Count.max overrides the
displayed maximum. Above it, TextArea adds ant-input-out-of-range and leaves
value and Form validation intact. Count.max=0 disables the soft range and clipping.
Count.strategy changes the count. Truncation requires count.max and
count.exceedFormatter(value, { max }) and takes place after composition. External
values stay intact, and native clamping preserves selection. Count.show overrides
showCount, including explicitly passed show:undefined. ShowCount.formatter and
the count.show formatter receive { value, count, maxLength } and return a string,
number, or Snippet<[info]>. Use formatter:()=>snippet for rich content. The counter
adds no live region.

AllowClear accepts a boolean or { disabled, clearIcon }. The icon accepts a
scalar or snippet. Omitted icon and disabled settings inherit
ConfigProvider.textArea.allowClear. Explicit false disables clearing, and an
object with disabled=false overrides context disabled. As upstream does, the
button stays mounted with a hidden class for an empty, disabled, or readonly
value. Pointerdown preserves focus. Clearing focuses the textarea and calls
onValueChange(''), onChange with type=click, and onClear in order. It leaves
native oninput to native input events. An explicit falsy clearIcon uses the
upstream '✖'. Set dimensions and line height for a text icon because the
upstream button uses line-height:0 for SVG.

OnChange receives an object with a cloned textarea as target and currentTarget
and a stable value as in resolveOnChange. Input uses type=change and the original
DOM event in nativeEvent. Compositionend and clear preserve their event types.
Target.setSelectionRange delegates to the real textarea. The implementation uses
a native Event proxy with delegated DOM methods. OnChange runs between
onValueChange and native oninput. Compositionend calls onChange and invokes the
legacy input callback only when exceedFormatter changed the value. Camel-case
onFocus, onBlur, onKeyDown, onMouseDown, onCompositionStart, and onCompositionEnd
complement native handlers.

Variant supports outlined, filled, borderless, and underlined. Explicit variant
takes precedence over Form.variant, component configuration, and shared variant,
with outlined as the fallback. ClassNames and styles accept root, textarea,
clear, and count or a callback({ props }) with the current Svelte value.
Context and local semantic styles merge. Root style follows the corresponding
semantic root styles. Root resize passes to the textarea, and styles.textarea
takes priority over it. Without a wrapper, root styles follow textarea styles
as in upstream. ConfigProvider.textArea supports allowClear, autoComplete,
variant, class, style, classNames, and styles. An explicit nested config replaces
the parent.

Bind:nativeElement exposes HTMLTextAreaElement. RootElement exposes the textarea
or span wrapper. Bind:this exposes focus({ cursor: 'start' | 'end' | 'all',
preventScroll }) and blur(). Native autocomplete and readonly and the
maxLength, readOnly, autoComplete, and autoFocus aliases stay on the real control.
SSR leaves ResizeObserver, the hidden textarea, and resize and change callbacks
inactive.

The `?fixture=textarea-features` fixture supplements `?fixture=textarea`. Unit,
SSR, and browser checks cover count, clear, IME, size and cleanup, native refs,
events and forms, themes, and RTL.

The agreed API keeps string bind:value and named Svelte bindings. React controlled
rejection, broad value types, and the upstream resizableTextArea ref shape remain
outside this contract. Local and shared prefixCls and the Input component token
engine apply as for regular Input. The audit of the full Input family, including
the remaining subcomponents, is still pending.
