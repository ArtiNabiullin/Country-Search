import { describe, expect, it, vi, afterEach } from 'vitest';
import { searchController } from './searchController.js';

describe('searchController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('aborts the active request immediately when input changes', async () => {
    vi.useFakeTimers();

    const signals: AbortSignal[] = [];
    const mockSearch = vi.fn((_query: string, signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<never>(() => {});
    });

    const search = searchController(mockSearch, 300, vi.fn(), vi.fn());
    search.onInput('sp');
    await vi.advanceTimersByTimeAsync(300);

    expect(mockSearch).toHaveBeenCalledTimes(1);

    search.onInput('spa');

    expect(signals[0]?.aborted).toBe(true);
    expect(mockSearch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(299);
    expect(mockSearch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(mockSearch).toHaveBeenCalledTimes(2);
  });

  it('the request was aborted, the mock rejected with an AbortError, and the custom error handler was not called.', async () => {
    vi.useFakeTimers();

    const onError = vi.fn();
    const mockSearch = vi.fn(
      (_query: string, signal: AbortSignal) =>
        new Promise<never>((_, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );

    const search = searchController(mockSearch, 300, onError, vi.fn());

    search.onInput('sp');
    await vi.advanceTimersByTimeAsync(300);
    expect(mockSearch).toHaveBeenCalledTimes(1);

    search.onInput('spa');
    await Promise.resolve();
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onError for a network error', async () => {
    vi.useFakeTimers();

    const networkError = new TypeError('Network failed');
    const onError = vi.fn();
    const mockSearch = vi.fn().mockRejectedValue(networkError);

    const search = searchController(mockSearch, 300, onError, vi.fn());

    search.onInput('sp');
    await vi.advanceTimersByTimeAsync(300);
    expect(mockSearch).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    expect(onError).toHaveBeenCalledWith(networkError);
  });

  it('successful outcome', async () => {
    vi.useFakeTimers();

    const onError = vi.fn();
    const onResults = vi.fn();
    const countries = [{ name: 'Spain' }];
    const mockSearch = vi.fn().mockResolvedValue(countries);

    const search = searchController(mockSearch, 300, onError, onResults);

    search.onInput('spain');
    await vi.advanceTimersByTimeAsync(300);

    expect(onResults).toHaveBeenCalledWith(countries);
    expect(onError).not.toHaveBeenCalled();
  });

  it('checking for empty input', async () => {
    vi.useFakeTimers();

    const onError = vi.fn();
    const onResults = vi.fn();
    const countries = [{ name: 'Spain' }];
    const mockSearch = vi.fn().mockResolvedValue(countries);

    const search = searchController(mockSearch, 300, onError, onResults);

    search.onInput('sp');
    search.onInput('');
    expect(onResults).toHaveBeenCalledWith([]);

    await vi.advanceTimersByTimeAsync(300);

    expect(mockSearch).not.toHaveBeenCalled();
  });
});
