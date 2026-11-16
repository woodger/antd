import { connectSelectTagOverflow } from './select-tag-overflow.dom';
export { measureSelectInput as measureCascaderInput } from './select-tag-overflow.dom';

/** Измеряет теги rc-overflow; hidden теги сохраняют ширину, но не участвуют в flow. */
export function connectCascaderTags(host: HTMLElement, update: (count: number) => void) {
  return connectSelectTagOverflow(host, update, {
    tag: ':scope > .overflow-item > [data-cascader-tag]',
    rest: ':scope > .overflow-item > [data-cascader-rest]',
    input: ':scope > .overflow-item > input'
  });
}
