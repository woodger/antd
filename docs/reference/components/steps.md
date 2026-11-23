# Steps

```svelte
<script lang="ts">
  import { Steps } from '@woodger/antd';
  let current = $state(0);
</script>

<Steps {current} onChange={index => { current = index; }} items={[
  { key: 'data', title: 'Данные', content: 'Заполните форму' },
  { key: 'review', title: 'Проверка', subTitle: 'Перед отправкой' },
  { key: 'send', title: 'Отправка', disabled: true }
]} />
```

Steps показывает этапы процесса. Current управляется владельцем и отсчитывается
от нуля; onChange сообщает запрошенный индекс, не меняя current самостоятельно.
Владелец может проверить поля перед принятием перехода. Повторный выбор текущего
шага, disabled и внешние обновления не вызывают callback. Без onChange список
пассивный и не создаёт остановок Tab. Привязка bind:current не используется.

Существующий тип StepsItem сохраняет стабильные строковые key и title.
StepsDataItem дополнительно принимает необязательные/numeric key и title;
для отсутствующих ключей используются позиции. При повторении string key
остаётся первое вхождение; индексы относятся к этому нормализованному списку.
Пустой список допустим. Конечное current округляется вниз и ограничивается
диапазоном 0..items.length; NaN/Infinity дают 0. Current=items.length отмечает
все автоматические шаги завершёнными без aria-current. Нормализация не
перезаписывает значение владельца и не генерирует callbacks.

Автоматические статусы: finish до current, process на current, wait после него.
Status меняет состояние текущего шага на wait/process/finish/error;
items.status имеет приоритет над вычисленным состоянием. Disabled ограничивает
выбор и не меняет статус или current. Корневой disabled наследует
ConfigProvider.componentDisabled; false явно снимает его, сохраняя items.disabled.

Существующий StepsItem принимает string или Snippet в title/subTitle/content;
новый StepsDataItem также принимает number/boolean/null. Ноль отображается,
boolean не создаёт текст. Icon может быть текстом, числом или декоративным Snippet.
Строки экранируются. Заголовок и подзаголовок находятся в нативной кнопке выбора
и должны содержать только текст/phrasing-разметку без вложенных controls.
Content находится отдельно и допускает блочную разметку; панели с полями
и действиями остаются у владельца. Иконки и линии
aria-hidden; icon также inert. Check/close используют существующий Icon.
Выбранный шаг помечен aria-current="step"; доступное описание кнопки содержит
локализованный статус и content. Собственных live-region и автофокуса нет.

Список использует ol/list, кнопки — естественные Tab/Shift+Tab, Enter и Space.
Это не tablist: содержимое и переходы принадлежат владельцу. При удалении или
отключении сфокусированного шага фокус переходит на следующий доступный шаг,
затем предыдущий. Keyed-перестановка сохраняет сфокусированную кнопку.
Если шагов/кнопок больше нет или Steps размонтирован, выбирается доступный
сосед текущего dialog/документа. Явный выбор владельца сохраняется.

Orientation: horizontal/vertical, по умолчанию horizontal. Responsive=true
переключает горизонтальный список в вертикальный при ширине viewport меньше
532px; SSR до гидратации не измеряет viewport и использует orientation.
При responsive=false сохраняется горизонтальная ориентация с внутренней
прокруткой при нехватке места. Size: medium/small; отсутствующий size наследует
small из ConfigProvider, остальные общие размеры дают medium.
Темы, compact, primary и RTL используют токены. Reduced motion отключает
встроенные transitions. Id/class/style и aria-describedby относятся к ol;
aria-label/aria-labelledby задают имя, по умолчанию locale.steps.label.

Locale.steps содержит label/wait/process/finish/error. RuRU и enUS предоставляют
все строки; вложенные частичные переводы сохраняют значения родительского
ConfigProvider. Отсутствующие значения дополняются ruRU. Тексты items задаёт владелец.

Type поддерживает default/dot/inline/navigation/panel, variant — filled/outlined.
Panel всегда горизонтальный. Dot/inline используют вертикальные заголовки в
горизонтальном списке; navigation сохраняет горизонтальные заголовки.
Orientation задаёт направление списка, titlePlacement — размещение заголовков.
Inline скрывает content в строке и показывает его в Tooltip по hover/focus;
Snippet title сохраняет rich content, Escape закрывает tooltip без смены фокуса.
Wrapper Tooltip находится внутри li, сохраняя нативную ol/li-семантику.

Initial сдвигает нумерацию, current и onChange в исходное пространство индексов;
согласованная нормализация current и first-wins keys сохранена. MaxCount>=3
ограничивает число реальных видимых шагов: первый, последний, текущий и ближайшие
соседи по исходному приоритету. Разрывы заменяются disabled ellipsis; сами ellipsis
не входят в maxCount. Номер и callback относятся к исходному item. Status ellipsis
сохраняет error скрытого диапазона либо finish/wait по current. Ellipsis=true
отдельно включает CSS-обрезку текста; offset задаёт начальную inline flex-cell.

Percent добавляет SVG progressbar к process-номеру, с исходной формулой dasharray;
в inline percent игнорируется. Progressbar доступен assistive technology,
декоративные иконки и стрелки panel скрыты. Новая ellipsis-иконка — точный SVG
@ant-design/icons-svg 4.6.0 (git 7f2516ac91226d2b41f93b35cb5197c8d94f7189),
MIT-лицензия уже включена в vendor/LICENSE.ant-design-icons.

ClassNames/styles принимают объект или функцию от {props}; root и item* слоты
совпадают с upstream. Item classNames/styles используют root/wrapper/icon/section/
header/title/subtitle/content/rail; локальные слои перекрывают общие, item.style
перекрывает styles.root. Root style имеет приоритет над styles.root. Стрелки navigation наследуют
colorTextDisabled активной темы; прямой --ant-steps-nav-arrow-color имеет приоритет.
Item.onClick вызывается перед onChange, включая повторный выбор current;
в disabled оба callback подавлены. Содержимое шага задаётся через content.

ConfigProvider.steps задаёт общие class/style/classNames/styles для десяти slots.
Классы config и local накапливаются. Root styles идут в порядке config.styles.root
→ config.style → local styles.root → local style; item-specific слои сохраняют приоритет.
Callbacks получают прежние native props с вычисленными layout/type/titlePlacement
и percent; текущие defaults/status/size и правила current не меняются.
Undefined наследует steps-record, любой собственный объект, включая {}, заменяет его.
В композиции Timeline, как в Source InternalContext, действуют только plain class/style:
semantic classNames/styles Steps не применяются и их callbacks не вызываются.

Локальный prefixCls меняет классы root, layout, item и progress; пустая строка
наследует ConfigProvider.prefixCls (по умолчанию ant-steps). CSS извлечён из закреплённого архива отдельным рецептом
steps-prefix. Namespace --ant-steps-* / --ant-cmp-steps-* и общий marker
ant-steps-css-var сохраняются. Смена prefix не пересоздаёт ol или кнопки, не меняет
их ids, выбор и фокус. Components.Icon из iconRender наследует тот же prefix;
восстановление фокуса при удалении шага от классов не зависит. Соседние Steps
изолированы, локальные/semantic styles и компонентные токены сохраняют приоритет.
Общий prefix ConfigProvider применяется и внутри Timeline.
Настройки самого ConfigProvider.timeline и локальные Timeline слои сохраняют приоритет.
Сверка: [36 исходных случаев и 4 обновления](../../../tests/browser/fixtures/ant-design-steps-config-reference.json),
[браузер](../../../tests/browser/steps-config.spec.ts),
[публичные типы и SSR](../../../tests/package/steps-config.ssr.test.ts), `?fixture=steps-config`.

IconRender — Snippet<[originalIcon, info]>, где info содержит index/active/item/
components.Icon. Можно отрендерить исходный Snippet или использовать переданный
Svelte Icon-компонент.
Bind:nativeElement возвращает ol; rootClassName добавляется к его class.

Сохранены согласованные отличия v1 от React: нативные кнопки внутри именованного
списка, keyed focus recovery, clamp current, responsive-порог 532px (исходный
useBreakpoint версии 6.6.8 использует xs), componentDisabled и locale.steps.
Произвольный prefixCls пока не перенесён.
Wave работает для доступных items при общем onChange.
Новые сценарии находятся в ?fixture=steps-variants и втором примере #steps;
unit/SSR/Chromium проверяют layouts, collapse/index mapping, render Snippets,
rich tooltip и доступность процента.

Source `theme.components.Steps` применяет исходные defaults, aliases и отдельные
algorithms к размерам иконок/точек, шрифтам, цветам и navigation. Поддержаны
CSS prefix/hash, нули/undefined и переданные во время выполнения CSS lengths.
Semantic root styles и plain style сохраняют приоритет. CustomIconSize/customIconTop
и iconTop создают переменные, но не меняют оформление,
как в 6.6.8; то же относится к legacy waitIcon*/finishIcon* defaults.
Метрики вариантов и композиции Timeline сверяются с официальным UMD в
`?fixture=steps-theme`; native-only темы сохраняют прежнее оформление.

