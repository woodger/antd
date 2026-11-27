# Flex

```svelte
<Flex gap="small" justify="space-between" wrap>
  <Button>First action</Button>
  <Button>Second action</Button>
</Flex>
```

Flex renders its children without wrappers. A native component has one root, and
children is a snippet. CSS `:empty` hides an empty container as in Ant Design.
Orientation=horizontal or vertical takes priority over vertical. Vertical mode
uses stretch when align is omitted. Align and justify support values for which
the reference generates classes. Use style for other CSS settings. Wrap accepts
a boolean or wrap, nowrap, or wrap-reverse. False adds no class.

Gap accepts small, medium, large, a number in pixels, or a CSS string, including
a combined row and column gap. Preset gaps use the 8, 16, and 24px padding tokens.
Zero is preserved. Flex accepts a CSS shorthand or a unitless number. A numeric
or custom CSS gap and flex take precedence over the corresponding style
declarations. A preset gap uses a CSS class, so inline style takes priority.
For example, gap="small" with style="gap:99px" gives 99px, and gap={12} gives 12px.

Component selects a native HTML tag, div by default, or a Svelte component.
`bind:nativeElement` exposes the current HTMLElement and updates when the tag
changes. Class, rootClassName, style, and native attributes and events reach the
root. It adds no role, tabindex, font reset, or keyboard handler of its own.
RTL changes visual direction and preserves DOM order and native Tab navigation.

SSR and Chromium checks for `?fixture=flex` cover structure, direction, alignment,
gap, flex, wrapping, empty content, tag changes, events, focus, themes, and RTL.
ConfigProvider.flex sets vertical, class, and style. Undefined inherits the record.
An explicit object, including {}, replaces it in full. Direction priority is
orientation, local vertical, provider vertical, then horizontal. Provider style
comes before local style, followed by flex and a custom gap. Preset gap remains
a class. Local prefixCls changes the root and all layout classes. An empty string
selects ant-flex. CSS variables keep their namespace. The component's stylesheet
is included in SSR and keeps neighboring Flex containers isolated, including
when a prefix matches a private marker.

A custom component receives attributes, events, class, style, dir, and children
without an extra element. Class supports standard Svelte ClassValue. Flex consumes
layout props. The generic FlexComponentProps checks additional parameters, and
FlexProps remains an extensible interface for existing consumers. A custom root
must declare `nativeElement` through `$bindable()` without a fallback and bind its
root to forward that ref. An omitted ref stays undefined.

```svelte
<!-- CustomRoot.svelte -->
<script lang="ts">
  import type { FlexRootProps } from '@woodger/antd';
  let { children, nativeElement = $bindable(), ...rest }: FlexRootProps = $props();
</script>

<section {...rest} bind:this={nativeElement}>{@render children?.()}</section>
```

`components.Flex` accepts alias overrides and an algorithm. Upstream has no
component defaults of its own. PaddingXS, padding, and paddingLG change preset
gaps without adding a font or color reset. Set the CSS variable prefix
independently of the BEM prefix. The 33 official UMD scenarios use
`?fixture=flex-source`. Live updates preserve custom state, DOM, refs, focus, and
selection. Changing component replaces the root, as in React. The flex and
flex-prefix recipes reproduce 32 pinned CSS rules without a typography reset.
Flex inherits ConfigProvider.prefixCls. A nonempty local prefix takes priority.
[Browser](../../../tests/browser/flex/flex-source.spec.ts) · [SSR](../../../tests/package/flex/flex-source.ssr.test.ts) · [Reference](../../../tests/browser/fixtures/ant-design-flex-source-reference.json)
