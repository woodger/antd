import Popconfirm from './Popconfirm.svelte';

// The specific signature preserves normal button props when extracting ComponentProps.
const component: typeof Popconfirm & typeof Popconfirm<undefined, undefined> = Popconfirm;

export default component;
