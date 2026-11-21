# ConfigProvider и App

## Темы и локализация

ConfigProvider принимает `theme={{ mode, primary, compact }}`, где `mode` равен
`light` или `dark`, а `primary` — `blue`, `purple` или `green`.
`componentSize` равен `small`, `medium` или `large`. Обычный размер по умолчанию — `medium`;
устаревшие значения `middle` и `size="default"` удалены.
[Замеры исходника](../current-size-observation.md) объясняют границы сравнения.
 Вложенный провайдер наследует
неуказанные настройки родителя. `componentDisabled` можно переопределить на
отдельном control.

ConfigProvider.variant и Form.variant задают общее оформление полей, Card и
внутренних controls Pagination. Локальные props сохраняют приоритет;
[общий справочник](../control-variants.md) описывает fallback Input,
вложенные контексты и component config.

Тёмная тема и компактный режим реализованы локальными CSS-переопределениями.
Spacing использует size map 6.6.8: compact size/SM=8, XS/XXS=4, LG/MD=16,
MS=12, XL=32, XXL=48px с padding/margin/content aliases. Каждый provider
разрешает aliases в собственном scope; явный compact=false восстанавливает
обычные интервалы, inline CSS variables сохраняют приоритет. Проверки геометрии
Card/Flex/Divider и вложенных provider — `tests/browser/theme.spec.ts`, `?fixture=theme`.

`compact: true` согласует fontSize/lineHeight/fontHeight и высоты controls с
compactAlgorithm, а Button/Input/TextArea/InputNumber получают рассчитанные
font/padding metrics при SSR. Для Input, Select, InputNumber и Button medium=28px,
large=35px. В small первые три имеют минимум 22px из-за строки и рамок,
Button — 21px, как в React 6.6.8. Native цвета сохраняются; пустой `token: {}`
для корректной геометрии не требуется. Браузерная сверка —
[compact-theme](../../../tests/browser/compact-theme.spec.ts), `?fixture=compact-theme`.

ConfigProvider также принимает source token/algorithm, наследование и настройки
hash/CSS variables. `theme.useToken()` возвращает реактивный объект с текущими
GlobalToken, Theme, hashId и transformed CSS-variable token. Глобальные переменные
передаются компонентам уже при SSR; native темы сохраняют прежние цвета,
а compact metrics описаны выше. Компонентные overrides подключены, в частности, к Button,
Input/TextArea (включая Password/Search/OTP), InputNumber, Space/SpaceAddon, Layout,
Radio/RadioButton/RadioGroup, Checkbox/CheckboxGroup, Switch, Avatar/AvatarGroup и Badge;
полное покрытие CSS-потребителей ещё переносится. Примеры и точная граница —
[в справочнике контекста темы](../theme-context.md).

ConfigProvider.wave управляет эффектом Button, Checkbox, Radio/RadioButton,
Switch, интерактивного Tag и Steps. Доступны disabled, showEffect с полным
GlobalToken и пять типов trigger. Настройки наследуются; явный record заменяет
родительский целиком. Targets, timing и Svelte boundaries описаны
[в справочнике Wave](../wave.md).

ConfigProvider.getPopupContainer задаёт `(trigger?: HTMLElement) => HTMLElement | ShadowRoot`.
Вложенный provider наследует функцию, когда его prop отсутствует или равен undefined;
theme.inherit=false не сбрасывает эту настройку. Она подключена к Tabs, ColorPicker,
Tooltip, Popover, Popconfirm, Dropdown, Slider, Tooltip внутри Typography,
Select, AutoComplete, TreeSelect, Cascader, Menu, Modal, Drawer, DatePicker, RangePicker, TimePicker
и TimeRangePicker;
остальные потребители исходного API ещё требуют переноса. Tour и Mentions используют
только собственный getPopupContainer, как Ant Design 6.6.8.
Функция вызывается только в браузере. Без выбранной функции сохраняется прежнее
native размещение компонента. Для ShadowRoot стили размещает потребитель;
стили document автоматически в него не переходят. Обновление функции с тем же
DOM-контейнером сохраняет popup, его state, фокус и выделение текста. Проверки —
[popup-container](../../../tests/browser/popup-container.spec.ts) и `?fixture=popup-container`;
30 сценариев наследования и приоритетов сверены с официальным UMD.
Для общих overlay-компонентов добавлены ещё 52 эталона:
[overlay-container](../../../tests/browser/overlay-container.spec.ts), `?fixture=overlay-container`.
В этой сверке default обозначает исходное native размещение без пользовательского
контейнера; DOM не переносится в body автоматически. ShadowRoot проверяется с
собственными стилями потребителя. При закрытии сохраняется прежний native lifecycle.
Select/AutoComplete добавляют 32 эталона в
[select-container](../../../tests/browser/select-container.spec.ts), `?fixture=select-container`.
TreeSelect/Cascader добавляют 40 эталонов в
[choice-container](../../../tests/browser/choice-container.spec.ts), `?fixture=choice-container`.

`ConfigProvider.popupOverflow` принимает `PopupOverflow = 'viewport' | 'scroll'`
для Select, TreeSelect, Cascader и AutoComplete, включая вложенные Select.
По умолчанию используется viewport; отсутствующий prop и `undefined` наследуют
родительское значение, явный viewport сбрасывает scroll. Режим scroll выбирает
область документа для расчёта переполнения; вертикальный shift по-прежнему учитывает
видимую область. Настройка не меняет собственные popup Tooltip, DatePicker,
Mentions или CascaderPanel. Смена режима обновляет карту для следующего исходного
выравнивания (открытие, resize или scroll), сохраняя текущие координаты до такого
события. Native сохраняет DOM parent, state и фокус; Select также использует
fixed top layer без обязательного `getPopupContainer`.
[Прямые сценарии](../../../tests/browser/popup-overflow.spec.ts),
[strict hydration](../../../tests/browser/popup-overflow-hydration.spec.ts) и
[SSR](../../../tests/package/popup-overflow.ssr.test.ts) проверяют эту настройку.
[Пары вложенных компонентов](../../../tests/browser/popup-overflow-smoke.spec.ts)
проверяют наследование и отсутствие влияния на другие popup; полное числовое
совпадение layout этих семейств они не подтверждают. Прежний Native контракт
Select сохраняется: закрытие не вызывает `onSearch`, controlled query очищает владелец.

`ConfigProvider.popupMatchSelectWidth` задаёт общий default для Select,
AutoComplete и TreeSelect. Вложенный provider наследует отсутствующее значение
и `undefined`; собственные `true`, `false` и число заменяют ближайшую настройку.
Cascader использует свой локальный prop. Pagination по умолчанию передаёт
локальный `false`, затем применяет props владельца `showSizeChanger`; Calendar
наследует общую ширину. ColorPicker задаёт внутреннему Select локальную ширину 68
и собственный контейнер. Calendar также сохраняет свои меню в header.
[Эталонные сценарии](../../../tests/browser/popup-width.spec.ts),
[вложенные controls](../../../tests/browser/popup-width-nested.spec.ts),
[пользовательские padding/border](../../../tests/browser/popup-width-height.spec.ts),
[strict hydration](../../../tests/browser/popup-width-hydration.spec.ts) и
[SSR](../../../tests/package/popup-width.ssr.test.ts) проверяют эти правила.

Статические defaultSeed, default/dark/compact algorithms и getDesignToken
работают без context и DOM. Их source-округления, overrides и ограничения описаны
[в справочнике design tokens](../design-tokens.md).

По умолчанию используется `ruRU`; `enUS` также экспортируется. `locale` принимает
частичное переопределение подписей кнопок и служебных сообщений. Вложенная группа
`locale.pagination`, `locale.table` и `locale.inputNumber` также объединяются с настройками родителя по отдельным
подписям. Тексты правил валидации задаются в `message` или возвращаются из validator.

## App

App объединяет MessageHolder, NotificationHolder и ModalHolder. Дочерний компонент
получает их API через `App.useApp()` либо отдельный `useApp()` при инициализации.
Вызов требует ближайшего App; глобальная очередь между SSR-запросами не создаётся.

```svelte
<!-- Application.svelte -->
<script lang="ts">
  import { App, ConfigProvider } from 'antd-svelte';
  import Actions from './Actions.svelte';
</script>

<ConfigProvider theme={{ cssVar: {} }}>
  <App message={{ maxCount: 3 }} notification={{ placement: 'bottomRight' }}>
    <Actions />
  </App>
</ConfigProvider>
```

```svelte
<!-- Actions.svelte -->
<script lang="ts">
  import { App, Button } from 'antd-svelte';
  const { message, notification, modal } = App.useApp();

  async function confirm() {
    if (await modal.confirm({ title: 'Продолжить?' })) {
      message.success('Готово');
      notification.info({ title: 'Операция завершена' });
    }
  }
</script>

<Button onclick={confirm}>Продолжить</Button>
```

Ближайший ConfigProvider задаёт тему, локаль и RTL holders. Настройки message и
notification объединяются по полям с ближайшим App; локальное undefined тоже
перекрывает родительское поле и возвращает default соответствующего holder.
Top/bottom меняют расположение поверхности; duration/pauseOnHover/maxCount и
notification.placement применяются к следующим вызовам. Изменение defaults не
перезапускает таймеры и не удаляет существующие записи. Новый maxCount применяется
при следующем добавлении; прежние placements уведомлений сохраняются.
Родительская, вложенная и соседняя очереди независимы. API остаются стабильными
на протяжении жизни App. В React notification API получает новый объект после
изменения config; это отличие механизма контекста записано в реестре.

По умолчанию root — div с исходной типографикой Ant Design. Component принимает
HTML-тег либо false; false оставляет children/holders без дополнительного root,
не применяет его class/style/attrs и не создаёт nativeElement. Смена тега или
fragment-режима пересоздаёт дочернее DOM-дерево и очищает holders; те же API
работают после повторного подключения. Bind:nativeElement даёт текущий HTML-root
и очищается при его удалении. Local prefixCls задаёт root-классы, иначе используется
ConfigProvider.prefixCls + app. ConfigProvider.app
наследует record class/style целиком; локальные class/rootClassName/style дополняют
его, style имеет приоритет. Обычные HTML attrs передаются корню.

В SSR App не открывает dialog/popover и не запускает таймеры. Удаление App
закрывает поверхности, снимает inert/scroll lock и завершает ожидающие Modal
handles с false. Поддерживаются текущие настройки Native Message/Notification;
их полные React semantic/render/stack/container options, React custom root
components остаются за пределами этого этапа.

Основа сверки — [исходные снимки App](../../../tests/browser/fixtures/ant-design-app-reference.json).
Все девять root-примеров, включая global-prefix, проверяются. Проверки:
[браузер](../../../tests/browser/app.spec.ts), [SSR и типы](../../../tests/package/app.ssr.test.ts),
[обновление defaults](../../../src/lib/notice-config.test.ts).

## Общий префикс ConfigProvider

PrefixCls задаёт базовый префикс CSS-классов; по умолчанию ant. Undefined и пустая
строка наследуют родительский prefix. Локальный непустой prefixCls компонента имеет
приоритет. Сейчас общий prefix подключён к App, Layout, LayoutSider,
LayoutHeader/Content/Footer, Statistic/Timer, QRCode, Timeline, Steps, Divider, Flex,
Segmented, Avatar/AvatarGroup, Badge/BadgeRibbon, Tag/CheckableTag/CheckableTagGroup,
Empty, Skeleton с primitives, Spin, Progress, Result, Alert, Collapse, Affix,
Tooltip, Popover, Popconfirm, Slider, BorderBeam, Masonry, Splitter, Anchor и
Space/SpaceCompact/SpaceAddon, Breadcrumb, Row/Col, Typography, Carousel, Descriptions, Tabs,
Card с Grid/Meta, Button, FloatButton/Group/BackTop, Radio/RadioButton/RadioGroup,
Checkbox/CheckboxGroup, Switch, Input, TextArea, InputPassword, InputSearch, InputOTP,
InputNumber, Form/FormItem/FormList/FormErrorList, Rate, Listy, Tour и Mentions.
Подключаемые prefix/theme styles остаются в head и не добавляют текст вокруг
корней компонентов, включая обычные и grid media styles ConfigProvider.
Пользовательские пробелы и текст внутри controls/snippets сохраняются.
Это защищают [SSR-проверки границ](../../../tests/package/prefix-text-boundaries.ssr.test.ts)
и [браузерный сценарий](../../../tests/browser/prefix-text-boundaries.spec.ts),
`?fixture=prefix-text-boundaries`.
Остальные семейства подключаются отдельно. Например,
ConfigProvider prefixCls="suite" создаёт suite-app, suite-layout,
suite-layout-sider и suite-layout-header без изменения имён Svelte-компонентов.

Для source theme базовый prefix задаёт fallback namespace CSS-переменных.
Унаследованный theme.cssVar.prefix имеет приоритет над новой настройкой провайдера,
локальный cssVar.prefix — над обоими. Явный undefined удаляет унаследованное значение
и возвращает fallback текущего провайдера, даже при inherit=false. Без локальной
темы сохраняется родительский theme scope и namespace. Legacy режим без source
theme сохраняет прежние переменные/цвета: useToken.cssVar пока использует ant namespace
вместо source fallback к class prefix. Это отличие записано отдельно в реестре.

Живая смена prefix не пересоздаёт Layout/controls, сохраняет refs, collapse, draft,
selection и focus; соседние и вложенные scopes независимы. Canonical Native
markers и --ant-* bridge сохраняются. В SSR классы и исходные variables доступны
до hydration.
Сверка: [13 UMD случаев и три перехода](../../../tests/browser/fixtures/ant-design-config-prefix-reference.json),
[browser](../../../tests/browser/config-prefix.spec.ts),
[SSR](../../../tests/package/config-prefix.ssr.test.ts),
[приоритет namespace](../../../src/lib/theme-prefix.test.ts).

Statistic/Timer, QRCode, Timeline и Steps проверяются также по
[девяти исходным примерам и трём переходам](../../../tests/browser/fixtures/ant-design-widget-prefix-reference.json):
[browser](../../../tests/browser/widget-prefix.spec.ts),
[SSR](../../../tests/package/widget-prefix.ssr.test.ts), `?fixture=widget-prefix`.
При сравнении родительские typography/direction совпадают с DOM-провайдером Svelte;
текущее время Timer не участвует в снимках.

Divider, Flex и Segmented сверяются с
[девятью исходными примерами и тремя переходами](../../../tests/browser/fixtures/ant-design-core-prefix-reference.json):
[browser](../../../tests/browser/core-prefix.spec.ts),
[SSR](../../../tests/package/core-prefix.ssr.test.ts), `?fixture=core-prefix`.
Смена prefix сохраняет выбранную опцию, radio DOM, callbacks, FormData и фокус.
Raw замеры отдельно фиксируют существующее поведение Segmented: radio не имеет
value-атрибута и отправляет "on"; типизированное значение передаётся через value/onChange.

Avatar/Group, Badge/Ribbon, Tag/CheckableTag/Group, Empty, Skeleton и его пять primitives,
Spin, Progress и Result сверяются с
[исходными замерами 17 вариантов](../../../tests/browser/fixtures/ant-design-status-prefix-reference.json):
[browser](../../../tests/browser/status-prefix.spec.ts),
[SSR](../../../tests/package/status-prefix.ssr.test.ts), `?fixture=status-prefix`.
Raw данные сохраняют React-результат. Сравнение отдельно учитывает прежний отступ
AvatarGroup, default-класс Tag и RTL-класс CheckableTag. Native Skeleton host/status,
имена CSS variables и canonical markers сохраняются. Badge ScrollNumber использует
общий prefix независимо от локального Badge.prefixCls; CSS Ribbon также следует
общему prefix. Изменение префикса сохраняет все 17 корней, draft, focus и selection.

Alert, Collapse и активный Affix сверяются по
[девяти исходным примерам и трём переходам](../../../tests/browser/fixtures/ant-design-structure-prefix-reference.json):
[browser](../../../tests/browser/structure-prefix.spec.ts),
[SSR](../../../tests/package/structure-prefix.ssr.test.ts), `?fixture=structure-prefix`.
Affix использует отдельные scroll targets; в SSR остаётся незакреплённым, как source.
Обновление prefix сохраняет fixed node и редактор раскрытой панели Collapse,
его значение, focus/selection и состояние остальных панелей.

Tooltip, Popover, Popconfirm и single/range Slider сверяются по
[45 исходным примерам и 15 переходам](../../../tests/browser/fixtures/ant-design-popup-prefix-reference.json):
[browser](../../../tests/browser/popup-prefix.spec.ts),
[SSR](../../../tests/package/popup-prefix.ssr.test.ts), `?fixture=popup-prefix`.
Открытые подсказки Slider отдельно наследуют Tooltip prefix; локальный Slider prefix
задаёт только owner class. Prefix Popconfirm не меняет prefix внешнего Popover.
Смена общего prefix сохраняет trigger/control, popup DOM, draft/focus/selection и
клавиатуру Slider. Проверка программно меняет контекст, как raw UMD transitions;
внешний pointerdown проверяется отдельно и сохраняет прежнее Native dismiss behavior.
Raw textContent сохранён; сравниваются непустые текстовые узлы без пробелов между
Svelte slots. В SSR остаются прежние hidden shells, без открытия popup и DOM containers.
