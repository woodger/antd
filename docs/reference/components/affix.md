# Affix

`Affix` закрепляет содержимое относительно окна либо DOM-контейнера `target`.
`offsetTop`/`offsetBottom` — числа в px; без обоих используется top=0. При
одновременном выполнении обоих условий приоритет у top. Сравнения координат
округляются как в Ant Design. `onChange(affixed)` вызывается только при
переходе между fixed и обычным потоком, после начального измерения в браузере.
Контейнер выбирается через target → ConfigProvider.getTargetContainer → window.
Функция вызывается только в браузере; общий тип GetTargetContainer экспортирован.

```svelte
<script lang="ts">
  import { Affix, Button } from '@woodger/antd-svelte';
  let container = $state<HTMLDivElement>();
</script>
<div bind:this={container} style="height:200px;overflow:auto">
  <Affix target={() => container ?? null} offsetTop={8}>
    <Button>Действие</Button>
  </Affix>
  <div style="height:600px"></div>
</div>
```

`class`/`style` и нативные div-атрибуты относятся к внешнему узлу;
`rootClassName` применяется к внутреннему узлу только при закреплении.
`bind:nativeElement` возвращает внешний div. Через `bind:this` доступны
`updatePosition()` и `updatePosition.cancel()` — отмена очередного принудительного
измерения; scroll-очередь независима. ResizeObserver следит за внешним узлом
и непосредственными DOM-детьми контента. Обработчики слушают фактический target
и снимаются при смене target/удалении; очереди и наблюдатели также очищаются.

SSR не читает target/DOM и оставляет контент в потоке. При закреплении добавляется
пустой aria-hidden placeholder исходных размеров; контент не клонируется и не
перемонтируется, поля сохраняют value, focus и участие в FormData. Affix не
создаёт интерактивной роли и не перехватывает клавиатуру. Типографика, цвета
и RTL наследуются; z-index фиксированного узла берётся из CSS-переменной.

Source theme.components.Affix задаёт zIndexPopup и alias overrides/algorithm.
Default zIndexPopup равен глобальному zIndexBase + 10; число остаётся без единиц,
включая 0. Переменные и scope применяются к закреплённому внутреннему узлу;
обычный поток сохраняет шрифт контейнера. Изменения темы сохраняют DOM, ref,
поля и focus, не вызывая повторного onChange при неизменном fixed-состоянии.
Style внешнего узла и вычисленные top/bottom/width/height сохраняют назначение.
Source aliases, scopes и geometry проверяются в `?fixture=affix-theme`.

ConfigProvider.affix задаёт class/style внешнего узла: локальные class идут
первыми, style — после контекстного. Вложенный record заменяет настройки целиком;
undefined наследует, {} очищает. Локальный prefixCls меняет fixed class и CSS
selectors, сохраняя имена variables. Пустое значение наследует ConfigProvider.prefixCls
(по умолчанию ant-affix).
Prefix/theme/config updates сохраняют wrapper, fixed content, placeholder,
draft/selection/focus и onChange; динамический stylesheet очищается при reset
и unmount. Проверки — `?fixture=affix-config`.

Сохранены ограничения upstream: горизонтальная прокрутка не компенсируется;
при custom target слушается сам контейнер, поэтому перемещение контейнера
внешней прокруткой требует явного updatePosition. Null target или полностью
нулевой скрытый root сохраняют последнее состояние до следующего измерения.
Общий ConfigProvider prefix применяется к fixed-узлу. React ref заменён Svelte bind:this,
children — Snippet без React-клонирования.

GetTargetContainer поддерживает Window/HTMLElement, как runtime context upstream.
В props Ant Design 6.6.8 дополнительно заявлен ShadowRoot, но официальный UMD
вызывает отсутствующий getBoundingClientRect в Affix и Anchor. Эта ветка исключена
из нашего типа и записана для отдельного разбора. При смене общей функции native
Affix сразу меняет target/позицию и снимает старые listeners. Исходник сохраняет
старую позицию до явного updatePosition(); raw frames и корректное состояние после
этого публичного вызова сохранены в [эталоне](../../../tests/browser/fixtures/ant-design-target-container-reference.json).
Проверки наследования, приоритетов, href updates, refs/focus и cleanup —
`?fixture=target-container`.

Фикстура — `?fixture=affix`, пример — `/ant-design#affix`. Engine/DOM-тесты
проверяют округление, очереди, смену target и очистку; SSR/Chromium — нативный
контент, placeholder, размеры, callbacks и hydration. Vendor CSS воспроизводится
рецептом affix (6 правил) из закреплённого архива. Affix-prefix извлекает те же
правила в CSS data template для локального prefixCls; проверяются SHA-256,
scoped defaults, overlapping prefixes и независимый default sibling.

