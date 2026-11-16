interface ApiLanguage {
  iso639_1: string;
  name: string;
}

interface ApiCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface RawCountryResponse {
  name: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  area: number;
  languages: ApiLanguage[];
  currencies: ApiCurrency[];
  flag: string;
  flags?: {
    png?: string;
    svg?: string;
  };
  borders: string[];
}

export interface Country {
  name: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  area: number;
  languages: string[];
  currencies: string[];
  flag: string;
  borders: string[];
}

export function mapCountryResponse(raw: RawCountryResponse): Country {
  const countryResponse = {
    name: raw.name,
    capital: raw.capital,
    region: raw.region,
    subregion: raw.subregion,
    population: raw.population,
    area: raw.area,
    languages: raw.languages.map((language) => language.name),
    currencies: raw.currencies.map(
      (currency) => `${currency.name} (${currency.symbol})`,
    ),
    flag: raw.flags?.svg ?? raw.flag,
    borders: raw.borders,
  };

  return countryResponse;
}
