import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { WcaCompetition } from './lib/types';
import { queryClient } from './lib/queryClient';

jest.mock('./components/SearchAreaMap', () => ({
  SearchAreaMap: () => <div data-testid="search-area-map" />,
}));

const seattle = {
  lat: '47.6038',
  lon: '-122.3301',
  name: 'Seattle',
  display_name: 'Seattle, King County, Washington, United States',
  address: {
    city: 'Seattle',
    country: 'United States',
    country_code: 'us',
    state: 'Washington',
  },
};

const competition = (overrides: Partial<WcaCompetition>): WcaCompetition => ({
  id: 'SeattleSummerOpen2026',
  name: 'Seattle Summer Open 2026',
  start_date: '2026-08-01',
  end_date: '2026-08-01',
  city: 'Seattle, Washington',
  venue: 'Seattle Center',
  url: 'https://www.worldcubeassociation.org/competitions/SeattleSummerOpen2026',
  website:
    'https://www.worldcubeassociation.org/competitions/SeattleSummerOpen2026',
  latitude_degrees: 47.6038,
  longitude_degrees: -122.3301,
  country_iso2: 'US',
  event_ids: ['333', '222'],
  cancelled_at: null,
  ...overrides,
});

const responseFor = (body: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => body,
  });

describe('Seattle event search', () => {
  const originalFetch = globalThis.fetch;
  let wcaRequestCount = 0;
  let wcaRequestUrls: string[] = [];
  let geocoderRequestCount = 0;

  beforeEach(() => {
    window.localStorage.clear();
    queryClient.clear();
    wcaRequestCount = 0;
    wcaRequestUrls = [];
    geocoderRequestCount = 0;
    globalThis.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('photon.komoot.io')) {
        geocoderRequestCount += 1;

        if (url.includes('/reverse?')) {
          return responseFor({
            features: [
              {
                geometry: {
                  coordinates: [-122.58725, 47.47935],
                },
                properties: {
                  country: 'United States',
                  countrycode: 'us',
                  name: 'Long Lake Road Southeast',
                  state: 'Washington',
                  type: 'street',
                },
              },
            ],
          }) as Promise<Response>;
        }

        return responseFor({
          features: [
            {
              geometry: {
                coordinates: [Number(seattle.lon), Number(seattle.lat)],
              },
              properties: {
                city: seattle.address.city,
                country: seattle.address.country,
                countrycode: seattle.address.country_code,
                name: seattle.name,
                state: seattle.address.state,
                type: 'city',
              },
            },
          ],
        }) as Promise<Response>;
      }

      if (
        url.includes('api.worldcubeassociation.org') ||
        url.includes('staging.worldcubeassociation.org')
      ) {
        if (url.includes('/me?')) {
          return responseFor({
            user: {
              id: 1,
              name: 'WCA User',
              wca_id: '2020USER01',
            },
            ongoing_competitions: [competition({})],
            upcoming_competitions: [],
          }) as Promise<Response>;
        }

        wcaRequestCount += 1;
        wcaRequestUrls.push(url);
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.has('q')) {
          return responseFor([competition({})]) as Promise<Response>;
        }

        const page = requestUrl.searchParams.get('page');
        if (page === '1') {
          const competitions = [
            competition({}),
            competition({
              id: 'TacomaSpringOpen2026',
              name: 'Tacoma Spring Open 2026',
              start_date: '2026-07-01',
              end_date: '2026-07-01',
              city: 'Tacoma, Washington',
              event_ids: ['333', 'pyram'],
              latitude_degrees: 47.2529,
              longitude_degrees: -122.4443,
            }),
          ];

          if (new URL(url).searchParams.get('end') === '2027-08-24') {
            competitions.push(
              competition({
                id: 'SeattleFallOpen2026',
                name: 'Seattle Fall Open 2026',
                start_date: '2026-09-12',
                end_date: '2026-09-13',
                event_ids: ['333', 'pyram'],
              }),
            );
          }

          if (requestUrl.searchParams.get('start') === '2024-08-24') {
            competitions.push(
              competition({
                id: 'OldHistoryOpen2024',
                name: 'Old History Open 2024',
                start_date: '2024-09-12',
                end_date: '2024-09-13',
                event_ids: ['444'],
              }),
            );
          }

          return responseFor(competitions) as Promise<Response>;
        }

        return responseFor([]) as Promise<Response>;
      }

      throw new Error(`Unexpected request: ${url}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads Seattle results and applies a smaller radius', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Search results' }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('3×3×3 Cube')).toBeInTheDocument();
    expect(screen.getByText('Pyraminx')).toBeInTheDocument();
    expect(screen.getByText('Tacoma Spring Open 2026')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Search back' })).toHaveValue(
      '12',
    );

    const requestsAfterInitialLoad = wcaRequestCount;
    const geocoderRequestsAfterInitialLoad = geocoderRequestCount;
    expect(
      wcaRequestUrls.every((url) => new URL(url).searchParams.has('per_page')),
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'By event' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('columnheader', { name: 'Competition' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Last held' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'By competition' }));
    expect(
      screen.getByRole('region', { name: 'Event results' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('columnheader', {
        name: 'Times held',
      }),
    ).toHaveLength(1);
    expect(wcaRequestCount).toBe(requestsAfterInitialLoad);

    const radiusInput = screen.getByRole('spinbutton', { name: /Radius/ });
    await user.clear(radiusInput);
    await user.type(radiusInput, '10');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(
        screen.queryByText('Tacoma Spring Open 2026'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('Pyraminx')).toBeInTheDocument();
    expect(geocoderRequestCount).toBe(geocoderRequestsAfterInitialLoad);
  });

  it('loads a signed-in competition and shows its event plan', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('comp-planner:wca-access-token', 'test-token');
    window.localStorage.setItem(
      'comp-planner:wca-access-token-expires-at',
      String(Date.now() + 60_000),
    );
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('My upcoming competitions'),
      ).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText('My upcoming competitions'),
      'SeattleSummerOpen2026',
    );

    await waitFor(() => {
      expect(screen.getByText('Competition plan')).toBeInTheDocument();
    });
    expect(screen.getByText('Events in this competition')).toBeInTheDocument();
    expect(screen.getByText('Suggested events')).toBeInTheDocument();
  });

  it('fetches the expanded history window after changing search back', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Search results' }),
      ).toBeInTheDocument();
    });

    const historySelect = screen.getByRole('combobox', {
      name: 'Search back',
    });
    await user.selectOptions(historySelect, '18');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(
        wcaRequestUrls.some(
          (url) => new URL(url).searchParams.get('start') === '2025-02-24',
        ),
      ).toBe(true);
    });

    const requestCountAfter18Months = wcaRequestUrls.length;
    await user.selectOptions(historySelect, '24');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(
        wcaRequestUrls.some(
          (url) => new URL(url).searchParams.get('start') === '2024-08-24',
        ),
      ).toBe(true);
    });
    expect(screen.getByText('Old History Open 2024')).toBeInTheDocument();
    expect(wcaRequestUrls.length).toBeGreaterThan(requestCountAfter18Months);
  });

  it('identifies country and state when searching with coordinates', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Search results' }),
      ).toBeInTheDocument();
    });

    const citySearch = screen.getByRole('textbox', { name: 'Pick a city' });
    await user.clear(citySearch);
    await user.type(citySearch, '47.47935, -122.58725');
    await user.click(screen.getByRole('button', { name: 'Find city' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Entire state' }),
      ).toBeEnabled();
    });
    expect(
      screen.getByRole('checkbox', { name: 'Same country' }),
    ).toBeChecked();
    expect(
      screen.queryByText(/No country could be identified/),
    ).not.toBeInTheDocument();
  });

  it('searches neighboring countries only when same-country search is disabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Search results' }),
      ).toBeInTheDocument();
    });

    const sameCountryCheckbox = screen.getByRole('checkbox', {
      name: 'Same country',
    });
    expect(sameCountryCheckbox).toBeChecked();
    await user.click(sameCountryCheckbox);
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      const countryCodes = wcaRequestUrls.map((url) =>
        new URL(url).searchParams.get('country_iso2'),
      );
      expect(countryCodes).toContain('CA');
      expect(countryCodes).toContain('MX');
    });
    expect(
      wcaRequestUrls.some(
        (url) => !new URL(url).searchParams.has('country_iso2'),
      ),
    ).toBe(false);
  });

  it('searches public competitions while signed out', async () => {
    const user = userEvent.setup();
    render(<App />);

    const competitionSearch =
      await screen.findByLabelText('Pick a competition');
    await user.type(competitionSearch, 'Seattle');

    const competitionOption = await screen.findByRole('option', {
      name: /Seattle Summer Open 2026/,
    });
    await user.click(competitionOption);

    await waitFor(() => {
      expect(screen.getByText('Competition plan')).toBeInTheDocument();
    });
    expect(screen.getByText('Events in this competition')).toBeInTheDocument();
  });

  it('shows upcoming competitions when the toggle is enabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Search results' }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Include upcoming competitions',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Upcoming competitions' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Seattle Fall Open 2026')).toBeInTheDocument();
  });
});
