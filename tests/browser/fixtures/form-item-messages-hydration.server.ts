import { render } from 'svelte/server';
import FormItemMessagesFixtures from './FormItemMessagesFixtures.svelte';
import FormNoStyleFixtures from './FormNoStyleFixtures.svelte';
import FormRichValidationFixtures from './FormRichValidationFixtures.svelte';

/** Seeds connected messages in SSR so hydration has to reuse their parsed nodes. */
export function renderFormItemMessages(profile: 'field' | 'nested' | 'rich') {
  if (profile === 'rich') {
    return render(FormRichValidationFixtures, { props: { initialMessages: true } });
  }
  if (profile === 'nested') {
    return render(FormNoStyleFixtures, { props: { initialCase: 'error', initialMetadata: true } });
  }

  return render(FormItemMessagesFixtures, {
    props: { initialProfile: 'extra-and-prefix', initialMessages: true }
  });
}
