import type { Snippet } from 'svelte';
import type {
  TreeSelectConfig, TreeSelectInputContext, TreeSelectPopupAlign, TreeSelectProps,
  TreeSelectRootContext, TreeSelectSemanticInfo
} from 'antd-svelte';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;
type AlignKeys = 'popupAlign' | 'builtinPlacements';
interface Entry { code: number; caption: string; }
type CustomProps = TreeSelectProps<number, Entry, HTMLButtonElement, HTMLTextAreaElement>;
type CustomInfo = TreeSelectSemanticInfo<number, Entry, HTMLButtonElement, HTMLTextAreaElement>;

export type TreeSelectAlignTypeAssertions = [
  Assert<Equal<TreeSelectProps['popupAlign'], TreeSelectPopupAlign | undefined>>,
  Assert<Equal<TreeSelectProps['builtinPlacements'], Readonly<Record<string, TreeSelectPopupAlign>> | undefined>>,
  Assert<Equal<NonNullable<TreeSelectPopupAlign['points']>, readonly string[]>>,
  Assert<Equal<NonNullable<TreeSelectPopupAlign['offset']>[number], string | number>>,
  Assert<Equal<TreeSelectPopupAlign['htmlRegion'], 'visible' | 'scroll' | 'visibleFirst' | undefined>>,
  Assert<Equal<Extract<keyof TreeSelectPopupAlign, '_experimental'>, never>>,
  Assert<Equal<Pick<CustomInfo['props'], AlignKeys>, Pick<CustomProps, AlignKeys>>>,
  Assert<Equal<Extract<keyof TreeSelectRootContext['attributes'], AlignKeys>, never>>,
  Assert<Equal<Extract<keyof TreeSelectInputContext['attributes'], AlignKeys>, never>>
];

export const treeSelectReadonlyAlign = {
  points: ['tr', 'br'], offset: [12, '-25%'], targetOffset: ['50%', -2.5],
  overflow: { adjustX: 1, adjustY: false, shiftX: 0, shiftY: -1 },
  htmlRegion: 'visibleFirst', dynamicInset: true, autoArrow: false,
  useCssRight: true, useCssBottom: false, useCssTransform: true, ignoreShake: false
} as const satisfies TreeSelectPopupAlign;

export const treeSelectReadonlyPlacements = {
  bottomLeft: treeSelectReadonlyAlign,
  topRight: { points: ['br', 'tr'], offset: [0, -4], overflow: { adjustY: true } }
} as const satisfies Readonly<Record<string, TreeSelectPopupAlign>>;

export function treeSelectAlignCustomProps(
  root: Snippet<[TreeSelectRootContext<HTMLButtonElement>]>,
  input: Snippet<[TreeSelectInputContext<HTMLTextAreaElement>]>
) {
  return {
    value: 1, treeData: [{ code: 1, caption: 'One' }],
    popupAlign: treeSelectReadonlyAlign, builtinPlacements: treeSelectReadonlyPlacements,
    components: {
      root: { render: root, props: { type: 'button' } },
      input: { render: input, props: { rows: 2 } }
    },
    onChange(next) {
      const value: number = next;
      void value;
    },
    styles({ props }) {
      const align: TreeSelectPopupAlign | undefined = props.popupAlign;
      const placements: Readonly<Record<string, TreeSelectPopupAlign>> | undefined = props.builtinPlacements;
      const nativeRoot: HTMLButtonElement | HTMLDivElement | undefined = props.nativeElement;
      const nativeEditor: HTMLTextAreaElement | HTMLInputElement | undefined = props.inputElement;
      void align;
      void placements;
      void nativeRoot;
      void nativeEditor;
      return { popup: { root: '--align-semantic:typed' } };
    }
  } satisfies CustomProps;
}

export const treeSelectAlignProvider: TreeSelectConfig = {
  styles({ props }) {
    const align: TreeSelectPopupAlign | undefined = props.popupAlign;
    const placements: Readonly<Record<string, TreeSelectPopupAlign>> | undefined = props.builtinPlacements;
    void align;
    void placements;
    return { popup: { root: '--align-provider:typed' } };
  }
};

export function treeSelectAlignNegativeProps(map: NonNullable<TreeSelectProps['builtinPlacements']>) {
  // @ts-expect-error Private experimental API не входит в публичный TreeSelect align.
  const privateAlign: TreeSelectPopupAlign = { _experimental: { dynamicInset: true } };
  // @ts-expect-error Private поля запрещены и во вложенной placement map.
  const privateMap: TreeSelectProps = { builtinPlacements: { bottomLeft: { _experimental: {} } } };
  // @ts-expect-error Регион ограничен исходными visible/scroll/visibleFirst.
  const region: TreeSelectPopupAlign = { htmlRegion: 'screen' };
  // @ts-expect-error Points принимают строки, а не числовые координаты.
  const points: TreeSelectPopupAlign = { points: [0, 1] };
  // @ts-expect-error Offsets принимают числа и строки, а не booleans.
  const offset: TreeSelectPopupAlign = { offset: [true] };
  // @ts-expect-error Target offsets также не принимают объекты.
  const target: TreeSelectPopupAlign = { targetOffset: [{}] };
  // @ts-expect-error Overflow flags принимают boolean или number.
  const overflow: TreeSelectPopupAlign = { overflow: { adjustX: 'yes' } };
  // @ts-expect-error Dynamic inset является boolean flag.
  const dynamic: TreeSelectPopupAlign = { dynamicInset: 1 };
  // @ts-expect-error Popup align является объектом, а не именем placement.
  const align: TreeSelectProps = { popupAlign: 'bottomLeft' };
  // @ts-expect-error Placement map содержит align objects.
  const placements: TreeSelectProps = { builtinPlacements: { bottomLeft: 'bottomLeft' } };
  // @ts-expect-error Публичная placement map доступна только для чтения.
  map.bottomLeft = treeSelectReadonlyAlign;
  const empty: TreeSelectProps = { popupAlign: {}, builtinPlacements: {} };
  const omitted: TreeSelectProps = { popupAlign: undefined, builtinPlacements: undefined };
  return {
    privateAlign,
    privateMap,
    region,
    points,
    offset,
    target,
    overflow,
    dynamic,
    align,
    placements,
    empty,
    omitted
  };
}
