# Avatar

```svelte
<script lang="ts">
  import { Avatar, Badge, Image } from 'antd-svelte';
</script>

<Avatar src="/anna.jpg" alt="Анна Новикова">АН</Avatar>
<Avatar shape="square" size={48} alt="Дмитрий Орлов">ДО</Avatar>
<Badge count={3}><Avatar alt="Вера Смирнова" size="large">ВС</Avatar></Badge>
{#snippet photo()}<Image src="/anna.jpg" alt="Фото Анны" />{/snippet}
<Avatar src={photo} size={64} alt="Анна Новикова" />
```

Avatar отображает изображение, icon или инициалы участника. Src принимает строку
или Snippet; пустая строка и отсутствующий src выбирают fallback.
Изображение имеет приоритет над icon Snippet, затем children Snippet.
При ошибке загрузки строки src onError вызывается один раз
для текущего изображения; false сохраняет его и отменяет fallback. Остальные
результаты выбирают icon или children. Смена src/srcSet разрешает новую загрузку,
в том числе возврат к ранее ошибочному адресу. Изменение только обработчика
ошибки не повторяет загрузку. SrcSet сам по себе не включает режим изображения.
Поддерживаются нативные draggable и crossOrigin.

Src Snippet отображается напрямую, даже если он пуст, и имеет приоритет над
icon/children. Его DOM, атрибуты, события и интерактивность принадлежат вызывающему
коду: Avatar не передаёт внутрь srcSet, draggable, crossOrigin и onError.
В частности, Image сохраняет собственные fallback и preview. Изменение размера,
темы и атрибутов Avatar сохраняет состояние Snippet; смена вида src удаляет
прежнее содержимое. При SSR Snippet выводится без обращения к browser API.

Ошибка привязана к версии пары src/srcSet. Позднее событие старого изображения
игнорируется; обработчик может синхронно заменить src, и новый источник
сохраняется. После гидратации также проверяется уже завершившаяся ошибочная
загрузка, чтобы fallback работал с изображениями из SSR. Listeners удаляются
при замене изображения и unmount. Компонент не загружает изображения вручную
и не вводит таймеров или повторных сетевых запросов поверх нативного img.

Shape по умолчанию circle; доступен square. Размер наследуется от
ConfigProvider.componentSize. Именованные размеры
small/medium/large равны 24/32/40 px. Явный size переопределяет контекст;
числовой size принимает положительное конечное число, включая дробное.
Неположительное/неконечное число заменяется размером из контекста. Для числового
размера шрифт текста равен 18 px, иконки — size/2, как в исходнике.
Class/rootClassName/style относятся к корню. ConfigProvider.avatar задаёт class/style
для каждого Avatar; отсутствующий record наследуется, явный объект, включая {},
заменяет родительский целиком. Context style перекрывает числовые/адаптивные размеры,
локальный style — context style. AvatarGroup не применяет этот config к своему корню,
но его видимые, счётчик и скрытые аватары читают общий config.
Темы и RTL наследуются, native compact сохраняет собственные размеры Avatar.

Size также принимает карту `{ xs, sm, md, lg, xl, xxl, xxxl }` с числовыми значениями:
например, `<Avatar size={{ xs: 24, md: 40, xxl: 100 }}>АВ</Avatar>`.
Выбирается самый крупный совпавший breakpoint с заданным значением; пропуски и
undefined позволяют использовать меньший совпавший. Размер xxl сохраняется на
xxxl, если xxxl не задан. Если совпадений нет, inline-размеры снимаются и действуют
обычные Avatar tokens; componentSize не заменяет явно заданную карту. Значение 0
останавливает поиск, но не задаёт inline-геометрию, как upstream. Шрифт адаптивных
icon/children равен size/2; без них — 18px. Локальный style сохраняет приоритет.

Пороги берутся из source screen* tokens с исходной проверкой порядка границ.
Карта media queries фиксируется при подписке: как useBreakpoint 6.6.8, изменение
порогов темы начинает действовать после выхода из responsive mode и возврата в него.
SSR не обращается к window и оставляет карту без совпадений; после mount размеры
обновляются без пересоздания Avatar, изображения и фокусируемого владельца.
Подгонка текста пересчитывается, listeners очищаются при unmount.
Эталонные 20 вариантов и 274 набора измерений закреплены в
[UMD-снимках](../../../tests/browser/fixtures/ant-design-avatar-responsive-reference.json),
проверки — [browser](../../../tests/browser/avatar-responsive.spec.ts) и
[SSR](../../../tests/package/avatar-responsive.ssr.test.ts), фикстура — `?fixture=avatar-responsive`.

Source `theme.components.Avatar` подготавливает container/text/icon sizes по
исходным правилам, включая отдельный algorithm и aliases. При стандартном
compactAlgorithm именованные small/medium/large имеют 21/28/35px; числовой size
сохраняет собственные размеры и font-size. Локальный style остаётся последним.
Общие токены применяются также к AvatarGroup и аватарам в overflow.

Gap задаёт свободное место по краям текста, по умолчанию 4 px. Конечное
неотрицательное значение сохраняется, иначе используется 4. Длинный текст
уменьшается через transform без изменения содержимого; короткий не увеличивается.
Если gap занимает всю ширину или элемент скрыт, scale остаётся 1 до следующего
измерения. ResizeObserver следит за корнем и текстом: изменение размера,
шрифта, children и появление скрытого элемента пересчитывают масштаб. При замене
fallback или unmount observer отключается. На SSR инициалы видимы без измерения;
подгонка выполняется после mount. Собственной анимации нет.

Для строки src, icon и children Alt, aria-label или aria-labelledby задают
полное имя корню с role=img;
оно сохраняется при смене изображения на fallback. Aria-describedby описывает
этот корень. Внутренний img строки src и icon/children скрыты от screen reader,
icon/children также inert. Без имени или
с aria-hidden=true весь Avatar декоративный. Для действия оберните Avatar
нативной кнопкой/ссылкой, задайте ей имя и при необходимости скройте повторяющий
его Avatar. Без явно переданных props компонент не добавляет остановок Tab,
live-region, автоматического фокуса и root click handler. Title задаёт нативную подсказку.

HTMLAttributes, data-/aria-атрибуты и нативные события передаются корневому span.
OnClick/onclick получают нативный MouseEvent; onclick имеет приоритет. Уже
отменённый click также передаётся владельцу. Enter/Space не синтезируют click:
keyboard behavior принадлежит владельцу. Локальные dir/role имеют приоритет над
контекстом и автоматической ролью; согласованные правила именования сохраняются.
Bind:nativeElement даёт текущий span, сохраняется при обновлениях config/props/
содержимого и очищается при unmount. SSR не создаёт ref или browser resources.

Для src Snippet именованный корень имеет role=group и сохраняет доступность
вложенных изображений и controls. Без имени содержимое использует собственные
подписи. Явный aria-hidden=true скрывает такой Avatar и делает его inert.
Не оборачивайте интерактивный Snippet ещё одной кнопкой или ссылкой.
Эталонные 14 вариантов закреплены в
[UMD-снимках](../../../tests/browser/fixtures/ant-design-avatar-source-reference.json),
проверки — [browser](../../../tests/browser/avatar-source.spec.ts) и
[SSR](../../../tests/package/avatar-source.ssr.test.ts), фикстура — `?fixture=avatar-source`.

Галерея `/ant-design#avatar` переключает содержимое, форму, размер, gap и отмену
fallback. Отдельный список участников сочетает Avatar с Badge и профилем в
Drawer. Выбор фото/инициалов/ошибочного источника сохраняется после закрытия
профиля; сброс восстанавливает участников и не меняет предпросмотр. Пример
использует локальные data URL без внешней сети и persistence.

AvatarProps, AvatarShape, AvatarSize и AvatarConfig экспортируются через index.ts.
Локальный prefixCls меняет root/modifier/string classes; отсутствие и пустая строка
наследуют ConfigProvider.prefixCls (по умолчанию ant-avatar).
Имена CSS variables, Image и anticon остаются общими.
Шаблон из 24 исходных правил ограничен текущим prefix и сохраняет шрифты/aliases
соседних стандартных Avatar. Смена prefix сохраняет root, img, text fit, src Snippet,
focus и ref; stylesheet живёт вместе с экземпляром и выводится также в SSR head.
Semantic classNames/styles исходный Avatar 6.6.8 не объявляет. Config/DOM/ref проверяются по
[UMD-эталонам](../../../tests/browser/fixtures/ant-design-avatar-api-reference.json),
[browser](../../../tests/browser/avatar-api.spec.ts) и
[SSR](../../../tests/package/avatar-api.ssr.test.ts); фикстура — `?fixture=avatar-api`.
Префиксы закреплены в
[UMD-эталонах](../../../tests/browser/fixtures/ant-design-avatar-prefix-reference.json),
[browser](../../../tests/browser/avatar-prefix.spec.ts) и
[SSR](../../../tests/package/avatar-prefix.ssr.test.ts); фикстура — `?fixture=avatar-prefix`.

