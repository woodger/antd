import Modal from './Modal.svelte';
import { destroyAllModals } from './modal-destroy.dom';
import { openStaticModal } from './modal-static.model.svelte.js';
import type { ModalConfirmType, ModalStaticConfig } from './modal-confirm.types';

/** Связывает публичный метод с начальным видом подтверждения. */
function createMethod(type: ModalConfirmType) {
  /** Запускает независимое окно по запросу. */
  return (config: ModalStaticConfig) => openStaticModal(type, config);
}

export default Object.assign(Modal, {
  info: createMethod('info'),
  success: createMethod('success'),
  error: createMethod('error'),
  warning: createMethod('warning'),
  confirm: createMethod('confirm'),
  destroyAll: destroyAllModals
});
