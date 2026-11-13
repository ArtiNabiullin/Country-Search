interface ApiLanguage {
  iso639_1: string;
  name: string;
}

interface RawCountryResponse {
  name: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  area: number;
  languages: ApiLanguage[];
  flag: string;
  borders: string[];
}

interface Country {
  name: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  area: number;
  languages: string[];
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
    flag: raw.flag,
    borders: raw.borders,
  };

  return countryResponse;
}
