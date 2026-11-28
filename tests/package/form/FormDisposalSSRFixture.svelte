<script lang="ts">
  import { Form, FormItem, Input, type FormInstance } from '@woodger/antd';

  let { form }: { form: FormInstance<{ title: string; draft: string }> } = $props();
</script>

<Form {form} clearOnDestroy preserve={false}>
  <FormItem name="title" preserve={true}>
    <Input id="disposal-title" value={form.values.title} />
  </FormItem>
</Form>
