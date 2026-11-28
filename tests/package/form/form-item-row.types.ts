import type { ComponentProps, Snippet } from 'svelte';
import { FormItem, type FormItemControl, type FormItemRenderContext } from '@woodger/antd';

type Props = ComponentProps<typeof FormItem>;

export function formItemRowTypes(
  children: Snippet, control: Snippet<[FormItemControl]>, render: Snippet<[FormItemRenderContext]>
) {
  const ordinary: Props = { name: ['profile', 0], children, gutter: [4, 8], 'aria-label': 'Row' };
  const controlled: Props = { name: 'profile', control, align: 'middle' };
  const conditional: Props = { shouldUpdate: true, render, dir: 'ltr' };
  // @ts-expect-error A store render snippet belongs to a nameless item.
  const namedRender: Props = { render, name: 'profile' };
  // @ts-expect-error The item id is retired. Labels use htmlFor.
  const retiredId: Props = { children, id: 'profile' };

  return { ordinary, controlled, conditional, namedRender, retiredId };
}
