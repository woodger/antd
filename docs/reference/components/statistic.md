# Statistic

```svelte
<Statistic title="Баланс" value="123456.789" precision={2} suffix="₽" />
```

Value — число или строка (default=0). Встроенное форматирование повторяет
Ant Design Number.tsx: группа из трёх цифр, groupSeparator="," и decimalSeparator=".".
Precision дополняет нулями или обрезает дробную часть без округления; отрицательная
precision убирает её. Длинные числовые строки не преобразуются в number.
Пустая строка и .5 превращаются в 0 и 0.5; неподдержанная запись, например
"1e6", "-" или "1.", отображается как текст. Числа с JS-научной нотацией также
не разворачиваются. Formatter(value) получает исходный value и возвращает
строку, число или Snippet; его результат заменяет встроенное форматирование.

Title/prefix/suffix принимают string/number/Snippet, null или false. Ноль
отображается, пустые scalar-значения не создают узел. Snippet считается
присутствующим даже при пустом выводе. ValueRender — Snippet<[Snippet]>:
полученный snippet выводит готовый span значения, который можно обернуть.
ClassNames/styles поддерживают root/header/title/content/value/prefix/suffix
и callback ({ props }) с default value/loading/separators. Styles передаются CSS-строками; style перекрывает styles.root,
styles.content задаёт оформление значения. Bind:nativeElement даёт HTMLDivElement.

ConfigProvider.statistic задаёт общие class/style/classNames/styles для Statistic
и StatisticTimer. Классы config и local накапливаются. Root styles применяются
в порядке config.styles.root → config.style → local styles.root → local style;
остальные slots объединяются с приоритетом local. Оба callback получают те же
props с разрешёнными value/loading/separators. Undefined наследует родительский
statistic-record, любой собственный объект, включая {}, заменяет его целиком.

```svelte
<ConfigProvider statistic={{ class: 'metric', styles: { value: 'font-weight:600' } }}>
  <Statistic title="Баланс" value={1234.5} styles={{ value: 'color:green' }} />
</ConfigProvider>
```

Реактивная смена config и callback props сохраняет DOM корня, вложенные и соседние
провайдеры изолированы. Сверка: [26 исходных случаев и 4 обновления](../../../tests/browser/fixtures/ant-design-statistic-config-reference.json),
[браузерные метрики](../../../tests/browser/statistic-config.spec.ts),
[публичные типы и SSR](../../../tests/package/statistic-config.ssr.test.ts), `?fixture=statistic-config`.
Прежние Svelte defaults, native RTL direction и доступный loading Skeleton сохранены.

Локальный `prefixCls` меняет root и имена частей Statistic/Timer; пустая строка
наследует ConfigProvider.prefixCls (по умолчанию ant-statistic). CSS variables
сохраняют namespace Statistic, marker
ограничивает динамический CSS своим корнем. Соседние default-компоненты не меняются,
включая prefix, совпадающий с ant-statistic-content или ant-statistic-css-var.
Смена prefix сохраняет DOM корня, semantic styles, темы и native compact defaults.
Сверка: [22 исходных случая и 4 смены prefix](../../../tests/browser/fixtures/ant-design-statistic-prefix-reference.json),
[браузер](../../../tests/browser/statistic-prefix.spec.ts),
[CSS boundary](../../../src/lib/statistic/statistic-prefix.test.ts),
[публичный пакет и SSR](../../../tests/package/statistic-prefix.ssr.test.ts), `?fixture=statistic-prefix`.
Общий ConfigProvider.prefixCls применяется также к Timer; локальный prefix имеет приоритет.

Loading сохраняет заголовок и заменяет content существующим Skeleton с active
и paragraph=false. Используются его доступный статус и служебные обёртки;
formatter и valueRender скрытого значения не вызываются. Statistic не добавляет
роль, tabindex или live region для обычного значения; их можно задать нативными
атрибутами. В RTL значение остаётся LTR, интервалы prefix/suffix логические.
Темы наследуют цвета; compact меняет title/content с 14/24px на 12/20px.

ConfigProvider.theme.components.Statistic задаёт titleFontSize/contentFontSize
также для обоих режимов Timer. Defaults рассчитываются из fontSize/fontSizeHeading3;
поддержаны числовой 0, строковый contentFontSize, alias tokens, глобальные
и компонентные algorithms, cssVar.prefix и вложенные providers.
Реактивная смена темы сохраняет содержимое, snippets, фокус и работу таймеров.
Переменные темы применяются перед styles.root/style; semantic styles сохраняются.
Отступ loading host берётся из собственной темы Skeleton, включая его
component aliases/algorithm; Statistic.padding не перекрывает этот отступ.
В эталоне 6.6.8 RTL class Statistic не задаёт direction в LTR-документе.
Svelte сохраняет существующий dir=rtl и LTR value; наблюдение записано в реестре.
Сверка: [официальные CSS tokens](../../../tools/fixtures/ant-design-statistic-tokens-reference.json),
[оформление normal/loading/Timer countup/countdown](../../../tests/browser/fixtures/ant-design-statistic-theme-reference.json),
[SSR](../../../tests/package/statistic-theme.ssr.test.ts) и
[browser](../../../tests/browser/statistic-theme.spec.ts), `?fixture=statistic-theme`.

Фикстура — `?fixture=statistic`. Unit/SSR/Chromium
проверяют форматирование, loading, snippets, semantic styles, темы, RTL и фокус.
Рецепт statistic воспроизводит 14 правил vendor/statistic.css из закреплённого
архива; statistic-prefix выводит те же 14 правил CSS-модулем для локального prefixCls.

StatisticTimer переносит актуальный Statistic.Timer и требует type=countdown/countup;
Остальные props
Statistic, включая loading и semantic slots, передаются показателю, но formatter
и valueRender заменяются встроенным выводом времени, как в upstream.

Value — timestamp в ms либо строка, которую принимает new Date(value).
При пропущенном value отображение использует default=0 самого Statistic,
но callbacks получают NaN от исходной отсутствующей цели, как в upstream.
SSR и первый hydration render выводят `-` без часов и callbacks. После mount
таймер отображает разницу с Date.now(), обновляясь через setInterval(1000/60).
Format по умолчанию HH:mm:ss; Y/M/D/H/m/s/S обозначают фиксированные единицы
365 дней/30 дней/день/час/минута/секунда/ms. Повтор токена дополняет нулями,
текст в квадратных скобках сохраняется буквально. Это формат длительности,
не календарный formatter и не полный API dayjs. Пропущенные крупные единицы
накапливаются в следующей: HH может превышать 24.

Отображаемая разница ограничена нулём, onChange(number) получает исходную
знаковую разницу на каждом тике. В режиме countdown onFinish вызывается один раз на первом
тике строго после цели и останавливается; на точном равенстве времени не завершает
интервал. Countup не вызывает onFinish. При смене value/type интервал перезапускается,
смена format/callbacks не требует перезапуска. Loading скрывает значение, сохраняя
работу таймера. При удалении компонента интервал очищается; поздние callbacks
отменённого или заменённого запуска игнорируются. Невалидная дата сохраняет
поведение upstream (NaN в форматировании/callback, без автоматического завершения).
Bind:nativeElement даёт корневой div Statistic. Фикстура — `?fixture=statistic-timer`.

