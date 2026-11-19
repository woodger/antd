import { expect, it } from 'vitest';
import { verifySelectComponentsResponsiveSSRLayout } from '../browser/select-components-responsive-ssr-assertions';
const source = '<div class="ant-select-content"><div class="ant-select-content-item ant-select-content-item-rest"><span><span data-custom-tag-label="rest">+ 4 ...</span></span></div></div>';
const actual = '<div class="ant-select-content" data-ant-select-content="true"><div class="ant-select-content-item ant-select-content-item-rest" data-select-rest="true"><span data-select-custom-tag="" role="presentation"><span data-custom-tag-label="rest">+ 4 ...</span></span></div></div>';
it('permits the exact custom SPAN annotations only in the explicitly enabled Overflow renderer context', () => {
  expect(() => verifySelectComponentsResponsiveSSRLayout(
    actual,
    source,
    'custom',
    { responsiveCustomTag: true }
  )).not.toThrow();
  expect(() => verifySelectComponentsResponsiveSSRLayout(
    actual,
    source,
    'old-default-remains-strict'
  )).toThrow();
});
it('rejects wrong role, unknown attrs, wrong tag, or a wrapper outside the measured Overflow item', () => {
  for (const changed of [actual.replace('role="presentation"', 'role="button"'), actual.replace(
    'role="presentation"',
    'role="presentation" data-unexpected=""'
  ),
    actual.replace('<span data-select-custom-tag', '<div data-select-custom-tag').replace(
      '</span></div></div>',
      '</div></div></div>'
    )]) {
    expect(() => verifySelectComponentsResponsiveSSRLayout(
      changed,
      source,
      'malformed',
      { responsiveCustomTag: true }
    )).toThrow();
  }
  expect(() => verifySelectComponentsResponsiveSSRLayout(actual.replaceAll(
    'ant-select-content-item-rest',
    'ant-select-content-item-suffix'
  ),
    source.replaceAll('ant-select-content-item-rest', 'ant-select-content-item-suffix'), 'suffix-is-not-a-tag', { responsiveCustomTag: true })).toThrow();
});
