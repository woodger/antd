<script lang="ts">
  import { ConfigProvider, Modal, ModalHolder, createModal } from '@woodger/antd';

  const modal = createModal();
  modal.confirm({ prefixCls: 'window', title: 'Confirmation', content: 'Body' });
</script>

<ConfigProvider prefixCls="suite" theme={{ cssVar: {} }}>
  <Modal title="First">First body</Modal>
  <ConfigProvider prefixCls="inner">
    <ModalHolder {modal} />
  </ConfigProvider>
</ConfigProvider>
