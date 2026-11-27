# QRCode

QRCode renders a code on canvas or in SVG and supports loading and error states.
[Props, status snippet, and semantic configuration](../../../src/lib/qr-code/qrcode.types.ts)

```svelte
<script lang="ts">
  import { QRCode } from '@woodger/antd';
</script>

<QRCode
  value="https://ant.design"
  type="svg"
  size={180}
  marginSize={4}
  aria-label="Link to Ant Design"
/>
```

An array value specifies separate segments. Numeric, alphanumeric, and UTF-8
use upstream rules. Versions 1–40 and correction levels L, M, Q, and H are
available. BoostLevel raises correction by default when the symbol size stays
the same. An empty string renders no DOM. An empty array renders a symbol without
a payload. A value that is too long throws RangeError `Data too long`, and an
unpaired Unicode surrogate throws URIError without substituting input.

Type defaults to canvas. SSR emits a canvas shell with size dimensions.
Drawing after mount accounts for devicePixelRatio. SVG is complete in SSR.
MarginSize is measured in modules, rounds down, and is clamped to at least 0.
The default 0 preserves Ant Design behavior. Size sets bitmap size and fallback
root width and height. Only ordinary style width and height also reach the
drawing. Semantic root dimensions stay on the root. CSS stretching leaves
bitmap resolution intact.

Icon takes a URL. IconSize accepts a square size or width and height, defaulting
to 40×40. Zero preserves rc-qrcode's fallback to 10% of size. The icon is centered,
loaded with crossOrigin=anonymous, and stretched to the specified rectangle.
Canvas cuts out overlapped modules only after successful load. SVG does so
immediately. Without Path2D, the upstream separate-rect fallback keeps the
modules under the icon. Without a 2D context, the canvas shell stays in place.
A failed image load leaves all QR modules visible on the canvas. Use
nativeElement.querySelector('canvas').toDataURL() for PNG. The remote image
server must permit CORS as in upstream.

Status active shows the drawing without a cover. Expired shows a message and
refresh, loading uses Spin, and scanned shows confirmation text. The owner
updates status after onRefresh. The button uses current Button, configuration,
and disabled rules, keeps native type=button, and bubbles its click to the
root. StatusRender receives status, locale, and onRefresh and replaces the
entire cover contents, including an empty result. Locale.qrcode merges field
by field. Russian and English labels come from the pinned Ant Design dictionaries.

Role=img and aria-* apply to canvas or SVG. Native id, title, data-*, and event
handlers apply to the root. Title stays on the root, and children is omitted.
Name the drawing with aria-label or aria-labelledby. Bind:nativeElement exposes
the root and clears on an empty value or unmount. A late load from a detached
image leaves the old canvas alone.

ConfigProvider.qrcode sets class, style, classNames, and styles for root and
cover. A nested config replaces the object in full. Semantic callbacks receive
resolved type, size, status, bordered, errorLevel, and bgColor. Root style follows
semantic styles. Size or ordinary width and height are applied last. Color
defaults to the global colorText theme token. Component QRCode.colorText and
style.color leave modules unaffected. Explicit color takes precedence. Undefined
global colorText uses the upstream #000000 fallback. Native light and dark
defaults are preserved. Bordered=false retains a transparent border and removes
padding and radius. RTL is inherited.

Upstream QRCode declares no public component tokens of its own.
ConfigProvider.theme.components.QRCode supports alias tokens and algorithms for
padding, border, radius, cover text, and other global values. The inner cover
background comes from colorBgContainer with absolute alpha 0.96, including
a translucent original color. Theme variables precede semantic and user styles.
The `?fixture=qrcode-theme` checks cover global and component algorithms,
cssVar.prefix, and nested, reset, and sibling scopes. Changes to global colorText
redraw the existing canvas and update the existing SVG. Cover and padding changes
preserve status snippet focus and refs. [UMD](../../../tests/browser/fixtures/ant-design-qrcode-theme-reference.json) · [SSR](../../../tests/package/qr-code/qrcode-theme.ssr.test.ts) · [Browser](../../../tests/browser/qr-code/qrcode-theme.spec.ts)

The qrcode recipe reproduces all 11 CSS rules with SHA-256 verification.
The `?fixture=qrcode` unit, SSR, package, and browser checks cover matrices,
pixel centers, quiet zone, icon and CORS, statuses, refs, themes, styles, and
fallback. Matrix checks use fixed npm package results for all 40 versions,
four correction levels, and eight masks. [Fixed reference matrices](../../../tests/package/qr-code/qrcode-vectors.json)

Local prefixCls changes root, cover, expired, scanned, and borderless classes.
An empty string inherits ConfigProvider.prefixCls, giving ant-qrcode by default.
The CSS module is scoped to its root marker. Token namespaces and Button and
Spin classes stay intact. Neighboring QRCode instances are isolated, including
prefix collisions with cover, css-var, and borderless. A prefix change preserves
root, canvas or SVG, encoding, status, refs, and keyboard-accessible refresh.
The module fallback variable preserves the adaptive cover of the existing
light and dark themes. Native RTL is inherited. The raw reference records
upstream root LTR. The `?fixture=qrcode-prefix` uses the qrcode-prefix recipe,
which produces the same 11 rules as a CSS data module and verifies SHA-256.
The local prefix takes priority over shared ConfigProvider.prefixCls.
React development warnings for empty value and for an icon with correction
level L are still outside the port. Production behavior is preserved.
[44 upstream cases and four updates](../../../tests/browser/fixtures/ant-design-qrcode-prefix-reference.json) · [CSS boundary](../../../src/lib/qr-code/qrcode-prefix.test.ts) ·
[Browser](../../../tests/browser/qr-code/qrcode-prefix.spec.ts) · [Public package and SSR](../../../tests/package/qr-code/qrcode-prefix.ssr.test.ts)
