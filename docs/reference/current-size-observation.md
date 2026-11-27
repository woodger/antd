# Component sizes

`ConfigProvider.componentSize` sets the shared size to `small`, `medium` (the default),
or `large`. Pass `size` to override it on one component. The button in this example
is larger than the adjacent field.

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Input } from '@woodger/antd';
</script>

<ConfigProvider componentSize="small">
  <Input aria-label="Название проекта" />
  <Button size="large">Создать проект</Button>
</ConfigProvider>
```

When migrating from the previous API, replace `size="middle"` and `size="default"`
with `size="medium"`. The value `middle` in `Row.align` sets alignment, and
`default` in `Skeleton.Button.shape` sets the shape.

## Comparison with previous sizes

The unchanged official UMD bundle, loaded without static antd.css, provided
171 profiles across 29 families. The profiles cover local sizes and inheritance
from ConfigProvider with the default, dark, and compact algorithms. The measurements
include dimensions, font, padding, gaps, borders, and colors. Measured CSS matched
in 166 profiles. Semantic callbacks receive the new size name, so the CSS match
establishes CSS equivalence alone. [Raw measurements](../../tests/reference/ant-design-current-size-observation.json)

For Table with the default and dark algorithms, inherited `middle` gives 16px
of cell padding, while `medium` gives 12px vertically and 8px horizontally.
In compact mode, horizontal padding changes from 8px to 4px. Local middle and
medium sizes match. For Descriptions with default and dark, local `default` gives
16px of vertical padding and `medium` gives 12px. The raw data preserves these
differences. A renamed value alone cannot establish equivalent CSS.

Some older reference names and DOM labels still use `middle` so they can be matched
to the raw measurements. The fixture adapter passes the current `medium` to
components. New measurements use explicit componentSize=medium for semantic
callbacks in Card and Descriptions and for five Collapse profiles. Two Divider
profiles were measured again with local size=medium. Old profiles that tested
deprecated sizes as a separate API were removed. [Fixture adapter](../../tests/browser/fixtures/reference-size.ts)
