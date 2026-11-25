import { describe, expect, it } from 'vitest';
import {
  getDrawerMotionDuration, getDrawerPushDistance, getDrawerResizeSize, getDrawerSize,
  getDrawerTransform
} from './drawer.engine';

describe('Drawer dimensions', () => {
  it('resolves official presets and numeric pixel sizes', () => {
    expect(getDrawerSize()).toBe('378px');
    expect(getDrawerSize('large')).toBe('736px');
    expect(getDrawerSize(480)).toBe('480px');
    expect(getDrawerSize(320.5)).toBe('320.5px');
  });

  it('preserves custom CSS dimensions', () => {
    expect(getDrawerSize(' 50% ')).toBe('50%');
    expect(getDrawerSize('20vw')).toBe('20vw');
    expect(getDrawerSize('calc(100% - 24px)')).toBe('calc(100% - 24px)');
  });

  it('falls back for empty, nonpositive or nonfinite dimensions', () => {
    for (const size of ['', '  ', 0, -1, NaN, Infinity])
      expect(getDrawerSize(size)).toBe('378px');
  });

  it('supports numeric strings and a zero size reached by resizing', () => {
    expect(getDrawerSize('250.5')).toBe('250.5px');
    expect(getDrawerSize(0, true)).toBe('0px');
    expect(getDrawerSize(-1, true)).toBe('378px');
  });

  it('clamps the proposed size without treating a missing maximum as zero', () => {
    expect(getDrawerResizeSize('right', 200, 210, 400)).toBe(0);
    expect(getDrawerResizeSize('right', 200, -230, 400)).toBe(400);
    expect(getDrawerResizeSize('bottom', 200, -100, 0)).toBe(300);
    expect(getDrawerResizeSize('left', 200, 100)).toBe(300);
  });
});

describe('Drawer nested push distance', () => {
  it('distinguishes the default, inheritance, zero and pixel number strings', () => {
    expect(getDrawerPushDistance(undefined, 68)).toBe(180);
    expect(getDrawerPushDistance(true, 68)).toBe(68);
    expect(getDrawerPushDistance({}, 68)).toBe(68);
    expect(getDrawerPushDistance(false, 68)).toBe(0);
    expect(getDrawerPushDistance({ distance: 0 }, 68)).toBe(0);
    expect(getDrawerPushDistance({ distance: '36' })).toBe(36);
    expect(getDrawerPushDistance({ distance: '36px' })).toBe(0);
  });
});

describe('Drawer motion', () => {
  it('slides off the physical edge without changing placement in RTL', () => {
    expect(getDrawerTransform('top')).toBe('translateY(-100%)');
    expect(getDrawerTransform('right')).toBe('translateX(100%)');
    expect(getDrawerTransform('bottom')).toBe('translateY(100%)');
    expect(getDrawerTransform('left')).toBe('translateX(-100%)');
  });

  it('reads seconds, milliseconds and reduced motion durations', () => {
    expect(getDrawerMotionDuration(' 0.3s ')).toBe(300);
    expect(getDrawerMotionDuration('150ms')).toBe(150);
    expect(getDrawerMotionDuration('.2s')).toBe(200);
    expect(getDrawerMotionDuration('0s')).toBe(0);
  });

  it('uses the standard duration for missing or malformed tokens', () => {
    for (const value of ['', '-1s', 'auto', 'NaNms', '0.3'])
      expect(getDrawerMotionDuration(value)).toBe(300);
  });
});
