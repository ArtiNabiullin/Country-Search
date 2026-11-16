export class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

export async function searchCountries(query: string, signal: AbortSignal) {
  const url = `https://countries.dev/name/${encodeURIComponent(query)}`;
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const requestSignal = AbortSignal.any([signal, timeoutSignal]);
  const response = await fetch(url, { signal: requestSignal });

  if (response.status === 404) return [];
  if (!response.ok) throw new HttpError(response.status);

  return response.json();
}
