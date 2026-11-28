<script lang="ts">
  import { useFormInstance, type FormInstance, type FormRef } from '@woodger/antd';

  type Values = { name: string; };
  let { submit }: {
    submit: (source: string, model?: FormInstance<Values>, ref?: FormRef<Values>) => void;
  } = $props();
  const owner = useFormInstance<Values>();
</script>

<button type="button" onclick={() => submit('context', owner.current, owner.ref)}>Submit from context</button>
