<script lang="ts">
  import type { Snippet } from 'svelte';
  import { provideFormField } from '../form/form-context';
  import { provideFormItemStatus, useFormItemStatusContext } from '../form/form-item-status';
  import { provideFormFeedback } from '../form/form-feedback-context';

  let { popupRender, menu }: { popupRender: Snippet<[Snippet]>; menu: Snippet; } = $props();
  provideFormField(undefined);
  provideFormFeedback({});
  provideFormItemStatus(Object.create(useFormItemStatusContext(), {
    status: { value: undefined }
  }));
</script>

{@render popupRender(menu)}
