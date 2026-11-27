# Badge

```svelte
<script lang="ts">
  import { Badge, Button } from '@woodger/antd';

  let unread = $state(120);
</script>

<Badge count={unread}>
  {#snippet children({ descriptionId })}
    <Button aria-describedby={descriptionId}>Уведомления</Button>
  {/snippet}
</Badge>
<Badge count={0} showZero size="small" />
<Badge status="processing" text="Сервис работает" />
```

Badge принимает count и необязательный children Snippet. Count может быть числом,
строкой, boolean/null или Snippet. Без children
индикатор остаётся в потоке. По умолчанию overflowCount=99, showZero=false,
dot=false и size=medium; размер не наследуется от componentSize. Значение выше
предела отображается как `99+`. Конечные отрицательные и дробные числа сохраняются;
NaN/Infinity считаются отсутствующим count. Отрицательный или нечисловой предел
заменяется на 99; конечный неотрицательный overflowCount, включая 0, допустим.
Входные значения владельца компонент не изменяет.

Строки сохраняют исходное написание, включая ведущие нули, отрицательные числа
и пробелы. Overflow использует числовое сравнение, как upstream: `'100'` даёт
`99+`, `'001'` остаётся `001`. Только точная строка `'0'` включает правило нуля;
`'00'` и `'0.0'` видимы. Числовые строки с целым значением выводятся исходными
символьными slots ScrollNumber. Пустая строка и false не
создают счётчик без text/dot; null означает отсутствие count. Boolean true
отображается как `true`, как в исходном ScrollNumber. Полные строки сохраняются
в title и доступном описании, независимо от overflow.

Целые числа и числовые строки прокручиваются по исходному алгоритму SingleNumber.
Направление следует изменению абсолютного count; переходы 9/0 и смена длины
сохраняют разряды по позиции справа. Знаки и нечисловые символы остаются статичными.
Быстрые изменения используют сохранённые previous value/count, как upstream;
неизменная цифра сама по себе не обновляет предыдущий count.
Transitionend завершает путь; если событие не пришло, работает fallback 1000 ms.
Таймер очищается при смене числового значения разряда и при его удалении. SSR выводит
начальные settled units без таймеров; browser mount не пересоздаёт их DOM.
Reduced motion отключает переходы. Прежний numeric offset без нового API меняется мгновенно;
это сохранённая native-граница внешнего ScrollNumber, независимо от движения цифр.
18 последовательностей и 68 кадров закреплены в
[UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-digit-motion-reference.json),
проверки — [engine](../../../src/lib/badge/badge-digit.engine.test.ts),
[browser](../../../tests/browser/badge-digit-motion.spec.ts) и
[SSR](../../../tests/package/badge/badge-digit-motion.ssr.test.ts), фикстура — `?fixture=badge-digit-motion`.

Появление и исчезновение следуют CSSMotion: начальный видимый count не анимируется,
последующие изменения проходят start/active, а повторный показ прерывает выход.
У индикатора на время выхода сохраняются последние видимые count, dot и title; явно заданный
title продолжает обновляться. Собственный animationend/transitionend завершает
анимацию, события внутренних цифр игнорируются. Fallback срабатывает через
1000 ms после active. Ранний end сохраняет предыдущую разметку до activated,
как в исходнике. Самостоятельный status обходит этот lifecycle.
`theme.token.motion=false` и reduced motion отключают новые анимации;
включение reduced motion завершает текущую. Удаление компонента отменяет RAF,
таймеры и слушатели. Description и descriptionId скрываются сразу, независимо
от сохраняемого декоративного индикатора. 17 последовательностей/87 кадров и SSR
закреплены в [UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-zoom-reference.json),
проверки — [browser](../../../tests/browser/badge-zoom.spec.ts) и
[SSR](../../../tests/package/badge/badge-zoom.ssr.test.ts), фикстура — `?fixture=badge-zoom`.

```svelte
<script lang="ts">
  import { Badge, type BadgeCountContext } from '@woodger/antd';
</script>

{#snippet clock(attributes: BadgeCountContext)}<span {...attributes} aria-label="Ожидает ответа">◷</span>{/snippet}
<Badge count={clock}><a href="/messages">Сообщения</a></Badge>
```

Count Snippet получает BadgeCountContext с class/style. Примените их к своему
корневому элементу; при собственном оформлении объедините классы массивом,
а CSS-строку контекста поставьте перед собственной. Это явная
замена React.cloneElement: Svelte не анализирует и не клонирует непрозрачный
Snippet. Дополнительной обёртки нет; если атрибуты не применены, автоматического
позиционирования не будет. Style содержит offset, ConfigProvider.badge.style и
Badge.style; собственный style корня имеет приоритет. Dot не заменяет готовый
count точкой, как upstream.
Пустой Snippet остаётся заданным count и не выбирает status вместо себя.
Доступность и интерактивность принадлежат Snippet; Badge не скрывает его controls
и не добавляет общее описание «Есть обновления». Смена offset/темы сохраняет его
DOM, состояние и фокус. При скрытии count содержимое сохраняется на время выхода.
Классы zoom передаются через контекст; как у исходного custom count без DOM-ref
CSSMotion, завершение использует deadline. Кеш сохраняет ссылку на Snippet,
а его собственные реактивные зависимости продолжают обновляться.

Нулевой count скрыт, пока не включён showZero. Как в Ant Design 6.6.8,
dot с count=0 скрыт, а с showZero отображается число 0; без count dot виден.
Самостоятельный status виден и без count, и при скрытом нуле. При наличии
children для статусной точки нужен dot или отображаемый count/text. Видимый
числовой count имеет приоритет над оформлением status. Строка text='0' и число
text=0 участвуют в общем правиле нуля, в том числе при ненулевом count.
Snippet считается содержимым независимо от его результата.

Поддерживаются success, processing, default, error, warning и 13 preset цветов:
blue, purple, cyan, green, magenta, pink, red, orange, yellow, volcano, geekblue,
lime, gold. Также поддерживаются CSS-цвета, CSS variables и background gradients.
У обычного индикатора custom color задаёт background; у самостоятельной статусной
точки — background и color. Preset color имеет приоритет над status.
Text принимает string/number/boolean/null или Snippet. Число не становится count
или BadgeContext.count. True учитывается как присутствующее значение, но подпись
не выводит; false/null считаются пустыми. Text=0 выводится только с showZero.
Размеры Badge — small и medium.

Offset — readonly-пара [x, y] из number|string: y задаёт margin-top,
положительный x сдвигает от логического конца наружу, в RTL направление зеркально.
Неконечная числовая координата заменяется на 0 независимо от второй координаты.
Строковый x использует parseFloat: '10.5px' даёт 10.5, '1e2' — 100; строковый y
сохраняет CSS units, включая em, %, calc и var. Строка '20' не превращается в 20px.
У обычного индикатора и самостоятельного статуса raw offset задаётся отдельными
DOM-свойствами: невалидное новое значение оставляет прежнюю координату, как React.
У custom count offset остаётся частью CSS-строки BadgeCountContext.
Компонент наследует тему и RTL; native compact сохраняет собственные размеры Badge.

Source `theme.components.Badge` применяет исходные размеры count/dot/status,
шрифты и padding. Defaults пересчитываются из global/компонентных aliases и
algorithm; тень использует colorBorderBg. Числовые indicatorZIndex/textFontWeight
сериализуются с px, как в Ant Design 6.6.8; безразмерные значения задаются строками.
Настройки доступны при SSR, custom cssVar.prefix и реактивных обновлениях.
Подробнее см. [Токены темы в ConfigProvider](../theme-context.md).

Обычный числовой/строковый индикатор скрыт от screen reader. Рядом расположен скрытый
текст с полным значением, в том числе при `99+` и dot. Children получает
BadgeContext с нормализованным числовым count и descriptionId, которым владелец может
описать кнопку, ссылку или другой control. Для строки/Snippet count остаётся
undefined; Snippet также не получает автоматического descriptionId.
При скрытии индикатора descriptionId
становится undefined. Children остаётся в DOM при изменении count: его фокус,
состояние и нативные события сохраняются. Сам Badge не создаёт остановок Tab,
live-region или автоматических объявлений. Aria-label/aria-labelledby именуют
необязательную группу; aria-describedby относится к корню. Подписи полного
значения/статусов переводятся через locale.badge с частичным наследованием.
Title по умолчанию содержит полный count; false/null убирают нативную подсказку,
строка заменяет её. Class/style относятся к корню, offset — к индикатору;
для самостоятельного статуса offset применяется к корню, как в исходнике.

ConfigProvider.badge задаёт class/style и semantic classNames/styles. Class и
rootClassName относятся к корню. ClassNames и styles принимают object либо
callback({props}) с разрешёнными size, overflowCount, dot и showZero; slots —
root и indicator. Контекстные и локальные классы объединяются. Для обычного
индикатора порядок стилей: offset → context indicator → context style → local
indicator → custom color. Border-color создаёт inset shadow ScrollNumber,
перекрывая заданный box-shadow. У самостоятельного статуса context style относится
к root, цвет status text берётся из semantic root/context style, а custom color
перекрывает оба цвета точки. Custom count получает только legacy context style
и offset через BadgeCountContext; semantic indicator к нему не применяется,
как в исходном ScrollNumber. Пустой ConfigProvider.badge заменяет родительский config.

```svelte
<Badge count="12" color="#2db7f5"
  styles={{ root: 'margin-inline:8px', indicator: 'border-color:#fff' }} />
```

Badge.style по-прежнему применяется к корню и не переносится
на обычный индикатор; для него используйте styles.indicator. Для custom count
Badge.style остаётся частью BadgeCountContext. Прежний числовой layout без нового
API сохраняется; ConfigProvider.badge, semantic props, rootClassName и custom
CSS color, новые scalar text и строковый offset включают исходный layout. Bind:nativeElement предоставляет корневой
HTMLSpanElement и очищается при unmount. Нативные span attrs/events передаются
корню; onclick имеет приоритет над React-compatible onClick. Изменение props/config
сохраняет DOM, состояние, selection и фокус. 49 вариантов и реактивные обновления
закреплены в [UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-api-reference.json),
проверки — [browser](../../../tests/browser/badge-api.spec.ts) и
[SSR](../../../tests/package/badge/badge-api.ssr.test.ts), фикстура — `?fixture=badge-api`.

46 вариантов count закреплены в
[официальных UMD-снимках](../../../tests/browser/fixtures/ant-design-badge-count-reference.json),
проверки — [browser](../../../tests/browser/badge-count.spec.ts) и
[SSR](../../../tests/package/badge/badge-count.ssr.test.ts), фикстура — `?fixture=badge-count`.
У прежнего числового режима без нового API сохранены native normalization, BadgeContext,
root style и оформление standalone/non-status text; эти границы отличаются от React.

58 вариантов text/offset/size и обратимые обновления закреплены в
[UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-values-reference.json),
проверки — [browser](../../../tests/browser/badge-values.spec.ts),
[engine](../../../src/lib/badge/badge.engine.test.ts) и
[SSR](../../../tests/package/badge/badge-values.ssr.test.ts), фикстура — `?fixture=badge-values`.

PrefixCls меняет классы Badge, status/text и zoom; пустая строка наследует
ConfigProvider.prefixCls (по умолчанию ant-badge).
Для локального префикса Badge выводит в head stylesheet из закреплённого CSS template.
Стили обновляются вместе с префиксом и удаляются при unmount; root, digits и caller
controls сохраняются. ScrollNumberPrefixCls меняет классы sup/custom count и разрядов,
иначе он наследует ConfigProvider.prefixCls (по умолчанию ant-scroll-number).
Как в исходнике, Badge CSS использует общий prefix для scroll-number:
произвольный scrollNumberPrefixCls сам по себе не создаёт CSS
для новых классов. Эта связь влияет на standalone positioning, overflow и стили
разрядов. Общий prefix применяется также к count/digit classes и CSS.
Reduced motion цифр не зависит от prefix.
31 вариант классов/styles/геометрии и шесть zoom-последовательностей/30 кадров
закреплены в [UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-prefix-reference.json)
и [motion-эталонах](../../../tests/browser/fixtures/ant-design-badge-prefix-motion-reference.json).
Проверки — [browser](../../../tests/browser/badge-prefix.spec.ts),
[motion](../../../tests/browser/badge-prefix-motion.spec.ts),
[SSR](../../../tests/package/badge/badge-prefix.ssr.test.ts) и
[motion SSR](../../../tests/package/badge/badge-prefix-motion.ssr.test.ts).
Фикстуры — `?fixture=badge-prefix` и `?fixture=badge-prefix-motion`.

Processing использует исходную
CSS-пульсацию, которая отключается при reduced motion. Экспортируются BadgeProps,
BadgeStatus, BadgeColor, BadgeSize, BadgeText, BadgeOffset, BadgeCount, BadgeCountContext,
BadgeContext, BadgeConfig, BadgeSlots, BadgeSemantic и BadgeLocale.

