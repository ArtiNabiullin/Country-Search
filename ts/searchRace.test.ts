import { describe, expect, it, vi, afterEach } from 'vitest';
import { searchController } from './searchController.js';
import { searchCountries } from './searchCountries.js';

describe('searchRace', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('delivers only the latest search result', async () => {
    vi.useFakeTimers();

    const onResults = vi.fn();
    const onError = vi.fn();
    const search = searchController(searchCountries, 300, onError, onResults);

    vi.spyOn(AbortSignal, 'timeout').mockImplementation(
      () => new AbortController().signal,
    );

    const pendingRequests: Array<{
      url: string;
      signal: AbortSignal;
      resolve: (response: Response) => void;
    }> = [];

    const mockFetch = vi.fn(
      (url: string, options: { signal: AbortSignal }) =>
        new Promise<Response>((resolve) => {
          pendingRequests.push({
            url,
            signal: options.signal,
            resolve,
          });
        }),
    );
    vi.stubGlobal('fetch', mockFetch);

    search.onInput('sp');
    await vi.advanceTimersByTimeAsync(300);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(pendingRequests[0]?.url).toBe('https://countries.dev/name/sp');

    search.onInput('spain');

    expect(pendingRequests[0]?.signal.aborted).toBe(true);

    await vi.advanceTimersByTimeAsync(300);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(pendingRequests[1]?.url).toBe('https://countries.dev/name/spain');

    const spainResults = [{ name: 'Spain' }];
    pendingRequests[1]?.resolve(
      new Response(JSON.stringify(spainResults), { status: 200 }),
    );
    await vi.advanceTimersByTimeAsync(0);

    pendingRequests[0]?.resolve(
      new Response(JSON.stringify([{ name: 'старый результат' }]), {
        status: 200,
      }),
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(onResults).toHaveBeenCalledTimes(1);
    expect(onResults).toHaveBeenLastCalledWith(spainResults);
    expect(onError).not.toHaveBeenCalled();
  });

  it('aborts the previous fetch and ignores its AbortError', async () => {
    vi.useFakeTimers();

    const onResults = vi.fn();
    const onError = vi.fn();
    const search = searchController(searchCountries, 300, onError, onResults);

    vi.spyOn(AbortSignal, 'timeout').mockImplementation(
      () => new AbortController().signal,
    );

    const pendingRequests: Array<{
      url: string;
      signal: AbortSignal;
      resolve: (response: Response) => void;
    }> = [];

    const mockFetch = vi.fn(
      (url: string, options: { signal: AbortSignal }) =>
        new Promise<Response>((resolve, reject) => {
          pendingRequests.push({
            url,
            signal: options.signal,
            resolve,
          });

          options.signal.addEventListener(
            'abort',
            () => reject(options.signal.reason),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', mockFetch);

    search.onInput('sp');
    await vi.advanceTimersByTimeAsync(300);

    search.onInput('spain');

    expect(pendingRequests[0]?.signal.aborted).toBe(true);
    expect(pendingRequests[0]?.signal.reason).toMatchObject({
      name: 'AbortError',
    });

    await vi.advanceTimersByTimeAsync(300);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(pendingRequests[1]?.url).toBe('https://countries.dev/name/spain');

    const spainResults = [{ name: 'Spain' }];
    pendingRequests[1]?.resolve(
      new Response(JSON.stringify(spainResults), { status: 200 }),
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(onResults).toHaveBeenCalledTimes(1);
    expect(onResults).toHaveBeenCalledWith(spainResults);
    expect(onError).not.toHaveBeenCalled();
  });
});
