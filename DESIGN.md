# Design notes

## Request cancellation and debounce

Each search request receives an `AbortSignal` from an `AbortController`. When
the input changes, [searchController.ts](./ts/searchController.ts) aborts the
active request immediately, before the next debounced request starts. This
avoids spending time and network resources on a query the user has already
replaced.

The controller also checks whether a request was aborted before publishing its
results. This protects the interface if a request implementation completes
after cancellation. An `AbortError` is expected during normal typing and is not
reported as a user-facing error.

[searchCountries.ts](./ts/searchCountries.ts) combines the controller's signal
with a 10-second timeout signal. A timeout is a different failure from a user
initiated abort, so it is passed to the error handler and shown as a retryable
timeout message.

The debounce delay is 300 ms. It allows a short pause for a user to finish
typing, reducing unnecessary requests while keeping search results responsive.
The debounce helper resets its timer on each call, so only the most recent
input in a burst starts a request.

## Complexity of `mapCountryResponse`

In [mapCountryResponse.ts](./ts/mapCountryResponse.ts), the language and
currency arrays are each traversed once to build the display values. If `L` is
the number of languages and `C` is the number of currencies, the running time
is **O(L + C)**. The mapped language and currency arrays require **O(L + C)**
additional space. Copying the remaining scalar fields takes constant time.

There is no response cache in this implementation.

## Clean-code decisions

- **Separate responsibilities:** [searchCountries.ts](./ts/searchCountries.ts)
  handles HTTP requests and status codes, while
  [mapCountryResponse.ts](./ts/mapCountryResponse.ts) converts API data into
  the shape used by the interface.
- **Keep search coordination out of the view:**
  [searchController.ts](./ts/searchController.ts) owns debounce and
  cancellation; [main.ts](./ts/main.ts) connects it to the input and renders
  results and errors.
- **Use explicit types and errors:** the API response and displayed country
  have separate types, and non-404 HTTP failures are represented by
  `HttpError` rather than being silently treated as an empty result.
- **Build DOM safely and accessibly:** [main.ts](./ts/main.ts) uses DOM methods
  and `textContent` for displayed data, provides a label for the search input,
  announces status updates, and uses a dialog for country details.
