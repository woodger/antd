<script lang="ts">
  import { FormItem, type FormFeedbackIcons } from '@woodger/antd';
  let { icons }: { icons: FormFeedbackIcons } = $props();
</script>
<FormItem hasFeedback={{ icons }} validateStatus="error"><span>Plain child</span></FormItem>
