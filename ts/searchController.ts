import { debounce } from './debounce.js';

export function searchController(
  search: (query: string, signal: AbortSignal) => Promise<unknown>,
  delay: number,
  onError: (error: unknown) => void,
  onResults: (results: unknown) => void,
) {
  let activeController: AbortController | null = null;

  const debounced = debounce((query: string) => {
    if (!query.trim()) {
      return;
    }

    const controller = new AbortController();
    activeController = controller;
    void search(query, controller.signal)
      .then((results) => {
        if (!controller.signal.aborted) {
          onResults(results);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        onError(error);
      });
  }, delay);

  return {
    onInput: (query: string) => {
      activeController?.abort();

      if (!query.trim()) {
        onResults([]);
      }

      debounced(query);
    },
  };
}
