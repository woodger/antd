import { render } from 'svelte/server';
import FormItemMessagesFixtures from './FormItemMessagesFixtures.svelte';
import FormNoStyleFixtures from './FormNoStyleFixtures.svelte';

/** Seeds connected messages in SSR so hydration has to reuse their parsed nodes. */
export function renderFormItemMessages(nested: boolean) {
  if (nested) {
    return render(FormNoStyleFixtures, { props: { initialCase: 'error', initialMetadata: true } });
  }

  return render(FormItemMessagesFixtures, {
    props: { initialProfile: 'extra-and-prefix', initialMessages: true }
  });
}
