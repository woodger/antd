# Tour

Tour проводит пользователя по шагам интерфейса. Props и snippets описаны
в [tour.types.ts](../../../src/lib/tour.types.ts).

```svelte
<script lang="ts">
  import { Tour } from '@woodger/antd';

  let open = $state(false);
  let target = $state<HTMLButtonElement>();
</script>

<button type="button" bind:this={target} onclick={() => { open = true; }}>
  Начать знакомство
</button>
<Tour {open} onClose={() => { open = false; }}
  steps={[{ title: 'Первый шаг', description: 'Описание', target: () => target }]} />
```

`Open` и `current` — controlled props: компонент сообщает изменения через
callbacks, владелец может их отклонить. Без open/defaultOpen непустой Tour открыт.
Default props читаются при создании; повторное открытие сбрасывает uncontrolled
current в ноль. Индекс вне steps закрывает Tour. OnChange получает новый индекс;
штатное завершение вызывает onClose, onFinish, затем nextButtonProps.onClick.
Поля шага заменяют общие panel callbacks/metadata, даже если явно равны undefined.

Target принимает DOM-элемент, getter либо null; getter вызывается только в браузере.
Без цели default placement — center, стрелка скрыта. Есть 12 направлений,
pointAtCenter, flip/shift, сохранение исходного flip cache и onPopupAlign.
Gap по умолчанию равен 6px по обеим осям, radius — 2px. Mask поддерживает color/style;
disabledInteraction блокирует pointer в подсвеченной области. Внешний click не
закрывает Tour. Mask=false с целью оставляет страницу интерактивной, но body scroll
по-прежнему блокируется; без цели прозрачный слой перехватывает pointer, как upstream.

Автопрокрутка зависит от raw open: одного defaultOpen недостаточно. Обычный шаг
получает собственный scrollIntoViewOptions={block:'center',inline:'center'} до
fallback к корневой настройке. Явный false передаётся native scrollIntoView(false),
а не отключает прокрутку. Animated и builtinPlacements принимаются в типах, но
Ant Design принудительно включает placeholder animation и подставляет свои placements.

Title/description/cover и подписи кнопок принимают текст, массивы и Svelte snippets.
ActionsRender получает исходные actions как snippet и current/total;
indicatorsRender — current/total. Step.renderPanel заменяет всю панель. Собственный
renderPanel=undefined выбирает базовую rc-tour панель с native Prev/Next/Finish.
Стабильный description snippet сохраняет native input draft при смене шагов.

ConfigProvider.tour задаёт class/style, closeIcon и semantic slots/callbacks.
Callback получает raw props с объединёнными steps и primary-классами. Root style
и styles.root относятся к маске; step styles/classNames целиком заменяют panel
slots. Локальные слои имеют приоритет. Locale.tour и исходный Tour alias задают
подписи кнопок; локальный Tour перекрывает tour. Global.close задаёт имя закрытия.
Темы light/dark/compact и RTL config сохраняются в portal. Физическое направление
текста наследуется от фактического контейнера: body остаётся LTR при RTL config,
как в React-эталоне; класс ant-tour-rtl и контекст кнопок при этом сохраняются.

Непустой prefixCls задаёт классы Tour; empty/undefined наследуют ConfigProvider.
Панель, маска, placeholder, primary state, placements и стрелки используют один
resolved prefix. Button namespace и private Tooltip variables следуют общему
prefix отдельно от local Tour; canonical tokens/markers не переименовываются.
Scoped template повторяет 61 source CSS rule. Смена prefix сохраняет текущий
шаг, открытый popup, draft/focus/selection и порядок callbacks.

При общем local class=guide вложенный Source provider с другим global prefix
теряет margins кнопок из-за CSS-кэша первого namespace. Raw результаты сохранены;
freshNested измерен с новым public local class. Svelte изолирует CSS по обоим
prefixes. Сверка — [UMD](../../../tests/browser/fixtures/ant-design-tour-prefix-reference.json),
[browser](../../../tests/browser/tour-prefix.spec.ts),
[SSR](../../../tests/package/tour-prefix.ssr.test.ts), `?fixture=tour-prefix`.

По умолчанию mask/placeholder/popup находятся в body. GetPopupContainer=false
оставляет их inline без body lock; функция задаёт собственный контейнер. Как в
rc-tour, mask/placeholder вызывают getter без аргумента, popup передаёт placeholder.
Внутри native Modal/Drawer стандартный portal остаётся в dialog top layer, чтобы
сохранить интерактивность. CSS variables обновляются при смене наследуемой темы.

Tour не устанавливает autofocus/focus trap и не возвращает фокус при закрытии.
Physical Left/Right меняют шаги, кроме событий из editable controls. Escape
учитывает keyboard, closable и 200ms после IME compositionend. Все открытые Tour
реагируют на Escape, как исходный rc-tour. SSR не рендерит portal layers и не
вызывает DOM getters/snippets. При закрытии/unmount удаляются DOM, locks, listeners
и observers; отложенное выравнивание не публикует callbacks после уничтожения.

`ConfigProvider.theme.components.Tour` подготавливает девять исходных CSS tokens,
alias overrides и algorithms для default/primary panels, close, indicators и arrows.
Button сохраняет независимую тему; local step/semantic styles имеют исходный приоритет.
CSS Tour подключён перед Button, как в исходном runtime: при наведении на Next
в primary panel Button задаёт цвет текста и рамки, Tour — фон.
Обновления темы сохраняют шаг, portal DOM, focus/caret и пользовательский input.
Проверки и 15 UMD-тем — [tour-theme](../../../tests/browser/tour-theme.spec.ts), `?fixture=tour-theme`.

Runtime `zIndex` имеет приоритет над CSS token `zIndexPopup`: обычное окно без prop
сохраняет слой 1001, даже при другом token/base. Это ограничение Ant Design 6.6.8,
подтверждённое [raw observation](../../../tests/browser/fixtures/ant-design-tour-z-index-observation.json).
Для изменения фактического слоя используйте prop `zIndex`; его default сохранён.

Общий zIndex context всех popup пока не поддерживается.

Проверки: [engine](../../../src/lib/tour.engine.test.ts),
[public package SSR](../../../tests/package/tour.ssr.test.ts),
[browser](../../../tests/browser/tour.spec.ts) и `?fixture=tour`.
[61 исходное CSS-правило](../../../src/lib/vendor/tour.css) воспроизводится
[рецептом](../../../tools/ant-design-css-recipes.json). Перенесённая логика снабжена
MIT-лицензиями [rc-tour](../../../src/lib/vendor/LICENSE.rc-tour),
[rc-trigger](../../../src/lib/vendor/LICENSE.rc-trigger) и
[rc-portal](../../../src/lib/vendor/LICENSE.rc-portal). CloseOutlined из icons-svg 4.6.0
использует существующую [MIT-лицензию icons](../../../src/lib/vendor/LICENSE.ant-design-icons).

