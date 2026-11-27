import { connectSelectTagOverflow } from '../select/select-tag-overflow.dom';
export { measureSelectInput as measureCascaderInput } from '../select/select-tag-overflow.dom';

/** Measures tags with rc-overflow. Hidden tags retain their width and stay out of flow. */
export function connectCascaderTags(host: HTMLElement, update: (count: number) => void) {
  return connectSelectTagOverflow(host, update, {
    tag: ':scope > .overflow-item > [data-cascader-tag]',
    rest: ':scope > .overflow-item > [data-cascader-rest]',
    input: ':scope > .overflow-item > input'
  });
}
