# Общий префикс ConfigProvider

`ConfigProvider.prefixCls` меняет начало имён CSS-классов. По умолчанию библиотека
использует `ant`. Вложенный провайдер наследует префикс родителя, а локальный
`prefixCls` компонента задаёт его собственный класс.

```svelte
<script lang="ts">
  import { Button, ConfigProvider } from '@woodger/antd';
</script>

<ConfigProvider prefixCls="suite">
  <Button>Сохранить</Button>
</ConfigProvider>
```

Кнопка получит класс `suite-btn`. Если передать самой кнопке
`prefixCls="save-button"`, её классом станет `save-button`.

## Компоненты и наследование

Сейчас общий prefix подключён к App, Layout, LayoutSider,
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
Это защищают [SSR-проверки границ](../../tests/package/config-provider/prefix-text-boundaries.ssr.test.ts)
и [браузерный сценарий](../../tests/browser/config-provider/prefix-text-boundaries.spec.ts),
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
Сверка: [13 UMD случаев и три перехода](../../tests/browser/fixtures/ant-design-config-prefix-reference.json),
[browser](../../tests/browser/config-provider/config-prefix.spec.ts),
[SSR](../../tests/package/config-provider/config-prefix.ssr.test.ts),
[приоритет namespace](../../src/lib/theme/theme-prefix.test.ts).

Statistic/Timer, QRCode, Timeline и Steps проверяются также по
[девяти исходным примерам и трём переходам](../../tests/browser/fixtures/ant-design-widget-prefix-reference.json):
[browser](../../tests/browser/config-provider/widget-prefix.spec.ts),
[SSR](../../tests/package/config-provider/widget-prefix.ssr.test.ts), `?fixture=widget-prefix`.
При сравнении родительские typography/direction совпадают с DOM-провайдером Svelte;
текущее время Timer не участвует в снимках.

Divider, Flex и Segmented сверяются с
[девятью исходными примерами и тремя переходами](../../tests/browser/fixtures/ant-design-core-prefix-reference.json):
[browser](../../tests/browser/config-provider/core-prefix.spec.ts),
[SSR](../../tests/package/config-provider/core-prefix.ssr.test.ts), `?fixture=core-prefix`.
Смена prefix сохраняет выбранную опцию, radio DOM, callbacks, FormData и фокус.
Raw замеры отдельно фиксируют существующее поведение Segmented: radio не имеет
value-атрибута и отправляет "on"; типизированное значение передаётся через value/onChange.

Avatar/Group, Badge/Ribbon, Tag/CheckableTag/Group, Empty, Skeleton и его пять primitives,
Spin, Progress и Result сверяются с
[исходными замерами 17 вариантов](../../tests/browser/fixtures/ant-design-status-prefix-reference.json):
[browser](../../tests/browser/config-provider/status-prefix.spec.ts),
[SSR](../../tests/package/config-provider/status-prefix.ssr.test.ts), `?fixture=status-prefix`.
Raw данные сохраняют React-результат. Сравнение отдельно учитывает прежний отступ
AvatarGroup, default-класс Tag и RTL-класс CheckableTag. Native Skeleton host/status,
имена CSS variables и canonical markers сохраняются. Badge ScrollNumber использует
общий prefix независимо от локального Badge.prefixCls; CSS Ribbon также следует
общему prefix. Изменение префикса сохраняет все 17 корней, draft, focus и selection.

Alert, Collapse и активный Affix сверяются по
[девяти исходным примерам и трём переходам](../../tests/browser/fixtures/ant-design-structure-prefix-reference.json):
[browser](../../tests/browser/config-provider/structure-prefix.spec.ts),
[SSR](../../tests/package/config-provider/structure-prefix.ssr.test.ts), `?fixture=structure-prefix`.
Affix использует отдельные scroll targets; в SSR остаётся незакреплённым, как source.
Обновление prefix сохраняет fixed node и редактор раскрытой панели Collapse,
его значение, focus/selection и состояние остальных панелей.

Tooltip, Popover, Popconfirm и single/range Slider сверяются по
[45 исходным примерам и 15 переходам](../../tests/browser/fixtures/ant-design-popup-prefix-reference.json):
[browser](../../tests/browser/popup/popup-prefix.spec.ts),
[SSR](../../tests/package/popup/popup-prefix.ssr.test.ts), `?fixture=popup-prefix`.
Открытые подсказки Slider отдельно наследуют Tooltip prefix; локальный Slider prefix
задаёт только owner class. Prefix Popconfirm не меняет prefix внешнего Popover.
Смена общего prefix сохраняет trigger/control, popup DOM, draft/focus/selection и
клавиатуру Slider. Проверка программно меняет контекст, как raw UMD transitions;
внешний pointerdown проверяется отдельно и сохраняет прежнее Native dismiss behavior.
Raw textContent сохранён; сравниваются непустые текстовые узлы без пробелов между
Svelte slots. В SSR остаются прежние hidden shells, без открытия popup и DOM containers.

## Nonce для стилей

Передайте `csp={{ nonce }}` в `ConfigProvider`, чтобы созданные библиотекой
стили темы, префиксов и блокировки прокрутки в ShadowRoot получили nonce из
политики документа. Вложенный провайдер с `csp={undefined}` наследует настройку,
а явный объект заменяет её целиком. `csp={{}}` сбрасывает унаследованный nonce.
Тип `CSPConfig` доступен из пакета.

SSR передаёт nonce в разметке `<style>`. При смене nonce браузер получает
новые style-элементы, а элементы управления сохраняют DOM и фокус.
Ant Design React 6.6.8 сохраняет nonce у уже закэшированных стилей.
Таблицы стилей сборщика и политика для атрибутов `style` настраиваются
приложением. [Замеры React](../../tests/browser/fixtures/ant-design-config-provider-csp-reference.json)
· [Проверки CSP и гидратации в Chromium](../../tests/browser/config-provider/config-provider-csp.spec.ts).

## Глобальные настройки статических вызовов

`ConfigProvider.config({ prefixCls, iconPrefixCls, theme, holderRender })`
задаёт настройки отдельных корней статического Modal. Префиксы и тема читаются
при отложенном рендере, а snippet `holderRender` закрепляется в момент вызова
`Modal.confirm()` или другого статического метода. Передайте
`holderRender: undefined`, чтобы снять обёртку у будущих вызовов. Пустая строка
возвращает префикс к default.

Snippet получает штатное содержимое и может отрисовать его под своим
провайдером. Такой провайдер задаёт, например, RTL, общий префикс, локаль
или параметры кнопок `modal`. `iconPrefixCls` управляет классом штатной
иконки подтверждения. Обычные провайдеры продолжают использовать свой
контекст. Настройки глобального вызова хранятся только в браузере.
[Глобальные подтверждения](components/modal.md#глобальные-подтверждения)

