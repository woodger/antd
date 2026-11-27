# Typography

`Typography` — нативный `article` с типографическими стилями; `component` меняет
его тег. `TypographyText`, `TypographyTitle`, `TypographyParagraph` и
`TypographyLink` соответствуют Text/Title/Paragraph/Link Ant Design и
добавляют операции над текстом. Точные контракты находятся в
[typography.types.ts](../../../src/lib/typography/typography.types.ts).

```svelte
<script lang="ts">
  import { TypographyTitle, TypographyParagraph, TypographyLink } from '@woodger/antd';

  let text = $state('Длинный текст статьи');
  let expanded = $state(false);
</script>

<TypographyTitle level={2}>Название статьи</TypographyTitle>
<TypographyParagraph children={text} copyable
  editable={{ onChange: value => { text = value; } }}
  ellipsis={{ rows: 2, expandable: 'collapsible', expanded,
    onExpand: (_event, info) => { expanded = info.expanded; } }} />
<TypographyLink href="/articles" target="_blank">Все статьи</TypographyLink>
```

Text рендерит `span`, Title — `h1`–`h5` (по умолчанию `h1`), Paragraph — `div`,
Link — `a`. У Link с `target="_blank"` и не заданным `rel` добавляется
`noopener noreferrer`. `disabled` меняет оформление; кнопки copy/edit/expand
сохраняют интерактивность, как в upstream. Decorations оборачивают текст вместе
с действиями; `actions.placement` переносит панель в начало или конец.

`copyable` принимает настройки text, format, icon, tooltips, tabIndex и onCopy.
Async producer вызывается по клику; пустой text использует исходный children
fallback. HTML копируется как `text/html` и `text/plain`; при отказе Clipboard API
применяется document copy fallback. Успешное состояние сбрасывается через три
секунды. Уже начатая операция и callback завершаются после unmount без нового
таймера. Для богатого содержимого указывайте `copyable.text`: исходный array
fallback объединяет верхний уровень, а узлы элементов превращает в
`[object Object]`.

`editable` управляет режимом через editing; callbacks сами не заменяют children.
Редактор получает editable.text или строковые children. Ввод удаляет CR/LF,
сохранение применяет trim. Enter вызывает onChange и onEnd, Escape — onCancel,
blur — только onChange; IME и модификаторы Enter учитываются. Поддержаны
triggerType, maxLength, autoSize, tooltip, icon и tabIndex. `enterIcon={null}`
скрывает подтверждение; custom enterIcon snippet получает CSS class первым
аргументом вместо React cloneElement. При закрытии фокус возвращается к edit icon.
Редактор не становится control внешнего FormItem. При blur без relatedTarget
проверка connected выполняется после Svelte tick: удаление focused DOM не должно
сохранять draft. `bind:nativeElement` отсутствует во время editing и очищается
при unmount.

Без действий и других настроек ellipsis использует native CSS. JS-ветка измеряет
строки и операции, ищет границу по UTF-16, сохраняет suffix и полный aria-label.
Поддержаны rows, expandable/collapsible, symbol, defaultExpanded, expanded,
onExpand, onEllipsis и tooltip. DefaultExpanded читается один раз. Text исключает
rows/expandable/onExpand; для responsive ширины Text задайте style. Link принимает
boolean ellipsis. Tooltip измеряет native overflow при наведении и скрывается
над панелью действий. Его trigger и hover delays наследуют ConfigProvider.tooltip;
локальные options приоритетнее, включая 0 и trigger=[]. Вложенный tooltip record
заменяет родительский целиком. Без настроек trigger=hover и обе задержки равны 0.1s.
Поддержаны focus/click/contextMenu и массивы событий; source config разделяет
их действия, поэтому hover leave может закрыть подсказку, открытую click/focus.
Повторный contextMenu переключает видимость, обычный click её закрывает.
Локальные showAction/hideAction независимо заменяют эти действия; focusDelay и
blurDelay не наследуют mouse delays. Их приоритет, touch fallback и поведение
внешнего закрытия описаны в [Tooltip](tooltip.md#tooltip).
Подсказки copy/edit наследуют те же настройки; копирование, success title и вход
в редактор сохраняют свои обычные действия.
Ellipsis Tooltip также принимает destroyOnHidden:
при закрытии удаляется его содержимое, измерение текста и native shell сохраняются.
Как в upstream, onOpenChange сообщает raw open даже для текста без усечения,
но сама подсказка остаётся скрытой. Для native CSS ellipsis сначала требуется
измерение при наведении; JS ellipsis измеряется независимо от Tooltip trigger.

Scalar children и массивы передают точные границы текста до SSR. В массиве snippet
остаётся атомом. Обычный текстовый children snippet распознаётся после mount через
DOM; при JS truncation и editing исходный snippet остаётся в скрытом `span`, чтобы
получать обновления. Его полный текст поэтому остаётся в textContent, а видимый обрезанный
текст доступен через innerText. Для точного initial SSR editing используйте
scalar children или editable.text. Богатый snippet не разбирается как React tree.

ConfigProvider.typography задаёт class/style и semantic root/actions/action/textarea;
локальные слои имеют приоритет. Callback видит разрешённые prefixCls/direction и
фактический component. Locale.typography и исходный locale.Text задают подписи
действий; Text имеет приоритет при совместном использовании. Сохранены dark,
compact, RTL, native focus и исходные heading margins.

Все варианты Typography используют локальный `prefixCls` либо наследуют общий
`ConfigProvider.prefixCls`; пустое значение выбирает наследование. Prefix охватывает
заголовки, decorations, ellipsis, actions и отдельный editor root. Смена prefix
сохраняет DOM, draft/selection/focus и состояние копирования. Namespace theme
variables и prefix вложенного Tooltip остаются независимыми.

`theme.components.Typography` применяет `titleMarginTop`/`titleMarginBottom`,
alias overrides и algorithms к обычному тексту и редактору. Global tokens,
вложенные/reset/sibling scopes и отдельный CSS-variable prefix следуют source;
semantic и локальный style сохраняют приоритет. Смена темы сохраняет DOM,
draft/selection/focus редактора и ожидающее async-копирование. Без source theme
сохраняются прежние CSS defaults.

Tooltip использует общий native popover внутри корня вместо React body portal.
Доступны общие 12 placement, container getters, color, локальные popup prefixCls и
openClassName и semantic styles. Callbacks получают разрешённые trigger/delays
и входной open владельца. Изменение config сохраняет popup DOM, ввод, выделение
и фокус. Ellipsis Tooltip участвует в ближайшем `Tooltip.UniqueProvider`.
`ellipsis.tooltip.unique=false` сохраняет отдельную панель. Анимации и lifecycle
следуют [контракту Tooltip](tooltip.md#общая-подсказка-для-нескольких-триггеров).
Границы fresh для opaque Snippet и геометрии CSS-transform/scroll-container
описаны в Tooltip.
В исходном Ellipsis memoization не учитывает смену prefix: во вложенном provider
кнопки copy/edit могут сохранить старые классы и потерять оформление. Raw live
замеры и fresh mount с теми же public props сохранены в
[prefix-эталоне](../../../tests/browser/fixtures/ant-design-typography-prefix-reference.json).
Native обновляет классы действий вместе с корнем; этот дефект не перенесён.
Проверки prefix: [браузер](../../../tests/browser/typography/typography-prefix.spec.ts) и
[SSR](../../../tests/package/typography/typography-prefix.ssr.test.ts), `?fixture=typography-prefix`.

Ширина actions сверяется с
[DOM/CSS-снимком Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-typography-actions-reference.json)
в изолированном ShadowRoot. Так сравнение использует одинаковые шрифты текущего
браузера в Chromium и Headless Shell; точность и границы двухстрочного текста сохранены.

Ellipsis Tooltip defaults, semantic callbacks и события сверяются с
[23 UMD-сценариями / 29 кадрами и 21 event trace](../../../tests/browser/fixtures/ant-design-typography-tooltip-reference.json):
[SSR](../../../tests/package/typography/typography-tooltip.ssr.test.ts),
[browser](../../../tests/browser/typography/typography-tooltip.spec.ts), `?fixture=typography-tooltip`.
Эталон использует runtime CSS официального UMD без статического antd.css;
native overflow измеряется под trigger=[] до записи последовательностей событий.
[73 исходных CSS rules](../../../src/lib/vendor/typography.css) воспроизводятся
[рецептом](../../../tools/ant-design-css-recipes.json). Иконки взяты из
@ant-design/icons-svg 4.6.0 под существующей
[MIT-лицензией](../../../src/lib/vendor/LICENSE.ant-design-icons).
