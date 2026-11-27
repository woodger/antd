<script module lang="ts">
  import type { MentionsOption } from './mentions.types';

  export interface MentionsListboxRef {
    readonly id: string;
    readonly activeId: string | undefined;
  }

  export interface MentionsListboxOwner {
    readonly id: string;
    readonly active: number;
    claimBaseId: () => (() => void) | undefined;
    register: (listbox: MentionsListboxRef) => () => void;
    choose: (option: MentionsOption) => Promise<void>;
    activate: (index: number) => void;
    focus: () => void;
    blur: (event: FocusEvent) => void;
  }
</script>

<script lang="ts">
  // Each menu call owns its DOM IDs, options, and focus subscriptions.
  import { onDestroy, onMount, untrack, type Snippet } from 'svelte';
  import RenderContent from './RenderContent.svelte';
  import type { MentionMenuRow } from './mentions.engine';
  import type { MentionsProps } from './mentions.types';

  let {
    owner, rows, prefix, label, loading, opened, onScroll, loadingIndicator, empty
  }: {
    owner: MentionsListboxOwner;
    rows: readonly MentionMenuRow[];
    prefix: string;
    label: string | undefined;
    loading: boolean;
    opened: boolean;
    onScroll?: MentionsProps['onPopupScroll'];
    loadingIndicator: Snippet;
    empty: Snippet;
  } = $props();

  const instanceId = $props.id();
  const releaseBaseId = untrack(() => owner.claimBaseId());
  const suffix = releaseBaseId ? '' : `-${instanceId}`;
  const idBase = $derived(owner.id + suffix);
  const activeRow = $derived(rows[owner.active]);
  const listbox: MentionsListboxRef = {
    get id() { return `${idBase}-list`; },
    get activeId() { return activeRow ? optionId(owner.active) : undefined; }
  };

  if (releaseBaseId) onDestroy(releaseBaseId);
  onMount(() => owner.register(listbox));

  function optionId(index: number) {
    return `${idBase}-option-${index}`;
  }

  function connectFocus(node: HTMLDivElement) {
    // Transitions within one ShadowRoot never reach the document's delegated listeners.
    const { focus, blur } = owner;
    node.addEventListener('focusin', focus);
    node.addEventListener('focusout', blur);

    return () => {
      node.removeEventListener('focusin', focus);
      node.removeEventListener('focusout', blur);
    };
  }

  function chooseByKey(key: string) {
    // A click selects the first match in this menu copy. Enter in the textarea uses the index.
    const row = rows.find(candidate => candidate.menuKey === key);
    if (row) void owner.choose(row.option);
  }

  function revealOption(node: HTMLButtonElement) {
    node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
</script>

<style>
  :where([data-ant-mentions-option]) {
    border: 0;
    width: 100%;
    background: transparent;
    font: inherit;
    text-align: start;
  }
</style>

<div id={listbox.id} role="listbox" class={`${prefix}-menu`}
  aria-label={label} onscroll={onScroll} aria-busy={loading || undefined} {@attach connectFocus}>
  {#each rows as { option, menuKey, domKey }, index (domKey)}
    <button data-ant-mentions-option type="button" role="option" tabindex="-1"
      id={optionId(index)} disabled={option.disabled} aria-selected={owner.active === index}
      aria-disabled={option.disabled || undefined}
      aria-label={option.label == null || option.label === loadingIndicator ? option.value : undefined}
      class={[
        `${prefix}-menu-item`,
        activeRow?.menuKey === menuKey && `${prefix}-menu-item-active`,
        option.disabled && `${prefix}-menu-item-disabled`,
        option.class
      ]} style={option.style} onpointermove={() => {
        if (!option.disabled) owner.activate(index);
      }} onclick={() => chooseByKey(menuKey)}
      {@attach opened && owner.active === index ? revealOption : undefined}>
      <RenderContent value={option.label} />
    </button>
  {:else}
    <div class={`${prefix}-menu-item ${prefix}-menu-item-disabled`}>{@render empty()}</div>
  {/each}
</div>
