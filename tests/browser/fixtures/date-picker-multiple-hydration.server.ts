import { render } from 'svelte/server';
import DatePickerMultipleFixtures from './DatePickerMultipleFixtures.svelte';

/** Рендерит те же props, с которыми клиент измеряет адаптивные теги. */
export function renderMultiplePickerFixture() {
  return render(DatePickerMultipleFixtures, {
    props: { profile: { id: 'hydrate', maxTagCount: 'responsive' } }
  });
}
