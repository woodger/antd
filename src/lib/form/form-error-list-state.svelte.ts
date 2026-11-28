// Retains Form messages across brief validation gaps and owns the lifetime of leaving entries.
import { onDestroy, onMount, untrack } from 'svelte';
import type { RenderEmptyContent } from '../types';
import type { FormErrorListProps } from './form-error-list.types';
import {
  buildFormErrorList, reconcileFormErrorList, type FormErrorMotionEntity
} from './form-error-list.engine';

/** Clears after 10 ms. Connected fields can expose nonempty messages in the current update. */
export function useDelayedFormMessages(
  read: () => readonly RenderEmptyContent[], deferNonempty: boolean
) {
  let retained = $state.raw<readonly RenderEmptyContent[]>(deferNonempty ? untrack(read) : []);

  $effect(() => {
    const next = [...read()];
    if (!deferNonempty) {
      if (next.length) {
        retained = next;
        return;
      }
      if (!untrack(() => retained.length)) {
        return;
      }
    }

    const timer = setTimeout(() => { retained = next; }, next.length ? 0 : 10);
    return () => clearTimeout(timer);
  });

  // Connected descriptions use the latest nonempty slice before the next timer.
  return () => {
    if (deferNonempty) {
      return retained;
    }

    const current = read();
    return current.length ? current : retained;
  };
}

type MessageInput = Pick<FormErrorListProps, 'help' | 'helpStatus' | 'errors' | 'warnings'>;

/** Keeps the holder and keyed rows until their own motion completes. */
export function useFormErrorList(read: () => MessageInput, onVisibleChanged?: (shown: boolean) => void) {
  const messages = $derived(buildFormErrorList(read()));
  const visible = $derived(messages.length > 0);
  const initialEntries = $derived(reconcileFormErrorList([], messages));
  let mounted = $state(false);
  let rendered = $state(false);
  let entries = $state.raw<FormErrorMotionEntity[]>([]);
  let active = true;

  $effect.pre(() => {
    const current = messages;

    untrack(() => {
      entries = reconcileFormErrorList(entries, current);
      if (current.length) rendered = true;
    });
  });

  onMount(() => { mounted = true; });
  onDestroy(() => { active = false; });

  /** A superseded transition cannot remove the current holder or notify its owner. */
  function finishHolder(shown: boolean) {
    if (!active || shown !== visible) {
      return;
    }

    if (!shown) {
      rendered = false;
      entries = [];
    }

    onVisibleChanged?.(shown);
  }

  /** Keep an entry with the same key if it returned while leaving. */
  function finishMessage(key: string, shown: boolean) {
    if (!active || shown) {
      return;
    }

    entries = entries.filter((entry) => entry.key !== key || entry.visible);
  }

  return {
    /** The holder is open while any delayed message remains. */
    get visible() { return visible; },
    /** The mounted holder can outlive its visible messages during exit. */
    get rendered() { return mounted ? rendered : visible; },
    /** SSR reads the message list after child fields have rendered and reported their metadata. */
    get entries() { return mounted ? entries : initialEntries; },
    finishHolder,
    finishMessage
  };
}
