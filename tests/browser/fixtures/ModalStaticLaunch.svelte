<script lang="ts">
  import { useApp, type ModalInstance } from '@woodger/antd';

  let { launch }: { launch: (modal: ModalInstance) => void; } = $props();
  const { modal } = useApp();
</script>

<button type="button" id="static-opener" onclick={() => launch(modal)}>Open static</button>
