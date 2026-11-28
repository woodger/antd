<script lang="ts">
  // Publishes the editor's props with per-key reactivity. Changing a mapped value must not
  // invalidate unrelated bindable props, including refs held by the editor itself.
  import { untrack, type Snippet } from 'svelte';
  import type { FormItemControl } from './form.types';

  let { control, valueProps, onEvent }: {
    control: Snippet<[FormItemControl]>;
    valueProps: Readonly<Record<string, unknown>>;
    onEvent: (event: string, args: readonly unknown[]) => boolean;
  } = $props();

  const readers = $state<Record<string | symbol, () => unknown>>({});
  const editorProps: Readonly<Record<string, unknown>> = new Proxy({}, {
    get(_, key) {
      return getReader(key)?.();
    },
    has(_, key) {
      return Object.hasOwn(readers, key);
    },
    ownKeys() {
      return Reflect.ownKeys(readers);
    },
    getOwnPropertyDescriptor(_, key) {
      const read = getReader(key);
      return read ? { configurable: true, enumerable: true, get: read } : undefined;
    }
  });

  const binding: FormItemControl = {
    props: editorProps,
    emit(event, ...args) {
      if (onEvent(event, args)) {
        // The editor may have a local draft even if normalization returned the old value.
        untrack(() => updateProps({ ...valueProps }, true));
      }
    }
  };

  untrack(() => updateProps({ ...valueProps }));
  $effect.pre(() => {
    const next = { ...valueProps };
    untrack(() => updateProps(next));
  });

  function getReader(key: string | symbol) {
    return Object.hasOwn(readers, key) ? readers[key] : undefined;
  }

  // Reader functions retain the mapped value's identity and allow same-value edits to refresh it.
  function updateProps(next: Readonly<Record<string, unknown>>, refresh = false) {
    for (const key of Reflect.ownKeys(readers)) {
      if (!Object.hasOwn(next, key)) {
        delete readers[key];
      }
    }

    for (const key of Reflect.ownKeys(next)) {
      const value: unknown = Reflect.get(next, key);
      const read = getReader(key);
      if (refresh || !read || !Object.is(read(), value)) {
        readers[key] = () => value;
      }
    }
  }
</script>

{@render control(binding)}
