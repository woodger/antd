# Руководство разработчика

## Разработка библиотеки

- [Архитектура](architecture/overview.md) — устройство репозитория.
- [UI Architecture](architecture/ui.md) — направление зависимостей и владельцы контрактов.
- [Реестр и CSS-инструменты](reference/ant-design-porting/readme.md) — покрытие и извлечение стилей.
- [Локальный эталон Ant Design](reference/ant-design-porting/upstream.md) — исходники для сверки.
- [Политики разработки](policy/index.md) — правила проекта.
- [История изменений](../CHANGELOG.md).

## Локальная разработка

### Установка, сборка и проверки

Эти команды устанавливают зависимости, проверяют исходники и тесты, а также
собирают пакет. Запускайте их из корня репозитория:

```sh
npm ci
npm run lint
npm run check
npm run cli -- check tests
npm test
npm run build
npm run cli -- test package
```

- `npm ci` устанавливает зависимости из lockfile.
- `npm run lint` проверяет исходники, тесты и инструменты линтером.
- `npm run check` проверяет типы и Svelte-компоненты.
- `npm run cli -- check tests` собирает пакет и проверяет типы тестов и браузерных фикстур.
- `npm test` запускает тесты исходников и инструментов.
- `npm run build` собирает пакет в `dist`.
- `npm run cli -- test package` собирает пакет и запускает его SSR-тесты.

`npm run build` использует официальный `@sveltejs/package` и создаёт `dist`:
Svelte-компоненты, JavaScript-модули, декларации `.d.ts`, CSS и лицензии vendor.
`npm run dev` обновляет этот каталог в watch-режиме. Тесты исключены из npm-архива.

Для `cli -- check tests` используется стандартный TypeScript-движок `svelte-check`.
Опциональный `--tsgo` в этой схеме неверно разрешает часть модулей self-reference
пакета; обычная проверка сохраняет строгие настройки и проверяет тот же набор файлов.

### Браузерные проверки

Браузерные проверки компонентов находятся в `tests/browser`, SSR-проверки
собранного публичного пакета — в `tests/package`. Они используют собственные
фикстуры. Для браузерных проверок установите Chromium:

```sh
npm exec -- playwright install chromium
npm run cli -- test browser
```

Playwright собирает текущий пакет и запускает Vite-стенд на `127.0.0.1:4175`.
Параметры тестового инструмента передаются после разделителя `--` в команде CLI.

```sh
npm run cli -- test package -- --maxWorkers=1
npm run cli -- test browser -- --workers=1 tests/browser/typography/typography.spec.ts
```

### Упаковка

После установки зависимостей выполните из корня репозитория:

```sh
npm run build
npm pack --ignore-scripts
```

`npm pack` запишет архив `woodger-antd-<версия>.tgz` в текущий каталог и выведет его имя.
Этот файл можно установить в приложение через `npm install`.

### Служебный CLI

Помимо проверок пакета, служебный CLI работает с реестром покрытия и
извлечёнными стилями Ant Design.

```sh
npm run cli -- --help
npm run cli -- registry check
npm run cli -- registry report
npm run cli -- registry show avatar
npm run cli -- css all --check
```

- `--help` показывает доступные команды и параметры.
- `registry check` проверяет реестр, локальные подтверждения и актуальность сводки.
- `registry report` обновляет сгенерированную сводку покрытия.
- `registry show avatar` выводит запись Avatar; вместо `avatar` можно указать другой компонент.
- `css all --check` сравнивает извлечённые стили с файлами проекта по всем рецептам.
  Для проверки нужен локальный архив Ant Design; способы его получить описаны
  в [справочнике инструментов](reference/ant-design-porting/readme.md#извлечение-css).

Ссылки `integration:` обозначают проверки потребителя, которые выполняются
отдельно. Метаданные переноса хранятся в
[реестре репозитория](reference/ant-design-porting/registry.json).
