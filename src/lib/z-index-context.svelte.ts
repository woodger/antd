// Наследует числовой слой по дереву компонентов, в том числе после переноса DOM в портал.
// Корневая поверхность берёт слой из собственных CSS-токенов.
import { getContext, setContext } from 'svelte';
import { getInlineStyleDeclarations, type InlineStyleLayer } from './inline-style.engine';
import { useDesignTokenContext } from './theme-context.svelte';

type ReadZIndex = () => number | undefined;
const key = Symbol('ant-z-index');

export interface ZIndexLayer {
  readonly zIndex: number | undefined;
  readonly contextZIndex: number;
  readonly parentZIndex: number | undefined;
  readonly style: string | undefined;
}

/** Разрешает слой поверхности и уровень для потомков с исходными смещениями Ant Design. */
export function useZIndex(kind: 'container' | 'popup', readLocal?: ReadZIndex): ZIndexLayer {
  const readParent = getContext<ReadZIndex | undefined>(key);
  const theme = useDesignTokenContext();
  const parentZIndex = $derived(readParent?.());
  const localZIndex = $derived(readLocal?.());
  const contextZIndex = $derived.by(() => {
    if (localZIndex !== undefined) {
      return localZIndex;
    }

    if (kind === 'popup') {
      return (parentZIndex ?? 0) + 50;
    }

    // Исходный контейнер с нулевым родителем начинает от базового токена.
    return (parentZIndex || theme.state.token.zIndexPopupBase) + 100;
  });
  const zIndex = $derived(localZIndex ?? (parentZIndex === undefined ? undefined : contextZIndex));

  return {
    /** Корневая поверхность без явного слоя использует собственный CSS. */
    get zIndex() { return zIndex; },
    /** Потомки получают числовую базу, в том числе при корневом CSS-слое. */
    get contextZIndex() { return contextZIndex; },
    /** Позволяет передать уровень владельца сквозь Dropdown без собственного слоя. */
    get parentZIndex() { return parentZIndex; },
    /** Формирует inline-слой для слияния с семантическими стилями панели. */
    get style() { return zIndex === undefined ? undefined : `z-index:${zIndex}`; }
  };
}

/** Передаёт потомкам текущее значение даже при смене владельца и темы. */
export function provideZIndex(read: ReadZIndex) {
  setContext(key, read);
}

/** Извлекает целое число из CSS с учётом порядка деклараций и приоритета important. */
export function getInlineZIndex(style: InlineStyleLayer): number | undefined {
  let value: string | undefined;
  let important = false;

  for (const declaration of getInlineStyleDeclarations([style])) {
    if (declaration.property !== 'z-index' || (important && !declaration.priority)) {
      continue;
    }

    value = declaration.value;
    important = declaration.priority === 'important';
  }

  if (value === undefined || !/^[+-]?\d+$/.test(value)) {
    return undefined;
  }

  const zIndex = Number(value);
  return Number.isFinite(zIndex) ? zIndex : undefined;
}
