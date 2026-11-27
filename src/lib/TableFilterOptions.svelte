<script lang="ts">
  // Presents the draft as a list, nested Menu, or Tree. TableFilter owns the values passed to Table
  // and the confirmation timing.
  import { untrack } from 'svelte';
  import { takeDropdownMenu } from './dropdown-menu-context';
  import {
    getTableFilterMenu, getTableFilterNodes, matchesTableFilterText, walkTableFilterNodes,
    type TableFilterNode
  } from './table-filter-options.engine';
  import type {
    TableFilterMode, TableFilterOption, TableFilterSearch, TableFilterValue
  } from './table.types';
  import type { MenuItemIconInfo, MenuProps, MenuSelectInfo } from './menu.types';
  import type { TreeCheckedKeys, TreeCheckInfo, TreeEventNode, TreeKey } from './tree.types';
  import type { TableFilterLocale } from './table-locale.engine';
  import Checkbox from './checkbox/Checkbox.svelte';
  import Empty from './Empty.svelte';
  import Icon from './Icon.svelte';
  import Input from './input/Input.svelte';
  import Menu from './Menu.svelte';
  import NoFormItemBinding from './form/NoFormItemBinding.svelte';
  import RenderContent from './RenderContent.svelte';
  import RenderEmpty from './RenderEmpty.svelte';
  import Tree from './Tree.svelte';

  let {
    prefixCls, dropdownPrefix, label, labelledby, id, options, mode, search, multiple, disabled, open,
    strings,
    draft = $bindable(), query = $bindable(), getPopupContainer, retainDropdownPopup
  }: {
    prefixCls: string;
    dropdownPrefix: string;
    label: string;
    labelledby?: string;
    id: string;
    options: readonly TableFilterOption[];
    mode: TableFilterMode;
    search: TableFilterSearch;
    multiple: boolean;
    disabled: boolean;
    open: boolean;
    strings: Pick<TableFilterLocale, 'filterSearchPlaceholder' | 'filterCheckAll' | 'filterEmptyText'>;
    draft: TableFilterValue[];
    query: string;
    getPopupContainer: NonNullable<MenuProps['getPopupContainer']>;
    retainDropdownPopup: boolean;
  } = $props();

  // The external portal stays inside the filter panel's interaction boundary. TableFilter applies
  // selections when the user confirms the draft.
  takeDropdownMenu(untrack(() => retainDropdownPopup));
  const placeholder = $derived(strings.filterSearchPlaceholder);
  const emptyText = $derived(strings.filterEmptyText);
  const description = $derived(
    typeof emptyText === 'object' && emptyText !== null ? emptyDescription : emptyText
  );
  const normalizedQuery = $derived(query.trim().toLowerCase());
  const grouped = $derived(options.some(option => option.children));
  const nodes = $derived(getTableFilterNodes(options));
  const orderedNodes = $derived(Array.from(walkTableFilterNodes(nodes)));
  const draftValues = $derived(new Set(draft));
  const selectedKeys = $derived(
    orderedNodes.filter(node => draftValues.has(node.option.value)).map(node => node.key)
  );
  const allValues = $derived([...new Set(orderedNodes.map(node => node.option.value))]);
  const allChecked = $derived(allValues.every(value => draftValues.has(value)));
  const menuItems = $derived(
    getTableFilterMenu(nodes, matchesMenu, `${prefixCls}-filter-dropdown-submenu`)
  );
  const visibleOptions = $derived(options.flatMap((option, index) =>
    matchesMenu(option) ? [{ option, index }] : []));
  let menuKeys = $state<string[]>([]);

  $effect.pre(() => {
    if (!open) {
      menuKeys = [];
    }
  });

  /** The custom predicate receives a normalized query in a menu. */
  function matchesMenu(option: TableFilterOption) {
    if (!normalizedQuery) {
      return true;
    }

    return typeof search === 'function'
      ? search(normalizedQuery, option)
      : matchesTableFilterText(option.text, normalizedQuery);
  }

  /** Tree preserves its branches and passes the raw query to the custom predicate. */
  function matchesTree(node: TreeEventNode<TableFilterNode>) {
    return typeof search === 'function'
      ? search(query, node.option)
      : matchesTableFilterText(node.option.text, normalizedQuery);
  }

  /** Maps Menu and Tree keys to unique values in the declared option order. */
  function selectKeys(keys: readonly TreeKey[]) {
    const selected = new Set(keys);
    const values = orderedNodes.flatMap(node => selected.has(node.key) ? [node.option.value] : []);
    draft = [...new Set(values)];
  }

  function selectMenu(info: MenuSelectInfo) {
    selectKeys(info.selectedKeys);
  }

  function selectTree(keys: TreeKey[] | TreeCheckedKeys, info: TreeCheckInfo<TableFilterNode>) {
    if (!multiple) {
      draft = info.checked ? [info.node.option.value] : [];
      return;
    }

    selectKeys(Array.isArray(keys) ? keys : keys.checked);
  }

  function selectAll(checked: boolean) {
    draft = checked ? [...allValues] : [];
  }

  /** A flat list retains native selection and the order of checked values. */
  function choose(option: TableFilterValue, checked: boolean) {
    if (!multiple) {
      draft = [option];
      return;
    }

    const selected = new Set(draft);
    if (checked) {
      selected.add(option);
    }
    else {
      selected.delete(option);
    }
    draft = [...selected];
  }
</script>

<style>
  .filter-options {
    display: grid;
    gap: var(--ant-margin-xs);
    padding: var(--ant-padding-sm);
    overflow-wrap: anywhere;
  }
  :global(.table-filter-source) .filter-options { background: var(--ant-table-filter-dropdown-menu-bg); }
  .radio-option {
    display: flex;
    align-items: center;
    gap: var(--ant-margin-xs);
    cursor: pointer;
  }
  .radio-option input {
    flex: none;
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--ant-color-primary);
  }
  input:focus-visible {
    outline: var(--ant-line-width-focus) solid var(--ant-color-primary-border);
    outline-offset: 2px;
  }
  .filter-search {
    padding: var(--ant-padding-xs);
    border-bottom: var(--ant-line-width) solid var(--ant-color-border-secondary);
  }
  .filter-search :global(svg) { color: var(--ant-color-text-disabled); }
  .filter-tree { padding: var(--ant-padding-xs) var(--ant-padding-xs) 0; }
  .filter-tree :global([data-ant-tree-root]) { padding: 0; }
  .filter-tree :global([role="treeitem"][aria-checked="true"] > [data-ant-tree-content]) {
    background: var(--ant-control-item-bg-active);
  }
  .menu-option-mark {
    order: -1;
    flex: none;
    width: 16px;
    height: 16px;
    margin-inline-end: var(--ant-margin-xs);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--ant-line-width) solid var(--ant-color-border);
    border-radius: var(--ant-border-radius-sm);
    background: var(--ant-color-bg-container);
  }
  .menu-option-mark.checked {
    border-color: var(--ant-color-primary);
    background: var(--ant-color-primary);
    color: var(--ant-color-white);
  }
  .menu-option-mark.radio { border-radius: 50%; }
  .menu-option-mark.radio.checked { background: var(--ant-color-bg-container); }
  .menu-option-mark.radio.checked::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ant-color-primary);
  }
</style>

{#snippet emptyDescription()}<RenderContent value={emptyText} />{/snippet}

{#snippet nativeEmpty()}
  <Empty image="simple" {description}
    styles={{ image: 'height:24px' }} style={'margin:0;'
      + 'padding:16px 0'} />
{/snippet}

{#snippet searchIcon()}<Icon name="search" />{/snippet}

{#snippet mark(info: MenuItemIconInfo)}
  <span aria-hidden="true" class="menu-option-mark" class:checked={info.isSelected}
    class:radio={!multiple}>
    {#if multiple && info.isSelected}<Icon name="check" />{/if}
  </span>
{/snippet}

{#if search && options.length}
  <div data-ant-table-filter-search class={[`${prefixCls}-filter-dropdown-search`, 'filter-search']}>
    <NoFormItemBinding>
      <Input bind:value={query} {placeholder} aria-label={placeholder} htmlSize={1}
        prefix={searchIcon} {disabled} class={`${prefixCls}-filter-dropdown-search-input`} />
    </NoFormItemBinding>
  </div>
{/if}

{#if options.length && mode === 'tree'}
  <div class={[`${prefixCls}-filter-dropdown-tree`, 'filter-tree']}>
    {#if multiple}
      <NoFormItemBinding>
        <Checkbox checked={allChecked} indeterminate={draftValues.size > 0 && !allChecked}
          {disabled} skipGroup class={`${prefixCls}-filter-dropdown-checkall`}
          onCheckedChange={selectAll}><RenderContent value={strings.filterCheckAll} /></Checkbox>
      </NoFormItemBinding>
    {/if}
    <Tree treeData={nodes} checkedKeys={selectedKeys} checkable aria-label={label}
      aria-labelledby={labelledby} blockNode
      {multiple} {disabled} selectable={false} checkStrictly={!multiple} defaultExpandAll
      autoExpandParent virtual={false} class={`${dropdownPrefix}-menu`}
      filterTreeNode={normalizedQuery ? matchesTree : undefined} onCheck={selectTree} />
  </div>
{:else if grouped}
  <Menu items={menuItems} {selectedKeys} {multiple} {disabled} {getPopupContainer}
    prefixCls={`${dropdownPrefix}-menu`} tooltip={false} itemIcon={mark}
    _itemRole={multiple ? 'menuitemcheckbox' : 'menuitemradio'}
    openKeys={open ? menuKeys : []} onOpenChange={keys => { menuKeys = keys; }}
    onSelect={selectMenu} onDeselect={selectMenu} aria-label={label} aria-labelledby={labelledby} />
{:else}
  <div class={`filter-options ${dropdownPrefix}-menu`} role="group"
    aria-label={label} aria-labelledby={labelledby}>
    {#each visibleOptions as { option, index } (index)}
      {#if multiple}
        <Checkbox checked={draftValues.has(option.value)} {disabled}
          onCheckedChange={checked => choose(option.value, checked)}><RenderContent
            value={option.text} /></Checkbox>
      {:else}
        <label class="radio-option">
          <input type="radio" name={`ant-filter-${id}`} value={index}
            checked={draftValues.has(option.value)} {disabled}
            onchange={() => choose(option.value, true)} /><RenderContent value={option.text} />
        </label>
      {/if}
    {:else}
      <RenderEmpty componentName="Table.filter" nullish fallback={nativeEmpty} />
    {/each}
  </div>
{/if}
