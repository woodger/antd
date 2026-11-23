# ImagePreviewGroup (Image.PreviewGroup)

ImagePreviewGroup предоставляет дочерним Image общий просмотрщик. Компонент
не добавляет DOM-обёртку вокруг children.

```svelte
<script lang="ts">
  import { Image, ImagePreviewGroup } from '@woodger/antd';
</script>
<ImagePreviewGroup>
  <Image src="/first.jpg" alt="Первое изображение" width={160} />
  <Image src="/second.jpg" alt="Второе изображение" width={160} />
</ImagePreviewGroup>
```

PreviewPrefixCls группы задаёт базовый Image prefix, как в Ant Design; к нему
добавляется -preview. Пустая строка наследует ConfigProvider. Префиксы дочерних
Image независимы от группы. Смена общего или локального префикса сохраняет viewer,
выбранное изображение и transform.

Без items список строится из зарегистрированных дочерних Image с preview=true.
Порядок соответствует созданию/регистрации, сохраняется при keyed DOM reorder;
обновление src не переставляет элемент. Одинаковые src различаются по id.
Image.preview=false исключает thumbnail из этого списка. Preview.src дочернего
Image регистрируется вместо thumbnail src; его собственный preview config и
onOpenChange не управляют групповым viewer.

Items принимает строки URL или объекты с src/alt и shared native image attrs.
Явный массив, включая пустой, имеет приоритет над регистрациями. При открытии
thumbnail ищется первое совпадение preview src, при отсутствии совпадения индекс 0.
Изображения items не создают thumbnails автоматически. Fallback группы применяется
к viewer; индивидуальный Image.fallback в registration data не входит.

Preview config поддерживает open/onOpenChange, current/onChange, countRender и
общие настройки viewer/transforms/render Snippets. Current — zero-based; по
умолчанию 0. Prev/next и физические Left/Right меняют индекс в пределах списка;
в RTL порядок индексов клавиатуры не меняется, иконки/логическое положение
переключателей адаптируются. OnChange(next,previous) относится к навигации;
thumbnail напрямую задаёт внутренний индекс и не вызывает onChange. Controlled
current остаётся у владельца. Navigation фиксирует previous до вызова callbacks,
даже если onTransform изменил props владельца.

OnOpenChange(open,{current}) вызывается при пользовательском изменении видимости.
Сохранена особенность rc-image 1.10.0: при открытии thumbnail callback получает
snapshot прежнего current, а viewer использует индекс нажатого изображения.
Внешняя смена open сама не вызывает этот callback. После закрытия программное
открытие uncontrolled current начинает с 0; новое открытие thumbnail сохраняет
его выбранный индекс. Внешнее изменение controlled current сохраняет transform,
пользовательская навигация сбрасывает его без scale transition.

CountRender(current,total) получает one-based current. Render info для
imageRender/actionsRender содержит zero-based current, total и actions;
info.actions.onActive(offset) принимает относительное смещение, как runtime
rc-image, а не абсолютный индекс. Refs/DOM и управление фокусом относятся к общему
viewer. После закрытия фокус возвращается thumbnail, открывшему группу.

Удаление images/items обновляет список, не ограничивая owner current автоматически:
владелец отвечает за допустимый индекс. Даже при пустом списке viewer можно закрыть.
Ещё одна особенность rc-image 1.10.0 сохранена: preview=false у Group снимает
настройки, но само по себе не отключает открытие из дочернего Image; отключение
конкретного thumbnail задаётся Image.preview=false.

Fixture — `?fixture=image-preview-group`, галерея — `/ant-design#image`.
SSR рендерит children без DOM registration и открытого viewer. Ограничения semantic/
config/container/icons и исходных motion общие с Image и перечислены выше.

