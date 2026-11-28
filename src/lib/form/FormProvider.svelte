<script lang="ts">
  import { provideFormProvider } from './form-provider-context';
  import type { FormProviderProps } from './form.types';

  let props: FormProviderProps = $props();
  provideFormProvider(() => props);
</script>

{@render props.children?.()}
