<script lang="ts">
  // A custom panel retains the theme and locale while isolating the FormItem and SpaceCompact contexts.
  import type { MentionsPopupMenu, MentionsPopupRender, MentionsPopupRenderInfo } from './mentions.types';
  import { provideFormField } from './form-context';
  import { provideFormItemStatus, useFormItemStatusContext } from './form-item-status';
  import { provideFormFeedback } from './form-feedback-context';
  import { provideCompact } from './space-compact-context';

  let { popupRender, menu, info }: {
    popupRender: MentionsPopupRender;
    menu: MentionsPopupMenu;
    info: MentionsPopupRenderInfo;
  } = $props();
  provideFormField(undefined);
  provideFormFeedback({});
  provideFormItemStatus(Object.create(useFormItemStatusContext(), {
    status: { value: undefined }
  }));
  provideCompact(null);
</script>

{@render popupRender(menu, info)}
