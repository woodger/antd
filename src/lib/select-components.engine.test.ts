import { describe, expect, it } from 'vitest';
import {
  blurSelectComponent, focusSelectComponent, mergeSelectComponentAttributes,
  selectComponentInputElement, selectComponentNativeElement
} from './select-components.engine';

describe('Select component attribute composition', () => {
  it('keeps generated root attributes and authored editor attributes in opposite precedence', () => {
    const generated = { id: 'generated', name: 'field', value: 'query', style: 'color:blue', disabled: true };
    const own = { id: 'origin', value: 'authored', style: 'color:red', disabled: false };

    expect(mergeSelectComponentAttributes({}, generated, own, 'root')).toEqual(generated);
    expect(mergeSelectComponentAttributes({}, generated, own, 'input')).toEqual({ ...generated, ...own });
    expect(own.value).toBe('authored'); expect(generated.value).toBe('query');
  });

  it.each(['root', 'input'] as const)('runs both %s callbacks after cancellation in the Source order', slot => {
    const events: string[] = [];
    const generated = { onkeydown: (event: Event) => { events.push('generated'); event.preventDefault(); } };
    const own = { onkeydown: (event: Event) => { events.push('own'); event.preventDefault(); } };
    const attrs = mergeSelectComponentAttributes({ onkeydown: generated.onkeydown }, generated, own, slot);
    const event = new Event('keydown', { cancelable: true });
    attrs.onkeydown(event);

    expect(events).toEqual(slot === 'root' ? ['generated', 'own'] : ['own', 'generated']);
    expect(event.defaultPrevented).toBe(true);
  });

  it('preserves an own undefined input value and suppresses disconnected callbacks', () => {
    let changes = 0;
    const attrs = mergeSelectComponentAttributes({ value: 'query' as string | undefined,
      oninput: (_event: unknown) => { changes++; } }, { value: 'query' }, { value: undefined }, 'input');

    attrs.oninput({ currentTarget: { isConnected: false } });
    expect(changes).toBe(0);
    attrs.oninput({ currentTarget: { isConnected: true } });
    expect(changes).toBe(1);
    expect(Object.hasOwn(attrs, 'value')).toBe(true); expect(attrs.value).toBeUndefined();
  });
});

describe('Select component references', () => {
  it('calls raw native methods with their original receiver and FocusOptions', () => {
    const effects: unknown[] = [];
    const options = { preventScroll: true };
    const node = { nodeType: 1,
      focus(this: unknown, supplied?: FocusOptions) { effects.push(['focus', this, supplied]); },
      blur(this: unknown) { effects.push(['blur', this]); }
    } as unknown as HTMLInputElement;
    focusSelectComponent(node, options); blurSelectComponent(node);

    expect(effects).toEqual([['focus', node, options], ['blur', node]]);
    expect(selectComponentNativeElement(node)).toBe(node);
  });

  it('uses composite methods rather than the underlying DOM methods', () => {
    const effects: unknown[] = [];
    const nativeElement = { nodeType: 1,
      focus() { effects.push('native-focus'); }, blur() { effects.push('native-blur'); }
    } as unknown as HTMLInputElement;
    const ref = { nativeElement,
      focus(this: unknown, options?: FocusOptions) { effects.push(['focus', this, options]); },
      blur(this: unknown) { effects.push(['blur', this]); }
    };
    const options = { preventScroll: true };
    focusSelectComponent(ref, options); blurSelectComponent(ref);

    expect(effects).toEqual([['focus', ref, options], ['blur', ref]]);
    expect(selectComponentNativeElement(ref)).toBe(nativeElement);
  });

  it('leaves native-only composites and absent registrations inert for public focus and blur', () => {
    const effects: string[] = [];
    const nativeElement = { nodeType: 1,
      focus() { effects.push('focus'); }, blur() { effects.push('blur'); }
    } as unknown as HTMLInputElement;
    for (const ref of [{ nativeElement }, undefined, null]) {
      focusSelectComponent(ref); blurSelectComponent(ref);
    }

    expect(effects).toEqual([]);
    expect(selectComponentNativeElement({ nativeElement })).toBe(nativeElement);
    expect(selectComponentNativeElement(undefined)).toBeUndefined();
  });

  it('keeps a raw DOM node even if it has an unrelated nativeElement property', () => {
    const other = { nodeType: 1 } as unknown as HTMLElement;
    const node = { nodeType: 1, nativeElement: other } as unknown as HTMLElement;

    expect(selectComponentNativeElement(node)).toBe(node);
  });

  it('prefers an explicit composite editor and otherwise resolves the physical input', () => {
    const editor = { nodeType: 1, matches: (selector: string) => selector === 'input,textarea' } as unknown as HTMLTextAreaElement;
    const queried: string[] = [];
    const nativeElement = { nodeType: 1, matches: () => false,
      querySelector(selector: string) { queried.push(selector); return editor; }
    } as unknown as HTMLDivElement;

    expect(selectComponentInputElement({ nativeElement, inputElement: editor })).toBe(editor);
    expect(queried).toEqual([]);
    expect(selectComponentInputElement(editor)).toBe(editor);
    expect(selectComponentInputElement({ nativeElement })).toBe(editor);
    expect(queried).toEqual(['input,textarea']);
    expect(selectComponentInputElement(undefined)).toBeUndefined();
  });
});
