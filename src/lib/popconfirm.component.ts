import Popconfirm from './Popconfirm.svelte';

// Конкретная сигнатура сохраняет параметры обычных кнопок при извлечении ComponentProps.
const component: typeof Popconfirm & typeof Popconfirm<undefined, undefined> = Popconfirm;

export default component;
