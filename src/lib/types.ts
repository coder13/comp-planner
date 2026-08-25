export interface CityLocation {
  cityName: string;
  countryCode: string;
  countryName: string;
  displayName: string;
  latitude: number;
  longitude: number;
  stateName?: string;
}

export interface WcaCompetition {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  venue: string;
  venue_address?: string;
  url: string;
  website: string;
  latitude_degrees: number | null;
  longitude_degrees: number | null;
  country_iso2: string;
  event_ids: string[];
  cancelled_at: string | null;
}

export interface WcaUser {
  id: number;
  name: string;
  wca_id: string | null;
  country_iso2?: string | null;
  avatar?: {
    thumb_url?: string | null;
    url?: string | null;
  } | null;
}

export interface EventSummary {
  id: string;
  label: string;
  lastHeldDate: string;
  lastCompetitionName: string;
  lastCompetitionUrl: string | null;
  lastDistanceMiles: number;
  heldInLast12Months: number;
  totalCompetitionCount: number;
}

export interface EventGroup {
  competitionId: string;
  competitionName: string;
  competitionUrl: string | null;
  lastHeldDate: string;
  lastDistanceMiles: number;
  events: EventSummary[];
}

export interface EventSummaryResults {
  events: EventSummary[];
  competitionCount: number;
  eventGroups: EventGroup[];
  upcomingCompetitions: UpcomingCompetitionSummary[];
}

export interface UpcomingCompetitionSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  city: string;
  url: string;
  eventIds: string[];
  distanceMiles: number;
}

export interface CompetitionEventInsight {
  eventId: string;
  label: string;
  lastHeldDate: string | null;
  heldInLast12Months: number;
  totalCompetitionCount: number;
}
