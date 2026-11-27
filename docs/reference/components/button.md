# Button

Button preserves its existing props and native onclick and adds href, color and
variant, ghost, square shape, iconPlacement, classNames, styles, and rootClassName.
Children and icon accept a snippet, text, number, or boolean. Zero is displayed,
and true creates present but empty content. ButtonProps remains the native
button interface at Button.svelte. ButtonLinkProps describes a link. Href
determines the currentTarget type. Onclick without href gets HTMLButtonElement,
and with href gets HTMLAnchorElement. OnClick is an alias, with native onclick
taking precedence. Bind:nativeElement exposes the actual button or anchor.

```svelte
<Button color="purple" variant="filled" iconPlacement="end">Do something</Button>
<Button href="#details">View details</Button>
<SpaceCompact size="small"><Button>Back</Button><Button>Next</Button></SpaceCompact>
```

A complete color and variant pair takes precedence over type and danger.
Without the pair, explicit type or danger uses the upstream shorthand mapping.
Variant=solid on its own selects primary. Other incomplete pairs fall back to
ConfigProvider.button or default and outlined, as in Ant Design 6.6.8. Color
includes default, primary, danger, and 13 preset colors. Ghost turns solid into
outlined and enables a transparent background. Text and link variants skip ghost.
Square uses the regular border radius without a separate shape class. Block
and sizes keep their behavior.

Loading accepts a boolean or { delay, icon }. A positive delay postpones the
spinner. Changing the delay, canceling loading, or unmounting clears the deadline.
Loading.icon takes precedence over button.loadingIcon. SSR starts no timer and
skips a delayed spinner. The default spinner changes width, opacity, and margin
on enter and exit when there is no regular or custom icon. An already visible
indicator stays in place on first render and hydration. The exit removes the
icon when complete, while the loading state and button accessibility update
immediately. `theme.token.motion=false` and prefers-reduced-motion disable the
transition. [React 6.6.8 comparison](../../../tests/browser/button/button-loading-motion.spec.ts)

The agreed v1 native button remains disabled and aria-busy during loading.
React guards the click, a difference preserved in v1. For links, loading
calls preventDefault to cancel navigation. Disabled also removes href, adds
aria-disabled, and sets tabindex=-1. An enabled anchor gets tabindex=0 as
upstream does. A native button keeps htmlType button, submit, and reset and
its form attributes. Navigation requires the link path through href.
AutoFocus focuses on mount.

Hydration preserves the DOM node and focus of a focused button or link.
Enter calls the handler on the same native element. [React 6.6.8 comparison](../../../tests/browser/button/button-hydration.spec.ts)

ClassNames and styles take an object or a function of { props } for root, icon,
and content. Classes merge. Style order is context.styles, context.style on
root, local styles, and local style on root. ConfigProvider.button configures
autoInsertSpace, shape, color, variant, loadingIcon, class, style, and semantic
slots. An omitted button record inherits config. An explicit object, including
{}, replaces it in full as in upstream. The internal _skipSemantic prop lets
FloatButton skip the config's semantic slots and is reserved for library use.

Button size resolves from local size, then Compact, then ConfigProvider.
Use SpaceCompact for compact groups. Native Tab order is preserved.

AutoInsertSpace defaults to true. Scalar children containing exactly two
U+4E00–U+9FA5 characters get a space in SSR when there is no icon and the variant
is neither text nor link. Svelte snippets are opaque to SSR. After hydration,
Button checks the single rendered text or element and applies the upstream HOC
letter-spacing class. A snippet keeps its original textContent and owned DOM.
Scalar children use an ASCII space. Text observation is cleaned up on unmount.
The registry records this adaptation as partial coverage.

Button supports local and shared prefixCls across the root, icon and loading,
variants, sizes, shapes, and Compact. A nonempty local prefix takes precedence.
An empty or undefined value inherits ConfigProvider.prefixCls. Variant and
Compact variables use the shared namespace independently of local class and
cssVar.prefix. Component tokens and legacy themes keep their namespace and
style precedence. Prefix changes preserve DOM, refs, focus, draft, selection,
and native submit behavior.

Upstream component tokens and Wave are supported. The theme, RTL, Form disabled,
and Compact mechanisms are shared. The `?fixture=button` unit, SSR, and Chromium
checks cover precedence, forms and links, delay and cancellation, CJK, nested
configuration, Compact, and Popconfirm. The `?fixture=button-prefix` fixture
compares styling with the official UMD and checks preserved state. Default
Button CSS is in vendor/antd.css. Button-prefix generates a separate template
without deprecated ButtonGroup. [Wave](../wave.md)
