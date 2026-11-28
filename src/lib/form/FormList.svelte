<script lang="ts">
  import { untrack } from 'svelte';
  import { useForm } from './form-context';
  import { useConfig } from '../config-provider/config-context';
  import { provideFormPrefix } from './form-prefix-context';
  import { provideFormList, useFormList } from './form-list-context';
  import { changeFormList, syncFormListKeys } from './form-list.engine';
  import { formNamePath } from './form-store.engine';
  import type { FormRemovalPath } from './form-internal';
  import type { FormListOperation, FormListProps } from './form-list.types';

  let { name, initialValue, rules, children, prefixCls }: FormListProps = $props();
  const form = useForm();
  const config = useConfig();
  provideFormPrefix({
    get prefixCls() {
      return config.getPrefixCls('form', prefixCls);
    }
  });
  const parent = useFormList();
  if (!form) {
    throw new Error('FormList requires Form');
  }

  let prefixName = $derived([...(parent?.prefixName ?? []), ...formNamePath(name)]);
  untrack(() => form.initializeList(prefixName, initialValue));

  function readValues(): readonly unknown[] {
    const value = form!.getFieldValue(prefixName);

    return Array.isArray(value) ? value : [];
  }

  let values = $derived(readValues());
  let keys = $state.raw(untrack(() => syncFormListKeys(
    { keys: [], nextKey: 0 }, readValues()
  )));
  // React map skips holes. each receives a dense list of positions that exist.
  let fields = $derived(values.flatMap((_, index) => ({ name: index, key: keys.keys[index] })));
  let meta = $derived({
    errors: form.getFieldError(prefixName), warnings: form.getFieldWarning(prefixName)
  });
  let fieldResetKey = $state.raw<object>({});
  let resetKey = $derived({ form: form.resetKey, field: fieldResetKey });

  // A row's index may change after registration. Skip rows already removed by a list operation.
  function captureRemovalPath(relative: readonly (string | number)[]): FormRemovalPath {
    const resolveParent = parent?.captureRemovalPath(formNamePath(name));
    const [position, ...rest] = relative;
    const rowKey = typeof position === 'number' ? keys.keys[position] : undefined;

    return (readValue) => {
      const listPath = resolveParent ? resolveParent(readValue) : prefixName;
      if (!listPath) {
        return;
      }
      if (typeof position !== 'number') {
        return [...listPath, ...relative];
      }
      if (rowKey === undefined) {
        return;
      }

      const index = keys.keys.indexOf(rowKey);
      const rows = readValue(listPath);
      if (index >= 0 && Array.isArray(rows) && Object.hasOwn(rows, index)) {
        return [...listPath, index, ...rest];
      }
    };
  }

  provideFormList({
    get prefixCls() {
      return config.getPrefixCls('form', prefixCls);
    },
    get prefixName() {
      return prefixName;
    },
    captureRemovalPath
  });

  $effect.pre(() => form.registerField?.({
    get name() {
      return prefixName;
    },
    get rules() {
      return rules;
    },
    get validateTrigger() {
      return form.validateTrigger;
    },
    get preserve() {
      return form.preserve;
    },
    get initialValue() {
      return initialValue;
    },
    isList: true,
    isListField: Boolean(parent),
    onReset() {
      fieldResetKey = {};
    }
  }));

  $effect.pre(() => {
    const current = values;
    untrack(() => {
      const next = syncFormListKeys(keys, current);
      if (next !== keys) keys = next;
    });
  });

  const operation: FormListOperation = {
    add(value, index) {
      const next = changeFormList(readValues(), keys, { type: 'add', value, index });
      if (!next) {
        return;
      }

      keys = next.state;
      form.changeList(prefixName, next.values);
    },
    remove(index) {
      const next = changeFormList(readValues(), keys, { type: 'remove', index });
      if (!next) {
        return;
      }

      keys = next.state;
      form.changeList(prefixName, next.values);
    },
    move(from, to) {
      const next = changeFormList(readValues(), keys, { type: 'move', from, to });
      if (!next) {
        return;
      }

      keys = next.state;
      form.changeList(prefixName, next.values);
    }
  };
</script>

{#key resetKey}
  {@render children(fields, operation, meta)}
{/key}
