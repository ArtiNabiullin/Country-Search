import { describe, expect, it, vi, afterEach } from 'vitest';
import { searchCountries, HttpError } from './searchCountries.js';

describe('searchCountries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('successful response: an array of countries is returned', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ['spain', 'russia', 'usa'],
    });

    vi.stubGlobal('fetch', mockFetch);

    const controller = new AbortController();
    const countries = await searchCountries('spain', controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://countries.dev/name/spain',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(countries).toEqual(['spain', 'russia', 'usa']);
  });

  it('404 response: an empty array is returned', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    vi.stubGlobal('fetch', mockFetch);

    const controller = new AbortController();
    const countries = await searchCountries('spain', controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://countries.dev/name/spain',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(countries).toEqual([]);
  });

  it('different HTTP status, for example 500', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    vi.stubGlobal('fetch', mockFetch);

    const controller = new AbortController();
    const request = searchCountries('spain', controller.signal);

    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({ status: 500 });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://countries.dev/name/spain',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('network error', async () => {
    const networkError = new TypeError('Failed to fetch');
    const fetchData = vi.fn().mockRejectedValue(networkError);

    vi.stubGlobal('fetch', fetchData);

    const controller = new AbortController();
    const request = searchCountries('spain', controller.signal);

    await expect(request).rejects.toBe(networkError);
  });

  it('timeout signal aborts fetch with TimeoutError', async () => {
    const timeoutController = new AbortController();
    const timeoutSpy = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(timeoutController.signal);

    const mockFetch = vi.fn((url: string, options: { signal: AbortSignal }) => {
      expect(url).toBe('https://countries.dev/name/spain');

      return new Promise<never>((_, reject) => {
        options.signal.addEventListener(
          'abort',
          () => reject(options.signal.reason),
          { once: true },
        );
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const userController = new AbortController();

    const request = searchCountries('spain', userController.signal);

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Number));

    const timeoutError = new DOMException('Timed out', 'TimeoutError');
    timeoutController.abort(timeoutError);

    await expect(request).rejects.toBe(timeoutError);
  });

  it('user abort cancels fetch through the combined signal', async () => {
    const timeoutController = new AbortController();
    const timeoutSpy = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(timeoutController.signal);

    const mockFetch = vi.fn((url: string, options: { signal: AbortSignal }) => {
      expect(url).toBe('https://countries.dev/name/spain');

      return new Promise<never>((_, reject) => {
        options.signal.addEventListener(
          'abort',
          () => reject(options.signal.reason),
          { once: true },
        );
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const userController = new AbortController();
    const request = searchCountries('spain', userController.signal);

    userController.abort();

    expect(timeoutSpy).toHaveBeenCalledTimes(1);
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
