# Shared ConfigProvider prefix

`ConfigProvider.prefixCls` changes the beginning of CSS class names. The library
defaults to `ant`. A nested provider inherits its parent's prefix. A component's
local `prefixCls` specifies its own class.

```svelte
<script lang="ts">
  import { Button, ConfigProvider } from '@woodger/antd';
</script>

<ConfigProvider prefixCls="suite">
  <Button>Сохранить</Button>
</ConfigProvider>
```

The button gets the class `suite-btn`. If you pass `prefixCls="save-button"` to
the button itself, it gets the class `save-button`.

## Components and inheritance

The shared prefix applies to App, Layout, LayoutSider, LayoutHeader, LayoutContent,
LayoutFooter, Statistic and its Timer, QRCode, Timeline, Steps, Divider, Flex,
Segmented, Avatar, AvatarGroup, Badge, BadgeRibbon, Tag, CheckableTag,
CheckableTagGroup, Empty, Skeleton and its primitives, Spin, Progress, Result,
Alert, Collapse, Affix, Tooltip, Popover, Popconfirm, Slider, BorderBeam, Masonry,
Splitter, Anchor, Space, SpaceCompact, SpaceAddon, Breadcrumb, Row, Col, Typography,
Carousel, Descriptions, Tabs, Card with Grid and Meta, Button, FloatButton with
Group and BackTop, Radio, RadioButton, RadioGroup, Checkbox, CheckboxGroup, Switch,
Input, TextArea, InputPassword, InputSearch, InputOTP, InputNumber, Form, FormItem,
FormList, FormErrorList, Rate, Listy, Tour, and Mentions.

The generated prefix and theme styles stay in the head, including ConfigProvider's
ordinary styles and grid media styles. They add no text around component roots.
User-provided spaces and text inside controls and snippets are preserved. The browser
fixture is `?fixture=prefix-text-boundaries`. [SSR boundary checks](../../tests/package/config-provider/prefix-text-boundaries.ssr.test.ts) ·
[Browser scenario](../../tests/browser/config-provider/prefix-text-boundaries.spec.ts)

Remaining families are connected separately. For example, ConfigProvider with
`prefixCls="suite"` creates `suite-app`, `suite-layout`, `suite-layout-sider`, and
`suite-layout-header` while keeping the public Svelte component names.

For the upstream theme, the base prefix supplies the fallback CSS variable
namespace. An inherited `theme.cssVar.prefix` takes precedence over a new provider
prefix. A local `cssVar.prefix` takes precedence over both. Explicit undefined
removes the inherited value and restores the current provider fallback, even
with `inherit=false`. In the absence of a local theme, the parent theme scope
and namespace stay in effect. Legacy mode without the upstream theme keeps
its previous variables and colors. Its `useToken.cssVar` uses the ant namespace.
The registry records this difference from upstream's fallback to the class prefix.

Changing the prefix at runtime preserves Layout and control DOM, refs, collapse
state, drafts, selection, and focus. Adjacent and nested scopes remain independent.
Canonical native markers and the --ant-* bridge stay in place. SSR exposes the
classes and upstream variables before hydration. [13 UMD cases and three transitions](../../tests/browser/fixtures/ant-design-config-prefix-reference.json) ·
[Browser tests](../../tests/browser/config-provider/config-prefix.spec.ts) ·
[SSR tests](../../tests/package/config-provider/config-prefix.ssr.test.ts) ·
[Namespace precedence](../../src/lib/theme/theme-prefix.test.ts)

Statistic and Timer, QRCode, Timeline, and Steps are also checked against nine
upstream examples and three transitions at `?fixture=widget-prefix`. The comparison
matches the parent typography and direction of the Svelte DOM provider. Timer's
current time is excluded from snapshots. [Reference data](../../tests/browser/fixtures/ant-design-widget-prefix-reference.json) ·
[Browser tests](../../tests/browser/config-provider/widget-prefix.spec.ts) ·
[SSR tests](../../tests/package/config-provider/widget-prefix.ssr.test.ts)

Divider, Flex, and Segmented are compared with nine upstream examples and three
transitions at `?fixture=core-prefix`. A prefix change preserves the selected
option, radio DOM, callbacks, FormData, and focus. Raw measurements also record
Segmented's existing behavior. A radio without a value attribute submits "on".
The typed value is available through value and onChange. [Reference data](../../tests/browser/fixtures/ant-design-core-prefix-reference.json) ·
[Browser tests](../../tests/browser/config-provider/core-prefix.spec.ts) ·
[SSR tests](../../tests/package/config-provider/core-prefix.ssr.test.ts)

Avatar and AvatarGroup, Badge and Ribbon, Tag and CheckableTag and its group, Empty,
Skeleton and its five primitives, Spin, Progress, and Result are compared with 17
upstream cases at `?fixture=status-prefix`. Raw data keeps the React result. The
comparison accounts separately for the previous AvatarGroup spacing, the default
Tag class, and the RTL class of CheckableTag. Native Skeleton host and status,
CSS variable names, and canonical markers stay in place. Badge ScrollNumber uses
the shared prefix independently of local `Badge.prefixCls`. Ribbon CSS also uses
the shared prefix. A prefix change preserves all 17 roots, drafts, focus, and
selection. [Reference measurements](../../tests/browser/fixtures/ant-design-status-prefix-reference.json) ·
[Browser tests](../../tests/browser/config-provider/status-prefix.spec.ts) ·
[SSR tests](../../tests/package/config-provider/status-prefix.ssr.test.ts)

Alert, Collapse, and active Affix are compared with nine upstream examples and
three transitions at `?fixture=structure-prefix`. Affix uses separate scroll
targets and remains unfixed in SSR, as upstream does. A prefix update preserves
the fixed node, the editor in the expanded Collapse panel, its value, focus and
selection, and the state of the other panels. [Reference data](../../tests/browser/fixtures/ant-design-structure-prefix-reference.json) ·
[Browser tests](../../tests/browser/config-provider/structure-prefix.spec.ts) ·
[SSR tests](../../tests/package/config-provider/structure-prefix.ssr.test.ts)

Tooltip, Popover, Popconfirm, and single and range Slider are compared with 45
upstream examples and 15 transitions at `?fixture=popup-prefix`. Open Slider
tooltips inherit the Tooltip prefix separately. A local Slider prefix only
sets the owner class. A Popconfirm prefix leaves the enclosing Popover's prefix
intact.

Changing the shared prefix preserves the trigger or control, popup DOM, drafts,
focus, selection, and Slider keyboard interaction. The check changes context
programmatically, as the raw UMD transitions do. Outside pointerdown is checked
separately and retains the existing native dismiss behavior. Raw textContent is
preserved. The comparison uses nonempty text nodes and omits whitespace between
Svelte slots. SSR keeps the existing hidden shells without opening popups or
creating DOM containers. [Reference data](../../tests/browser/fixtures/ant-design-popup-prefix-reference.json) ·
[Browser tests](../../tests/browser/popup/popup-prefix.spec.ts) ·
[SSR tests](../../tests/package/popup/popup-prefix.ssr.test.ts)

## Style nonce

Pass `csp={{ nonce }}` to ConfigProvider to apply the document policy nonce to
library-generated styles for themes, prefixes, and scroll locking inside ShadowRoot.
A nested provider with `csp={undefined}` inherits the setting. An explicit object
replaces it in full. `csp={{}}` clears the inherited nonce. The `CSPConfig` type is
available from the package.

SSR includes the nonce on `<style>` elements. A nonce change gives the browser
new style elements and preserves control DOM and focus. Ant Design React 6.6.8
retains the nonce on previously cached styles. The application configures
bundler-generated stylesheets and the policy for `style` attributes.
[React measurements](../../tests/browser/fixtures/ant-design-config-provider-csp-reference.json) ·
[CSP and hydration checks in Chromium](../../tests/browser/config-provider/config-provider-csp.spec.ts)

## Global settings for static calls

`ConfigProvider.config({ prefixCls, iconPrefixCls, theme, holderRender })` configures
the separate roots used by static Modal methods. The deferred render reads prefixes
and theme. The call to `Modal.confirm()` or another static method captures
`holderRender`. Pass `holderRender: undefined` to remove the wrapper from future
calls. An empty prefix string restores the default.

The snippet receives the standard content and can render it inside its own
provider. The provider can set RTL, a shared prefix, locale, or `modal` button
options. `iconPrefixCls` sets the class for the standard confirmation icon.
Ordinary providers continue using their own context. Global call settings are
stored only in the browser. [Global confirmations](components/modal.md#глобальные-подтверждения)
