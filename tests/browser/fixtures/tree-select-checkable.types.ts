import type { Snippet } from 'svelte';
import type {
  TreeSelectCheckableContent, TreeSelectConfig, TreeSelectInputContext, TreeSelectLabel, TreeSelectProps,
  TreeSelectRootContext, TreeSelectSemanticInfo
} from 'antd-svelte';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;
interface Entry { code: number; caption: string; children?: readonly Entry[]; }
type Props = TreeSelectProps<number, Entry, HTMLButtonElement, HTMLTextAreaElement>;
type Info = TreeSelectSemanticInfo<number, Entry, HTMLButtonElement, HTMLTextAreaElement>;

export type TreeSelectCheckableTypeAssertions = [
  Assert<Equal<TreeSelectProps['treeCheckable'], TreeSelectCheckableContent>>,
  Assert<Equal<Props['treeCheckable'], TreeSelectCheckableContent>>,
  Assert<Equal<Info['props']['treeCheckable'], TreeSelectCheckableContent>>,
  Assert<Equal<Extract<keyof TreeSelectRootContext['attributes'], 'treeCheckable'>, never>>,
  Assert<Equal<Extract<keyof TreeSelectInputContext['attributes'], 'treeCheckable'>, never>>,
  Assert<Equal<Extract<TreeSelectLabel, bigint>, never>>,
  Assert<Equal<Extract<TreeSelectLabel, Promise<unknown>>, never>>
];

export function treeSelectCheckableContent(content: Snippet) {
  return [
    {},
    { treeCheckable: undefined },
    { treeCheckable: null },
    { treeCheckable: false },
    { treeCheckable: true },
    { treeCheckable: 0 },
    { treeCheckable: -0 },
    { treeCheckable: Number.NaN },
    { treeCheckable: 7 },
    { treeCheckable: -2 },
    { treeCheckable: '' },
    { treeCheckable: 'ignored checkbox content' },
    { treeCheckable: [] },
    { treeCheckable: [false] },
    { treeCheckable: [0] },
    { treeCheckable: [null, undefined, false] },
    { treeCheckable: ['ignored', 7] },
    { treeCheckable: [[], [content]] },
    { treeCheckable: content },
    { treeCheckable: 0n },
    { treeCheckable: 1n },
    { treeCheckable: -1n },
    { treeCheckable: new Set<TreeSelectCheckableContent>() },
    { treeCheckable: new Set<TreeSelectCheckableContent>([1n, content, Promise.resolve(null)]) },
    { treeCheckable: [Promise.resolve(content), [1n]] },
    { treeCheckable: Promise.resolve(null) },
    { treeCheckable: Promise.resolve(content) }
  ] satisfies readonly TreeSelectProps[];
}

export function treeSelectCheckableGeneric(
  content: Snippet,
  root: Snippet<[TreeSelectRootContext<HTMLButtonElement>]>,
  input: Snippet<[TreeSelectInputContext<HTMLTextAreaElement>]>
) {
  return {
    value: 1,
    treeData: [{ code: 1, caption: 'Parent', children: [{ code: 2, caption: 'Child' }] }],
    fieldNames: { value: 'code', label: 'caption', children: 'children' },
    treeCheckable: content,
    components: { root, input },
    classNames({ props }) {
      const original: TreeSelectCheckableContent = props.treeCheckable;
      const node: Entry | undefined = props.treeData?.[0];
      void original;
      void node;
      return { root: 'checkable-generic-root' };
    },
    styles({ props }) {
      const original: TreeSelectCheckableContent = props.treeCheckable;
      const nativeRoot: HTMLButtonElement | HTMLDivElement | undefined = props.nativeElement;
      const editor: HTMLTextAreaElement | HTMLInputElement | undefined = props.inputElement;
      void original;
      void nativeRoot;
      void editor;
      return { popup: { root: '--checkable-original:retained' } };
    }
  } satisfies Props;
}

export const treeSelectCheckableProvider: TreeSelectConfig = {
  classNames({ props }) {
    const original: TreeSelectCheckableContent = props.treeCheckable;
    void original;
    return { root: 'checkable-provider-root' };
  },
  styles({ props }) {
    const original: TreeSelectCheckableContent = props.treeCheckable;
    void original;
    return { root: '--checkable-provider:original' };
  }
};

export function treeSelectCheckableNegativeContent(
  requiresArgument: Snippet<[string]>, nestedPromise: Promise<Promise<null>>
) {
  // @ts-expect-error Content does not accept arbitrary records.
  const object: TreeSelectProps = { treeCheckable: { checked: true } };
  // @ts-expect-error Content uses a Svelte Snippet, not an ordinary callback.
  const callback: TreeSelectProps = { treeCheckable: () => 'ignored' };
  // @ts-expect-error The content snippet receives no arguments.
  const argument: TreeSelectProps = { treeCheckable: requiresArgument };
  // @ts-expect-error DOM nodes are not Native content descriptors.
  const element: TreeSelectProps = { treeCheckable: document.createElement('span') };
  // @ts-expect-error Symbol is not content.
  const symbol: TreeSelectProps = { treeCheckable: Symbol('ignored') };
  // @ts-expect-error Nested arrays still reject noncontent objects.
  const nested: TreeSelectProps = { treeCheckable: [[{ text: 'ignored' }]] };
  // @ts-expect-error Promise payloads still reject arbitrary records.
  const promise: TreeSelectProps = { treeCheckable: Promise.resolve({ text: 'ignored' }) };
  // @ts-expect-error Iterables still reject arbitrary records.
  const iterable: TreeSelectProps = { treeCheckable: new Set([{ text: 'ignored' }]) };
  // @ts-expect-error The top-level Promise payload excludes another Promise.
  const promiseOfPromise: TreeSelectProps = { treeCheckable: nestedPromise };
  // @ts-expect-error BigInt support belongs only to the ignored treeCheckable prop.
  const labelBigint: TreeSelectProps = { placeholder: 1n };
  // @ts-expect-error Rendered labels are not widened to asynchronous content.
  const labelPromise: TreeSelectProps = { placeholder: Promise.resolve('ignored') };
  return { object, callback, argument, element, promise, symbol, nested, iterable,
    promiseOfPromise, labelBigint, labelPromise };
}
