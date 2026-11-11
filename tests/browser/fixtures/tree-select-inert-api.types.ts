import type { Snippet } from 'svelte';
import type {
  TreeSelectInputContext, TreeSelectProps, TreeSelectRootContext, TreeSelectSemanticInfo
} from 'antd-svelte';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;
type InertKeys = 'direction' | 'choiceTransitionName' | 'popupStyle' | 'onPopupVisibleChange';

export type TreeSelectInertApiAssertions = [
  Assert<Equal<TreeSelectProps['direction'], 'ltr' | 'rtl' | undefined>>,
  Assert<Equal<TreeSelectProps['choiceTransitionName'], string | undefined>>,
  Assert<Equal<TreeSelectProps['popupStyle'], string | undefined>>,
  Assert<Equal<TreeSelectProps['onPopupVisibleChange'], ((open: boolean) => void) | undefined>>,
  Assert<Equal<Pick<TreeSelectSemanticInfo['props'], InertKeys>, Pick<TreeSelectProps, InertKeys>>>,
  Assert<Equal<Extract<keyof TreeSelectRootContext['attributes'], InertKeys>, never>>,
  Assert<Equal<Extract<keyof TreeSelectInputContext['attributes'], InertKeys>, never>>
];

interface Entry { code: number; caption: string; }
export function treeSelectInertCustomProps(
  root: Snippet<[TreeSelectRootContext<HTMLButtonElement>]>,
  input: Snippet<[TreeSelectInputContext<HTMLTextAreaElement>]>
) {
  return {
    value: 1, treeData: [{ code: 1, caption: 'One' }],
    direction: 'rtl', dir: 'auto', popupStyle: '', choiceTransitionName: '',
    onPopupVisibleChange(open) { const visible: boolean = open; void visible; },
    components: { root: { render: root, props: { type: 'button', dir: 'ltr' } },
      input: { render: input, props: { rows: 2, dir: 'rtl' } } },
    onChange(value) { const selected: number = value; void selected; },
    styles({ props }) {
      const direction: 'ltr' | 'rtl' | undefined = props.direction;
      const popup: string | undefined = props.popupStyle;
      const choice: string | undefined = props.choiceTransitionName;
      const callback: ((open: boolean) => void) | undefined = props.onPopupVisibleChange;
      const root: HTMLButtonElement | HTMLDivElement | undefined = props.nativeElement;
      const editor: HTMLTextAreaElement | HTMLInputElement | undefined = props.inputElement;
      void direction; void popup; void choice; void callback; void root; void editor;
      return { popup: { root: 'outline:1px solid red' } };
    }
  } satisfies TreeSelectProps<number, Entry, HTMLButtonElement, HTMLTextAreaElement>;
}

export function treeSelectInertNegativeProps() {
  // @ts-expect-error Inherited direction is configuration, separate from native dir="auto".
  const direction: TreeSelectProps = { direction: 'auto' };
  // @ts-expect-error Popup styles use the existing Svelte CSS-string contract.
  const popup: TreeSelectProps = { popupStyle: { color: 'red' } };
  // @ts-expect-error Choice names are arbitrary strings.
  const choice: TreeSelectProps = { choiceTransitionName: 1 };
  // @ts-expect-error The inherited callback receives a boolean.
  const callback: TreeSelectProps = { onPopupVisibleChange: (_open: string) => {} };
  const nativeDir: TreeSelectProps = { dir: null };
  return { direction, popup, choice, callback, nativeDir };
}
