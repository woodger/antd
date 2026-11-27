# Statistic

```svelte
<Statistic title="Balance" value="123456.789" precision={2} suffix="₽" />
```

Value is a number or string and defaults to 0. Built-in formatting follows
Ant Design Number.tsx, with groups of three digits, groupSeparator=",", and
decimalSeparator=".". Precision pads or truncates the fractional part without
rounding. Negative precision removes it. Long numeric strings stay strings.
An empty string becomes 0 and .5 becomes 0.5. Unsupported forms such as
"1e6", "-", and "1." render as text. JavaScript scientific notation also stays
as supplied. Formatter(value) receives the original value and replaces built-in
formatting with a string, number, or snippet.

Title, prefix, and suffix accept a string, number, snippet, null, or false.
Zero displays. Empty scalars omit their node. A snippet counts as present
even with empty output. ValueRender is Snippet<[Snippet]>. It receives a
snippet for the value span, which you can wrap. ClassNames and styles support
root, header, title, content, value, prefix, and suffix and a ({ props })
callback with resolved value, loading, and separators. Styles are CSS strings.
Style overrides styles.root, and styles.content styles the value.
Bind:nativeElement exposes HTMLDivElement.

ConfigProvider.statistic sets shared class, style, classNames, and styles for
Statistic and StatisticTimer. Config and local classes accumulate. Root
style order is config.styles.root, config.style, local styles.root, then
local style. Other slots merge with local precedence. Both callbacks receive
props with resolved value, loading, and separators. Undefined inherits the
parent record. Any explicit object, including {}, replaces it.

```svelte
<ConfigProvider statistic={{ class: 'metric', styles: { value: 'font-weight:600' } }}>
  <Statistic title="Balance" value={1234.5} styles={{ value: 'color:green' }} />
</ConfigProvider>
```

Reactive config and callback prop changes preserve root DOM. Nested and
sibling providers remain isolated. Existing Svelte defaults, native RTL
direction, and accessible loading Skeleton are preserved. The fixture is
`?fixture=statistic-config`. [26 upstream cases and four updates](../../../tests/browser/fixtures/ant-design-statistic-config-reference.json) ·
[Browser measurements](../../../tests/browser/statistic/statistic-config.spec.ts) · [Public types and SSR](../../../tests/package/statistic/statistic-config.ssr.test.ts)

Local `prefixCls` changes the root and part names of Statistic and Timer.
Empty inherits ConfigProvider.prefixCls, giving ant-statistic by default.
CSS variables keep the Statistic namespace. A marker scopes dynamic CSS to
its root. Sibling defaults are unaffected, including prefix collisions with
ant-statistic-content or ant-statistic-css-var. A prefix change preserves
root DOM, semantic styles, themes, and native compact defaults. Timer also
uses the shared ConfigProvider prefix, with local precedence.
The fixture is `?fixture=statistic-prefix`. [22 upstream cases and four prefix updates](../../../tests/browser/fixtures/ant-design-statistic-prefix-reference.json) ·
[Browser](../../../tests/browser/statistic/statistic-prefix.spec.ts) · [CSS boundary](../../../src/lib/statistic/statistic-prefix.test.ts) · [Public package and SSR](../../../tests/package/statistic/statistic-prefix.ssr.test.ts)

Loading retains the title and replaces content with existing Skeleton using
active and paragraph=false. It uses Skeleton's accessible status and wrappers,
and skips the hidden value's formatter and valueRender. Statistic adds no
role, tabindex, or live region for an ordinary value. Set them through native
attributes if needed. Value remains LTR in RTL, with logical prefix and suffix
spacing. Themes supply colors. Compact changes title and content from
14/24px to 12/20px.

ConfigProvider.theme.components.Statistic sets titleFontSize and contentFontSize
for Statistic and both Timer modes. Defaults derive from fontSize and
fontSizeHeading3. Numeric 0, string contentFontSize, aliases, global and
component algorithms, cssVar.prefix, and nested providers are supported.
Theme changes preserve content, snippets, focus, and running timers. Variables
apply before styles.root and style. Semantic styles retain precedence.
Loading host padding uses Skeleton's own theme, including aliases and algorithm.
Statistic.padding leaves it intact. In upstream 6.6.8, the Statistic RTL class
leaves direction unchanged in an LTR document. Svelte preserves dir=rtl with
LTR value, as recorded in the registry. The fixture is `?fixture=statistic-theme`.
[Official CSS tokens](../../../tests/reference/ant-design-statistic-tokens-reference.json) · [Normal, loading, and Timer styles](../../../tests/browser/fixtures/ant-design-statistic-theme-reference.json) ·
[SSR](../../../tests/package/statistic/statistic-theme.ssr.test.ts) · [Browser](../../../tests/browser/statistic/statistic-theme.spec.ts)

The `?fixture=statistic` unit, SSR, and Chromium checks cover formatting,
loading, snippets, semantic styles, themes, RTL, and focus. The statistic recipe
reproduces 14 vendor/statistic.css rules from the pinned archive. Statistic-prefix
produces a CSS module with the same rules for local prefixCls.

StatisticTimer ports the current Statistic.Timer and requires type=countdown
or countup. Other Statistic props, including loading and semantic slots, pass
through. Built-in time output owns formatter and valueRender, as in upstream.

Value is a timestamp in milliseconds or a string accepted by new Date(value).
With no value, display uses Statistic's default 0. Callbacks receive NaN from
the missing target, as upstream does. SSR and the first hydration render display
`-` without clocks or callbacks. After mount, the timer displays the difference
from Date.now() and updates through setInterval(1000/60). Format defaults to
HH:mm:ss. Y, M, D, H, m, s, and S denote fixed 365-day, 30-day, day, hour, minute,
second, and millisecond units. Repeated tokens pad with zeros and square brackets
keep text literal. This is a duration format, separate from calendar or full
Day.js formatting. Omitted larger units accumulate in the next one, so HH can
exceed 24.

Display clamps the difference to zero, and onChange(number) gets the original
signed difference on each tick. Countdown calls onFinish once on the first
tick strictly after the target and stops. Exact equality leaves it running.
Countup skips onFinish. Value or type changes restart the interval. Format and
callback changes do not require a restart. Loading hides the value and keeps
the timer running. Unmount clears the interval. Late callbacks from canceled
or replaced runs are ignored. Invalid dates match upstream with NaN in formatting
and callbacks and no automatic completion. Bind:nativeElement exposes the
Statistic root div. The fixture is `?fixture=statistic-timer`.
