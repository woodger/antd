# Формы и валидация

Form, FormItem и FormList независимо разрешают prefixCls: непустой local prefix
имеет приоритет, empty/undefined наследуют ConfigProvider. Локальный prefix Form
не назначается дочерним Item автоматически, как в Source; для общего локального
namespace задайте оба Props. Input/Col/Row/Tooltip используют собственные общие
namespaces. Canonical Form token marker/variables и приоритет semantic/user styles
сохраняются. Store, callbacks, registration, default vertical layout, native refs,
labels/ARIA, focus/selection, submit/reset и component=false сохраняют прежние контракты.

Form CSS использует global screenXSMax/SMMax/MDMax/LGMax. Scoped template из 99
Source rules изолирует custom media от canonical CSS, включая сужение порогов,
и разделяет общий namespace private Form/Grid variables. Scope не зависит от
cssVar.key/hashed. Motion остаётся native. Styled Item и noStyle передают prefix
ErrorList; существующий List prefix имеет приоритет над промежуточным Item.
Без списка/Item используется общий Form prefix. Canonical ErrorList сохраняет
explain styles и в форме с отдельным media scope.

Raw UMD states записаны до fresh counterparts. Shared local class в Inner provider
и media CSS эталона сохраняют чужие/старые namespaces; fresh scopes измерены с новым
public local class. Canonical sibling в Source также получает чужие media rules;
Native sibling сравнивается с отдельно измеренным исходным default на той же ширине.
Все исходные results/freshMedia сохранены без изменения. Проверки —
`?fixture=form-prefix`, [browser](../../../tests/browser/form-prefix.spec.ts),
[SSR](../../../tests/package/form-prefix.ssr.test.ts),
[эталон UMD](../../../tests/browser/fixtures/ant-design-form-prefix-reference.json).

Создавайте модель в scope компонента или presentation model, чтобы разные формы
и SSR-запросы не разделяли состояние:

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Form, FormItem, Input, createForm } from 'antd-svelte';

  const form = createForm({
    initialValues: { email: '' },
    rules: {
      email: [
        { required: true, message: 'Введите email.' },
        { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Проверьте email.' }
      ]
    }
  });
</script>

<ConfigProvider>
  <Form {form} onFinish={(values) => console.log(values.email)}>
    <FormItem name="email" label="Email">
      <Input
        type="email"
        value={form.values.email}
        onValueChange={(value) => form.setFieldValue('email', value)}
      />
    </FormItem>
    <Button type="primary" htmlType="submit" loading={form.isSubmitting}>Отправить</Button>
    <Button htmlType="reset">Сбросить</Button>
  </Form>
</ConfigProvider>
```

FormItem предоставляет label, status, required, description и обработчик blur.
Расположение подписи наследуется из `Form.layout`: `vertical` размещает её
над control, `horizontal` — рядом с ним на широком экране, `inline` располагает
поля в строке с переносом по доступной ширине. Прежний default остаётся vertical.
Локальный `FormItem.layout` (`horizontal` или `vertical`) имеет приоритет над Form;
undefined возвращает наследование. Переключение layout не пересоздаёт controls,
не меняет values/metadata и сохраняет фокус и выделение.

Form и FormItem принимают rootClassName; FormItem также принимает строковый style.
ConfigProvider.form.class/style оформляют native корень Form: классы config,
local class и rootClassName накапливаются, inline CSS идёт после component theme
в порядке config.style → local style. FormItem.style применяется к своему корню
после компонентных токенов. Component=false сохраняет контекст без native wrapper.
Undefined record наследуется, {} сбрасывает config; настройки и соседние поля
не теряют значения, metadata, фокус и выделение при обновлениях оформления.
Проверки: [12 эталонов](../../../tests/browser/fixtures/ant-design-form-root-reference.json),
[браузер](../../../tests/browser/form-root.spec.ts),
[публичные типы и SSR](../../../tests/package/form-root.ssr.test.ts), `?fixture=form-root`.
В том же артефакте записан неработающий ConfigProvider.form.variant исходника 6.6.8.

`Form.classNames/styles` и одноимённые поля ConfigProvider.form принимают объект
или callback для slots root, label, content, help, helpItem и extra. Root оформляет
сам Form, остальные slots — подпись, content и пояснения FormItem/ErrorList.
Классы config и local накапливаются. CSS root применяется в порядке component theme,
config.styles.root, config.style, local.styles.root, local style; остальные slots
объединяют config.styles и local.styles. CSS задаётся строками.

Callback получает native Form props с разрешёнными layout, disabled и requiredMark;
colon/labelAlign/labelWrap объединены с config и могут остаться undefined до
внутренних CSS defaults. Возврат undefined сохраняет предыдущий слой.
Вложенный Item наследует slots, вложенный Form применяет свои props/config.
Component=false сохраняет slots полей без DOM root. Обновления сохраняют controls,
фокус/выделение и metadata; прежний приоритет help и доступные сообщения сохранены.
Классы error/warning относятся к сообщениям, контейнер сохраняет role alert/status.

FormErrorList в FormList получает help/helpItem. Source без обёртки FormItem
наследует обычный цвет формы; это записано отдельно, native цвета standalone
ErrorList сохранены. Проверки: [16 эталонов и наблюдение](../../../tests/browser/fixtures/ant-design-form-semantic-reference.json),
[браузер](../../../tests/browser/form-semantic.spec.ts),
[публичные типы и SSR](../../../tests/package/form-semantic.ssr.test.ts), `?fixture=form-semantic`.

`Form.size` задаёт small, medium или large для формы и вложенных компонентов.
Undefined наследует ближайший Form/ConfigProvider; локальный размер control
и размер SpaceCompact сохраняют свой приоритет. Настройки соседей не меняются.
Small/large также задают исходную высоту подписей и control containers; component=false
передаёт размер без wrapper. Semantic callbacks получают разрешённый size:
undefined без явной настройки, medium при явном medium. Divider сохраняет различие
между размером по умолчанию и medium. Динамическая смена сохраняет control,
focus/selection, metadata и native FormData.
Сверка: [25 эталонов](../../../tests/browser/fixtures/ant-design-form-size-reference.json),
[браузер](../../../tests/browser/form-size.spec.ts),
[публичные типы и SSR](../../../tests/package/form-size.ssr.test.ts), `?fixture=form-size`.

`Form.disabled` передаётся всем дочерним Ant Design controls, включая компоненты
без FormItem. Undefined наследует ConfigProvider или внешний Form; false разрешает
controls поверх внешнего disabled=true. Вложенный ConfigProvider.componentDisabled
переопределяет Form для своего поддерева; локальный disabled компонента приоритетнее.
Переключение сохраняет DOM, значения, выделение текста и выбранные options.
Прежняя блокировка связанного control на время async onFinish сохраняется отдельно;
явный disabled=false компонента по-прежнему разрешает его.
Сверка: [12 эталонов](../../../tests/browser/fixtures/ant-design-form-disabled-reference.json),
[браузер](../../../tests/browser/form-disabled.spec.ts),
[публичный пакет и SSR](../../../tests/package/form-disabled.ssr.test.ts), `?fixture=form-disabled`.

`FormItem.validateStatus` принимает success, warning, error, validating и ''.
Явное значение меняет оформление поверх metadata; пустая строка отключает
автоматический визуальный статус. Без prop приоритет такой: текущая validation,
errors, warnings, затем success для touched-поля. Pristine-поле остаётся без статуса.
Metadata берётся по точному имени, без touched потомков. Прежние triggers/touched
модели сохранены. Настройка работает и у FormItem без name, без регистрации поля.

Статус не запускает validation и не удаляет errors/warnings. Сохранённая ошибка
остаётся доступной через aria-invalid и description даже при success/validating/'';
локальный status control сохраняет приоритет оформления. Input/Select по-прежнему
выставляют aria-invalid при visual error без ошибок модели; source его не задаёт.
Transfer получает ошибку и доступное описание на корне, как официальный компонент.
Обновления сохраняют DOM, draft, focus/selection; reset очищает автоматический статус.
`FormItem.hasFeedback` включает значок статуса. `Form.feedbackIcons` задаёт функцию
`({ status, errors, warnings }) => ({ success, error, warning, validating })`;
`hasFeedback={{ icons }}` перекрывает её для одного Item. Значения — содержимое
или Svelte snippets. `false` скрывает значок; null/undefined/0/пустая строка
выбирают стандартный. Пустой map использует стандартные значки и заменяет Form renderer.
Validated-поле без touched получает success только при hasFeedback; прежний порядок
validating/errors/warnings и явный validateStatus сохраняется.

NoStyle без собственного hasFeedback наследует значок родителя, даже если имеет
свой validateStatus. Локальный false отключает feedback. Вложенный Form сбрасывает
значок и visual status, сохраняя metadata ближайшего Item. Label/extra не получают
контекст собственного поля. Сигнатура useFormItemStatus остаётся прежней.

Feedback подключён к TreeSelect: отдельные классы control/Item, исходные glyphs,
цвета, размеры, local Form/Item prefixes и данные custom renderer проверены по React.
Значок следует статусу Item, даже если локальный status TreeSelect другой.
SuffixIcon=null оставляет только feedback; собственный suffix имеет приоритет.
PopupRender и ячейки InputOTP изолируют feedback. Обновления сохраняют DOM и focus
поля; reset использует прежний remount. SSR не запускает validation или timers.
Сверка: [45 сценариев](../../../tests/browser/fixtures/ant-design-form-feedback-reference.json),
[браузер](../../../tests/browser/form-feedback.spec.ts),
[SSR](../../../tests/package/form-feedback.ssr.test.ts), `?fixture=form-feedback`.

Input, TextArea, InputNumber и Select также выводят feedback. InputPassword и
InputSearch наследуют его через Input. Пользовательский suffix Input/InputNumber
предшествует значку; у TextArea порядок — clear, feedback, счётчик. InputNumber и
Select получают `has-feedback` и `in-form-item`; Calendar сохраняет feedback у
Select заголовка, отключая для них только `in-form-item`. Pagination наследует оба
признака. Панель ColorPicker и popupRender Mentions сбрасывают feedback/status.
Смена статуса и содержимого значка сохраняет поле и фокус. Переключение самого
hasFeedback может сменить обёртку Input/TextArea и снять фокус, как в React;
постоянный prefix/suffix или clear/count сохраняет обёртку. Reset использует прежний
remount. InputSearch сохраняет прежнее восстановление фокуса SpaceCompact после
замены поля; в записанном React-эталоне фокус при таком переключении теряется.
Согласованные native ARIA, значения, события и refs сохраняются.
Сверка: [128 сценариев и 118 переходов](../../../tests/browser/fixtures/ant-design-form-feedback-control-reference.json),
[браузер](../../../tests/browser/form-feedback-control.spec.ts),
[SSR](../../../tests/package/form-feedback-control.ssr.test.ts), `?fixture=form-feedback-control`.
Feedback также подключён к Cascader, AutoComplete, Mentions, Transfer и четырём
date/time controls. Cascader добавляет значок после generated/custom suffixIcon;
null/false убирают стрелку, сохраняя feedback. Его popupRender изолирует
feedback/status и field binding. AutoComplete выводит feedback без стрелки;
custom Antd Input/TextArea сохраняет собственный значок, поэтому их два, как
в закреплённом React. Retained native popup не скрывает suffix после открытия.
Pointer-clear закрывает AutoComplete после clear/change/search; click-only
сохраняет прежнюю открытость, controlled open остаётся у владельца.

Mentions использует affix/suffix. Toggle feedback без постоянного clear-wrapper
заменяет textarea и закрывает popup, как React; совместное переключение clear/feedback
с неизменной обёрткой сохраняет editor. Native root/ref остаётся DIV. Отложенное
выделение не фокусирует заменённый editor. Transfer добавляет только root flag;
оба search Input наследуют feedback, без showSearch значков нет. Pickers добавляют
has-feedback без in-form-item; custom suffix заменяет иконку и feedback целиком.
Сверка: [Cascader](../../../tests/browser/form-feedback-cascader.spec.ts),
[AutoComplete](../../../tests/browser/form-feedback-autocomplete.spec.ts),
[Mentions/Transfer](../../../tests/browser/form-feedback-mentions.spec.ts),
[pickers](../../../tests/browser/form-feedback-picker.spec.ts); соответствующие
`?fixture=form-feedback-cascader`, `form-feedback-autocomplete`,
`form-feedback-mentions`, `form-feedback-picker`. Проверены DOM-free SSR,
строгая гидратация и pending disposal. Остальная Form motion ещё переносится.
Сверка: [29 исходных состояний](../../../tests/browser/fixtures/ant-design-form-status-reference.json),
[браузер и доступность controls](../../../tests/browser/form-status.spec.ts),
[публичный пакет и SSR](../../../tests/package/form-status.ssr.test.ts), `?fixture=form-status`.

`useFormItemStatus()` — Svelte-аналог Form.Item.useStatus для собственных controls.
Вызывайте его при инициализации дочернего компонента FormItem и читайте поля
возвращённого объекта: status, errors и warnings обновляются через getters.
Destructuring сохраняет snapshot. Массивы сообщений доступны только для чтения.

```svelte
<script lang="ts">
  import { useFormItemStatus } from 'antd-svelte';
  const field = useFormItemStatus();
</script>

{#each field.errors as error}<p>{error}</p>{/each}
```

Pristine FormItem возвращает status='', вне FormItem status равен undefined.
Вложенный Item читает собственное состояние. Label/extra читают внешний контекст,
поскольку status provider окружает только controls. Вложенный Form сбрасывает
status в undefined и сохраняет errors/warnings ближайшего внешнего Item, как source.
InputOTP учитывает свой status, сохраняя родительские сообщения. Hook не меняет
value binding, ref или фокус control и работает при SSR.
Сверка: [14 исходных состояний](../../../tests/browser/fixtures/ant-design-form-use-status-reference.json),
[браузер](../../../tests/browser/form-use-status.spec.ts),
[публичные типы и SSR](../../../tests/package/form-use-status.ssr.test.ts), `?fixture=form-use-status`.

`FormItem.noStyle` убирает layout, label, help и extra, сохраняя field binding,
правила, ref и reset. Ошибки и предупреждения передаются ближайшему FormItem
с layout; help=false отключает эту передачу. Hidden сохраняет собственную
скрытую обёртку и при noStyle=true. Без оформленного родителя сообщения остаются
в metadata и useFormItemStatus, отдельного списка в DOM нет.

Родитель показывает собственные сообщения, затем сообщения noStyle-полей в порядке
первых metadata events. Одинаковые имена объединяются; строки FormList сохраняют
свои сообщения при перестановке. Статус и useFormItemStatus родителя описывают
только его собственное поле, как upstream. NoStyle наследует visual status родителя,
если у него нет своего статуса, errors/warnings, pending validation или touched.
Reset пересоздаёт control; прежние native focus/selection contracts сохраняются.

Две ошибки 6.6.8 не повторены: описание noStyle-control связано с реальным списком
родителя, а переключение noStyle/help и удаление поля сразу обновляют этот список.
Игнорируемые собственные help/extra не оставляют висячих aria-describedby.
Исходные наблюдения сохранены в
[20 raw-сценариях и transitions](../../../tests/browser/fixtures/ant-design-form-no-style-reference.json).
Проверки: [сбор сообщений](../../../src/lib/form-no-style.engine.test.ts),
[браузер и lifecycle](../../../tests/browser/form-no-style.spec.ts),
[публичный пакет и SSR](../../../tests/package/form-no-style.ssr.test.ts), `?fixture=form-no-style`.

`Form.colon`, `labelAlign` и `labelWrap` наследуют defaults из `ConfigProvider.form`.
При отсутствии настройки colon включён, labelAlign равен right, labelWrap — false.
Локальные FormItem.colon/labelAlign имеют приоритет над Form; true включает colon
и поверх Form.colon=false. Вертикальный layout сохраняет скрытый CSS colon.
Если colon добавляется, последний `:` или `：` с пробелами удаляется из текста
подписи, а исходный title сохраняется. При colon=false текст владельца остаётся целиком.
LabelWrap включает перенос в доступной ширине подписи; labelAlign использует
исходные логические start/end, включая RTL.

`FormConfig` содержит эти поля и requiredMark. Undefined record наследуется от внешнего
ConfigProvider, любой объект, включая {}, заменяет его целиком. Ближайший Form
применяет собственные props и config; вложенный Form сбрасывает настройки внешнего
Form к своим defaults. Изменения сохраняют control, focus/selection и metadata.
Сверка: [32 эталона](../../../tests/browser/fixtures/ant-design-form-labels-reference.json),
[браузер](../../../tests/browser/form-labels.spec.ts),
[публичные типы и SSR](../../../tests/package/form-labels.ssr.test.ts), `?fixture=form-labels`.

`Form.labelCol`/`wrapperCol` и одноимённые props FormItem принимают настройки Col:
span/offset/order/push/pull/flex, responsive размеры, class и строковый style.
Объект FormItem заменяет соответствующий объект Form целиком; {} сбрасывает его.
Внутренние Row/Col используют существующий Grid. Колонки сбрасываются для FormItem
внутри controls, остальные настройки и модель остаются реактивными. Локальные
колонки вложенного Item применяются заново; вложенный Form использует свои defaults.
Переключения сохраняют control, values/metadata и focus/selection.
Label принимает RenderEmptyContent; выравнивание null описано ниже.
Проверены приоритеты, сбросы, стили, скрытие span=0, RTL, три layouts и границы
576/768/992px: [42 эталона](../../../tests/browser/fixtures/ant-design-form-columns-reference.json),
[браузер](../../../tests/browser/form-columns.spec.ts),
[публичные типы и SSR](../../../tests/package/form-columns.ssr.test.ts), `?fixture=form-columns`.

`FormItem.label` можно опустить. Undefined, false и пустая строка не создают label;
строка из пробелов сохраняет контейнер, как upstream. Null также убирает label,
но добавляет wrapper offset из Form.labelCol для span меньше 24, включая 0.
Явные local labelCol/wrapperCol, даже {}, отключают этот расчёт. Существующий
offset, включая 0 и undefined, не заменяется; responsive offsets независимы.
Если видимой подписи нет, задайте control aria-label или aria-labelledby.
Вставка и удаление подписи сохраняют input, metadata, value, focus/selection,
native required и validation.

У 6.6.8 есть две ошибки расчёта null-label offset: числовой responsive label span
игнорируется, а числовой wrapper span может потеряться. Они сохранены в
[42 raw-эталонах](../../../tests/browser/fixtures/ant-design-form-label-presence-reference.json).
В Svelte числовой shorthand сохраняет span/offset и совпадает с эквивалентными
исходными настройками `{ span }`. Проверки: [engine](../../../src/lib/form-columns.engine.test.ts),
[браузер](../../../tests/browser/form-label-presence.spec.ts),
[публичные типы и SSR](../../../tests/package/form-label-presence.ssr.test.ts),
`?fixture=form-label-presence`.

Label также принимает числа, вложенные массивы и Svelte snippets. Числовой 0
отображается; true, пустой массив и пустой opaque snippet сохраняют контейнер.
Colon удаляется только из строкового label, title также задаётся только для строки.
RequiredMark snippet получает исходный content после обработки colon и required;
существующие строковые snippets остаются типосовместимыми для строковых label.
При новых типах содержимого renderer принимает RenderEmptyContent.
ResetFields пересоздаёт content подписи вместе с выбранным control, сбрасывая
локальное состояние вложенных компонентов, как upstream.

RadioGroup, CheckboxGroup, InputOTP, Slider и стандартный trigger ColorPicker
получают доступное имя из rich label через aria-labelledby. Snippet обновляет имя без замены
controls; явные aria-label/aria-labelledby и handle labels сохраняют приоритет.
Сверка: [42 эталона и reset](../../../tests/browser/fixtures/ant-design-form-rich-labels-reference.json),
[браузер](../../../tests/browser/form-rich-labels.spec.ts),
[публичные типы и SSR](../../../tests/package/form-rich-labels.ssr.test.ts), `?fixture=form-rich-labels`.

`Form.requiredMark` наследует ConfigProvider.form.requiredMark, затем true.
False скрывает звёздочку, 'optional' помечает необязательные поля, Svelte snippet
получает `(label, { required })` и целиком заменяет содержимое label. Label передаётся
после обработки colon; title и native association сохраняются. Это только
оформление: required controls, правила validation и FormData не меняются.
Настройки ближайшего Form сбрасывают внешний Form, сохраняя provider defaults.
Текст optional берётся из Locale.Form.optional: ruRU — «(необязательно)»,
enUS — «(optional)». Эта группа заменяется целиком вложенным locale.Form;
пустая строка и отсутствующий optional используют английский fallback, как в upstream.
Сверка: [18 эталонов](../../../tests/browser/fixtures/ant-design-form-required-mark-reference.json),
[браузер](../../../tests/browser/form-required-mark.spec.ts),
[публичные типы и SSR](../../../tests/package/form-required-mark.ssr.test.ts),
`?fixture=form-required-mark`.

`FormItem.tooltip` принимает текст, число, массив, Svelte snippet или Tooltip options.
Form.tooltip и ConfigProvider.form.tooltip задают defaults; сами по себе они не
показывают значок. Options объединяются по свойствам: config → Form → Item.
Пустой объект Item включает унаследованный title; undefined/null/false/'' убирают
значок. Вложенный Form сбрасывает внешние локальные options к props/config.
Icon задаётся snippet; без него используется children, затем QuestionCircleOutlined.
При custom requiredMark renderer получает составную подпись вместе с подсказкой.

Сохранены исходные отступы, hover/click settings и tabindex=-1 значка: Tab ведёт к
control, клик по значку не фокусирует поле. Popup по умолчанию находится в body,
getPopupContainer сохраняет local/global приоритет. Обновления сохраняют control,
focus/selection, metadata и native FormData; общие native Tooltip contracts сохраняются.
Две неточности 6.6.8 не повторены: массивы выводятся как содержимое, а декоративный
SVG не добавляет «question-circle» к доступному имени поля. Raw source и эквивалентный
title-array сохранены в [31 эталоне и наблюдениях](../../../tests/browser/fixtures/ant-design-form-tooltip-reference.json).
Для RTL матрица использует одинаковый DOM dir; raw замер только с ConfigProvider.direction
также сохранён. SVG взят из закреплённого UMD, [лицензия Ant Design Icons](../../../src/lib/vendor/LICENSE.ant-design-icons).
Проверки: [нормализация](../../../src/lib/form-tooltip.engine.test.ts),
[браузер](../../../tests/browser/form-tooltip.spec.ts),
[публичные типы и SSR](../../../tests/package/form-tooltip.ssr.test.ts), `?fixture=form-tooltip`.

Значением владеет модель: обновляйте его явно через `setFieldValue` или
`setFieldsValue`. `FormItem.name` принимает буквальный string/number либо массив
сегментов: `['users', 0, 'name']`. Строка `"user.name"` остаётся отдельным ключом.
Поля могут отсутствовать в initialValues; числовой сегмент отсутствующего
контейнера создаёт массив, строковый `"0"` — объект. Native name вложенного control
собирается через `_`; при необходимости задайте ему собственный name.
Состояние `values` и ошибки предназначены для чтения.
Модель можно хранить в `$state` и заменять во время жизни Form; регистрация полей
переключается на новый экземпляр, поздние проверки прежней модели изолированы.

`FormItem` без name служит строкой layout: label, help/extra, колонки и настройки
Form сохраняются, но rules/initialValue не регистрируются в модели. Required управляет отметкой
подписи; required/name/id/ARIA самого control задаёт его владелец. Для связи подписи
используйте FormItem.htmlFor вместе с id control либо его явное доступное имя.
В этом режиме getFieldsValue/getFieldInstance не получают binding строки,
а reset модели сохраняет локальные черновик, DOM, фокус и выделение control.
При переходе между name и его отсутствием control пересоздаётся, как в исходнике;
переход между двумя заданными именами сохраняет прежний native lifecycle.
Согласованные Svelte id/name/FormData и label association именованных полей сохранены.
Сверка: [восемь эталонов и переходы](../../../tests/browser/fixtures/ant-design-form-nameless-reference.json),
[браузер](../../../tests/browser/form-nameless.spec.ts),
[публичные типы и SSR](../../../tests/package/form-nameless.ssr.test.ts), `?fixture=form-nameless`.

`FormItem.initialValue` заполняет отсутствующее значение перед render control,
включая SSR. Значение модели приоритетнее, в том числе null, false, 0 и '';
undefined позволяет применить local default. Поздний mount сохраняет уже записанное
значение. Начальные значения не меняют touched, но участвуют в dirty validation.
Привязка value/onValueChange к модели остаётся явной.

Изменение initialValue не перезаписывает текущий draft. Reset использует текущий prop,
при этом исходное initialValues модели имеет приоритет по точному пути. Plain containers
копируются, Date/Dayjs и другие непрозрачные значения сохраняют identity.
Если несколько bindings задают initialValue одному пути, первый mount заполняет store,
а reset не выбирает между конфликтующими defaults. При перекрывающихся parent/child
путях defaults следуют порядку mount, как source; порядок проекции values/refs сохранён.

В FormList задавайте начальный массив через initialValue списка или initialValues модели.
Локальный initialValue поля списка применяется при создании control, но не восстанавливается
при reset только этого поля. Полный reset списка пересоздаёт строки и применяет defaults
заново. Намеренно пустое значение и пропущенный ключ различаются как в модели.
Сверка: [22 случая и lifecycle](../../../tests/browser/fixtures/ant-design-form-initial-reference.json),
[браузер](../../../tests/browser/form-initial.spec.ts),
[модель](../../../src/lib/form-initial-value.test.ts),
[публичные типы и SSR](../../../tests/package/form-initial.ssr.test.ts), `?fixture=form-initial`.

`theme.components.Form` настраивает Form и каждый FormItem: цвет и размер подписи,
required mark, высоту, отступы colon и полей, vertical padding/margin.
Поддержаны aliases/algorithms, custom cssVar prefix и вложенные темы. LabelHeight
также задаёт vertical height, пока не передан отдельный verticalLabelHeight.
Внутренний Row сохраняет общий alias scope исходных Row/Col, а собственные Form
tokens наследуются. Локальный style относится к нативному form; значения,
validation, submit/reset, фокус и native attributes сохраняются при смене темы.
Сверка с Ant Design — [form-theme](../../../tests/browser/form-theme.spec.ts),
`?fixture=form-theme`. Для inline `inlineItemMarginBottom` задаёт нижний отступ,
общий margin — промежуток между полями; compact и нулевые значения поддержаны.
Inline, локальные overrides и мобильный перенос проверены на 36 случаях LTR/RTL
по [эталонным метрикам](../../../tests/browser/fixtures/ant-design-form-layout-reference.json):
[браузер](../../../tests/browser/form-layout.spec.ts),
[SSR и публичные props](../../../tests/package/form-layout.ssr.test.ts), `?fixture=form-layout`.
Component=false по-прежнему передаёт контекст без native form и layout-wrapper;
сам по себе контекст не создаёт flex-контейнер.

`FormItem.extra` задаёт постоянное пояснение, которое показывается вместе с
errors/warnings. Поддержаны строки, числа, массивы и Svelte snippets; 0 сохраняется.
Null/undefined/false/пустая строка убирают пояснение. True, пустой массив и opaque
snippet сохраняют контейнер, как текущая проверка renderability upstream.
Extra получает собственный id и добавляется к aria-describedby после сообщений;
существующие внешние описания встроенного control сохраняются.
Обновление extra или snippet сохраняет input, значение, фокус и выделение.
ResetFields пересоздаёт content extra вместе с label, tooltip и control выбранного
поля. Локальное состояние snippet сбрасывается; соседние поля сохраняют свои
компоненты, значения, фокус и выделение. Выборочный, повторный и полный reset
сверены с [эталоном](../../../tests/browser/fixtures/ant-design-form-explanation-reset-reference.json):
[браузер](../../../tests/browser/form-explanation-reset.spec.ts),
[SSR](../../../tests/package/form-explanation-reset.ssr.test.ts), `?fixture=form-explanation-reset`.
Прежний приоритет help сохранён: errors/warnings заменяют help, extra остаётся.
Четырнадцать случаев сверены с
[upstream](../../../tests/browser/fixtures/ant-design-form-extra-reference.json):
[браузер](../../../tests/browser/form-extra.spec.ts),
[SSR](../../../tests/package/form-extra.ssr.test.ts), `?fixture=form-extra`.

Controls внутри label, extra и tooltip подписи наследуют disabled/size/variant Form,
но не binding текущего поля: id/name, required, status, ARIA ошибок и ref не копируются.
Blur и ввод вспомогательного control не меняют touched/value основного поля;
getFieldInstance возвращает основной control, а FormData не получает лишние значения
под его именем. Явные props вспомогательного control сохраняются.
Сверка: [семь эталонов](../../../tests/browser/fixtures/ant-design-form-slot-context-reference.json),
[браузер](../../../tests/browser/form-slot-context.spec.ts),
[SSR](../../../tests/package/form-slot-context.ssr.test.ts), `?fixture=form-slot-context`.

`FormItem.help` также принимает RenderEmptyContent: числа, вложенные массивы
и Svelte snippets. Undefined/null/false/'' скрывают пояснение; 0 отображается
и входит в aria-describedby. True и пустой массив сохраняют контейнер.
Semantic help/helpItem продолжают оформлять пояснение; reset выбранного поля
пересоздаёт его snippet, а обновление help сохраняет основной control и его фокус.
Controls внутри help изолированы от binding поля, как extra.

Сохранён прежний native приоритет: errors/warnings заменяют help. Source 6.6.8
отдаёт приоритет явно заданному help, включая false; raw наблюдения сохранены.
Help={0} входит в описание поля, как строковый '0'. Source 6.6.8 пропускает
связь для числового нуля; этот дефект не повторяется в Svelte.
Сверка: [15 эталонов и reset](../../../tests/browser/fixtures/ant-design-form-help-reference.json),
[браузер](../../../tests/browser/form-help.spec.ts),
[публичные типы и SSR](../../../tests/package/form-help.ssr.test.ts), `?fixture=form-help`.

`FormItem.hidden` скрывает весь блок поля через исходный CSS, сохраняя его control,
ref, значение, metadata и локальное состояние children. По умолчанию false.
Скрытое поле продолжает участвовать в validation, submit и native FormData;
ошибка required может блокировать отправку. Его controls исключаются из Tab
и accessibility tree; после показа доступное описание ошибки восстанавливается.
Обычное скрытие сохраняет DOM, а reset по-прежнему пересоздаёт children и ref.
Проверки: [эталон upstream](../../../tests/browser/fixtures/ant-design-form-hidden-reference.json),
[браузер](../../../tests/browser/form-hidden.spec.ts),
[SSR](../../../tests/package/form-hidden.ssr.test.ts), `?fixture=form-hidden`.

Модель хранит скаляры, вложенные plain objects, массивы и экземпляры классов.
`getFieldValue(name)` читает значение пути; `setFieldValue(name, value)` заменяет
его целиком. `setFieldsValue` рекурсивно объединяет plain objects и заменяет
массивы. `FormItem.rules` задаёт правила вложенного поля; при отсутствии локальных
rules используются прежние правила createForm верхнего уровня.
Правила модели действуют и без FormItem в DOM; локальные rules удаляются вместе
с их полем, а значение по-прежнему сохраняется.
Ошибки и touched модельных правил остаются у имени поля при переключении name.
В FormList локальная metadata следует за key строки.

`isFieldTouched(name)` учитывает также потомков пути, как upstream; строка с
точкой и числовой/строковый сегменты различаются. Пустой путь [] проверяет,
есть ли touched-поле в модели. Падение Ant Design 6.6.8 при таком запросе
сохранено в [наблюдении](../../../tests/browser/fixtures/ant-design-form-touched-paths-observation.json)
и не повторяется в Svelte. Запрос не создаёт поля и не меняет metadata.

`isFieldsTouched()` проверяет, есть ли touched-поле. `isFieldsTouched(true)`
проверяет все bindings; корни FormList сами не блокируют этот вариант проверки.
Список имён задаёт группы по префиксам: `isFieldsTouched(names, true)` требует
хотя бы одного touched-поля в каждой группе, как upstream. Это не проверка всех
потомков группы. Например, `isFieldsTouched([['user']], true)` станет true после
взаимодействия с одним полем внутри user; выбор обоих leaf paths требует оба.

В общий набор входят FormItem/FormList, поля с правилами createForm и явно
touched-поля модели. Корни initialValues без UI и правил не добавляют controls
в проверку allTouched. Прежние правила blur/submit и модели без UI сохраняются.
Пустой список имён возвращает false, а с allTouched=true — true. Вызов
`isFieldsTouched(undefined, true)` равен `isFieldsTouched(true)`; `[[]]`
выбирает модель как одну группу. Падения этих перегрузок Ant Design 6.6.8
сохранены в [raw reference](../../../tests/browser/fixtures/ant-design-form-aggregate-touched-observation.json).

`isFieldsValidating(names?)` проверяет, выполняется ли обычная validation хотя бы
одного выбранного поля. Без списка учитываются все поля модели; имена совпадают
точно, без выбора потомков. Пустой список не выбирает поля. ValidateOnly не
добавляет validating и не прерывает видимую проверку; поле без правил не получает
этот флаг. `isFieldValidating(name)` использует ту же проверку одного имени.
Группы, списки, reset/unmount и параллельные запросы сверены
[в браузере](../../../tests/browser/form-aggregate.spec.ts),
[через публичный пакет](../../../tests/package/form-aggregate.ssr.test.ts) и
[в модели](../../../src/lib/form-aggregate.test.ts).

`getFieldsValue()` возвращает проекцию известных bindings, а `getFieldsValue(true)`
без фильтра — весь текущий store, включая значения без UI. Список путей выбирает
соответствующие bindings и потомков: `getFieldsValue([['user']])` включает только
известные поля user. Если bindings под этим путём нет, читается само значение
store. Пустой список даёт `{}`, `[[]]` выбирает весь store. Строка с точкой
остаётся буквальным ключом, number/string segments различаются.
Bindings здесь — FormItem/FormList и поля с правилами createForm. Сам touched-флаг
не добавляет значение без binding в проекцию.

Фильтр передаётся вторым аргументом после списка/true либо через `{ filter }`.
Он получает FormFieldMeta с touched, validating, errors, warnings, name и validated;
для явно выбранного пути без binding приходит null. True с фильтром выбирает
bindings, а не все ключи store. Validated становится true после обычной validation
или изменения значения через setFieldsValue; validateOnly его не меняет.
Прежние touched/triggers модели и защита от устаревших результатов сохранены.

Как текущий код 6.6.8, метод проецирует поля строк FormList, затем заполняет
отсутствующий корень списка пустым массивом. Корни не передаются фильтру: даже
`getFieldsValue({ filter: () => false })` вернёт `{ people: [] }` для списка people.
Полный список со значениями без controls доступен через true без фильтра.
Это уточнение к описанию List в документации upstream подтверждено
[неизменённым UMD](../../../tests/browser/fixtures/ant-design-form-get-fields-value-observation.json).
UI-регистрации ожидают mount; при SSR полный store также читается через true.
Проверки: [браузер](../../../tests/browser/form-get-fields-value.spec.ts),
[публичный пакет](../../../tests/package/form-get-fields-value.ssr.test.ts),
[модель](../../../src/lib/form-get-fields-value.test.ts).

`setFields(entries)` применяет записи по порядку без запуска validation. Можно
передать value, errors, warnings, touched и validating; отсутствующие свойства
сохраняются. Например, для зарегистрированного поля:

```ts
form.setFields([{ name: ['user', 'name'], errors: ['Name is unavailable'], touched: true }]);
```

Пустой массив сообщений или явный undefined очищает errors/warnings. Value с
undefined записывает пустое значение; отсутствие value ничего не записывает.
Значения можно менять без UI, но metadata для пути без binding игнорируется
и не откладывается до будущего mount. Поля с правилами createForm работают также
без UI. Как в upstream, входной validated принимается, но не заменяет вычисляемый
флаг; явный validating=false делает validated=true без запуска правил.

Validation пропускает поля без rules: ручные errors/warnings/validating такого
поля сохраняются и сами по себе не блокируют validateFields/submit. Обычная
проверка поля с rules может заменить временно заданные сообщения; явный
validating заменяет её управление metadata. Для изменённого value сохранена
прежняя защита snapshot: старый validator не заменяет свежие сообщения.
Дефект 6.6.8 с поздней ошибкой для прежнего значения записан
[в raw reference](../../../tests/browser/fixtures/ant-design-form-set-fields-observation.json).
Там же сохранён undefined touched в metadata upstream; Svelte нормализует
явные undefined touched/validating в false, сохраняя булевый контракт.
Прежние правила setFieldValue/setFieldsValue/touchField и проекция errors остаются.
Проверки: [браузер](../../../tests/browser/form-set-fields.spec.ts),
[публичный пакет](../../../tests/package/form-set-fields.ssr.test.ts),
[модель](../../../src/lib/form-set-fields.test.ts).

Правила включают required, min/max/len, whitespace, pattern и синхронный либо
асинхронный `validator(value, values)`. Для строк min/max/len считают Unicode
code points, для чисел сравнивают значение, для массивов считают элементы.
Пустой массив считается пустым значением; массивы с 0 или false — непустыми.
Pattern проверяет скалярные значения; для проверки содержимого массива
используйте custom validator. Пустые необязательные значения пропускают прежние
встроенные проверки, но передаются в custom validator. Len также проверяет пустой
массив и пробелы в непустой строке; optional null/undefined/'' пропускаются.

`len` задаёт точную длину или число и имеет приоритет над min/max, включая len=0.
Pattern и custom validator продолжают применяться после успешной проверки длины.
Как и у min/max, текущий native API определяет строку, число и массив по значению;
в исходных числовых и массивных эталонах задан соответствующий type.
`whitespace: true` отклоняет непустую строку из одних пробелов, tab или newline,
сохраняя текст в модели. Пустая optional-строка допустима; required сохраняет
прежний native запрет пустых строк, пробелов и массивов. WarningOnly остаётся
неблокирующим. Сверка: [35 исходных сценариев](../../../tests/browser/fixtures/ant-design-form-constraints-reference.json),
[правила и модель](../../../src/lib/form-constraints.test.ts),
[браузер](../../../tests/browser/form-constraints.spec.ts),
[публичный пакет и SSR](../../../tests/package/form-constraints.ssr.test.ts), `?fixture=form-constraints`.

`ValidationRule.type` поддерживает string, number, integer, float, boolean, array,
object, date, regexp, method, any, enum, email, url, hex, tel и pattern;
union экспортируется как ValidationRuleType.
Явный type включает исходный выбор constraints. String проверяет длину/pattern/whitespace,
числовые типы и array — диапазон/len, date — timestamp после стандартного JS parsing.
Boolean/object/regexp/method/any не применяют range/pattern/whitespace.
RegExp принимает готовое выражение или значение, из которого можно создать RegExp;
object исключает массив, method означает функцию.

У явного string пробелы считаются содержимым, whitespace=true запрещает их отдельно.
У array диапазон проверяет и пустой массив; required запрещает его. Number считает
'' отсутствующим значением, integer/float проверяют его как неверный тип. Any
проверяет только отсутствие null/undefined при required. Custom validator заменяет
встроенные проверки явного type и получает значение после transform, до date/number
normalization. Возвращённые и преобразованные значения не заменяют store.
Правила без type сохраняют прежние native empty values и порядок constraints/validator.
Сообщения по умолчанию сохраняют native русский текст и первую ошибку правила;
общие шаблоны настраиваются через validateMessages.

Две классификации 6.6.8 исправлены: integer принимает 1e21, float его отклоняет;
source использует parseInt и ошибается на scientific notation. BigInt/Symbol
отклоняются числовыми/date правилами без исходных console/page errors.
Raw classifications и diagnostics сохранены в
[366 исходных случаях](../../../tests/browser/fixtures/ant-design-form-rule-types-reference.json).
Проверки: [правила и модель](../../../src/lib/form-rule-types.test.ts),
[браузер](../../../tests/browser/form-rule-types.spec.ts),
[публичный пакет и SSR](../../../tests/package/form-rule-types.ssr.test.ts), `?fixture=form-rule-types`.
Логика адаптирована из async-validator 6.0.0;
[MIT-лицензия](../../../src/lib/vendor/LICENSE.rc-async-validator) включена в пакет.

`type='enum'` проверяет enum через строгое сравнение без преобразования типов:
0 отличается от '0', NaN не совпадает с NaN. Массив выбора может быть readonly;
без type='enum' это свойство не добавляет constraint. Optional null/undefined
пропускаются, пустая строка проверяется как обычный элемент списка.

Pattern принимает строку или RegExp. У type='pattern' проверяется только required
и выражение; у string и implicit rules сохраняется прежний порядок constraints.
Переданный RegExp не меняет lastIndex, включая global flag. Ошибочная строка
выражения становится validation error без исходных console/page errors.

Email/hex/tel/url проверяют тип и формат, игнорируя range/pattern/whitespace.
Пределы source сохранены: email — 320 символов, tel — 32, URL — 2048; hex — 3 или
6 цифр с необязательным #. URL сохраняет схемы с //, адреса вида //example.com и www.example.com.
Четыре ошибки source исправлены: IPv6 требует скобки, порт допускает одну цифру
и проверяется стандартным URL parser. Адрес не нормализуется в store.
Raw source cases и diagnostics сохранены в
[188 исходных случаях](../../../tests/browser/fixtures/ant-design-form-rule-formats-reference.json).
Проверки: [правила](../../../src/lib/form-rule-formats.test.ts),
[браузер](../../../tests/browser/form-rule-formats.spec.ts),
[публичный пакет и SSR](../../../tests/package/form-rule-formats.ssr.test.ts), `?fixture=form-rule-formats`.
У rc-form 1.8.6 декларации уже runtime: type union содержит 15 значений без any/pattern,
pattern объявлен как RegExp. Документация Form отсылает к дополнительным типам
async-validator; неизменённый UMD принимает any/pattern и строковый pattern.
Svelte публикует проверенный runtime API; эта разница исходных типов записана в reference.

`FormRule` принимает объект ValidationRule или ValidationRuleFactory — чистую
функцию `(form) => rule`. Фабрики работают в createForm.rules и FormItem.rules.
Аргументом служит текущая native модель с getFieldValue/getFieldsValue и остальным
публичным API. Функция вычисляется заново перед каждой проверкой, до debounce;
возвращённые настройки фиксируются для этого запуска. Getters значений/errors/touched
сами по себе фабрики не запускают. IsFieldRequired и отметка required вычисляют их
отдельно, включая SSR; warningOnly не делает control обязательным.

```ts
const form = createForm({
  initialValues: { password: '', confirmation: '' },
  rules: {
    confirmation: [form => {
      const password = form.getFieldValue('password');
      return { validator: value => value === password ? undefined : 'Пароли различаются.' };
    }]
  }
});
```

Фабрика должна возвращать объект правила и не менять форму. Без ближайшего Form
локальная factory не используется для required; standalone Item сохраняет explicit
required и object rules. Исключение фабрики при validateFields отклоняет Promise
и снимает validating; следующий запрос может повторить проверку. Прежние native
validator(value, values), setters/touched, reset и правила без фабрик сохранены.
Сверка: [14 исходных состояний](../../../tests/browser/fixtures/ant-design-form-rule-factories-reference.json),
[модель и debounce](../../../src/lib/form-rule-factories.test.ts),
[браузер](../../../tests/browser/form-rule-factories.spec.ts),
[публичные типы и SSR](../../../tests/package/form-rule-factories.ssr.test.ts), `?fixture=form-rule-factories`.

`fields` задаёт правила дочерних значений при type='object' или 'array'. Каждый
ключ — буквальное имя свойства, в том числе 'a.b'; значение — объект правила
или readonly-массив объектов. DefaultField проверяет все существующие элементы
массива после fields, если родитель и explicit fields не дали ошибок. Для object
defaultField применяется к собственным ключам без переопределения в fields.
Необязательное отсутствующее родительское значение пропускает вложенную схему.
Ошибки и предупреждения записываются в родительское поле; отдельные bindings не создаются.

```ts
const form = createForm({
  initialValues: { profile: { name: '' } },
  rules: {
    profile: [{ type: 'object', fields: {
      name: { required: true, message: 'Введите имя.' }
    } }]
  }
});
```

Вложенный validator сохраняет native `(value, values)` с общим snapshot формы.
Parent transform применяется до дочерних правил и не заменяет store; схема
фиксируется перед асинхронным parent validator. ValidateFirst управляет списком
корневых правил, внутри одной схемы собираются все дочерние результаты. Вложенное
предупреждение не скрывает ошибку последующего корневого правила.
Fields сохраняет исходный порядок завершения child promises; defaultField массива —
порядок индексов. Корневой warningOnly переводит все сообщения своей схемы в warnings.

Исправлены подтверждённые ошибки source: вложенный warningOnly не блокирует submit,
defaultField проверяет существующие sparse positions и преобразованный массив,
required без type принимает числовой 0, поля читаются только из собственных данных.
Повтор пары schema/value в текущей ветви завершается ошибкой цикла; одинаковый
объект у независимых siblings допустим. Reset и устаревшие async results сохраняют
прежние guards модели. Сверка: [30 raw-состояний и diagnostics](../../../tests/browser/fixtures/ant-design-form-nested-rules-reference.json),
[правила и lifecycle](../../../src/lib/form-nested-rules.test.ts),
[браузер](../../../tests/browser/form-nested-rules.spec.ts),
[публичный пакет и SSR](../../../tests/package/form-nested-rules.ssr.test.ts), `?fixture=form-nested-rules`.

Строковые сообщения правил поддерживают `${label}`, `${name}` и параметры правила,
например `${min}` или `${enum}`. FormItem.messageVariables перекрывает эти значения
для текущего поля. Label берётся из строковой подписи, иначе из имени; name — полный
путь через точку. У вложенных правил name и параметры относятся к дочернему правилу,
label и явные messageVariables сохраняются от FormItem. Без FormItem подписью служит путь.

```svelte
<FormItem name="title" label="Заголовок"
  messageVariables={{ min: 'трёх' }}
  rules={[{ min: 3, message: '${label}: минимум ${min} символа.' }]}>
  <Input value={form.values.title}
    onValueChange={(value) => form.setFieldValue('title', value)} />
</FormItem>
```

Подстановка однократная: содержимое replacement не интерпретируется снова.
Backslash перед `${label}` сохраняет буквальный placeholder; в JS-строке его нужно
экранировать: `'\\${label}'`. Неизвестный ключ даёт текст undefined. Переменные
фиксируются до debounce/async validator; следующая проверка читает свежие props.
Это относится и к строковым результатам validator, но не к готовым errors/warnings
из setFields и не к ошибкам обработчика submit. Обычные сообщения и native defaults сохранены.

Исправлены исходные ошибки подписи имени 0, inherited constructor/toString и
родительского контекста вложенного object. Raw source behavior сохранён в
[22 исходных состояниях](../../../tests/browser/fixtures/ant-design-form-message-variables-reference.json).
Проверки: [модель и шаблоны](../../../src/lib/form-message-variables.test.ts),
[браузер](../../../tests/browser/form-message-variables.spec.ts),
[публичные типы и SSR](../../../tests/package/form-message-variables.ssr.test.ts),
`?fixture=form-message-variables`.

`Form.validateMessages` задаёт общие шаблоны required/enum/whitespace, types,
string/number/array len/min/max/range и pattern.mismatch. Те же настройки доступны
в ConfigProvider.form.validateMessages и locale.Form.defaultValidateMessages.
Rule.message приоритетнее Form, затем config и locale. Locale/config объединяют
вложенные группы; локальный Form заменяет переданную группу целиком, как source.
ConfigProvider.form сохраняет правило замены record: собственный {} или другой
form-record убирает родительские настройки Form. Отсутствующие шаблоны используют
прежние native русские сообщения; встроенные ruRU/enUS их не меняют.

```svelte
<Form {form} validateMessages={{ string: { min: '${label}: минимум ${min} символа.' } }}>
  <FormItem name="title" label="Заголовок" rules={[{ min: 3 }]}>
    <Input value={form.values.title}
      onValueChange={(value) => form.setFieldValue('title', value)} />
  </FormItem>
</Form>
```

ValidateMessage принимает строку или функцию, возвращающую строку. Шаблон
вычисляется только при ошибке соответствующего constraint. Source printf
`%s/%d/%j/%%` применяется до `${variables}`; аргументы функции/printf — путь поля,
затем соответствующие constraint values. Rule.message обрабатывает только `${}`.
Date, как source validator, использует types.date для неверной даты и number
для timestamp range; date.format/parse/invalid сохранены в типах без новых проверок.
Default перекрывает native fallback custom rejection без Error.message; готовые
строки validator и ручные ошибки metadata сохраняют прежний приоритет.

Настройки фиксируются перед debounce/async; изменение props действует при следующей
проверке и само не переписывает старые errors. Провайдер Form снимается при unmount
и замене модели. SSR не запускает validation, а standalone createForm без Form
сохраняет native defaults. Undefined вместо шаблона и исключение template callback
используют обычное сообщение без исходных console/page errors; поле остаётся invalid.
Raw failures и контексты сохранены в
[52 исходных случаях](../../../tests/browser/fixtures/ant-design-form-validate-messages-reference.json).
Проверки: [шаблоны и lifecycle](../../../src/lib/form-validate-messages.test.ts),
[браузерные scopes](../../../tests/browser/form-validate-messages.spec.ts),
[публичные типы и SSR](../../../tests/package/form-validate-messages.ssr.test.ts),
`?fixture=form-validate-messages`.

`ValidationRule.transform(value)` синхронно преобразует вход только для своего
правила, до required/min/max/pattern и validator. Другие правила получают исходное
значение. Возвращённый результат не записывается в модель, native FormData, submit payload или
reset defaults. Например, `{ transform: value => String(value).trim(), min: 3 }`
проверяет длину без крайних пробелов, сохраняя введённый текст.
Не изменяйте объект на месте: callbacks видят общий snapshot текущей проверки.
Plain containers скопированы; экземпляры классов сохраняют свою identity.

Исключение transform становится ошибкой правила: message имеет приоритет,
затем Error.message и обычный fallback; warningOnly сохраняет свой смысл.
В 6.6.8 такое исключение ошибочно даёт успешную validation. Raw наблюдение оставлено
для отдельного разбора; этот дефект не повторён. Сверка:
[15 исходных сценариев](../../../tests/browser/fixtures/ant-design-form-transform-reference.json),
[модель и правила](../../../src/lib/form-transform.test.ts),
[браузер](../../../tests/browser/form-transform.spec.ts),
[публичный пакет и SSR](../../../tests/package/form-transform.ssr.test.ts), `?fixture=form-transform`.

`FormItem.validateFirst` управляет правилами одного поля:

- `false` по умолчанию запускает правила параллельно и собирает все сообщения
  в порядке правил, независимо от порядка ответов;
- `true` проверяет последовательно и останавливается на первом сообщении;
- `"parallel"` запускает правила параллельно и возвращает первую завершившуюся
  ошибку, не ожидая остальные результаты. Если ошибок нет, проверка ждёт все
  блокирующие правила; первое предупреждение выбирается по порядку ответов.

Блокирующие правила идут перед warningOnly, как upstream; массив правил владельца
не изменяется. В последовательном режиме предупреждение останавливает оставшиеся
warning rules только после успешной проверки всех блокирующих правил.
Изменение validateFirst действует на следующий запрос без пересоздания control.
Поздние ответы после завершения проверки не меняют сообщения; reset, запись
и удаление поля сохраняют прежнюю защиту outOfDate. ValidateOnly использует
выбранный режим, сохраняя видимую metadata. Сигнатура validator(value, values),
тексты встроенных ошибок и native contracts сохранены.

В неизменённом Ant Design 6.6.8 ранний warning в parallel-режиме может разрешить
validateFields/submit до завершения блокирующего validator; поздняя ошибка теряется.
Это поведение записано в [raw reference](../../../tests/browser/fixtures/ant-design-form-validate-first-observation.json)
и не перенесено: предупреждение ждёт результат блокирующих правил.
Подтверждения: [браузер](../../../tests/browser/form-validate-first.spec.ts),
[публичный пакет](../../../tests/package/form-validate-first.ssr.test.ts),
[engine и модель](../../../src/lib/form-validate-first.test.ts).

`FormItem.validateDebounce` откладывает автоматическую validation на заданное число
миллисекунд; undefined/0 сохраняют немедленный запуск. Ожидание входит в validating.
Повторный запуск заменяет таймер, устаревшие значения не передаются validator.
Правила, validateFirst и задержка фиксируются для текущего запуска; изменения props
действуют на следующий. ValidateFields и submit обходят задержку; validateOnly
работает сразу и не отменяет ожидающую видимую проверку. Прежние blur/touched
triggers и повторная проверка touched-полей при записи сохраняются.
Reset, ручная замена value/validating и удаление поля отменяют отложенную работу.
Уже запущенные Promise сохраняют прежнюю защиту от устаревших ответов.

В Ant Design 6.6.8 таймер может запустить validator после unmount поля.
Это [наблюдение сохранено](../../../tests/browser/fixtures/ant-design-form-debounce-observation.json);
Svelte отменяет таймер и не запускает validator удалённого control. Артефакт содержит
35 состояний: calls, values, errors/warnings, touched/validating и явные проверки
с управляемым временем. Проверки: [модель](../../../src/lib/form-validate-debounce.test.ts),
[браузер](../../../tests/browser/form-validate-debounce.spec.ts),
[публичные типы и SSR](../../../tests/package/form-validate-debounce.ssr.test.ts),
`?fixture=form-validate-debounce`.

Plain objects и массивы копируются при создании модели, установке полей, в snapshot проверки
и при каждом reset. Defaults, snapshot и аргументы владельца не разделяют
изменяемые контейнеры. Значения модели изменяйте через setters.
Dayjs|null также поддержан: immutable экземпляр сохраняется без proxy, coercion
или сериализации; заменяйте его новым значением через setter.

`validateFields()` возвращает snapshot значений или отклоняется с
FormValidationError. Ошибка содержит `values`, `outOfDate` и `errorFields` с
массивами сегментов name и сообщениями errors. `getFieldError(name)` и
`getFieldsError(names?)` читают ошибки вложенных полей. Прежний `errors` сохраняет
проекцию верхнего уровня. Правило с `warningOnly: true` записывает сообщение
в warnings; оно не блокирует validateFields/submit и не делает поле обязательным.
`getFieldWarning(name)` читает предупреждения, `getFieldsError` возвращает оба
массива. При сборе всех сообщений errorFields включает также предупреждения ошибочного поля.
Новая проверка сразу очищает прежние warnings, включая ожидание async validator;
после ответа записывается новый результат. Этот lifecycle сверён с
[официальным UMD](../../../tests/browser/fixtures/ant-design-form-warning-lifecycle-observation.json).
FormItem показывает ошибки перед предупреждениями; error имеет приоритет над
warning. Предупреждение входит в доступное описание, но не выставляет aria-invalid.
Переданные в `validateFields(names)` пути выбирают проверяемые поля; snapshot
по-прежнему содержит всю модель. Upstream возвращает проекцию выбранных путей.
Устаревшие результаты не перезаписывают состояние после изменения или сброса
формы или удаления локального поля. После blur поле считается touched; изменение любого поля повторно
проверяет touched-поля, включая зависимые validators.

`validateFields(options)` и `validateFields(names, options)` принимают
`FormValidateOptions`. Все флаги по умолчанию false и могут сочетаться:

```ts
await form.validateFields([['users']], {
  recursive: true,
  dirty: true,
  validateOnly: true
});
```

`validateOnly` возвращает результат правил без изменения errors, warnings,
touched и validating. Уже показанные сообщения сохраняются; такая проверка
не делает нетронутое поле dirty. Фокус и значения controls не меняются.
`recursive` выбирает зарегистрированных потомков указанного пути, включая
само поле; пересекающиеся пути не запускают его правила повторно. Строка с
точкой остаётся буквальным именем, числовой и строковый сегменты различаются.

`dirty` выбирает touched, изменённые поля и поля, для которых уже запускалась
обычная проверка.
Как upstream, он включает поля с initialValues/initialValue, кроме undefined:
пустая строка, 0, false и null также считаются заданными начальными значениями.
`setFieldValue` делает известное поле dirty и при записи прежнего значения;
setFieldsValue — при изменении содержимого. Plain containers сравниваются по
собственным значениям, непрозрачные экземпляры — по identity. Reset очищает
историю dirty; заданные defaults продолжают участвовать в фильтрации.
Прежние правила touched модели сохраняются: запись сама не заменяет blur/submit.

Новый вызов validation помечает предыдущий Promise outOfDate, как upstream.
При этом validateOnly не отменяет видимую проверку: её собственные сообщения
и validating завершаются независимо от результата тихой проверки.
Защита snapshot после изменения, reset и удаления поля сохраняется и для validateOnly.

В Ant Design 6.6.8 вызов `validateFields(undefined, options)` игнорирует options
вопреки объявленной перегрузке. В Svelte второй аргумент применяется; наблюдение
сохранено в [raw reference](../../../tests/browser/fixtures/ant-design-form-validation-options-observation.json).
Фильтрация и параллельные запросы сверены с неизменённым UMD:
[браузер](../../../tests/browser/form-validation-options.spec.ts),
[публичный пакет](../../../tests/package/form-validation-options.ssr.test.ts) и
[модель](../../../src/lib/form-validation-options.test.ts).

`resetFields(names?)` восстанавливает начальные значения выбранных путей.
Без аргумента сбрасывается вся модель. `[]` ничего не меняет; `[[]]` восстанавливает
весь store, но не выбирает metadata именованных полей. Неизвестный путь получает
собственное значение undefined без создания binding.

Metadata выбирается точным именем: сброс `['user']` восстанавливает объект user,
но сохраняет touched/errors потомка `['user', 'name']`. Для очистки его состояния
передайте полный путь: `form.resetFields([['user', 'name']])`. Строка с точкой
и числовой/строковый сегменты различаются. Повтор одного пути не дублирует reset.

Содержимое выбранного FormItem пересоздаётся, включая локальное состояние
и cleanup компонентов. Это относится также к обычным полям при полном reset,
как гарантирует Ant Design. Соседние поля сохраняют DOM, черновики, фокус и выделение.
Для связанного native control сохраняется прежний контракт фокуса: после
пересоздания он восстанавливается, если владелец поля остался на странице
и пользователь не перевёл фокус. Это сохраняет работу с черновиком InputNumber
при программном reset; локальные элементы без field association не перехватывают фокус.
Сброс FormList пересоздаёт его строки; ключи списка сохраняются по исходным правилам.
Form initialValues имеют приоритет над текущим initialValue корневого списка.
Если несколько списков задают initialValue одного пути, reset не выбирает
произвольный default; наблюдение есть в [эталоне конфликта](../../../tests/browser/fixtures/ant-design-form-reset-conflicts-observation.json).

В неизменённом UMD 6.6.8 сброс родителя или другого typed alias может обновить
store без обновления вложенного input даже после завершения рендера. Этот дефект
сохранён в observations [raw reference](../../../tests/browser/fixtures/ant-design-form-reset-fields-observation.json);
Svelte показывает актуальное значение store. Защита от поздних результатов
validation сохраняется. Проверки: [браузер](../../../tests/browser/form-reset-fields.spec.ts),
[публичный пакет](../../../tests/package/form-reset-fields.ssr.test.ts),
[модель](../../../src/lib/form-reset-fields.test.ts).

`getFieldInstance(name)`, `focusField(name)` и `scrollToField(name, options?)`
работают с текущим UI binding. Встроенные Input, TextArea, InputNumber, Select,
Checkbox/Radio, Switch, Slider, OTP, pickers, Rate, Mentions, AutoComplete,
TreeSelect, Cascader и группы регистрируются автоматически. Когда компонент
публикует `bind:ref`, возвращается этот ref; иначе — стабильный handle с
nativeElement и поддержанными методами либо опубликованный native element.
Это Svelte refs: например, Slider фокусирует прежний native range input.

`Form.scrollToFirstError` прокручивает первую ошибку после onFinishFailed.
Настройка Form целиком заменяет ConfigProvider.form.scrollToFirstError;
undefined наследует config, false отключает прокрутку и фокус. True использует
if-needed/nearest без фокуса. Объект принимает FormScrollOptions, в том числе
block, behavior и focus:true. Прокрутка использует текущий ref поля.
Без настройки в обоих местах сохранён прежний native автофокус первой ошибки;
Ant Design в этом случае не переводит фокус. Это отличие также действует после
сброса config record через {}. Устаревшие validation, смена модели и unmount
не вызывают позднюю прокрутку, включая удаление формы в onFinishFailed.
Сверка: [15 эталонов](../../../tests/browser/fixtures/ant-design-form-scroll-first-reference.json),
[браузер](../../../tests/browser/form-scroll-first.spec.ts),
[публичные типы и SSR](../../../tests/package/form-scroll-first.ssr.test.ts), `?fixture=form-scroll-first`.

У пользовательского control исходный ref передаётся в `FormItem.controlRef`.
Он имеет приоритет над автоматической регистрацией и возвращается без обёртки.
Можно передать native element, Svelte `bind:this` с экспортированным focus
или объект с nativeElement/focus. Для native binding:

```svelte
<script lang="ts">
  import { Form, FormItem, Input, createForm } from 'antd-svelte';

  const form = createForm({ initialValues: { title: '' } });
  let controlRef = $state<HTMLInputElement>();
</script>

<Form {form}>
  <FormItem name="title" label="Title" {controlRef}>
    <Input value={form.values.title} onValueChange={(value) => form.setFieldValue('title', value)}
      bind:inputElement={controlRef} />
  </FormItem>
</Form>
<button onclick={() => form.scrollToField('title', { block: 'center', focus: true })}>
  Show title
</button>
```

До mount, после удаления и без binding getFieldInstance возвращает undefined.
Без ref фокус и прокрутка используют связанный id; для своего native markup
задайте htmlFor. Сначала ищется control внутри собственного FormItem, чтобы
соседняя форма с тем же явным id не перехватила фокус. Динамические refs, reset,
замена модели и keyed FormList обновляют регистрацию без хранения снятых controls.
GetFieldInstance — императивный запрос, не подписка на mount; generic Instance
задаёт ожидаемый вызывающей стороной тип и не выполняет runtime validation.

FocusField вызывает focus с исходным receiver. ScrollToField использует
nativeElement ref либо связанный control и по умолчанию if-needed/nearest.
Поддержаны block/inline, scrollMode, behavior auto/instant/smooth либо callback
actions, boundary element/predicate, skipOverflowHiddenElements и focus.
Callback управляет прокруткой самостоятельно; его Promise не ожидается.
Неизвестный путь ничего не делает. При SSR эти методы безопасны без UI.
CSS scroll-margin пока не участвует в расчёте: upstream дважды учитывает margins,
может обрезать control и смещает его при повторном вызове. Этот дефект и коллизии
underscore refs сохранены в [raw reference](../../../tests/browser/fixtures/ant-design-form-dom-observation.json),
в Svelte они не повторяются. Проверки:
[браузер](../../../tests/browser/form-dom.spec.ts),
[публичный пакет](../../../tests/package/form-dom.ssr.test.ts),
[регистрация модели](../../../src/lib/form-dom.test.ts).

`form.submit(onFinish)` блокирует повторную отправку и возвращает результат
`success`, `invalid`, `failed` или `busy`. Изменение значений во время проверки
делает результат устаревшим и предотвращает вызов onFinish. Уже начавшуюся
операцию onFinish модель не отменяет.

Компонент Form вызывает onFinish только после успешной проверки. Ошибки полей
передаются в onFinishFailed, ошибки onFinish — в onError и показываются общим
сообщением. Нативная браузерная проверка отключена через novalidate, чтобы
использовать единый набор правил. Серверная проверка данных остаётся
ответственностью приложения.

Семантика путей и merge сверена с неизменённым UMD Ant Design 6.6.8 и
@rc-component/form 1.8.6. Svelte-модель сохраняет прежнюю изоляцию копий;
upstream передаёт значения store без такой гарантии. Подтверждения —
[browser и raw reference](../../../tests/browser/form-paths.spec.ts),
[SSR](../../../tests/package/form-paths.ssr.test.ts) и [модель](../../../src/lib/form.model.test.ts).
Полный validation API, dependencies, field adapters и остальные
настройки Form ещё не перенесены; наличие методов чтения не означает полного RcForm API.

## FormList

`FormList` — Svelte-эквивалент Form.List. Он читает массив ближайшего Form,
не добавляет DOM-обёртку и передаёт в children поля, операции и ошибки списка:

```svelte
<Form {form}>
  <FormList name="users">
    {#snippet children(fields, { add, remove }, meta)}
      {#each fields as field (field.key)}
        <FormItem name={[field.name, 'name']} label="Имя" rules={[{ required: true }]}>
          <Input
            value={form.getFieldValue(['users', field.name, 'name']) ?? ''}
            onValueChange={(value) => form.setFieldValue(['users', field.name, 'name'], value)}
          />
        </FormItem>
        <button type="button" onclick={() => remove(field.name)}>Удалить</button>
      {/each}
      <div class="ant-form-item">
        <FormErrorList errors={meta.errors} warnings={meta.warnings} />
      </div>
      <button type="button" onclick={() => add({ name: '' })}>Добавить</button>
    {/snippet}
  </FormList>
</Form>
```

Модель примера создаётся как
`createForm<{ users: { name: string }[] }>({ initialValues: { users: [] } })`.
Импортируйте FormList вместе с Form, FormItem, FormErrorList, Input и createForm из пакета.
`field.name` — текущий индекс, `field.key` — устойчивый ключ строки. Используйте
key в each: при move и remove соседних строк сохраняются controls, фокус,
выделение и ошибки оставшихся строк. Новые строки получают новые ключи.
Внешняя замена массива сохраняет ключи по индексам, как upstream.
Для sparse arrays fields содержит только существующие позиции с исходными
индексами name: это сохраняет строки React map при рендеринге Svelte each.
Замена массива с пропущенными позициями сверена с
[raw reference](../../../tests/browser/fixtures/ant-design-form-sparse-list-observation.json).
Там же сохранено наблюдение: merge initialValues upstream превращает пустые
позиции массива объектов в undefined; createForm сохраняет holes. Это отличие
инициализации модели остаётся для общего аудита Form.
В отдельном замере nested setFieldValue увеличивает массив в store upstream,
но List не показывает новую строку до следующей операции; Svelte обновляет её сразу.

Имена FormItem и вложенного FormList считаются от ближайшего списка;
setFieldValue/getFieldValue используют полный путь от корня Form. Вложенный
независимый Form сбрасывает prefix. Начальный массив из Form имеет приоритет,
включая []; отсутствующий массив может получить initialValue списка. При reset
используется Form initialValues либо текущий initialValue списка; контролы строк
создаются заново и сохраняют регистрацию для последующей validation и submit.
Скрытие списка сохраняет его значения, но снимает локальные правила.

Add принимает defaultValue и insertIndex, без индекса добавляет в конец;
неверный индекс вставки также добавляет в конец. Remove принимает индекс или
массив индексов; повторы и отсутствующие индексы не удаляют лишние строки.
Move переносит строку и её key. Rules списка принимают только custom validators
с прежней Svelte-сигнатурой `(value, values)`. Ошибки приходят в meta.errors,
предупреждения warningOnly — в meta.warnings;
после remove/reset поздняя validation не возвращает ошибки удалённых controls.
`prefixCls` списка задаёт префикс вложенного FormErrorList; empty/undefined
наследуют ConfigProvider (по умолчанию ant-form).
Он не меняет prefix соседних FormItem.
WarningOnly сверено с официальным UMD: [браузерные проверки и raw reference](../../../tests/browser/form-warnings.spec.ts),
[SSR](../../../tests/package/form-warnings.ssr.test.ts) и [модель](../../../src/lib/form-warnings.test.ts).

Отличие от Ant Design 6.6.8: move с дробным индексом игнорируется. В исходном
UMD `move(0.5, 1)` теряет первую строку и вставляет undefined; этот дефект
сохранён как отдельное наблюдение в [raw reference](../../../tests/browser/fixtures/ant-design-form-list-observation.json).
Остальные операции сверены [в браузере](../../../tests/browser/form-list.spec.ts),
вложенность и initialValue — также [через SSR](../../../tests/package/form-list.ssr.test.ts).
Логика ключей адаптирована из @rc-component/form 1.8.6; [MIT-лицензия](../../../src/lib/vendor/LICENSE.rc-form)
включена в пакет. React runtime не добавлен.

## FormErrorList

`FormErrorList` — Svelte-эквивалент Form.ErrorList. Передавайте errors и warnings
из FormList meta, как в примере выше. Класс ant-form-item у обёртки сохраняет
исходные explain styles; при custom prefix используется соответствующий
`<prefix>-item`. Компонент не регистрирует поле и не меняет значения формы.

Ошибки идут перед предупреждениями. Сообщения принимают строки, числа, вложенные
массивы и snippets; ReactNode заменён обычным Svelte content.
Любой help, кроме null/undefined, заменяет оба списка, включая false, 0 и ''.
`helpStatus` задаёт его status class, fieldId — id `${fieldId}_help`,
class добавляет класс контейнера. Без сообщений контейнер отсутствует.

Очистка errors/warnings задерживается на 10 ms, чтобы короткий промежуточный
пустой список не скрывал сообщения. Появление и удаление сохраняют opacity/height
motion с токенами Form, CSS easing и deadline 500 ms; motion=false и reduced motion
отключают анимацию. `onVisibleChanged` вызывается после появления/скрытия,
не вызывается для исходного пустого списка и после unmount.
Повторная вставка во время скрытия отменяет прежний callback.

Порядок leaving rows сверён с @rc-component/motion 1.3.3;
[MIT-лицензия](../../../src/lib/vendor/LICENSE.rc-motion) включена в пакет.
Повторяющиеся сообщения получают отдельные ключи, обычный текст сохраняет DOM
при перестановке. Подтверждённый дефект Ant Design 6.6.8 с текстом toString
не воспроизводится: после обновления upstream оставляет 7 сообщений вместо
переданных 5. Входы и результат сохранены в
[raw reference](../../../tests/browser/fixtures/ant-design-form-error-list-observation.json).

Темы, приоритет help, snippets, callbacks, отмена при unmount и изолированный
prefix проверяются [в браузере](../../../tests/browser/form-error-list.spec.ts),
рендер без таймеров — [через SSR](../../../tests/package/form-error-list.ssr.test.ts).
Help/helpItem наследуют classNames/styles Form; local styles и native motion
сохраняют прежние приоритеты. Prefix списка приоритетнее styled Item; без списка
используется styled Item через noStyle, затем ConfigProvider.
