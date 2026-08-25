import {
  formatCompetitionDate,
  formatDistanceMiles,
  getEventLabel,
  isTrackedEvent,
} from '../../lib/planner';
import { UpcomingCompetitionSummary } from '../../lib/types';
import { ArrowUpRightIcon } from '../Icons';

interface UpcomingCompetitionListProps {
  competitions: UpcomingCompetitionSummary[];
}

const formatDateRange = (startDate: string, endDate: string) =>
  startDate === endDate
    ? formatCompetitionDate(startDate)
    : `${formatCompetitionDate(startDate)} – ${formatCompetitionDate(endDate)}`;

const formatEventCount = (eventCount: number) =>
  `${eventCount} event${eventCount === 1 ? '' : 's'}`;

export function UpcomingCompetitionList({
  competitions,
}: UpcomingCompetitionListProps) {
  return (
    <section
      className="mt-4 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm"
      aria-labelledby="upcoming-competitions-heading">
      <header className="flex items-start justify-between gap-4 border-b border-blue-100 bg-blue-50 px-4 py-3">
        <div>
          <h3
            id="upcoming-competitions-heading"
            className="text-base font-semibold text-gray-900">
            Upcoming competitions
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Next 12 months · visible in the WCA data
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-700">
          {competitions.length}
        </span>
      </header>

      <div>
        {competitions.map((competition) => (
          <article
            className="border-t border-gray-100 px-5 py-4 first:border-t-0 sm:px-6"
            key={competition.id}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)] sm:items-start">
              <div className="min-w-0">
                <a
                  className="focus-ring inline-flex max-w-full items-center gap-1 text-sm font-semibold text-gray-900 transition hover:text-blue-700"
                  href={competition.url}
                  target="_blank"
                  rel="noreferrer">
                  <span className="truncate">{competition.name}</span>
                  <ArrowUpRightIcon className="size-3.5 shrink-0 opacity-45" />
                </a>
                <p className="mt-1 text-xs text-gray-500">{competition.city}</p>
              </div>

              <div className="text-xs text-gray-500 sm:text-right">
                <p className="font-medium text-gray-700">
                  {formatDateRange(competition.startDate, competition.endDate)}
                </p>
                <p className="mt-1">
                  {formatDistanceMiles(competition.distanceMiles)} away ·{' '}
                  {formatEventCount(
                    competition.eventIds.filter(isTrackedEvent).length,
                  )}
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Events:</span>{' '}
              {competition.eventIds.filter(isTrackedEvent).length > 0
                ? competition.eventIds
                    .filter(isTrackedEvent)
                    .map(getEventLabel)
                    .join(', ')
                : 'Not listed yet'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
