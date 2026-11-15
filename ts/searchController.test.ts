import { describe, expect, it, vi, afterEach } from 'vitest';
import { searchController } from './searchController.js';

describe("searchController", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("aborts the active request immediately when input changes", async () => {
    vi.useFakeTimers();

    const signals: AbortSignal[] = [];
    const mockSearch = vi.fn((_query: string, signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<never>(() => {});
    });

    const search = searchController(mockSearch, 300);
    search.onInput('sp');
    await vi.advanceTimersByTimeAsync(300);

    expect(mockSearch).toHaveBeenCalledTimes(1);

    search.onInput("spa");

    expect(signals[0]?.aborted).toBe(true);
    expect(mockSearch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(299);
    expect(mockSearch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(mockSearch).toHaveBeenCalledTimes(2);
  });
})