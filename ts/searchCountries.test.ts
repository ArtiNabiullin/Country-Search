import { describe, expect, it, vi, afterEach } from 'vitest';
import { searchCountries, HttpError } from './searchCountries.js';

describe('searchCountries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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

    expect(mockFetch).toHaveBeenCalledWith('https://countries.dev/name/spain', {
      signal: controller.signal,
    });
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

    expect(mockFetch).toHaveBeenCalledWith('https://countries.dev/name/spain', {
      signal: controller.signal,
    });
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
    expect(mockFetch).toHaveBeenCalledWith('https://countries.dev/name/spain', {
      signal: controller.signal,
    });
  });

  it('network error', async () => {
    const networkError = new TypeError('Failed to fetch');
    const fetchData = vi.fn().mockRejectedValue(networkError);

    vi.stubGlobal('fetch', fetchData);

    const controller = new AbortController();
    const request = searchCountries('spain', controller.signal);

    await expect(request).rejects.toBe(networkError);
  });
});
