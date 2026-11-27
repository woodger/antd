# Image

Image показывает изображение и поддерживает предварительный просмотр. Для
группового просмотра используйте ImagePreviewGroup.

```svelte
<script lang="ts">
  import { Image } from '@woodger/antd';
  let open = $state(false);
</script>
<Image src="/photo.jpg" alt="Фотография" width={240}
  preview={{ open, onOpenChange: next => { open = next; } }} />
```

Src/alt/width/height и native image attrs поддержаны. Числовые размеры задаются
в px, CSS-строки сохраняются. Class/style относятся к img; rootClassName и
styles.root — к обёртке. Bind:nativeElement и bind:imageElement дают native refs.
Preview по умолчанию true; false оставляет пассивное изображение. Интерактивная
обёртка — native button вместо React div role=button, поэтому не отправляет форму.
Enter/Space открывают preview, onKeyDown доступен; pointer opening вызывается до
onClick, как upstream. Image не наследует Form/ConfigProvider control disabled.

PrefixCls задаёт локальный базовый префикс Image; пустая строка наследует общий
ConfigProvider.prefixCls. Классы миниатюры, placeholder/cover и preview используют
этот префикс; viewer по умолчанию добавляет суффикс -preview. Смена префикса
сохраняет DOM, refs, открытый viewer, масштаб и фокус. Canonical theme variables не переименовываются.

Image.previewPrefixCls задаёт полное независимое имя viewer. Undefined оставляет
производное имя; пустая строка сохраняется, как в rc-image. Настройка не меняет
классы миниатюры и игнорируется групповым viewer. Стили подключаются для обоих
namespaces. В официальном wrapper независимое имя теряет CSS; [raw замеры и отдельные
оформленные counterparts](../../../tests/browser/fixtures/ant-design-image-independent-preview-reference.json)
сохранены. Svelte подключает недостающие стили и сохраняет dialog, transform и фокус.

Fallback подставляется при ошибке исходного src; root сохраняет ant-image-error,
даже если fallback загрузился. Новый src сбрасывает ошибку. Source probe повторяет
useStatus; результаты старого src и события отсоединённого img игнорируются.
OnError/onLoad передают native event. Placeholder=true включает исходный фон img,
Snippet отображается до загрузки; без src Snippet показывается отдельно без preview.
Кешированный complete img обрабатывается после mount без зависания placeholder.

Preview config содержит src, open/onOpenChange/afterOpenChange, cover, closeIcon,
mask, focusTrap, movable, wheel, scaleStep/minScale/maxScale и onTransform.
Preview.src может отличаться от thumbnail. Open без onOpenChange остаётся под
контролем владельца; без open компонент хранит состояние сам. Программная смена
open не вызывает onOpenChange. Cover — boolean/Snippet/{coverNode,placement};
placement top/bottom/center. По runtime 6.6.8 default cover=true создаёт пустую
hover-поверхность. CloseIcon — boolean/null/Snippet; false/null скрывают кнопку.

Viewer — native dialog, SSR не открывает его. После первого открытия DOM остаётся
смонтированным. FocusTrap по умолчанию true; false допускает фокус вне viewer.
Escape закрывает верхний preview, фокус возвращается opener, scroll освобождается
при закрытии/unmount и остаётся заперт при открытом host Modal. Mask принимает
boolean/{enabled,blur,closable}; closable по умолчанию true. ClassNames.popup.root
на Image/ImagePreviewGroup и preview.zIndex применяются к viewer. AfterOpenChange
выполняется после native смены видимости; rc-motion fade timing пока отсутствует.

Default transform: x=y=rotate=0, scale=1, flipX=flipY=false. По умолчанию
minScale=1, maxScale=50, scaleStep=0.5. Toolbar zoom использует множитель 1+step;
wheel учитывает deltaY и ограничивает ratio, сохраняя точку под курсором.
Double click переключает zoom/scale=1; rotate меняется по 90°, flip инвертирует
соответствующую ось. Movable=false отключает drag/touch, wheel управляется отдельно.
Touch pinch допускает временный scale ниже min и восстанавливает его на отпускании.
Mouse rebound сохраняет source проверку изменения обеих координат.

OnTransform({transform,action}) сообщает изменения через RAF queue; close сбрасывает
transform, если он отличается от начального. Actions: zoomIn/zoomOut, rotateLeft/
rotateRight, flipX/flipY, wheel, doubleClick, move, dragRebound, touchZoom, reset/close.
ActionsRender(original,info) и imageRender(original,info) — Snippet: original можно
вызвать через @render, info содержит transform/image, а toolbar info также
current/total/actions. Reset доступен через info.actions.onReset. Native Pointer
Events/capture заменяют React window mouse/touch handlers с cleanup на unmount.

Темы, RTL, RU/EN accessible labels и reduced motion поддержаны. Рецепт image
извлекает 48 правил; progress wrapper и rc-motion исключены. Иконки перенесены из
Ant Design Icons SVG 4.6.0 с существующей MIT-лицензией. Фикстура `?fixture=image`.

ConfigProvider.theme.components.Image задаёт zIndexPopup, previewOperationSize,
previewOperationColor, previewOperationHoverColor, previewOperationColorDisabled
и progressAnimationDuration. Общая тема применяется к миниатюре и viewer, включая
ImagePreviewGroup; aliases, algorithms, cssVar prefix/key и вложенные providers
поддержаны. `styles.root` имеет приоритет над переменными миниатюры.
Смена темы сохраняет viewer, transforms, current и фокус.
ProgressAnimationDuration пока доступен только как CSS variable: placeholder.progress
и его анимация ещё не перенесены.

Просмотрщик добавляет 1 к [слою владельца](../theme-context.md#уровни-вложенных-панелей).
Собственный `preview.zIndex` задаёт слой явно, включая 0. Корневой просмотрщик
без явного значения использует `zIndexPopup`. Нативные диалоги браузер
упорядочивает в top layer.
При `preview.zIndex=0` React 6.6.8 использует CSS-токен Image. Svelte применяет 0.

Из semantic API пока перенесены styles.root у Image и classNames.popup.root у
Image/ImagePreviewGroup. Остальные slots, placeholder progress/render,
ConfigProvider.image, getContainer, icons/React info.icons wrappers и
исходные fade/appear/leave/mousePosition motion пока отсутствуют. Deprecated aliases
исключены из переноса. [Замер текущих полей оформления](../../../tests/reference/ant-design-image-current-styling-observation.json)
подтверждает styles.root и classNames.popup.root в закреплённом UMD; вложенный
preview.classNames не входит в текущий тип preview и игнорируется upstream.

