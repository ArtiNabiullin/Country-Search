import { mapCountryResponse, type Country } from './mapCountryResponse.js';
import { HttpError, searchCountries } from './searchCountries.js';
import { searchController } from './searchController.js';

const app = document.createElement('main');
app.className = 'app';

const heading = document.createElement('h1');
heading.textContent = 'Поиск стран';

const introduction = document.createElement('p');
introduction.className = 'app__intro';
introduction.textContent =
  'Введите название страны, чтобы посмотреть информацию.';

const searchLabel = document.createElement('label');
searchLabel.className = 'search__label';
searchLabel.htmlFor = 'country-query';
searchLabel.textContent = 'Название страны';

const input = document.createElement('input');
input.className = 'search__input';
input.id = 'country-query';
input.type = 'search';
input.autocomplete = 'off';
input.placeholder = 'Например, Spain';
input.setAttribute('aria-describedby', 'search-status');

const status = document.createElement('p');
status.className = 'search__status';
status.id = 'search-status';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
status.textContent = 'Начните вводить название страны.';

const retryButton = document.createElement('button');
retryButton.className = 'button button--secondary';
retryButton.type = 'button';
retryButton.textContent = 'Повторить поиск';
retryButton.hidden = true;

const countryList = document.createElement('ul');
countryList.className = 'country-list';
countryList.setAttribute('aria-label', 'Результаты поиска');

const detailDialog = document.createElement('dialog');
detailDialog.className = 'country-dialog';
detailDialog.setAttribute('aria-labelledby', 'country-detail-title');

const detailHeading = document.createElement('h2');
detailHeading.id = 'country-detail-title';

const closeButton = document.createElement('button');
closeButton.className = 'button button--secondary country-dialog__close';
closeButton.type = 'button';
closeButton.textContent = 'Закрыть';

const detailList = document.createElement('dl');
detailList.className = 'country-details';

detailDialog.append(closeButton, detailHeading, detailList);
app.append(
  heading,
  introduction,
  searchLabel,
  input,
  status,
  retryButton,
  countryList,
);
document.body.append(app, detailDialog);

let lastQuery = '';

function updateStatus(message: string): void {
  status.textContent = message;
}

function addCountryDetails(country: Country): void {
  const details: Array<[string, string]> = [
    ['Столица', country.capital],
    ['Регион', country.region],
    ['Подрегион', country.subregion],
    ['Население', new Intl.NumberFormat('ru-RU').format(country.population)],
    ['Площадь', `${new Intl.NumberFormat('ru-RU').format(country.area)} км²`],
    ['Языки', country.languages.join(', ') || 'Нет данных'],
    ['Границы', country.borders.join(', ') || 'Нет данных'],
    ['Валюта', country.currencies.join(', ') || 'Нет данных'],
  ];

  detailList.replaceChildren();

  for (const [label, value] of details) {
    const term = document.createElement('dt');
    term.textContent = label;

    const description = document.createElement('dd');
    description.textContent = value;

    detailList.append(term, description);
  }
}

function showCountryDetails(country: Country): void {
  detailHeading.textContent = country.name;
  addCountryDetails(country);
  detailDialog.showModal();
}

function createCountryCard(country: Country): HTMLLIElement {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.className = 'country-card';
  button.type = 'button';
  button.addEventListener('click', () => showCountryDetails(country));

  const flag = document.createElement('span');
  flag.className = 'country-card__flag';

  if (country.flag.startsWith('http')) {
    const image = document.createElement('img');
    image.src = country.flag;
    image.alt = `Флаг страны ${country.name}`;
    image.loading = 'lazy';
    flag.append(image);
  } else {
    flag.textContent = country.flag;
    flag.setAttribute('aria-hidden', 'true');
  }

  const name = document.createElement('span');
  name.className = 'country-card__name';
  name.textContent = country.name;

  const capital = document.createElement('span');
  capital.className = 'country-card__meta';
  capital.textContent = `Столица: ${country.capital}`;

  const region = document.createElement('span');
  region.className = 'country-card__meta';
  region.textContent = `${country.region} · ${country.subregion}`;

  const population = document.createElement('span');
  population.className = 'country-card__meta';
  population.textContent = `Население: ${new Intl.NumberFormat('ru-RU').format(country.population)}`;

  button.append(flag, name, capital, region, population);
  item.append(button);
  return item;
}

function renderResults(countries: Country[]): void {
  countryList.replaceChildren();
  retryButton.hidden = true;

  if (!input.value.trim()) {
    updateStatus('Начните вводить название страны.');
    return;
  }

  if (countries.length === 0) {
    updateStatus('Страны с таким названием не найдены.');
    return;
  }

  for (const country of countries) {
    countryList.append(createCountryCard(country));
  }

  updateStatus(`Найдено стран: ${countries.length}.`);
}

function showError(error: unknown): void {
  countryList.replaceChildren();
  retryButton.hidden = false;

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    updateStatus('Превышено время ожидания. Попробуйте ещё раз.');
  } else if (error instanceof HttpError) {
    updateStatus(`Ошибка сервера (HTTP ${error.status}). Попробуйте ещё раз.`);
  } else {
    updateStatus(
      'Не удалось выполнить поиск из-за сетевой ошибки. Попробуйте ещё раз.',
    );
  }
}

const search = searchController(
  async (query, signal) => {
    const rawCountries = await searchCountries(query, signal);
    return rawCountries.map(mapCountryResponse);
  },
  300,
  showError,
  renderResults,
);

input.addEventListener('input', () => {
  lastQuery = input.value.trim();
  countryList.replaceChildren();
  retryButton.hidden = true;

  if (lastQuery) {
    updateStatus('Ищем страны…');
  }

  search.onInput(lastQuery);
});

retryButton.addEventListener('click', () => {
  if (!lastQuery) return;

  countryList.replaceChildren();
  retryButton.hidden = true;
  updateStatus('Ищем страны…');
  search.onInput(lastQuery);
});

closeButton.addEventListener('click', () => detailDialog.close());
