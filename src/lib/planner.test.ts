import {
  getEventSummaries,
  getSearchCountryCodes,
  getSearchDateRange,
} from './planner';
import { WcaCompetition } from './types';

const competition = (overrides: Partial<WcaCompetition>): WcaCompetition => ({
  id: 'LocalOpen2026',
  name: 'Local Open 2026',
  start_date: '2026-08-01',
  end_date: '2026-08-01',
  city: 'Seattle, Washington',
  venue: 'Community Center',
  url: 'https://example.com/local-open',
  website: 'https://example.com/local-open',
  latitude_degrees: 47.6,
  longitude_degrees: -122.3,
  country_iso2: 'US',
  event_ids: ['333'],
  cancelled_at: null,
  ...overrides,
});

describe('getEventSummaries', () => {
  it('sorts events by last held date and counts the previous 12 months', () => {
    const results = getEventSummaries(
      [
        competition({ event_ids: ['333'] }),
        competition({
          id: 'JulyOpen2026',
          name: 'July Open 2026',
          start_date: '2026-07-01',
          end_date: '2026-07-01',
          event_ids: ['222'],
        }),
        competition({
          id: 'EarlierOpen2026',
          name: 'Earlier Open 2026',
          start_date: '2026-01-01',
          end_date: '2026-01-01',
          event_ids: ['333'],
        }),
        competition({
          id: 'OldOpen2025',
          name: 'Old Open 2025',
          start_date: '2025-01-01',
          end_date: '2025-01-01',
          event_ids: ['222'],
        }),
        competition({
          id: 'FarOpen2026',
          name: 'Far Open 2026',
          latitude_degrees: 48.5,
          longitude_degrees: -122.3,
          event_ids: ['555'],
        }),
        competition({
          id: 'SeattleFallOpen2026',
          name: 'Seattle Fall Open 2026',
          start_date: '2026-09-12',
          end_date: '2026-09-13',
          event_ids: ['pyram'],
        }),
      ],
      { latitude: 47.6, longitude: -122.3 },
      '2026-08-24',
      { mode: 'radius', radiusMiles: 50 },
    );

    expect(results.competitionCount).toBe(4);
    expect(results.events.map((event) => event.id)).toEqual(['222', '333']);
    expect(results.events[0].heldInLast12Months).toBe(1);
    expect(results.events[1].heldInLast12Months).toBe(2);
    expect(results.events[0].lastCompetitionName).toBe('July Open 2026');
    expect(results.events[1].lastCompetitionName).toBe('Local Open 2026');
    expect(results.eventGroups.map((group) => group.competitionName)).toEqual([
      'July Open 2026',
      'Local Open 2026',
    ]);
    expect(results.eventGroups[1].events.map((event) => event.id)).toEqual([
      '333',
    ]);
    expect(results.upcomingCompetitions.map((upcoming) => upcoming.id)).toEqual(
      ['SeattleFallOpen2026'],
    );
  });

  it('extends the WCA request by 12 months when upcoming competitions are included', () => {
    expect(getSearchDateRange('2026-08-24', true)).toEqual({
      endDate: '2027-08-24',
      startDate: '2025-08-24',
    });
  });

  it('uses the selected history window for the WCA request', () => {
    expect(getSearchDateRange('2026-08-24', false, 24)).toEqual({
      endDate: '2026-08-24',
      startDate: '2024-08-24',
    });
  });

  it('filters competitions by state and PNW region', () => {
    const competitions = [
      competition({
        id: 'WashingtonOpen2026',
        event_ids: ['333'],
        city: 'Seattle, Washington',
      }),
      competition({
        id: 'OregonOpen2026',
        event_ids: ['222'],
        city: 'Portland, Oregon',
        latitude_degrees: 45.5,
        longitude_degrees: -122.6,
      }),
      competition({
        id: 'CaliforniaOpen2026',
        event_ids: ['555'],
        city: 'Redding, California',
        latitude_degrees: 40.6,
        longitude_degrees: -122.4,
      }),
    ];

    const stateResults = getEventSummaries(
      competitions,
      { latitude: 47.6, longitude: -122.3 },
      '2026-08-24',
      { mode: 'state', stateName: 'Washington' },
    );
    const regionResults = getEventSummaries(
      competitions,
      { latitude: 47.6, longitude: -122.3 },
      '2026-08-24',
      {
        mode: 'region',
        region: {
          id: 'pnw',
          name: 'Pacific Northwest',
          states: ['Alaska', 'Washington', 'Oregon'],
        },
      },
    );

    expect(stateResults.events.map((event) => event.id)).toEqual(['333']);
    expect(regionResults.events.map((event) => event.id)).toEqual([
      '222',
      '333',
    ]);
  });
});

describe('getSearchCountryCodes', () => {
  it('keeps same-country searches narrow and adds only known neighbors', () => {
    expect(getSearchCountryCodes('US', true)).toEqual(['US']);
    expect(getSearchCountryCodes('US', false)).toEqual(['US', 'CA', 'MX']);
    expect(getSearchCountryCodes('ZZ', false)).toEqual(['ZZ']);
  });
});
