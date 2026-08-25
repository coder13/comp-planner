import {
  EventGroup,
  EventSummary,
  EventSummaryResults,
  WcaCompetition,
} from './types';

export const LOOKBACK_MONTHS = 24;
export const RECENT_MONTHS = 12;
export const KILOMETERS_PER_MILE = 1.609344;

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
  '333ft': '3×3 With Feet',
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

export const getEventLabel = (eventId: string) =>
  EVENT_LABELS[eventId] ?? eventId;

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

export const getDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getSearchDateRange = (asOfDate: string) => ({
  endDate: asOfDate,
  startDate: formatDate(dateMonthsAgo(toDate(asOfDate), LOOKBACK_MONTHS)),
});

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
): EventSummaryResults => {
  const asOf = toDate(asOfDate);
  const recentStart = dateMonthsAgo(asOf, RECENT_MONTHS);
  const localCompetitions = competitions
    .filter((competition) => {
      if (
        competition.cancelled_at ||
        competition.latitude_degrees === null ||
        competition.longitude_degrees === null
      ) {
        return false;
      }

      return isHeldByDate(competition, asOf);
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

  const events = new Map<
    string,
    EventSummary & {
      lastCompetitionId: string;
      lastCompetitionName: string;
      lastCompetitionUrl: string | null;
      lastHeldDate: string;
      lastDistanceMiles: number;
    }
  >();
  localCompetitions.forEach(({ competition, distanceMiles }) => {
    competition.event_ids.forEach((eventId) => {
      const current = events.get(eventId);
      const isRecent = toDate(competition.end_date) >= recentStart;
      const isNewer =
        !current?.lastHeldDate || competition.end_date > current.lastHeldDate;

      events.set(eventId, {
        id: eventId,
        label: getEventLabel(eventId),
        heldInLast12Months:
          (current?.heldInLast12Months ?? 0) + (isRecent ? 1 : 0),
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
    const currentGroup = eventGroups.get(event.lastCompetitionId);
    const eventSummary: EventSummary = {
      id: event.id,
      label: event.label,
      lastHeldDate: event.lastHeldDate,
      lastCompetitionName: event.lastCompetitionName,
      lastCompetitionUrl: event.lastCompetitionUrl,
      lastDistanceMiles: event.lastDistanceMiles,
      heldInLast12Months: event.heldInLast12Months,
      totalCompetitionCount: event.totalCompetitionCount,
    };

    if (currentGroup) {
      currentGroup.events.push(eventSummary);
      return;
    }

    eventGroups.set(event.lastCompetitionId, {
      competitionId: event.lastCompetitionId,
      competitionName: event.lastCompetitionName,
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
        toDate(first.lastHeldDate).getTime() -
          toDate(second.lastHeldDate).getTime() ||
        first.competitionName.localeCompare(second.competitionName)
      );
    });

  return {
    competitionCount: localCompetitions.length,
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
          heldInLast12Months,
          totalCompetitionCount,
        }) => ({
          id,
          label,
          lastHeldDate,
          lastCompetitionName,
          lastCompetitionUrl,
          lastDistanceMiles,
          heldInLast12Months,
          totalCompetitionCount,
        }),
      )
      .sort((first, second) => {
        return (
          toDate(first.lastHeldDate).getTime() -
            toDate(second.lastHeldDate).getTime() ||
          first.label.localeCompare(second.label)
        );
      }),
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

export const formatRelativeAge = (heldDate: string, asOfDate: string) => {
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
