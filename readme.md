# Ant Design для Svelte 5

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-types-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#лицензия)

Библиотека компонентов [Ant Design](https://ant.design/) для Svelte и TypeScript: элементы интерфейса,
модели форм, темы и локализация.

[Каталог компонентов](docs/reference/components/README.md) · [Документация](#документация)

## Подключение

Чтобы использовать `@woodger/antd` в своём проекте, выполните:

```sh
npm install @woodger/antd
```

## Стили

`ConfigProvider` подключает стили библиотеки. Если компоненты используются без
него, импортируйте стили один раз в точке входа приложения или в корневом
компоненте. В SvelteKit это можно сделать в `<script>` корневого layout
`src/routes/+layout.svelte`:

```ts
import '@woodger/antd/styles.css';
```

## Быстрый старт

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Input, Select } from '@woodger/antd';

  let name = $state('');
  let role = $state<string | undefined>('developer');
</script>

<ConfigProvider theme={{ mode: 'light', primary: 'blue' }}>
  <label for="name">Имя</label>
  <Input id="name" bind:value={name} />

  <label for="role">Роль</label>
  <Select
    id="role"
    bind:value={role}
    options={[
      { value: 'developer', label: 'Разработчик' },
      { value: 'designer', label: 'Дизайнер' }
    ]}
    showSearch
    allowClear
  />

  <Button type="primary" onclick={() => console.log(name, role)}>Сохранить</Button>
</ConfigProvider>
```

## Документация

### Использование библиотеки

- [Каталог компонентов](docs/reference/components/README.md) — компоненты, примеры и ограничения.
- [Формы и валидация](docs/reference/forms.md) — модели, поля, правила и отправка.
- [Темы и локализация](docs/reference/themes.md) — оформление, размеры и язык интерфейса.
- [Токены темы в ConfigProvider](docs/reference/theme-context.md) — наследование темы, настройка компонентов и чтение значений через `theme.useToken()`.
- [Статический расчёт design tokens](docs/reference/design-tokens.md) — получение цветов, размеров и отступов через `theme.getDesignToken()`.
- [Размеры компонентов](docs/reference/current-size-observation.md) — локальный размер и наследование от провайдера.
- [Варианты оформления полей](docs/reference/control-variants.md) — настройки `ConfigProvider` и `Form`.
- [Пустые состояния ConfigProvider](docs/reference/render-empty.md) — настройка `renderEmpty`.
- [Всплывающие элементы](docs/reference/popup-settings.md) — контейнер, размещение и ширина списка.
- [Эффект Wave](docs/reference/wave.md) — настройки и поведение эффекта нажатия.
- [Клавиатура и фокус](docs/reference/keyboard.md) — управление компонентами и доступность.
- [Покрытие переноса Ant Design](docs/reference/ant-design-porting/status.md) — реализованные возможности и отличия.

## Руководство разработчика

Установка зависимостей, сборка и проверки описаны в
[руководстве разработчика](docs/development.md). Правила проекта собраны в
[политиках разработки](docs/policy/index.md).

## Лицензия

Проект распространяется по [лицензии MIT](LICENSE).
