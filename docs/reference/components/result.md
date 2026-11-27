# Result

```svelte
<script lang="ts">
  import { Button, Result } from '@woodger/antd';
  let { edit }: { edit: () => void } = $props();
</script>

<Result status="success" title="Application submitted"
  subTitle="Your data has been saved." headingLevel={2}>
  {#snippet extra()}<Button onclick={edit}>Edit application</Button>{/snippet}
  <p>Application number 42.</p>
</Result>
```

The form owner supplies the edit handler. Result displays an operation outcome.
It has no built-in requests, timers, or data management. Status accepts success,
error, info, warning, and 403, 404, or 500 as strings or numbers. It defaults to
info. The first four statuses use official filled icons. 403, 404, and 500 use
separate Ant Design illustrations with their original palettes. These variants
leave application routes and HTTP statuses alone.

Title, subTitle, extra, and children accept strings, numbers, booleans, null,
snippets, and nested arrays of those values. Undefined, null, false, and an empty
string omit containers. Zero, true, and arrays produce containers, and booleans
render no text. Strings are escaped. Title is a native heading with headingLevel
from 1 to 6, defaulting to 2. Choose a level for the page structure and give
it text content without a nested heading. Extra contains actions and children
contains details. The reading order is icon, title, description, actions, then
details. Actions keep normal Tab and Shift+Tab and their own keyboard semantics.

Icon accepts the same decorative content. Null and false hide the regular icon,
undefined and an empty string keep the built-in icon, and 0 renders literally.
As in Ant Design, the 403, 404, and 500 illustrations take precedence over icon,
including false. Their container is aria-hidden and inert, so the icon neither
duplicates the heading nor adds focus stops. A custom icon owns its resources
and animation. Put interactive elements in extra or children.

Result.PRESENTED_IMAGE_403, 404, and 500 are Svelte components for the upstream
illustrations, for example `<Result.PRESENTED_IMAGE_404 />`. Standalone images
keep the upstream SVG geometry, colors, and titles (Unauthorized / No Found /
Server Error). Their original viewBox and ARIA behavior are preserved. Inside
an exception Result, the viewBox illustrations are decorative and have no title.
One container has both icon and image classes, as upstream does.

Id, class, style, data-*, and aria-* apply to the root. Aria-label or
aria-labelledby names a group. An explicit role takes precedence. Result leaves
live announcements, autofocus, and Tab handling to its surroundings. The owner
decides whether to announce the outcome or explicitly move focus after submission.
When a focused action disappears, focus returns to an available control inside
or near Result. On unmount, restoration uses saved neighbors in the current
dialog or document. It preserves explicit focus chosen by the owner. Empty
uses the same mechanism.

ConfigProvider.result sets class and style and supports object or function
classNames and styles for root, title, subTitle, body, extra, and icon. Callbacks
receive input props with resolved status='info'. Classes merge. Root style order
is provider.styles.root, provider.style, local.styles.root, then local.style.
Undefined inherits the provider record. An explicit object, including {},
replaces it in full. Local prefixCls and rootClassName and bind:nativeElement
and ref are supported. Refs are assigned after mount and cleared on unmount.
Appearance changes preserve action DOM, value, focus, and selection.

ConfigProvider supplies the theme, compact settings, and direction. All four
Result tokens, aliases, and component algorithms apply to the root before user
styles. Regular icon colors and the text and background of the details use tokens.
Illustrations keep their original colors. Text and actions wrap, and SVGs shrink
in narrow viewports. The owner supplies and translates the title, description,
and action text. [Result tokens](../theme-context.md#result-tokens)

The native heading, named group, decorative inert icons, responsive inline
padding and image sizes, flex and wrapping of actions, and focus restoration
are preserved. The 81 official UMD scenarios compare the remaining API, slot
styles, and complete SVG geometry. The browser CSSOM parses compact arc flags
when comparing path d. The upstream theme uses the original fitted viewBox for
status icons. The legacy viewport is preserved. Separate checks cover these
native layout and ARIA boundaries outside the upstream snapshots. The shared
ConfigProvider prefix is supported. React development warnings are still outside
the port.
