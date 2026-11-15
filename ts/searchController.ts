import { debounce } from './debounce.js';

export function searchController(
  search: (query: string, signal: AbortSignal) => Promise<unknown>,
  delay: number,
  onError: (error: unknown) => void,
) {
  let activeController: AbortController | null = null;

  const debounced = debounce((query: string) => {
    const controller = new AbortController();
    activeController = controller;
    void search(query, controller.signal).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      onError(error);
    });
  }, delay);

  return {
    onInput: (query: string) => {
      activeController?.abort();
      debounced(query);
    },
  };
}
