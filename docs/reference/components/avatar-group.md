# AvatarGroup

```svelte
<script lang="ts">
  import { AvatarGroup, type AvatarGroupItem } from '@woodger/antd';

  const members: AvatarGroupItem[] = [
    { key: 'anna', label: 'Анна Новикова', text: 'АН', src: '/anna.jpg' },
    { key: 'dmitry', label: 'Дмитрий Орлов', text: 'ДО' },
    { key: 'vera', label: 'Вера Смирнова', text: 'ВС', size: 'small' }
  ];
</script>

<AvatarGroup items={members} size="large" max={{ count: 2 }}
  aria-label="Команда проекта" />
```

AvatarGroup — отдельный Svelte export для Avatar.Group. Items принимает readonly
массив AvatarGroupItem с обязательными key и label. Key — строка или число;
первый повтор ключа сохраняется, следующие исключаются до применения лимита.
Число 0 и строка '0' различаются. Порядок владельца сохраняется, входной массив
и элементы не изменяются. Внутри видимой части и открытого списка элементы
сохраняют DOM и состояние Avatar при перестановке по key.
Key/label/text используются группой и не передаются в DOM аватаров. Остальные
DOM props и callbacks элемента относятся к его Avatar. Bind:nativeElement
задаётся на отдельном Avatar; items не создаёт binding для ref каждого элемента.

Class/rootClassName/style относятся к div группы. Bind:nativeElement даёт этот div
после mount и очищается при unmount. ConfigProvider.avatar class/style относятся
к аватарам, включая счётчик и открытый overflow; к корню группы они не применяются.
PrefixCls группы меняет group/RTL/popover classes, но не передаётся участникам и
счётчику. PrefixCls участника задаётся отдельно, как у исходных дочерних Avatar.
Обводка группы применяется к аватарам с совпадающим prefix. Native wrap, overlap,
список с подписями, кнопка +N и focus recovery сохраняются. Смена prefix обновляет
класс уже открытого popup и сохраняет его содержимое; стили снимаются при unmount.

Item поддерживает props Avatar и необязательный text для строковых инициалов.
Children Snippet имеет приоритет над text; затем действуют правила Avatar:
изображение → icon → содержимое. Label даёт Avatar полное имя по умолчанию
через alt; явные alt/ARIA props сохраняются. Size/shape элемента переопределяют
значения группы, затем используются defaults Avatar/ConfigProvider. Строковые
и числовые размеры, breakpoint-карты, fallback и подгонка текста работают как у Avatar.

Max.count ограничивает число видимых участников, а кнопка +N добавляется
отдельно: count=2 при пяти участниках даёт два Avatar и +3. Без лимита, при 0,
отрицательном или неконечном значении видны все. Положительная дробь усекается
до целого, но не ниже 1. При лимите не меньше числа уникальных участников
кнопка отсутствует. Max.style задаёт style Avatar внутри кнопки +N.

Без собственных triggers сохраняется нативный default hover/click.
При обновлении max кнопка и открытый список сохраняются, пока остаются
скрытые участники.

В исходнике overflow Avatar — span, которому браузер не передаёт фокус.
В Svelte сохранена нативная кнопка +N: focus trigger доступен с клавиатуры.
В raw source-замерах отдельно записан результат настоящего focus;
событие focusin отправляется отдельно для проверки обработчика Popover.

Max.popover принимает настройки текущего Svelte Popover, кроме children:
содержимое, видимость, callbacks, container getters, ARIA, classes/styles,
trigger, placement, arrow, autoAdjustOverflow и задержки
mouseEnterDelay/mouseLeaveDelay. Class/style относятся к wrapper Popover;
popupClass добавляется к group-popover class. По умолчанию используются
hover/click и top: нативная кнопка открывается кликом, Enter/Space или наведением.
Для клавиатуры при собственном trigger используйте click или focus. Popover
показывает именованный список скрытых участников с полными label; аватары
в этом списке декоративные, кроме src Snippet, сохраняющих собственную
доступность и controls; явный aria-hidden=true делает их декоративными.
Title заменяет заголовок списка, content — сам список. Наличие ключа с null,
false или undefined явно отключает соответствующий default; true оставляет
пустую секцию, 0 отображается. Snippets создаются после первого открытия,
без вызовов при SSR. Если собственного заголовка нет, сохраняется имя из locale;
иначе имя берётся из title или явных aria-label/aria-labelledby. Aria-describedby
и aria-busy передаются поверхности.

Вложенный max.popover.open — controlled prop с onOpenChange, как у исходной
группы: владелец принимает или отклоняет запрос. Без open состояние внутреннее;
defaultOpen читается один раз при создании overflow. Удаление controlled open
очищает внутреннее значение и не возвращает defaultOpen. Внешнее изменение open
не вызывает callback. Отклонённое закрытие сохраняет открытый popup и фокус;
отклонённое открытие позволяет повторить запрос следующим кликом.

```svelte
<script lang="ts">
  import { AvatarGroup } from '@woodger/antd';

  let open = $state(false);
  const members = [
    { key: 'anna', label: 'Анна', text: 'АН' },
    { key: 'vera', label: 'Вера', text: 'ВС' }
  ];
</script>

{#snippet details()}<input aria-label="Комментарий команды" value="Черновик" />{/snippet}

<AvatarGroup items={members} max={{
  count: 1,
  popover: {
    title: 'Команда',
    content: details,
    open,
    onOpenChange: next => { open = next; },
    destroyOnHidden: false
  }
}} />
```

DestroyOnHidden по умолчанию true: список и пользовательские snippets удаляются
при закрытии. False сохраняет их DOM и состояние после первого открытия;
сохраняющееся содержимое остаётся реактивным по правилам Svelte Popover.
Явный ключ destroyOnHidden=undefined снимает default группы; Popover сохраняет
содержимое. GetPopupContainer имеет те же
приоритеты и lifecycle, что у Popover; getter получает нативную кнопку +N.
Переход элемента между видимой частью и Popover создаёт новый Avatar.
Image preview внутри списка сохраняет открытый Popover: первый Escape закрывает
preview и возвращает фокус изображению, следующий — Popover с возвратом к +N.

Корень — именованная группа, собственных остановок Tab и live-region у неё нет.
Кнопка +N имеет type=button, доступное имя с полным количеством и ARIA-связь с
Popover после mount. Escape возвращает фокус кнопке. Если лимит/список убирает
кнопку или группа удалена, фокус восстанавливается на доступном соседнем control
в текущем dialog или документе. Явный выбор фокуса владельцем сохраняется.
Повторное появление overflow создаёт закрытый Popover. Кнопка раскрытия
не блокируется через componentDisabled, поскольку показывает информацию.

Подписи группы, списка и кнопки берутся из locale.avatarGroup с частичным
наследованием. Aria-label/aria-labelledby переопределяют имя группы,
aria-describedby описывает корень; id/class/style также относятся к корню.
Группа наследует темы, compact и RTL и переносит аватары на узком экране.
В native-темах сохраняются логическое перекрытие 8px и обводка под фон темы.
В source-темах Avatar groupOverlapping/groupBorderColor управляют перекрытием и
обводкой; groupSpace задаёт расстояние между строками существующего overflow-списка.
Панель Popover сбрасывает чужие alias overrides на значения provider, а скрытые
аватары получают собственные Avatar tokens.
Нативный Popover требует Popover API; собственных анимаций группа не добавляет.

Экспортируются AvatarGroupProps, AvatarGroupItem,
AvatarGroupKey, AvatarGroupMax и AvatarGroupLocale. Произвольные компоненты вместо
Avatar и настройки исходного Popover, ещё отсутствующие в Svelte Popover,
пока не перенесены: в том числе motion и полная React.memo-заморозка opaque Snippet.
Id/forceRender/fresh/zIndex передаются; forceRender прогревает также скрытый
Snippet после mount, сохраняя ленивый SSR и последующий destroy/retain lifecycle.
Точный текущий тип max.popover производен от
[PopoverProps](../../../src/lib/popover.types.ts), а не дублирует отдельный список props.
Приоритеты aliases, count/style и trigger/placement проверяются по
[20 UMD-эталонам](../../../tests/browser/fixtures/ant-design-avatar-group-max-reference.json),
[SSR](../../../tests/package/avatar-group-max.ssr.test.ts) и
[браузерным сценариям](../../../tests/browser/avatar-group-max.spec.ts).
Содержимое, controlled/default state, destroy/retain и container getters проверяются по
[33 UMD-последовательностям](../../../tests/browser/fixtures/ant-design-avatar-group-popover-reference.json),
[SSR](../../../tests/package/avatar-group-popover.ssr.test.ts) и
[browser lifecycle](../../../tests/browser/avatar-group-popover.spec.ts).

