import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce a function', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 0);
    expect(typeof debounced).toBe('function');
  });

  it('reset timer on ever call', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('does not call the function immediately', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 300);

    debounced();
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('call with last arguments', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 300);

    debounced('s');
    debounced('sp');
    debounced('spain');

    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('spain');
  });
});
