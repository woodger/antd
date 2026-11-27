# FloatButton, FloatButtonGroup, and FloatButtonBackTop

FloatButton keeps native Button and href behavior, type=default or primary,
shape=circle or square, icon, and content. Text, numbers, booleans, and snippets
represent content. The number 0 keeps the fallback icon inactive. Without
renderable content or an icon, it uses FileTextOutlined from the pinned icons-svg.
The button is 40px and fixed at inline-end 24px and bottom 48px. The standard icon
is fontSizeIcon × 1.5, or 18px. Group shape takes priority over child shape.
Native htmlType, disabled, and events use the Button API.

Tooltip accepts scalars, snippets, or Tooltip props. Zero displays a tooltip.
Badge accepts Badge props except status, text, title, and children. The runtime
also excludes those props. Semantic classNames and styles for root, icon, and
content accept an object or a { props } callback that may return undefined.
Group context merges before local slots, and the button's style is last.

FloatButtonGroup accepts a children snippet or items=[{ key, children: Snippet }].
Items create separate Compact slots and take priority over children. An opaque
snippet uses CSS sibling geometry for square edges, with the exact Compact edge
classes outside that contract. Circle uses Flex and square uses Compact.
Click or hover trigger enables a menu. Omitting trigger renders the list directly.

FloatButton, Group, and BackTop support local and shared prefixCls. The Group
value is the base button prefix without -group. Child buttons inherit the owner
prefix when undefined. A nonempty local value takes priority, and an empty
value selects shared ConfigProvider. Button, Badge, Tooltip, and Compact keep
their own namespaces. Progress and animation parameters use the shared prefix
independently of the local class. Changing the prefix preserves DOM, refs, an
open menu, scroll and progress, drafts, selection, and focus.

Upstream Group leaves its local prefix out of children and the trigger. Raw UMD
measurements stay separate from matched public child prefixes and trigger
semantic aliases and styles. Svelte inherits the owner prefix. A shared local
class in a nested provider also exposed an upstream cache defect that drops
the BackTop progress background. The reference keeps the fresh Inner measurement
separate. The native implementation isolates the class and global namespace.

Placement stays physical for top, bottom, left, and right, including in RTL.
Open with onOpenChange is controlled, so the owner can decline a request.
Without open, the group owns state. Disabled blocks menu toggling and leaves
children's disabled state alone. Clicking outside closes the menu. Clicking an
item keeps it open. CloseIcon and semantic root, list, item, itemIcon,
itemContent, trigger, triggerIcon, and triggerContent slots are available locally
and through ConfigProvider.floatButtonGroup.

FloatButtonBackTop accepts target={() => window | document | element | null},
visibilityHeight (400), duration (450ms), and showProgress. SSR displays it only
with visibilityHeight=0 and defers target until the browser. After mount, scroll
updates visibility and progress, and resize updates progress alone. Click starts
a cubic scroll to 0 before the user callback. Reduced motion makes it instant.
Unmount cancels its animation frames and listeners. Bind:nativeElement is
available on FloatButton and FloatButtonBackTop and exposes the group div on Group.

ConfigProvider.floatButton.backTopIcon supplies the FloatButtonBackTop icon. As in
upstream 6.6.8, FloatButton's global class, style, and semantic slots are declared
but unused. Local props apply. A nested provider inherits its config when
undefined and replaces it as a whole when given an object.

`theme.components.FloatButton` applies alias overrides and algorithms to buttons,
Group, and FloatButtonBackTop. The pinned FloatButton has no component tokens of
its own. ControlHeightLG sets size, fontSizeIcon sets the icon, and paddingXXS,
marginXXL, marginLG, and group padding set spacing. Button keeps its own component
tokens. Its config style, semantic styles, and local style take priority over the
theme. Nested and adjacent providers stay isolated, with support for a custom
CSS variable prefix, reactive changes, and returning to legacy defaults.

FloatButton, Group, and BackTop use the owner layer. Explicit CSS in `styles.root`
and `style` takes priority. Buttons in Group read the same owner context as the
group. React 6.6.8 sets an explicit layer through `style.zIndex`. Its computed layer
overrode `styles.root.zIndex` in the measurement. Svelte preserves explicit CSS in
that slot. [Owner layer](../theme-context.md#layering-nested-panels)

Button, Badge, and Tooltip keep their existing limitations. The CSS recipe
reproduces 42 rules. The global fade uses WAAPI with upstream durations and
reduced motion. FloatButtonBackTop changes only opacity with linear easing and
preserves local transform during entry and exit. The browser checks compare
intermediate frames with the official UMD. Wave is inherited through the
shared Button, including BackTop and the group trigger. [Browser](../../../tests/browser/float-button/float-button-motion.spec.ts)

```svelte
<FloatButton tooltip="Помощь" aria-label="Помощь" onclick={showHelp} />
<FloatButtonGroup shape="square" trigger="click" aria-label="Действия">
  <FloatButton content="?" aria-label="Поддержка" />
  <FloatButtonBackTop visibilityHeight={0} aria-label="К началу" />
</FloatButtonGroup>
```
