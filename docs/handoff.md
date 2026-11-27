# Передача контекста: миграция Ant Design на Svelte 5

> Временный файл для восстановления контекста после переустановки ОС.
> Срез: 10 ноября 2026 года. **Не добавлять в Git index и не коммитить.**
> Пользователь планирует удалить этот файл после восстановления работы.

## С чего начать новой сессии

1. Прочитать этот файл и действующие инструкции окружения/AGENTS.md.
2. Найти корень репозитория, проверить фактические HEAD, ветку и `git status`.
   Ожидается `develop`, commit `3a13cd31276cb889db17d544afaf65c1983f3393`.
   Более новые изменения учитывать, существующую работу не откатывать.
3. Прочитать политики и профильные материалы из раздела ниже.
4. Проверить окружение. Сохранённые результаты тестов — история предыдущей
   машины, а не доказательство прохождения после переустановки.
5. Коротко сообщить, что контекст восстановлен, где остановились и есть ли
   препятствия. Не просить пользователя заново объяснять уже записанные решения.

Миграция **приостановлена по просьбе пользователя после завершённого этапа**.
Последний запрос был дойти до логического этапа и остановиться перед обсуждением
приоритетов. Чтение handoff само по себе не поручает начать следующий этап.
После команды «продолжай» действуют прежние полномочия на автономный перенос
и локальные коммиты; готовые задачи не требуют промежуточных согласований.
Текущая задача перед переустановкой — только подготовка этого файла.

## Цель и согласованные границы

Полностью перенести **актуальный, не deprecated API Ant Design 6.6.8** с
React/TypeScript на самостоятельную библиотеку Svelte 5/TypeScript с минимальными
структурными и поведенческими отклонениями. Эталон — исходники, типы, стили,
демонстрации, тесты и делегированные зависимости официального проекта.

- Официальный upstream: <https://github.com/ant-design/ant-design>.
- Версия: `6.6.8`.
- Закреплённая ревизия: `984592267de88fbf9cdaecc96a56629e721c709d`.
- Версию эталона не обновлять одновременно с переносом компонента.
- Сохранять выполненную работу, согласованные Svelte/native API, SSR/hydration,
  доступность, фокус, клавиатуру, темы, RTL, локализацию и lifecycle.
- Потребности приложения определяли **порядок работ**, а не адаптацию библиотеки
  под бизнес-формы, серверные endpoints или предметную область сайта.
- **Deprecated слой не нужен вообще**, включая уже перенесённые компоненты,
  props, методы, значения, алиасы токенов, compatibility-код, CSS, тесты и docs.
  Проверять deprecated по закреплённому upstream и его зависимостям. Возраст API
  и слово `legacy` во внутреннем имени сами по себе не доказывают deprecated.
  Legacy-темы не являются отдельной целью переноса.
- Явные ошибки upstream не копировать ради совпадения. Сохранять исходное
  воспроизведение/замеры и описывать выбранное поведение в docs и feature note
  реестра. Спорное поведение записывать для отдельного разбора с пользователем.
- Наличие экспортов или отметка v1-ready **не означают полного переноса**.
  Итоговая цель включает оставшиеся расширения API и аудит покрытия.

Пользователь хочет автономную работу с проверками и атомарными коммитами, без
постоянных запросов подтверждения. При явной просьбе остановиться — остановиться.
В конце всей миграции нужен доказательный отчёт о реализованном, отличиях,
проверках и фактически оставшихся ограничениях. Полная миграция ещё не завершена.

## Правила работы

- Общаться по-русски, прямо и кратко, без канцелярита. Сообщать о существенных
  результатах и изменении направления работы; не пропадать надолго без обновлений.
- Сначала изучать относящиеся к задаче код, типы, тесты и политики.
  Делать минимальные завершённые изменения без постороннего рефакторинга.
- Публичные контракты принадлежат исходным types/package metadata. README их
  объясняет, реестр фиксирует покрытие, а не заменяет operational contract.
- Для `CONTRACT DOCUMENT` перед правкой назвать изменение и сохраняемые положения:
  `Changing X; preserving Y, Z`. Менять только необходимое, затем проверить diff.
  Смысл `NORMATIVE DOCUMENT` сохранять, если задача прямо не требует изменения.
- Использовать npm и существующий lockfile. Не добавлять зависимости или менять
  scripts/config ради удобства. Для следующего этапа новые runtime-модули заранее
  не согласованы и не считаются необходимыми.
- Установка ПО, глобальная конфигурация и права доступа требуют явного разрешения.
  Ранее пользователь разрешал загрузку штатного Chromium Playwright; не считать
  это разрешением на произвольные системные изменения.
- Ошибки окружения сообщать прямо. Не менять приложение, assertions, допуски,
  таймауты или сбор console errors/warnings для сокрытия проблемы.
- Различать `passed`, `failed`, `not run`, `blocked by environment`.
  Логи и старые build artifacts не подтверждают новый source или новую машину.
- Сначала узкие проверки, затем соразмерная регрессия. Повторять проверки при
  новых изменениях, ошибках или оставшемся риске, а не ради количества прогонов.
- **Сборки и все читатели `dist` выполнять последовательно**: `check:tests`,
  package SSR и браузерные тесты начинают со сборки/читают пакет.
  Root unit и независимые read-only проверки можно запускать параллельно.
- **Не менять source и browser fixtures во время браузерного прогона.**
  Независимые пробы неизменённого upstream не читают Native `dist`.
- Ждать реального завершения процесса. Таймаут наблюдения не означает завершения;
  повторно проверять тот же handle/process, не запускать дубликат.
- Все исходники, пробы, отчёты и временные рабочие материалы держать внутри
  рабочего пространства, обычно `.upstream/artifacts/`. **Не работать в `/tmp`.**
  Автоматические кэши Node/Playwright в `/tmp` можно пересоздать.
- Поиск начинать с `rg` / `rg --files`; независимые чтения можно объединять.
- Подагенты не были разрешены. Автономность сама по себе не означает делегирование.
- После логического этапа обновлять затронутые types/JSDoc, тесты, README,
  CHANGELOG, registry.json и сгенерированную сводку. Делать локальный Git-коммит.
- Формат коммита: `<type>(<scope>): <lowercase imperative action>`, английский,
  без точки. Типы: feat/fix/refactor/docs/test/chore. Один этап — один коммит.
- **Не делать push, публикацию, merge или deployment без поручения.**
  Этот handoff не включать даже в очередной коммит миграции.

В hand-written TS/Svelte: два пробела, single quotes, semicolons, ориентир 100
символов; runes, `$derived` для вычислений, `$effect` для runtime-синхронизации,
cleanup всех ресурсов. Естественные комментарии/JSDoc писать по-русски.

## Что читать

1. [readme.md](../readme.md): быстрый старт, актуальный API, ограничения,
   раздел «Локальные исходники Ant Design», CSS и лицензии. Документ большой;
   компонентные разделы читать по текущей задаче.
2. [Карта docs](README.md), [политики](policy/index.md), затем
   [change-policy](policy/change-policy.md), [architecture](policy/architecture.md),
   [code-style](policy/code-style.md), [testing-policy](policy/testing-policy.md),
   [scripts-policy](policy/scripts-policy.md),
   [dependencies-policy](policy/dependencies-policy.md),
   [documentation-policy](policy/documentation-policy.md).
3. [Архитектура](architecture/overview.md) и [направление зависимостей](architecture/ui.md).
4. [Справочник переноса](reference/ant-design-porting/readme.md),
   [registry.json](reference/ant-design-porting/registry.json),
   [status.md](reference/ant-design-porting/status.md).
5. [CHANGELOG](../CHANGELOG.md), последние коммиты и относящиеся к области
   reference notes. Старые отчёты о дефектах сначала сверять с текущим кодом.

AGENTS.md в самом репозитории на момент передачи не найден. Общие Agent Rules
были в окружении `/home/node/.codex/AGENTS.md`; после переустановки этот файл
может отсутствовать. Существенные правила перечислены выше, новые действующие
инструкции окружения всё равно нужно прочитать.

## Реальный репозиторий и карта кода

Это уже **отдельный репозиторий библиотеки**, а не старый SvelteKit-проект homepage.

- Origin: `git@github.com:woodger/antd-svelte.git`.
- Ветка: `develop`; HEAD: `3a13cd31276cb889db17d544afaf65c1983f3393`.
- Локальная ссылка `origin/develop` на момент подготовки указывает туда же.
  Это локальное состояние refs, а не новый fetch или доказательство remote state.
- До создания handoff рабочее дерево было чистым. Незавершённого этапа кода нет.
- Пакет `antd-svelte`, версия `0.1.0`, пока `private: true`.
- Сайт `woodger.org` / `woodger/homepage` — отдельный потребитель. Его исходники
  и интеграционные проверки не нужны для локальной разработки библиотеки.

| Путь | Назначение |
| --- | --- |
| [src/lib](../src/lib/) | Компоненты, types, engines, модели, DOM-механизмы |
| [src/lib/index.ts](../src/lib/index.ts) | Публичные экспорты |
| [package.json](../package.json) | Exports, peer/dev dependencies и команды |
| [styles.css](../src/lib/styles.css), [theme.css](../src/lib/theme.css), [vendor](../src/lib/vendor/) | Стили, bridge и лицензированные извлечения |
| [tests/package](../tests/package/) | SSR собранного публичного пакета |
| [tests/browser](../tests/browser/) | Браузерные сценарии и собственные фикстуры |
| [catalog.json](../tests/browser/fixtures/catalog.json) | Ленивые изолированные маршруты фикстур |
| [tools](../tools/) | CLI, реестр, извлечение CSS и проверки границ |
| [architecture.test.ts](../src/lib/architecture.test.ts) | Независимость runtime imports |
| [test-boundaries.test.mjs](../tools/test-boundaries.test.mjs) | Границы импортов тестового стенда |
| `dist/` | Производная сборка, вручную не редактируется и не коммитится |
| `.upstream/ant-design/` | Отдельный checkout официального эталона |
| `.upstream/artifacts/` | Архивы, source probes, замеры, логи, отчёты и checkpoints |

`*.engine.ts` — чистая нетривиальная логика, `*.model.svelte.ts` — runes/state,
`*.dom.ts` — браузерные ресурсы. Использовать эти границы по смыслу, без
механического создания каждого типа файла. Есть `.component` facades со статическим API.

Тесты пакета/браузера импортируют собственные файлы внутри `tests`, публичный
`antd-svelte` и объявленные dependencies. Не импортировать приватный `src/lib`
или `tools/fixtures`. Browser JSON imports — `with { type: 'json' }`.
Контракты `integration:` принадлежат потребителю; локальный check не проверяет
их выполнение или наличие тестов на сайте.

Старые пути `src/lib/components/ant-design`, `src/routes/ant-design`, `e2e/`,
порты 4173/4174 и команды SvelteKit/`test:e2e` относятся к прежнему состоянию.
Актуальны текущие package.json, playwright.config.ts и самостоятельный стенд 4175.

## Состояние покрытия

Источник — registry.json; status.md генерируется из него. На этом HEAD:

- 73 семейства каталога, 112 публичных Svelte-компонентов.
- Реализация есть у 70 семейств. Без публичной реализации: candidates Icon/Util
  и excluded deprecated List. Актуальный Listy — отдельное реализованное семейство.
- Согласованный объём v1 покрыт у 58 семейств, аудит v1 нужен у 12:
  Dropdown, Form, Input, Popover, Table, Tooltip, Drawer, Message, Modal,
  Notification, Popconfirm, ConfigProvider.
- Экспорты и семейства считаются отдельно; factories/types не увеличивают число
  Svelte-компонентов. AvatarGroup относится к Avatar, FormItem — к Form и т. п.
- States features: unreviewed / missing / partial / supported. Unreviewed означает
  отсутствие детального аудита; partial может фиксировать согласованное Native
  отличие или отказ от ошибки Source. V1-ready не означает весь React API.
- `referenceVersion: null` — точная версия delegate ещё не выбрана.
- Реестр хранит scope/evidence, **не результаты выполнения тестов**.

TextArea, удалённый Select, DatePicker с временем/RangePicker, Upload, Tree,
TreeSelect, Menu, AutoComplete, Mentions и Image preview уже существуют.
Возвращаться к их базовой реализации с нуля не нужно. Дальнейшие расширения
проверять по source/types/реестру, а не по названию компонента.

Среди оставшегося: Tree drag/drop и motion; virtual/scrollTo и расширенные API
Select/AutoComplete/TreeSelect; другие picker modes/multiple/mask/render/config;
Menu overflow/motion и расширенные slots/config; nested Dropdown; расширения
Table/Modal/Drawer/Notification/App и общий z-index context. Это ориентиры,
не исчерпывающий список. Полный перечень — features всех семейств в реестре.
Candidate не является безусловным поручением переносить внешнюю библиотеку иконок.

### Последние завершённые этапы

| Commit | Этап |
| --- | --- |
| `3a13cd3` | Tree/DirectoryTree virtual scrolling и imperative refs |
| `6b2d696` | Пять semantic slots, ConfigProvider.tree, generic callbacks |
| `7b09e6d` | Generic data / fieldNames в UI, callbacks, renderers и lazy load |
| `6b3ae4e` | createTree / getPath и реактивные data/schema inputs |
| `4ae0f48` | Per-node switcher, leaf snippets и hover callbacks |
| `8a7ee39` | DirectoryTree: иконки, Ctrl/Meta/Shift и defaults |
| `9aab01e` | ExpandAction заголовка |

Не использовать старую подготовительную точку `429e085` как актуальный HEAD.

### Что закончено в последнем этапе Tree

- Измеряемые окна с retained heights, margins, source boundaries/overscan.
  Height, itemHeight, virtual, scrollWidth и ConfigProvider.virtual.
- Без height либо при height=0 — все раскрытые строки без ограничения высоты.
  Virtual=false оставляет native scroll; itemHeight=0 отключает виртуальное окно.
  Undefined local virtual наследует config. Default Tree=true, Listy=false.
- Обе оси, wheel/Shift+wheel, touch/inertia и custom scrollbars, RTL.
- TreeRef через bind:this: focus/blur/scrollTo; nativeElement — отдельная binding.
  ScrollTo: number, {top,left}, key/index, align, numeric/function offset,
  getSize, finite fallback, максимум десять проходов, latest request wins.
  AutoExpand добавляет только целевой key в uncontrolled expandedKeys.
- SSR начального окна, controlled active scrolling, itemScrollOffset,
  onScroll на holder, cleanup и игнорирование поздних load/ref после unmount.
- Listy использует общие чистые расчёты/измерения; его API/defaults/sticky сохранены.
- Внутренний Tree у TreeSelect пока без height: отдельный TreeSelect virtual API
  этим этапом не реализован. Drag/drop и collapse/appear motion ещё отсутствуют.

Source: `@rc-component/tree 1.4.0`, delegate `@rc-component/virtual-list 1.5.1`
(Tree объявляет диапазон `^1.2.0`; изученная версия указана явно).
[Эталон](../tests/browser/fixtures/ant-design-tree-virtual-reference.json)
содержит 28 положительных browser cases, 12 SSR cases и шесть raw observations.
Окончательные source-пробы повторены побайтно; motion был явно выключен.

Шесть ошибок Source сохранены, Native их не повторяет:

1. Local virtual=undefined перекрывает global false.
2. Tree не передаёт direction в NodeList/VirtualList, оставляя RTL scrollbar LTR.
3. Memo окна пропускает itemHeight и сохраняет старый estimate при изменении темы.
4. Aria-activedescendant указывает на удалённый виртуальный DOM.
5. Focus теряет ключ 0 из-за `first.key || null`.
6. ScrollWidth=200 при viewport=280 даёт отрицательный offset и margin-left=80px.

Не «исправлять» обратно уже согласованные Tree-контракты: внешний Tree.style,
native buttons/focus/ARIA, generic identity, canonical event key/state, свежие
fieldNames/semantic icon updates, безопасный Directory controlled release,
пустой getPath неизвестных prototype keys. Подробности и прежние отличия — в README
и отдельных features реестра.

## Окружение и восстановление

Срез перед переустановкой:

- Fedora 44 container, пользователь node uid/gid 1000, группа render gid 105.
- Intel Core i7-14700T, 28 логических CPU, около 64 GB RAM. Нагрузка машины не была
  блокером. Playwright default workers=2; связанная регрессия проходила с 4 workers.
- Node `24.18.0`, npm `11.16.0`.
- Svelte `^5.57.1`, TypeScript `~6.0.3`, Vite `^7.3.6`, Vitest `^4.1.11`,
  Playwright `1.64.1`; точные разрешённые версии — в package-lock.json.
- Playwright Chromium/Headless Shell revision `1248`, browser `156.0.8078.4`;
  ffmpeg revision 1013. Кэш был в `/home/node/.cache/ms-playwright`.
- Системный Fedora Chromium `156.0.8078.79` установлен отдельно.
  Его наличие **не заменяет** browser binaries, ожидаемые Playwright.

После восстановления, если dependencies/browser отсутствуют и установка разрешена:

```sh
npm ci
npm exec -- playwright install chromium
```

Не обновлять lockfile/версии при восстановлении окружения. В зависимостях
потребителя нужны Svelte 5 и dayjs; React не является runtime-зависимостью пакета.
Пробы React используют неизменённый официальный UMD и отдельные npm-архивы.
Устанавливать зависимости самого upstream checkout для чтения не требуется.

Восстановление отсутствующего upstream из корня проекта:

```sh
mkdir -p .upstream
git clone --depth 1 --single-branch --branch 6.6.8 https://github.com/ant-design/ant-design.git .upstream/ant-design
git -C .upstream/ant-design rev-parse HEAD
git -C .upstream/ant-design status --porcelain
```

HEAD должен быть строго `984592267de88fbf9cdaecc96a56629e721c709d`, дерево чистое.
Если это не так, сначала восстановить именно pin. Перед переносом изучать
components/<name>: реализацию, типы, style/, demo/, __tests__/, index.en-US.md,
затем реализацию и версии соответствующих `@rc-component/*`.
Для поиска в ignored checkout: `rg --files --hidden --no-ignore .upstream/ant-design`.

CSS-архив: `.upstream/artifacts/antd-6.6.8.tgz`, официальный URL:
<https://registry.npmjs.org/antd/-/antd-6.6.8.tgz>.
SHA-256: `8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa`.
CLI умеет явный `--fetch`; cache может отсутствовать на новой машине.
Рецепты уже охватывают много компонентов и prefix modules: старое ограничение
«только Avatar/AvatarGroup/Badge» больше не актуально. Список брать из CLI.

## GPU: желание пользователя, факты и флаги

Пользователь хочет аппаратный GPU при headless E2E. Он пробрасывал render node
в Docker и ставил Mesa/EGL/Vulkan. На 10 ноября 2026 это отдельно проверено:

- `/dev/dri/renderD128` существует и доступен пользователю node.
- Kernel driver `i915`, PCI vendor/device `8086:a780`.
- Установлены mesa-dri-drivers, mesa-libEGL и mesa-vulkan-drivers `26.2.6`,
  vulkan-loader `1.4.341.0`. Intel ICD есть в `/usr/share/vulkan/icd.d`.
- `vulkan-tools` в этом конкретном контейнере **не установлен**, хотя упоминался
  в старой переписке. Для выполненной проверки Chrome он не понадобился.
- Параметры контейнера из настройки пользователя, вычисление gid выполняется на хосте:

```sh
--device=/dev/dri/renderD128
--group-add="$(stat -c '%g' /dev/dri/renderD128)"
```

После переустановки заново проверить device/driver/доступ; gid 105 не фиксировать
как переносимое значение. Права и глобальные настройки самостоятельно не менять.

Фактические пробы стандартного Playwright Headless Shell 156.0.8078.4 через
CDP SystemInfo.getInfo при подготовке этого handoff:

| Launch args, заданные пробой | Renderer/displayType | Compositing/rasterization |
| --- | --- | --- |
| `[]` | Google SwiftShader / ANGLE_SWIFTSHADER | disabled_software |
| `['--enable-gpu']` | Google SwiftShader / ANGLE_SWIFTSHADER | disabled_software |
| `['--enable-gpu', '--use-angle=vulkan']` | Intel/Mesa / ANGLE_VULKAN | enabled / enabled |

**Рабочий аппаратный профиль в этом окружении:**

```ts
args: ['--enable-gpu', '--use-angle=vulkan']
```

Renderer последней пробы:
`ANGLE (Intel, Vulkan 1.4.354 (Intel(R) Graphics (RPL-S) (0x0000A780)), Intel open-source Mesa driver-26.2.6)`.
2d_canvas, gpu_compositing, rasterization, webgl и webgpu сообщили enabled.
Отдельное поле featureStatus.vulkan при этом было disabled_off: его одного
недостаточно для вывода о software renderer; смотреть renderer/displayType и
нужные featureStatus вместе.

В **текущем закоммиченном playwright.config.ts launchOptions.args отсутствуют**.
Последние миграционные проверки выполнялись штатной конфигурацией; их нельзя
задним числом объявлять GPU-прогонами. В старом Typography reference есть пометка
о GPU/Vulkan-замерах; она не доказывает текущий режим всего стенда.
В этой задаче конфиг и тесты ради GPU не менялись, ускорение по времени не измерялось.

После переустановки проверить этот профиль повторно. Если подключать его к E2E,
это должна быть явная правка launch options с отдельным smoke/геометрической
регрессией и фиксацией режима. Software mode остаётся пригодным для проверок;
наличие renderD128 само по себе не доказывает использование GPU браузером.

Небольшая самостоятельная проверка из корня проекта после восстановления deps:

```sh
node --input-type=module - <<'JS'
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-gpu', '--use-angle=vulkan'] });
try {
  await browser.newPage();
  const cdp = await browser.newBrowserCDPSession();
  const { gpu, commandLine } = await cdp.send('SystemInfo.getInfo');
  console.log(gpu.auxAttributes?.glRenderer, gpu.auxAttributes?.displayType);
  console.log(gpu.featureStatus);
  console.log(commandLine?.match(/--[^\s]*(gpu|angle|vulkan|headless|use-gl)[^\s]*/gi));
} finally {
  await browser.close();
}
JS
```

Browser.getBrowserCommandLine в этой сборке без enable-automation вернул protocol
error; для указанной диагностики использован SystemInfo.getInfo.commandLine.
[Официальная инструкция Chromium](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/gpu/using-gpu-hardware-in-headless-chrome.md)
описывает enable-gpu и Vulkan backend для headless Linux без X11.
Наличие GPU не гарантирует ускорения CPU-bound тестов, сборки или TypeScript.

## Команды и честная граница подтверждённых проверок

Актуальные команды из package.json:

```sh
npm run lint
npm run check
npm run check:tests
npm test
npm run build
npm run test:package
npm run test:browser -- tests/browser/fixture-routing.spec.ts --grep 'isolated fixture mounts tree-virtual$'
npm run test:browser -- tests/browser/tree-virtual.spec.ts tests/browser/tree-virtual-native.spec.ts --workers=4
npm run test:browser -- tests/browser/tree tests/browser/directory-tree tests/browser/listy --workers=4
npm run cli -- registry check
npm run cli -- registry check --upstream
```

Полный browser: `npm run test:browser`. Команды, читающие/собирающие dist, выполнять
последовательно. Для test types штатный `check:tests` использует обычный
svelte-check; не добавлять туда --tsgo. Для исходников --tsgo уже задан скриптом.
Полноценная сборка пакета — svelte-package, без svelte-kit sync.

Стенд [playwright.config.ts](../playwright.config.ts) /
[tests/browser/vite.config.ts](../tests/browser/vite.config.ts):
127.0.0.1:4175, locale ru-RU, timezone UTC; Playwright сам собирает пакет и
управляет сервером. Query `?fixture=tree-virtual` лениво монтирует нужный модуль.
Строгий сбор console errors/warnings и pageerror в
[tests/browser/test.ts](../tests/browser/test.ts) оставлять включённым.

Исторические результаты этапа `3a13cd3`, полученные в предыдущем окружении:

| Проверка | Результат |
| --- | --- |
| Root unit | 4471 passed, 332 файла |
| Полный package SSR | 3971 passed, 332 файла |
| Новый virtual SSR | 14 passed; 12 Source SSR окон также подтверждены Node VM без DOM |
| Новые virtual browser | 44 уникальных сценария passed |
| Связанная browser-регрессия Tree/TreeSelect/DirectoryTree/Listy | 487 уникальных component cases passed |
| Маршрут tree-virtual | 1 passed |
| Source и test types | 0 errors / 0 warnings |
| Build, lint, registry --upstream, diff check | passed |
| Локальные Markdown links | 1103 проверены до добавления handoff |

487 — сумма 486 связанных сценариев и одного добавленного boundary test;
ещё один тест — маршрут. Множества проверены на отсутствие пересечений,
runtime исходники не менялись после начала общего прогона. Это **не один
непрерывный прогон 487 тестов и не полный глобальный browser на текущем HEAD**.

Ранее на неизменённом старом commit `0abbca0` суммарно прошли 15414 уникальных
browser-тестов: четыре непересекающихся продолженных прогона. Это история старого
commit, не доказательство текущего HEAD, GPU-профиля или новой ОС. Старые числа
676/861 из исходной передачи homepage давно не описывают нынешний test contour.

Историческая ошибка `Unregistered integration evidence: result` не является
текущим блокером: последний registry --upstream прошёл. Не считать старые
сообщения о Card/Carousel/Descriptions/Image/Calendar и других дефектах
автоматически открытыми задачами без проверки текущего source и реестра.

Для реестра/CSS использовать текущий CLI:

```sh
npm run cli -- registry show tree
npm run cli -- registry report
npm run cli -- css --list
npm run cli -- css all --check
npm run cli -- css all --check --fetch
```

Report обновляет status.md; --fetch явно разрешает загрузку отсутствующего
закреплённого архива. Для нового CSS recipe проверять selectors, exclusions,
transformations, at-rules/keyframes, число правил и происхождение/лицензии.

## Сохранение перед переустановкой

Текущий `/workspace` — bind mount хоста с btrfs:
`/dev/nvme0n1p3[/root/home/nerv/antd-svelte]`. Это переживает очистку `/tmp`,
но **не гарантирует сохранность при форматировании диска во время переустановки ОС**.

Перед форматированием скопировать **за пределы переустанавливаемого диска**:

- Этот незакоммиченный docs/handoff.md. Clone репозитория его не вернёт.
- Репозиторий вместе с `.git`, если есть нужные локальные refs/история.
- По возможности всю `.upstream/`: probes/замеры/отчёты не входят в Git.
  Минимальная готовая резервная копия последнего этапа:
  `.upstream/artifacts/reboot-checkpoint-2026-11-10-112132/`.

В последнем checkpoint находятся repository.bundle со всей Git-историей/refs,
workspace-files.tar.gz с 3505 source files, validation.json, RESUME.txt,
source scripts/npm archives/reports в evidence/, SHA256SUMS и VERIFIED.json.
Bundle и все source hashes были проверены, checksum failures=0. На момент
передачи кода рабочее дерево чистое, активных сборок/тестов/браузеров нет.
Этот handoff создан позже checkpoint и в его архив не входит — копировать отдельно.

Если `.upstream` сохранена, полезные точки входа:

- `.upstream/artifacts/MIGRATION-STATE.json` — последняя точка остановки.
- `.upstream/artifacts/REBOOT-CHECKPOINT.json` — указатель на backup.
- `.upstream/artifacts/validation/3a13cd3-tree-virtual.json` — доказательства этапа.
- `.upstream/artifacts/validation/tree-virtual-browser-final.json` и
  `tree-virtual-browser-boundary.json` — отчёты 486+2.
- `.upstream/artifacts/capture-tree-virtual.mjs` и
  `capture-tree-virtual-ssr-node.mjs` — Source probes.
- `.upstream/artifacts/tree-virtual-*.log` — исходные логи, включая первоначальные
  неудачные пробы и причины их исправления. Они не являются текущими падениями.

Проверка сохранённого checkpoint после копирования:

```sh
sha256sum -c SHA256SUMS
```

При потере рабочей копии клонировать repository.bundle в **новый** каталог,
выбрать develop и проверить HEAD/status. Не распаковывать архив поверх уцелевшей
работы. Затем положить этот файл в docs/handoff.md. Ignored артефакты восстановить
в .upstream; node_modules, dist и browser caches можно пересоздать.
Если backup артефактов не сохранён, продолжать по закоммиченным source/types/
fixtures/реестру, заново получив upstream; не утверждать наличие потерянных логов.

## Ближайший шаг после возобновления

Приоритеты пользователь хотел обсудить после текущей остановки. Если новых
приоритетов не задано и есть команда продолжать автономно, ближайший связанный
этап — **Tree drag/drop**. Он не начат; нельзя помечать missing как выполненное.

1. Изучить pinned Tree.tsx, rc-tree1.4.0 Tree/TreeNode/DropIndicator/util и
   upstream demos/tests: draggable boolean/function/config, nodeDraggable/icon,
   allowDrop, позиции/indicator, onDragStart/Enter/Over/Leave/End/Drop,
   раскрытие при drag-enter, запрет drop в потомка, RTL и виртуальное окно.
2. Снять независимые воспроизведения официального поведения. Отдельно сохранить
   реальные ошибки Source, не подменять их желаемым поведением в raw reference.
3. Выбрать законченный атомарный объём drag/drop с ясными оставшимися границами;
   сохранить текущие selection/check/load, focus/ARIA и virtual/ref контракты.
   Motion переносить отдельным этапом, если он не обязателен для корректности DnD.
4. Добавить нужные unit/SSR/browser проверки, в том числе реальные drag events,
   controlled keys, запретные drops, prefix/RTL, виртуальную прокрутку и cleanup.
   Обновить docs/реестр, выполнить связанную регрессию, сделать локальный коммит.

Альтернатива следующего приоритета — TreeSelect virtualization с уже изученным
virtual-list. Её API и взаимодействие с Select/popup/keyboard/loadData нужно
изучать отдельно; простое наличие виртуализации Tree задачу не закрывает.

После завершения всей не deprecated миграции провести отдельный аудит всего
покрытия по требованиям и evidence. Зелёные узкие тесты, количество экспортов
и отметки v1-ready не подменяют этот аудит.
