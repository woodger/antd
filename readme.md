# Ant Design for Svelte 5

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-types-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

An [Ant Design](https://ant.design/) component library for Svelte and TypeScript with UI components,
form models, themes, and localization.

## Installation

Run this command to use `@woodger/antd` in your project.

```sh
npm install @woodger/antd
```

## Styles

`ConfigProvider` loads the library styles. If you use components without it, import the styles
once in your application entry point or root component. In SvelteKit, you can do this in the
`<script>` block of the root layout at `src/routes/+layout.svelte`.

```ts
import '@woodger/antd/styles.css';
```

## Quick start

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Input, Select } from '@woodger/antd';

  let name = $state('');
  let role = $state<string | undefined>('developer');
</script>

<ConfigProvider theme={{ mode: 'light', primary: 'blue' }}>
  <label for="name">Name</label>
  <Input id="name" bind:value={name} />

  <label for="role">Role</label>
  <Select
    id="role"
    bind:value={role}
    options={[
      { value: 'developer', label: 'Developer' },
      { value: 'designer', label: 'Designer' }
    ]}
    showSearch
    allowClear
  />

  <Button type="primary" onclick={() => console.log(name, role)}>Save</Button>
</ConfigProvider>
```

## Documentation

### Using the library

- Components, examples, and limitations. [Component catalog](docs/reference/components/README.md)
- Models, fields, validation rules, and submission. [Forms and validation](docs/reference/forms.md)
- Appearance, sizes, and interface language. [Themes and localization](docs/reference/themes.md)
- Theme inheritance, component settings, and `theme.useToken()`. [Theme context](docs/reference/theme-context.md)
- Colors, sizes, and spacing from `theme.getDesignToken()`. [Static design tokens](docs/reference/design-tokens.md)
- Local sizes and provider defaults. [Component sizes](docs/reference/current-size-observation.md)
- Field appearance in `ConfigProvider` and `Form`. [Control variants](docs/reference/control-variants.md)
- Setting `renderEmpty` in ConfigProvider. [Empty states](docs/reference/render-empty.md)
- Popup containers, placement, and list width. [Popup settings](docs/reference/popup-settings.md)
- Configuring the press effect. [Wave effect](docs/reference/wave.md)
- Keyboard interaction and accessibility. [Keyboard and focus](docs/reference/keyboard.md)
- Implemented features and differences from Ant Design. [Porting coverage](docs/reference/ant-design-porting/status.md)

## Developer guide

Install dependencies, build the package, and run checks with the instructions in the
[developer guide](docs/development.md). Repository rules are in the
[development policies](docs/policy/index.md).

## License

The project is distributed under the [MIT license](LICENSE).
