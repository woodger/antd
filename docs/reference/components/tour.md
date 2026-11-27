# Tour

Tour walks the user through a series of interface steps. [Props and snippets](../../../src/lib/tour/tour.types.ts)

```svelte
<script lang="ts">
  import { Tour } from '@woodger/antd';

  let open = $state(false);
  let target = $state<HTMLButtonElement>();
</script>

<button type="button" bind:this={target} onclick={() => { open = true; }}>
  Start tour
</button>
<Tour {open} onClose={() => { open = false; }}
  steps={[{ title: 'First step', description: 'Description', target: () => target }]} />
```

Open and current are controlled props. The component reports changes through
callbacks, and the owner can decline them. A nonempty Tour opens by default
when open and defaultOpen are omitted. Defaults are read at creation. Reopening
resets uncontrolled current to zero. An index outside steps closes the Tour.
OnChange receives the new index. Normal completion calls onClose, onFinish,
then nextButtonProps.onClick. Step fields replace shared panel callbacks and
metadata, including explicit undefined.

Target accepts a DOM element, a getter, or null. The getter runs only in the
browser. Without a target, placement defaults to center and hides the arrow.
Tour supports 12 placements, pointAtCenter, flip and shift, the upstream flip
cache, and onPopupAlign. Gap defaults to 6px on both axes and radius to 2px.
Mask supports color and style. DisabledInteraction blocks pointer input in
the highlighted area. Clicking outside leaves Tour open. Mask=false with a
target leaves the page interactive while body scroll stays locked. Without a
target, a transparent layer captures pointer input as upstream does.

Autoscroll depends on raw open. DefaultOpen alone leaves it disabled. A regular
step gets its own scrollIntoViewOptions={block:'center',inline:'center'} before
falling back to the root setting. Explicit false calls native scrollIntoView(false).
The types accept animated and builtinPlacements. Ant Design forces placeholder
animation and supplies its own placements.

Title, description, cover, and button labels accept text, arrays, and snippets.
ActionsRender receives the original actions as a snippet and current and total.
IndicatorsRender receives current and total. Step.renderPanel replaces the whole
panel. An explicit renderPanel=undefined selects the base rc-tour panel with
native Prev, Next, and Finish. A stable description snippet preserves native
input drafts when changing steps.

ConfigProvider.tour sets class, style, closeIcon, and semantic slots or callbacks.
The callback receives raw props with merged steps and primary classes. Root style
and styles.root apply to the mask. Step styles and classNames replace panel slots
in full. Local layers take priority. Locale.tour and upstream Tour alias define
button labels. Local Tour takes precedence over tour. Global.close names the
close button. The portal retains light, dark, compact, and RTL context. Physical
text direction follows the actual container. Body stays LTR with RTL config,
as in React, while the ant-tour-rtl class and button context remain active.

A nonempty prefixCls sets Tour classes. Empty and undefined inherit ConfigProvider.
The panel, mask, placeholder, primary state, placements, and arrows use the same
resolved prefix. The Button namespace and private Tooltip variables use the shared
prefix independently of local Tour. Canonical token and marker names stay in place.
The scoped template reproduces 61 upstream CSS rules. A prefix change preserves
current step, open popup, draft, focus, selection, and callback order.

With the shared local class guide, an upstream provider nested under a different
global prefix loses button margins because the CSS cache uses the first
namespace. The raw results are preserved, and freshNested measures a new public
local class. Svelte isolates CSS by both prefixes. The fixture is `?fixture=tour-prefix`.
[UMD](../../../tests/browser/fixtures/ant-design-tour-prefix-reference.json) · [Browser](../../../tests/browser/tour/tour-prefix.spec.ts) · [SSR](../../../tests/package/tour/tour-prefix.ssr.test.ts)

Mask, placeholder, and popup default to body. GetPopupContainer=false renders
them inline without a body scroll lock. Pass a function for a custom container.
As in rc-tour, mask and placeholder call the getter without an argument, and
popup passes the placeholder. In a native Modal or Drawer, the default portal
stays in the dialog top layer so it remains interactive. CSS variables update
when the inherited theme changes.

Tour leaves autofocus, focus trapping, and focus restoration to its owner.
Physical Left and Right move between steps, excluding events from editable
controls. Escape accounts for keyboard, closable, and 200ms after IME
compositionend. All open Tours respond to Escape, as in rc-tour. SSR omits
portal layers and defers DOM getters and snippets. Closing or unmounting removes
DOM, locks, listeners, and observers. Deferred alignment stops reporting callbacks
after destruction.

`ConfigProvider.theme.components.Tour` prepares nine upstream CSS tokens,
alias overrides, and algorithms for default and primary panels, close controls,
indicators, and arrows. Button keeps its own theme. Local step and semantic
styles retain upstream precedence. Tour CSS loads before Button as in upstream.
Hovering Next in a primary panel takes text and border color from Button and
background from Tour. Theme updates preserve the step, portal DOM, focus,
caret, and user input. The `?fixture=tour-theme` checks cover 15 UMD themes.
[Tour theme](../../../tests/browser/tour/tour-theme.spec.ts)

The panel and mask use the Tour layer. A root Tour without explicit `zIndex`
uses 1001 even when `zIndexPopup` or `zIndexPopupBase` differs.
[React 6.6.8 measurement](../../../tests/browser/fixtures/ant-design-tour-z-index-observation.json)

A nested Tour adds 100 to the owner layer. Explicit `zIndex` sets it directly,
including 0. Descendants read the computed layer from context. [Shared context](../theme-context.md#layering-nested-panels)

The main fixture is `?fixture=tour`. [Engine](../../../src/lib/tour/tour.engine.test.ts) · [Public package SSR](../../../tests/package/tour/tour.ssr.test.ts) ·
[Browser](../../../tests/browser/tour/tour.spec.ts)

The recipe reproduces 61 upstream CSS rules. [CSS rules](../../../src/lib/vendor/tour.css) · [Recipe](../../../tools/ant-design-css-recipes.json)
Ported logic includes the MIT licenses for [rc-tour](../../../src/lib/vendor/LICENSE.rc-tour), [rc-trigger](../../../src/lib/vendor/LICENSE.rc-trigger),
and [rc-portal](../../../src/lib/vendor/LICENSE.rc-portal). CloseOutlined from icons-svg 4.6.0 uses the
existing [icons MIT license](../../../src/lib/vendor/LICENSE.ant-design-icons).
