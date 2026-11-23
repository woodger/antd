# Drawer

```svelte
<script lang="ts">
  import { Button, Drawer, Input } from '@woodger/antd';

  let open = $state(false);
</script>

{#snippet footer()}<Button onclick={() => { open = false; }}>Закрыть</Button>{/snippet}

<Button onclick={() => { open = true; }}>Редактировать</Button>
<Drawer bind:open title="Карточка участника" {footer}>
  <label>Имя<Input defaultValue="Анна" /></label>
</Drawer>
```

Drawer v1 — модальная панель на нативном dialog. `bind:open` передаёт запрос
видимости владельцу; без binding компонент может закрываться самостоятельно.
Начальное open=true подготавливает содержимое в SSR и открывает настоящий
модальный dialog после гидратации. Атрибут open не выводится в SSR, чтобы
избежать промежуточного немодального окна.

Title принимает строку или пассивный Snippet, children/extra/footer — Snippet.
Заголовок использует h2; интерактивные действия размещайте в extra/footer.
Без footer нижняя область отсутствует. Без title именуйте dialog через
aria-label или aria-labelledby. Внешнее aria-labelledby имеет приоритет;
aria-label заменяет автоматически созданную связь с визуальным title.
Aria-describedby связывает внешнее описание. Id/class/style относятся к
корневому dialog; дополнительные semantic classNames/styles не поддерживаются.

PrefixCls задаёт локальный namespace Drawer, его mask/panel/header/body/footer.
Пустая строка наследует ConfigProvider.prefixCls. 32 исходных CSS-правила без
motion/pure/inline/resizable/skeleton изолированы по корню; canonical variables
и приватные native dialog/size markers сохраняются. Button в extra/footer
использует собственный общий prefix. Смена namespace сохраняет открытый dialog,
panel/input DOM, draft/focus/selection, IDs, scroll lock и возврат фокуса.
Внутренние motion/backdrop механизмы используют атрибуты, не BEM-классы.

Placement — физическая сторона top/right/bottom/left, по умолчанию right.
RTL меняет направление содержимого, сохраняя выбранную сторону. Size задаёт
ширину для left/right и высоту для top/bottom: default=378px, large=736px,
положительное число в px или корректную CSS-длину, например 50% или 30rem.
Размер ограничен viewport; пустая строка и неположительное/нефинитное число
используют default. Header и footer остаются на месте, длинное body прокручивается.

Closable=false убирает кнопку закрытия. Keyboard=false отключает закрытие по
Escape. Mask принимает объект с closable (по умолчанию true) и blur (false).
Закрытие по фону требует начала и конца основного pointer-действия на фоне;
перетаскивание из панели или в панель не закрывает её. Маска всегда включена,
фон страницы остаётся inert. Drawer не наследует disabled от Form/ConfigProvider;
его поля и пользовательские кнопки получают собственный контекст.

Пользовательское закрытие сначала записывает open=false в binding, затем
вызывает onClose(Event) один раз: click для кнопки, cancel для Escape,
pointerup для фона. Callback уведомляет о запросе и не отменяет его.
Изменение open владельцем, нативный dialog.close() и удаление компонента
не вызывают onClose. Нативное закрытие синхронизирует binding; позднее событие
старого закрытия не закрывает заново открытый dialog.

При открытии фокус получает первый доступный control; без controls — сам
dialog. Нативная модальность удерживает фон inert и ограничивает Tab;
после закрытия фокус возвращается к доступному opener. Select, Tooltip и
Popover потребляют свой Escape раньше Drawer. Поддерживается стек с Modal
и другими модальными Drawer без push. Прокрутка страницы заблокирована,
пока остаётся открытый модальный Drawer или Modal.

Содержимое ленивое и после первого открытия сохраняет локальный state и
DOM-черновики в закрытом dialog. ForceRender монтирует его сразу и сохраняет
даже при destroyOnHidden. DestroyOnHidden удаляет header/body/footer после
завершения ухода панели; отключение настройки не монтирует уничтоженное
содержимое заново. Удаление Drawer уничтожает его содержимое и освобождает
модальность. Состояние, хранимое снаружи, не сбрасывается.
Сохранённые скрытые поля остаются в DOM и нативной FormData своей формы;
их таймеры и подписки продолжают работать. Для фокуса ошибки закрытую панель
сначала должен открыть владелец формы.

Панель выдвигается от выбранной стороны, маска меняет прозрачность.
При запросе закрытия dialog сохраняет модальность до завершения анимации.
Повторное открытие прерывает уход без уничтожения черновика. Reduced motion
отключает анимацию; изменение этой настройки завершает текущую анимацию.
`theme.components.Drawer` настраивает zIndexPopup, footerPaddingBlock и
footerPaddingInline, aliases и component algorithms. Пользовательский style
корневого dialog сохраняет приоритет. Title наследует цвет панели, как 6.6.8;
Button и Input внутри сохраняют собственные tokens. DraggerSize вычисляется
как в upstream, но resize-handle пока не реализован.
Обновление темы и inherit reset сохраняют модальность, DOM, draft, selection
и focus, в том числе после переноса через getContainer. Оформление по умолчанию
сохраняется. [Сверка с UMD и проверки](../theme-context.md#тема-drawer)
учитывают типографику внешнего ConfigProvider: в React она задана на статическом
host через публичный theme.useToken(), в Svelte — на DOM-контейнере provider.

Первая версия не поддерживает немодальный режим, mask=false, resizable, push,
loading/Skeleton, focusable и afterOpenChange.

GetContainer поддерживает те же DOM-узлы, DocumentFragment, selectors, функции и
false, что [Modal](modal.md#modal). Undefined наследует ConfigProvider.getPopupContainer;
Drawer передаёт ему document.body, как Ant wrapper. Getter вызывается и в закрытом
состоянии, кроме destroyOnHidden без forceRender, пока содержимое не требуется.
Смена контейнера пересоздаёт панель и отменяет прежнюю анимацию; замена функции
с тем же контейнером сохраняет DOM/state/focus. Нативные SSR, lifecycle children,
модальность и fullscreen-геометрия сохранены. Source absolute-размещение inline
Drawer при getContainer=false ещё не перенесено: false пока выбирает исходную
DOM-ветку. Эталон — @rc-component/drawer 1.4.2 и portal 2.1.3;
[LICENSE.rc-drawer](../../../src/lib/vendor/LICENSE.rc-drawer) сохранена в пакете.

