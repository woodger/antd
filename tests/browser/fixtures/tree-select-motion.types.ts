import type { Snippet } from 'svelte';
import type {
  TreeSelectConfig, TreeSelectInputContext, TreeSelectProps, TreeSelectRootContext,
  TreeSelectSemanticInfo
} from '@woodger/antd-svelte';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;
type MotionKeys = 'animation' | 'transitionName';
interface Entry { code: number; caption: string; }
type CustomProps = TreeSelectProps<number, Entry, HTMLButtonElement, HTMLTextAreaElement>;
type CustomInfo = TreeSelectSemanticInfo<number, Entry, HTMLButtonElement, HTMLTextAreaElement>;

export type TreeSelectMotionTypeAssertions = [
  Assert<Equal<TreeSelectProps['animation'], string | undefined>>,
  Assert<Equal<TreeSelectProps['transitionName'], string | undefined>>,
  Assert<Equal<Pick<CustomInfo['props'], MotionKeys>, Pick<CustomProps, MotionKeys>>>,
  Assert<Equal<Extract<keyof TreeSelectRootContext['attributes'], MotionKeys>, never>>,
  Assert<Equal<Extract<keyof TreeSelectInputContext['attributes'], MotionKeys>, never>>
];

export function treeSelectMotionCustomProps(
  root: Snippet<[TreeSelectRootContext<HTMLButtonElement>]>,
  input: Snippet<[TreeSelectInputContext<HTMLTextAreaElement>]>
) {
  return {
    value: 1,
    treeData: [{ code: 1, caption: 'One' }],
    animation: 'consumer-defined-motion',
    transitionName: 'consumer-defined-transition',
    components: {
      root: { render: root, props: { type: 'button' } },
      input: { render: input, props: { rows: 2 } }
    },
    styles({ props }) {
      const animation: string | undefined = props.animation;
      const transition: string | undefined = props.transitionName;
      const nativeRoot: HTMLButtonElement | HTMLDivElement | undefined = props.nativeElement;
      const nativeEditor: HTMLTextAreaElement | HTMLInputElement | undefined = props.inputElement;
      void animation;
      void transition;
      void nativeRoot;
      void nativeEditor;
      return { popup: { root: '--motion-owner:typed' } };
    }
  } satisfies CustomProps;
}

export const treeSelectMotionProvider: TreeSelectConfig = {
  classNames({ props }) {
    const animation: string | undefined = props.animation;
    const transition: string | undefined = props.transitionName;
    void animation;
    void transition;
    return { popup: { root: 'consumer-popup-motion' } };
  }
};

export function treeSelectMotionNegativeProps() {
  // @ts-expect-error Animation accepts an arbitrary name, not a boolean switch.
  const animationBoolean: TreeSelectProps = { animation: false };
  // @ts-expect-error Animation names are strings.
  const animationNumber: TreeSelectProps = { animation: 100 };
  // @ts-expect-error TreeSelect does not expose CSSMotion configuration objects.
  const animationObject: TreeSelectProps = { animation: { motionName: 'consumer' } };
  // @ts-expect-error Transition names are strings, not durations.
  const transitionNumber: TreeSelectProps = { transitionName: 100 };
  // @ts-expect-error Transition names do not accept CSSMotion callbacks.
  const transitionObject: TreeSelectProps = { transitionName: { onAppearEnd() {} } };
  // @ts-expect-error Empty string disables a named transition; null is outside the public type.
  const transitionNull: TreeSelectProps = { transitionName: null };
  const empty: TreeSelectProps = { animation: '', transitionName: '' };
  const undefinedNames: TreeSelectProps = { animation: undefined, transitionName: undefined };
  return {
    animationBoolean, animationNumber, animationObject,
    transitionNumber, transitionObject, transitionNull, empty, undefinedNames
  };
}
