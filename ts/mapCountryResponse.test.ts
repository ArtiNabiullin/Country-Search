import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from './mapCountryResponse.js';

describe("mapCountryResponse", () => {
  it("verifying that all fields in the country card are loaded", () => {
    const rawCountry = {
      "name": "United States of America",
      "capital": "Washington, D.C.",
      "region": "Americas",
      "subregion": "North America",
      "population": 329484123,
      "area": 9372610,
      "languages": [{ "iso639_1": "en", "name": "English" }],
      "flag": "https://countries.dev/flags/us.svg",
      "borders": ["CAN", "MEX"]
    };
    const cardFields = {
      "name": "United States of America",
      "capital": "Washington, D.C.",
      "region": "Americas",
      "subregion": "North America",
      "population": 329484123,
      "area": 9372610,
      "languages": ["English"],
      "flag": "https://countries.dev/flags/us.svg",
      "borders": ["CAN", "MEX"],
    };
    expect(mapCountryResponse(rawCountry)).toEqual(cardFields);
  })
})