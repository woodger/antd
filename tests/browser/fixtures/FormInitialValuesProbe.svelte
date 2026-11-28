<script lang="ts">
  import { useFormInstance } from '@woodger/antd';

  let { id }: { id: string } = $props();
  const owner = useFormInstance();
</script>

<output id={id + '-values'}>{JSON.stringify(owner.current?.getFieldsValue(true))}</output>
<button id={id + '-edit'} type="button"
  onclick={() => owner.current?.setFieldValue('word', 'draft')}>Edit from context</button>
<button id={id + '-reset'} type="button"
  onclick={() => owner.current?.resetFields()}>Reset from context</button>
