export type TreeSelectCheckableDescriptor =
  | 'omitted' | 'undefined' | 'false' | 'null' | 'zero' | 'negative-zero' | 'nan' | 'empty-string'
  | 'true' | 'text' | 'number' | 'negative' | 'element-empty' | 'element-rich'
  | 'array-empty' | 'array-false' | 'array-zero' | 'array-nested'
  | 'bigint-zero' | 'bigint-one' | 'bigint-negative'
  | 'iterable-empty' | 'iterable-values' | 'iterable-throw' | 'promise-pending';

export interface TreeSelectCheckableSettings {
  value: TreeSelectCheckableDescriptor;
  multiple?: boolean;
  strict?: boolean;
  maxCount?: number;
  strategy?: 'SHOW_ALL' | 'SHOW_PARENT' | 'SHOW_CHILD';
}

export interface TreeSelectCheckableSample extends TreeSelectCheckableSettings {
  id: string;
  scene: 'baseline' | 'live-values' | 'live-reference' | 'strict'
    | 'limit-child' | 'limit-all' | 'limit-parent' | 'strict-limit'
    | 'search-truthy' | 'search-falsy';
  initialModel?: string | readonly string[] | null;
  slot?: 'root' | 'input';
  searchable?: boolean;
  diagnostic?: true;
}

export type TreeSelectCheckableAction =
  | { type: 'click' | 'clear' }
  | { type: 'choose'; value: 'p' | 'a' | 'b' | 'c' }
  | { type: 'value'; value: TreeSelectCheckableDescriptor }
  | { type: 'props'; set?: Partial<Omit<TreeSelectCheckableSettings, 'value'>>;
      unset?: readonly (keyof Omit<TreeSelectCheckableSettings, 'value'>)[] }
  | { type: 'open'; value: boolean }
  | { type: 'fill'; text: string }
  | { type: 'caret'; start: number; end: number };

export const treeSelectCheckableData = [
  { value: 'p', title: 'Parent', children: [
    { value: 'a', title: 'Alpha' },
    { value: 'b', title: 'Beta' }
  ] },
  { value: 'c', title: 'Gamma' }
] as const;

const descriptors: readonly TreeSelectCheckableDescriptor[] = [
  'omitted', 'undefined', 'false', 'null', 'zero', 'negative-zero', 'nan', 'empty-string',
  'true', 'text', 'number', 'negative', 'element-empty', 'element-rich',
  'array-empty', 'array-false', 'array-zero', 'array-nested',
  'bigint-zero', 'bigint-one', 'bigint-negative',
  'iterable-empty', 'iterable-values', 'iterable-throw', 'promise-pending'
];

export const treeSelectCheckableSamples: readonly TreeSelectCheckableSample[] = [
  ...descriptors.map(value => ({ id: value === 'undefined' ? 'own-undefined' : value,
    value, scene: 'baseline' as const })),
  { id: 'live-values', value: 'undefined', scene: 'live-values' },
  { id: 'live-reference-reuse', value: 'element-rich', scene: 'live-reference', initialModel: ['a'] },
  { id: 'strict-only-falsy', value: 'null', strict: true, scene: 'strict', initialModel: [] },
  { id: 'limit-child-array', value: 'array-empty', maxCount: 1, strategy: 'SHOW_CHILD', scene: 'limit-child' },
  { id: 'limit-all-text', value: 'text', maxCount: 1, strategy: 'SHOW_ALL', scene: 'limit-all' },
  { id: 'limit-parent-nested-array', value: 'array-nested', maxCount: 1, strategy: 'SHOW_PARENT', scene: 'limit-parent' },
  { id: 'strict-limit-number', value: 'number', strict: true, maxCount: 1, strategy: 'SHOW_ALL', scene: 'strict-limit', initialModel: [] },
  { id: 'multiple-with-falsy', value: 'false', multiple: true, scene: 'baseline', initialModel: ['a'] },
  { id: 'content-forces-multiple-false', value: 'element-rich', multiple: false, scene: 'baseline', diagnostic: true },
  { id: 'input-element-rich', value: 'element-rich', slot: 'input', scene: 'baseline' },
  { id: 'root-empty-array', value: 'array-empty', slot: 'root', scene: 'baseline' },
  { id: 'search-live-truthy', value: 'element-rich', searchable: true, scene: 'search-truthy', initialModel: ['a'] },
  { id: 'search-live-falsy', value: 'undefined', searchable: true, scene: 'search-falsy', initialModel: 'a' }
];

export function treeSelectCheckableActions(sample: TreeSelectCheckableSample): readonly TreeSelectCheckableAction[] {
  const click: TreeSelectCheckableAction = { type: 'click' };
  const choose = (value: 'p' | 'a' | 'b' | 'c'): TreeSelectCheckableAction => ({ type: 'choose', value });
  const value = (value: TreeSelectCheckableDescriptor): TreeSelectCheckableAction => ({ type: 'value', value });
  const clear: TreeSelectCheckableAction = { type: 'clear' };
  if (sample.slot === 'root') return [click, choose('a'), choose('b'), value('false'),
    value('array-empty'), { type: 'open', value: false }, { type: 'open', value: true }];
  if (sample.scene === 'live-values') return [click, value('true'), choose('p'), value('zero'),
    choose('c'), value('array-empty'), choose('b'), value('nan'), value('element-empty'),
    value('empty-string'), value('negative-zero'), value('undefined'), value('omitted'), value('true'), clear];
  if (sample.scene === 'live-reference') return [click, value('false'), value('element-rich'), choose('b'),
    value('array-nested'), value('null'), value('array-nested'), value('iterable-throw'),
    value('zero'), value('iterable-throw'), value('promise-pending'), value('undefined'),
    value('promise-pending'), value('omitted'), value('array-empty'), value('array-nested'), clear];
  if (sample.scene === 'strict') return [click, choose('p'), choose('a'), choose('p'), clear];
  if (sample.scene === 'limit-child') return [click, choose('a'), choose('b'), choose('a'),
    choose('p'), choose('c'), clear];
  if (sample.scene === 'limit-all') return [click, choose('p'), choose('c'), choose('a'), clear];
  if (sample.scene === 'limit-parent') return [click, choose('p'), choose('c'), choose('b'), clear];
  if (sample.scene === 'strict-limit') return [click, choose('p'), choose('a'), choose('p'), choose('b'), clear];
  if (sample.scene === 'search-truthy') return [click, { type: 'fill', text: 'Kept query' },
    { type: 'caret', start: 1, end: 5 }, value('element-empty'), value('array-empty'),
    value('array-false'), value('number'), value('element-rich')];
  if (sample.scene === 'search-falsy') return [click, { type: 'fill', text: 'Kept query' },
    { type: 'caret', start: 1, end: 5 }, value('false'), value('null'), value('nan'),
    value('zero'), value('negative-zero'), value('empty-string'), value('omitted'), value('undefined')];
  return [click, choose('a'), choose('b'), clear];
}
