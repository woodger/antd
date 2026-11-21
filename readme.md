# Ant Design для Svelte 5

## Что это?

`antd-svelte` переносит компоненты Ant Design React на Svelte 5 и TypeScript.
Библиотека работает без React и SvelteKit. Объём переноса различается по компонентам.
[Сводка покрытия](docs/reference/ant-design-porting/status.md).

## Как быстро запустить?

Локальный стенд запускается из корня репозитория.

```sh
npm ci
npm run build
npm exec -- vite --config tests/browser/vite.config.ts
```

Откройте [пример Button на локальном стенде](http://127.0.0.1:4175/?fixture=button).
Пакет пока приватный. В соседнем приложении на Svelte 5 подключите его командой
`npm install ../antd-svelte`.
[Пример подключения со стилями](docs/reference/components/readme.md#подключение).

## Где документация?

Начните с [оглавления по ролям](docs/README.md). Если у вас только собранный пакет, откройте
[оглавление на GitHub](https://github.com/woodger/antd-svelte/blob/develop/docs/README.md).
Посмотреть компоненты в действии можно в [галерее примеров](https://woodger.org/ant-design).

## Какие основные точки входа?

| Импорт | Что предоставляет |
| --- | --- |
| `antd-svelte` | Именованные экспорты компонентов, типов и утилит |
| `antd-svelte/styles.css` | Общие стили. Без `ConfigProvider` импортируйте их один раз в приложении |
| `antd-svelte/porting/registry.json` | Данные о покрытии переноса для инструментов |

## Где источники истины?

- Пути импорта и версии зависимостей задаёт [package.json](package.json).
- Именованные экспорты собраны в [index.ts](src/lib/index.ts). Props, callbacks, snippets и refs
  определены в [исходных объявлениях компонентов](src/lib).
- Покрытие и расхождения с конкретной ревизией Ant Design фиксирует [реестр переноса](docs/reference/ant-design-porting/registry.json).
  Для сверки поведения используйте [закреплённые исходники Ant Design](docs/reference/ant-design-porting/sources.md#локальные-исходники-ant-design).
- Правила извлечения стилей и параметры служебного CLI определены в коде.
  [CSS-рецепты](tools/ant-design-css-recipes.json) · [Определения команд](tools/cli-core.mjs).
- Правила изменения библиотеки собраны в [политиках проекта](docs/policy/index.md).
