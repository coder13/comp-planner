import {
  EventGroup,
  CompetitionEventInsight,
  EventSummary,
  EventSummaryResults,
  UpcomingCompetitionSummary,
  WcaCompetition,
} from './types';

export const DEFAULT_LOOKBACK_MONTHS = 12;
export const UPCOMING_MONTHS = 24;
export const KILOMETERS_PER_MILE = 1.609344;

const COUNTRY_NEIGHBORS: Record<string, string[]> = {
  AT: ['CH', 'CZ', 'DE', 'HU', 'IT', 'LI', 'SK', 'SI'],
  AU: [],
  BE: ['DE', 'FR', 'LU', 'NL'],
  BR: ['AR', 'BO', 'CO', 'GF', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE'],
  CA: ['US'],
  CH: ['AT', 'DE', 'FR', 'IT', 'LI'],
  CL: ['AR', 'BO', 'PE'],
  CN: [
    'AF',
    'BT',
    'IN',
    'KG',
    'KZ',
    'LA',
    'MM',
    'MN',
    'NP',
    'KP',
    'PK',
    'RU',
    'TJ',
    'VN',
  ],
  CO: ['BR', 'EC', 'PA', 'PE', 'VE'],
  CZ: ['AT', 'DE', 'PL', 'SK'],
  DE: ['AT', 'BE', 'CH', 'CZ', 'DK', 'FR', 'LU', 'NL', 'PL'],
  DK: ['DE'],
  EC: ['CO', 'PE'],
  ES: ['AD', 'FR', 'PT'],
  FI: ['NO', 'RU', 'SE'],
  FR: ['AD', 'BE', 'CH', 'DE', 'ES', 'IT', 'LU', 'MC'],
  GB: ['IE'],
  HU: ['AT', 'HR', 'RO', 'RS', 'SI', 'SK', 'UA'],
  IE: ['GB'],
  IN: ['BD', 'BT', 'CN', 'MM', 'NP', 'PK'],
  IT: ['AT', 'CH', 'FR', 'SI', 'SM', 'VA'],
  JP: [],
  KR: [],
  MX: ['BZ', 'GT', 'US'],
  NL: ['BE', 'DE'],
  NO: ['FI', 'RU', 'SE'],
  NZ: [],
  PE: ['BO', 'BR', 'CL', 'CO', 'EC'],
  PL: ['BY', 'CZ', 'DE', 'LT', 'RU', 'SK', 'UA'],
  PT: ['ES'],
  SE: ['FI', 'NO'],
  SI: ['AT', 'HR', 'HU', 'IT'],
  SK: ['AT', 'CZ', 'HU', 'PL', 'UA'],
  US: ['CA', 'MX'],
};

export const getSearchCountryCodes = (
  countryCode: string,
  sameCountryOnly: boolean,
) => {
  const normalizedCountryCode = countryCode.trim().toUpperCase();
  if (!normalizedCountryCode) {
    return [];
  }

  if (sameCountryOnly) {
    return [normalizedCountryCode];
  }

  return [
    normalizedCountryCode,
    ...(COUNTRY_NEIGHBORS[normalizedCountryCode] ?? []),
  ];
};

export type SearchScopeMode = 'radius' | 'state' | 'region';

export interface SearchRegion {
  id: string;
  name: string;
  states: string[];
}

export type SearchScope =
  | { mode: 'radius'; radiusMiles: number }
  | { mode: 'state'; stateName: string }
  | { mode: 'region'; region: SearchRegion };

const SEARCH_REGIONS: SearchRegion[] = [
  {
    id: 'pnw',
    name: 'Pacific Northwest',
    states: ['Alaska', 'Washington', 'Oregon'],
  },
];

export const getRegionForState = (stateName?: string) => {
  if (!stateName) {
    return null;
  }

  const normalizedState = stateName.trim().toLocaleLowerCase();
  return (
    SEARCH_REGIONS.find((region) =>
      region.states.some(
        (state) => state.toLocaleLowerCase() === normalizedState,
      ),
    ) ?? null
  );
};

export const getSearchScopeLabel = (scope: SearchScope) => {
  if (scope.mode === 'radius') {
    return `within ${scope.radiusMiles} miles`;
  }

  if (scope.mode === 'state') {
    return `across ${scope.stateName}`;
  }

  return `across the ${scope.region.name}`;
};

export const EVENT_LABELS: Record<string, string> = {
  '222': '2×2×2 Cube',
  '333': '3×3×3 Cube',
  '333bf': '3×3 Blindfolded',
  '333fm': '3×3 Fewest Moves',
  '333mbf': '3×3 Multi-Blind',
  '333oh': '3×3 One-Handed',
  '444': '4×4×4 Cube',
  '444bf': '4×4 Blindfolded',
  '555': '5×5×5 Cube',
  '555bf': '5×5 Blindfolded',
  '666': '6×6×6 Cube',
  '777': '7×7×7 Cube',
  clock: 'Clock',
  minx: 'Megaminx',
  pyram: 'Pyraminx',
  skewb: 'Skewb',
  sq1: 'Square-1',
};

export const isTrackedEvent = (eventId: string) =>
  Object.prototype.hasOwnProperty.call(EVENT_LABELS, eventId);

export const getEventLabel = (eventId: string) =>
  EVENT_LABELS[eventId] ?? eventId;

export const getCompetitionEventInsights = (
  eventIds: string[],
  eventSummaries: EventSummary[],
) => {
  const summariesById = new Map(
    eventSummaries.map((summary) => [summary.id, summary]),
  );
  const trackedEventIds = eventIds.filter(isTrackedEvent);
  const selectedEventIds = new Set(trackedEventIds);
  const toInsight = (eventId: string): CompetitionEventInsight => {
    const summary = summariesById.get(eventId);
    return {
      eventId,
      label: getEventLabel(eventId),
      lastHeldDate: summary?.lastHeldDate ?? null,
      heldInSearchWindow: summary?.heldInSearchWindow ?? 0,
      totalCompetitionCount: summary?.totalCompetitionCount ?? 0,
    };
  };

  return {
    selected: trackedEventIds.map(toInsight),
    suggested: eventSummaries
      .filter((summary) => !selectedEventIds.has(summary.id))
      .map((summary) => toInsight(summary.id)),
  };
};

const toDate = (value: string | Date) =>
  value instanceof Date
    ? new Date(value.getTime())
    : new Date(`${value}T00:00:00Z`);

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

const dateMonthsAgo = (date: Date, months: number) => {
  const result = toDate(date);
  result.setUTCMonth(result.getUTCMonth() - months);
  return result;
};

const dateMonthsFrom = (date: Date, months: number) => {
  const result = toDate(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
};

export const getDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getSearchDateRange = (
  asOfDate: string,
  includeUpcoming = false,
  lookbackMonths = DEFAULT_LOOKBACK_MONTHS,
) => ({
  endDate: includeUpcoming
    ? formatDate(dateMonthsFrom(toDate(asOfDate), UPCOMING_MONTHS))
    : asOfDate,
  startDate: formatDate(dateMonthsAgo(toDate(asOfDate), lookbackMonths)),
});

export const getMedianValue = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((first, second) => first - second);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return sortedValues[middleIndex];
  }

  return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
};

export const getDistanceMiles = (
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((secondLatitude - firstLatitude) * Math.PI) / 180;
  const longitudeDelta = ((secondLongitude - firstLongitude) * Math.PI) / 180;
  const firstLatitudeRadians = (firstLatitude * Math.PI) / 180;
  const secondLatitudeRadians = (secondLatitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 *
      Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians);

  return (
    (earthRadiusKm *
      2 *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))) /
    KILOMETERS_PER_MILE
  );
};

const isHeldByDate = (competition: WcaCompetition, asOfDate: Date) =>
  toDate(competition.end_date) <= asOfDate;

const normalizeLocationText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

const competitionIncludesState = (
  competition: WcaCompetition,
  stateName: string,
) => {
  const locationText = normalizeLocationText(
    [competition.city, competition.venue_address].filter(Boolean).join(', '),
  );
  return locationText.includes(normalizeLocationText(stateName));
};

const competitionMatchesScope = (
  competition: WcaCompetition,
  distanceMiles: number,
  scope: SearchScope,
) => {
  if (scope.mode === 'radius') {
    return distanceMiles <= scope.radiusMiles;
  }

  if (scope.mode === 'state') {
    return competitionIncludesState(competition, scope.stateName);
  }

  return scope.region.states.some((state) =>
    competitionIncludesState(competition, state),
  );
};

export const getEventSummaries = (
  competitions: WcaCompetition[],
  location: { latitude: number; longitude: number },
  asOfDate: string,
  scope: SearchScope,
  searchLookbackMonths = DEFAULT_LOOKBACK_MONTHS,
): EventSummaryResults => {
  const asOf = toDate(asOfDate);
  const recentStart = dateMonthsAgo(asOf, searchLookbackMonths);
  const localCompetitions = competitions
    .filter((competition) => {
      if (
        competition.cancelled_at ||
        competition.latitude_degrees === null ||
        competition.longitude_degrees === null
      ) {
        return false;
      }

      return true;
    })
    .map((competition) => ({
      competition,
      distanceMiles: getDistanceMiles(
        location.latitude,
        location.longitude,
        competition.latitude_degrees as number,
        competition.longitude_degrees as number,
      ),
    }))
    .filter(({ competition, distanceMiles }) =>
      competitionMatchesScope(competition, distanceMiles, scope),
    );
  const heldCompetitions = localCompetitions.filter(({ competition }) =>
    isHeldByDate(competition, asOf),
  );
  const upcomingCompetitions = localCompetitions.filter(
    ({ competition }) => !isHeldByDate(competition, asOf),
  );

  const events = new Map<
    string,
    EventSummary & {
      lastCompetitionId: string;
      lastCompetitionName: string;
      lastCompetitionUrl: string | null;
      lastHeldDate: string | null;
      lastDistanceMiles: number;
    }
  >();

  Object.entries(EVENT_LABELS).forEach(([eventId, label]) => {
    events.set(eventId, {
      id: eventId,
      label,
      heldInSearchWindow: 0,
      totalCompetitionCount: 0,
      lastCompetitionId: '',
      lastCompetitionName: '',
      lastCompetitionUrl: null,
      lastHeldDate: null,
      lastDistanceMiles: 0,
    });
  });

  heldCompetitions.forEach(({ competition, distanceMiles }) => {
    competition.event_ids.forEach((eventId) => {
      if (!isTrackedEvent(eventId)) {
        return;
      }

      const current = events.get(eventId);
      const isRecent = toDate(competition.end_date) >= recentStart;
      const isNewer =
        !current?.lastHeldDate || competition.end_date > current.lastHeldDate;

      events.set(eventId, {
        id: eventId,
        label: getEventLabel(eventId),
        heldInSearchWindow:
          (current?.heldInSearchWindow ?? 0) + (isRecent ? 1 : 0),
        totalCompetitionCount: (current?.totalCompetitionCount ?? 0) + 1,
        lastCompetitionId: isNewer
          ? competition.id
          : (current?.lastCompetitionId ?? competition.id),
        lastCompetitionName: isNewer
          ? competition.name
          : (current?.lastCompetitionName ?? competition.name),
        lastCompetitionUrl: isNewer
          ? competition.url
          : (current?.lastCompetitionUrl ?? competition.url),
        lastHeldDate: isNewer
          ? competition.end_date
          : (current?.lastHeldDate ?? competition.end_date),
        lastDistanceMiles: isNewer
          ? distanceMiles
          : (current?.lastDistanceMiles ?? distanceMiles),
      });
    });
  });

  const eventGroups = new Map<string, EventGroup>();
  events.forEach((event) => {
    const groupId = event.lastCompetitionId || 'no-nearby-competition';
    const currentGroup = eventGroups.get(groupId);
    const eventSummary: EventSummary = {
      id: event.id,
      label: event.label,
      lastHeldDate: event.lastHeldDate,
      lastCompetitionName: event.lastCompetitionName,
      lastCompetitionUrl: event.lastCompetitionUrl,
      lastDistanceMiles: event.lastDistanceMiles,
      heldInSearchWindow: event.heldInSearchWindow,
      totalCompetitionCount: event.totalCompetitionCount,
    };

    if (currentGroup) {
      currentGroup.events.push(eventSummary);
      return;
    }

    eventGroups.set(groupId, {
      competitionId: groupId,
      competitionName: event.lastCompetitionName || 'No nearby competition',
      competitionUrl: event.lastCompetitionUrl,
      lastHeldDate: event.lastHeldDate,
      lastDistanceMiles: event.lastDistanceMiles,
      events: [eventSummary],
    });
  });

  const sortedEventGroups = [...eventGroups.values()]
    .map((group) => ({
      ...group,
      events: [...group.events].sort((first, second) =>
        first.label.localeCompare(second.label),
      ),
    }))
    .sort((first, second) => {
      return (
        compareHeldDates(first.lastHeldDate, second.lastHeldDate) ||
        first.competitionName.localeCompare(second.competitionName)
      );
    });

  const upcomingCompetitionSummaries: UpcomingCompetitionSummary[] = [
    ...upcomingCompetitions,
  ]
    .sort((first, second) => {
      return (
        first.competition.start_date.localeCompare(
          second.competition.start_date,
        ) || first.competition.name.localeCompare(second.competition.name)
      );
    })
    .map(({ competition, distanceMiles }) => ({
      id: competition.id,
      name: competition.name,
      startDate: competition.start_date,
      endDate: competition.end_date,
      city: competition.city,
      url: competition.url,
      eventIds: competition.event_ids.filter(isTrackedEvent),
      distanceMiles,
    }));

  return {
    competitionCount: heldCompetitions.length,
    eventGroups: sortedEventGroups,
    events: [...events.values()]
      .map(
        ({
          id,
          label,
          lastHeldDate,
          lastCompetitionName,
          lastCompetitionUrl,
          lastDistanceMiles,
          heldInSearchWindow,
          totalCompetitionCount,
        }) => ({
          id,
          label,
          lastHeldDate,
          lastCompetitionName,
          lastCompetitionUrl,
          lastDistanceMiles,
          heldInSearchWindow,
          totalCompetitionCount,
        }),
      )
      .sort((first, second) => {
        return (
          compareHeldDates(first.lastHeldDate, second.lastHeldDate) ||
          first.label.localeCompare(second.label)
        );
      }),
    upcomingCompetitions: upcomingCompetitionSummaries,
  };
};

export const formatCompetitionDate = (date: string | null) => {
  if (!date) {
    return 'No match in search history';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(toDate(date));
};

export const formatDistanceMiles = (distanceMiles: number | null) =>
  distanceMiles === null
    ? '—'
    : `${distanceMiles < 10 ? distanceMiles.toFixed(1) : Math.round(distanceMiles)} mi`;

const compareHeldDates = (first: string | null, second: string | null) => {
  if (!first && !second) {
    return 0;
  }

  if (!first) {
    return -1;
  }

  if (!second) {
    return 1;
  }

  return toDate(first).getTime() - toDate(second).getTime();
};

export const formatRelativeAge = (
  heldDate: string | null,
  asOfDate: string,
) => {
  if (!heldDate) {
    return 'Never held';
  }

  const elapsedDays = Math.max(
    0,
    Math.floor(
      (toDate(asOfDate).getTime() - toDate(heldDate).getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );

  if (elapsedDays === 0) {
    return 'Today';
  }

  if (elapsedDays < 7) {
    return `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;
  }

  if (elapsedDays < 30) {
    const weeks = Math.floor(elapsedDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  if (elapsedDays < 365) {
    const months = Math.floor(elapsedDays / 30.44);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(elapsedDays / 365.25);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};
