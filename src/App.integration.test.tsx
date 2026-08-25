import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { WcaCompetition } from './lib/types';

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
    wcaRequestCount = 0;
    wcaRequestUrls = [];
    geocoderRequestCount = 0;
    globalThis.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('photon.komoot.io')) {
        geocoderRequestCount += 1;
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
            me: {
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

    const requestsAfterInitialLoad = wcaRequestCount;
    const geocoderRequestsAfterInitialLoad = geocoderRequestCount;
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
        name: 'Times held in last year',
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
    expect(screen.queryByText('Pyraminx')).not.toBeInTheDocument();
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
