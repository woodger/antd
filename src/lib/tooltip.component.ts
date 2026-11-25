import TooltipRoot from './Tooltip.svelte';
import UniqueProvider from './TooltipUniqueProvider.svelte';

const Tooltip = Object.assign(TooltipRoot, { UniqueProvider });
type Tooltip = TooltipRoot;

export default Tooltip;
