# Tag, CheckableTag, and CheckableTagGroup

```svelte
<script lang="ts">
  import { CheckableTag, ConfigProvider, Tag } from '@woodger/antd';
  let checked = $state(false);
</script>

<Tag color="success" variant="outlined">Готово</Tag>
<Tag closeIcon closeLabel="Удалить обязательную метку"
  onClose={event => event.preventDefault()}>Обязательная метка</Tag>
<Tag href="#tag-help" closable>Ссылка с закрытием</Tag>
<CheckableTag {checked} onChange={value => { checked = value; }}>
  Показывать готовые задачи
</CheckableTag>

<ConfigProvider tag={{ variant: 'outlined', style: 'letter-spacing:1px' }}>
  <Tag color="#2db7f5" styles={{ root: 'font-weight:600' }}>CSS color</Tag>
</ConfigProvider>
```

Tag shows a label with a required `children` Snippet. `icon` and a
custom `closeIcon` accept Snippets. `closeIcon` also accepts text and
numbers. Keep contents to short phrasing markup without nested
controls other than a link. Icons are decorative, `aria-hidden`,
and `inert`. With no nonempty `href`, the root is a `span` and
adds no Tab stop or live region. `aria-label` or `aria-labelledby`
gives the `span` a group role. A supplied `role` takes precedence.
A nonempty `href` uses a native anchor with `target`, Tab, and Enter.
Disabled retains the anchor, removes `href`, and adds
`aria-disabled`. Closing a link prevents navigation. Canceling
the close preserves its contents. A child link retains its
own `href`. As upstream, a disabled Tag changes that link's style
and pointer events.

HTML, data, and ARIA attributes and native events apply to the
root. Local `dir` takes precedence over context. `bind:nativeElement`
supplies the current span or anchor, updates when the root type
changes, and clears on close or unmount. The ref is empty during
SSR. Hydration preserves existing DOM and focus. Separate anchor
and span branches avoid reinserting the root and losing focus on
a child button.

`onClick` and `onclick` receive the root span's native click.
`onclick` takes precedence. A callback or one direct link enables
Wave. Closing stops propagation and leaves the tag's `onClick`
uncalled. [Wave](../wave.md)

`variant` supports `filled` (default), `outlined`, and `solid`. The
previous default class is preserved. Semantic callbacks receive
the original undefined color except for the `solid` default.
Statuses are `success`, `processing`, `error`, `default`, and `warning`.
Preset colors are `blue`, `purple`, `cyan`, `green`, `magenta`,
`pink`, `red`, `orange`, `yellow`, `volcano`, `geekblue`, `lime`,
and `gold`. Pink and magenta use their respective Ant Design
tokens. A status color adds no `role=status`, animation, or
announcement. `TagColor`, `TagPresetColor`, `TagStatusColor`, and
`TagVariant` are exported through `index.ts`.

`color` also accepts CSS strings. `solid` sets `background-color`.
`filled` and `outlined` calculate a light background using upstream
FastColor and HSL lightness 0.95, preserving alpha. `outlined`
adds `border-color`. CSS variables are used as supplied for
foreground and border. FastColor leaves their value unresolved.
Disabled removes calculated colors and preserves explicit
`styles` and `style`.

Variant precedence is local prop, `ConfigProvider.tag.variant`,
then `filled`.

`ConfigProvider.tag` inherits when omitted. An explicit object,
including `{}`, replaces the parent record. It supports `class`,
`style`, `variant`, `classNames`, `styles`, `closable`, and
`closeIcon`. `TagSlots` and `TagSemantic` define `root`, `icon`,
`content`, and `close` as CSS or class strings. Callbacks see
resolved `color`, `variant`, and `disabled`. Root style order is
calculated CSS color, context `styles.root`, context `style`,
local `styles.root`, and local `style`. `rootClassName` supplements
`class`. Shorthand and longhand updates follow upstream style
diffing. CSS strings preserve native `!important` precedence.

Icon classes and styles apply to the Snippet's existing decorative
wrapper. The close slot applies to the native button. As upstream,
the content semantic slot applies when an icon is present. The
existing internal content wrapper and description for the close
button are retained. CheckableTag reads only context `class` and
`style`, with local `style` taking precedence. Tag semantic settings
and variant do not apply to CheckableTag.

The close button is hidden without local or context close settings.
`closeIcon=true` selects the default close Icon. Text, numbers, and
Snippets replace its graphic inside the same native button. An
empty string and 0 keep the control. Omitted props inherit context.
`closable=false` hides the button regardless of icon. `closeIcon=false`
or `null` hides it unless `closable` is enabled. Explicit
`closable=true` retains the inherited or default icon.

`closable` also accepts an object with `closeIcon` and ARIA attributes.
Inside this object, `closeIcon=null` hides the control and booleans
leave its graphic empty. `undefined` preserves the context field.
Only ARIA attributes pass through, as in `useClosable`. Tag uses
`Tag.disabled` for blocking and leaves this object's `disabled` and
`afterClose` unused. `closeLabel` takes precedence over
`closable['aria-label']`, followed by `locale.closeText`. By default,
the button description references tag content. It can be overridden
with `closable['aria-describedby']` so buttons with the same
“Close” label keep their context. `disabled` inherits
`ConfigProvider.componentDisabled` and explicit `false` overrides it.
Disabled blocks closing and callbacks while leaving content intact.

`onClose` receives a native `MouseEvent`. `event.preventDefault()`
cancels the close synchronously. Return values and Promises are
ignored. Reentering from the callback does not repeat `onClose`.
A direct DOM listener stops the click from bubbling. Enter and
Space are handled at keydown on the `type=button` button. Repeat
and canceled events are ignored. The button does not submit the
form. The callback can remove the whole component or choose focus.

An accepted close removes content from the DOM. Prop changes leave
the instance closed. To show it again, create a new instance or
key. Tag leaves the owner's collection intact. When removing an
item or canceling `onClose`, the owner synchronizes its model.
Focus from a closed or removed button moves to the next accessible
control in the current dialog or document, then to the previous
one. Hiding `closeIcon` also restores focus. Explicit focus chosen
by the owner is preserved. Closing produces no additional
announcement.

CheckableTag is a separate export with required `children` and a
decorative icon. It uses a native `type=button` button with
`aria-pressed`. It does not act as a form field. `checked` defaults
to `false` and is fully owner-controlled. `onChange` reports
`!checked`. The owner sets the value, and there is no
`bind:checked` or `defaultChecked`. External `checked` changes do not
call the callback. Disabled preserves the value and contents while
removing the button from the Tab order and blocking toggling.

CheckableTag supports Enter, Space, and native Tab. Removing the
button restores focus nearby, respecting the owner's choice.
`onClick` runs after `onChange`. Canceling click inside it leaves the
reported value intact. `onKeyDown` runs first, and
`preventDefault` cancels toggling. Space toggles at keydown, ignores
repeat, and skips `onClick`. Native Enter generates a click. Lowercase
`onclick` and `onkeydown` override their corresponding callbacks.
An already canceled click triggers neither toggling nor `onClick`.

`id`, `class`, `style`, `title`, data and ARIA attributes, and other
HTML attributes apply to the button. `dir` inherits when omitted.
`bind:nativeElement` keeps the button across updates and clears on
unmount, and SSR creates no ref. The component owns `type=button`
and `aria-pressed`. The owner manages selected filters, combining
them, and integrating with Form and Table. There are no hidden
FormData fields or automatic FormItem integration.

CheckableTagGroup is a separate export corresponding to
`Tag.CheckableTagGroup`. `options` accepts strings, numbers, or
records with `value`, `label`, `className`, and `style`. `label` also
accepts a Snippet. Values preserve type and must be unique stable
keys. Without options, the group is empty regardless of children.

```svelte
<script lang="ts">
  import { CheckableTagGroup } from '@woodger/antd';

  let selected = $state<string[]>(['Books']);
</script>

<CheckableTagGroup multiple options={['Movies', 'Books', 'Music']}
  value={selected} onChange={next => { selected = next; }} />
```

Without `multiple`, clicking a selected tag again returns `null`.
In multiple mode, the callback receives an array. Adding keeps
existing value order, and removing keeps the remaining values,
including values outside `options`. The owner controls `value` and
can reject the callback to keep `checked`. Without `value`, state is
local and `defaultValue` is read only at creation. Switching `value`
to `undefined` resets local state as in upstream `useControlledState`.
External updates do not call the callback. `bind:value` is unsupported.

`classNames` and `styles` set `root` and `item` with an object or
callback receiving raw group props. Root style order is context
`styles.root`, context `style`, local `styles.root`, and local
`style`. Each item receives context CheckableTag `style`, context
`styles.item`, local `styles.item`, and `option.style`. Context
`class` applies to the group and tags. Local `class` and
`rootClassName` apply to the group, and `option.className` applies to
the tag. Shared `ConfigProvider.tag` callbacks receive the current
component's props. As upstream, the context type remains Tag.
Use local props for typed group callbacks.

The root is a `div` without an automatic group or radiogroup role.
It receives `id`, `role`, data and ARIA attributes. Other HTML props
are omitted as upstream. `bind:nativeElement` supplies the `div`
after mount and clears on unmount. Group disabled state passes to
tags. `undefined` inherits `componentDisabled`, and `false`
overrides it. The group disabled class reflects the local prop.
Flex wrapping and gap use upstream `paddingXS`. Tags remain native
CheckableTag toggle buttons with Enter, Space, `aria-pressed`,
focus recovery, and no FormData entries. React uses a span.

Tag, CheckableTag, and CheckableTagGroup accept a local `prefixCls`.
Omission or the empty string inherits `ConfigProvider.prefixCls`
(`ant-tag` by default). Root, modifier, and close classes follow the
prefix. The group and item classes change with the group prefix.
Nested CheckableTags inherit the shared prefix independently, as
in the pinned upstream. `prefixCls` neither becomes an HTML attribute
nor renames CSS variables. The internal content and icon wrappers
and native dark class are preserved.

A custom prefix uses a template of 90 upstream CSS rules. It is
emitted in the SSR head and updates with props. Prefix changes
keep the root, close control, and group items mounted. Removing or
closing an instance releases its stylesheet and preserves nearby
styles. The default prefix uses existing vendor CSS without an
extra head style. Native wrapping, hit target, focus, and dark and
compact themes are preserved. Semantic styles and component tokens
retain their source.

The components inherit theme, primary color, compact mode, and RTL.
In the dark theme, Tag uses tokens for ordinary text color and
adapts preset and status backgrounds and borders through
`color-mix` and local palette tokens. Solid keeps the supplied
color. A plain solid tag in dark mode uses a light background and
dark text. This adaptation applies to the native theme. The
upstream token and algorithm theme uses original Tag aliases,
component overrides, and algorithm palettes. Text wraps on
narrow screens and the close control does not shrink. Reduced
motion disables built-in transitions. The owner manages resources
in custom Snippets. `closeText` is already part of `ruRU` and `enUS`.

The owner handles drag-and-drop and external animation.
