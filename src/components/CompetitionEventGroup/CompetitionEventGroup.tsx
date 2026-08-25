import {
  formatCompetitionDate,
  formatRelativeAge,
  getMedianValue,
} from '../../lib/planner';
import { EventGroup } from '../../lib/types';
import { EventSummaryRow } from '../EventSummaryRow';
import { ArrowUpRightIcon, CalendarIcon } from '../Icons';

interface CompetitionEventGroupProps {
  asOfDate: string;
  group: EventGroup;
  maxHeldInSearchWindow?: number;
  medianHeldInSearchWindow?: number;
}

export function CompetitionEventGroup({
  asOfDate,
  group,
  maxHeldInSearchWindow = Math.max(
    0,
    ...group.events.map((event) => event.heldInSearchWindow),
  ),
  medianHeldInSearchWindow = getMedianValue(
    group.events.map((event) => event.heldInSearchWindow),
  ),
}: CompetitionEventGroupProps) {
  return (
    <article className="overflow-hidden border-t border-line-light first:border-t-0">
      <header className="bg-paper px-5 py-5 sm:px-6">
        <p
          className={`text-sm font-medium ${
            group.lastHeldDate ? 'text-coral-dark' : 'text-ink/55'
          }`}>
          {group.lastHeldDate
            ? formatRelativeAge(group.lastHeldDate, asOfDate)
            : 'Never held in search area'}
        </p>
        {group.competitionUrl ? (
          <a
            className="focus-ring mt-2 inline-flex max-w-full items-center gap-2 text-base font-semibold text-ink transition hover:text-coral-dark"
            href={group.competitionUrl}
            target="_blank"
            rel="noreferrer">
            <span className="truncate">{group.competitionName}</span>
            <ArrowUpRightIcon className="size-4 shrink-0 opacity-45" />
          </a>
        ) : (
          <h3 className="mt-2 text-base font-semibold text-ink">
            {group.competitionName}
          </h3>
        )}
        {group.lastHeldDate && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              {formatCompetitionDate(group.lastHeldDate)}
            </span>
          </div>
        )}
      </header>

      <div>
        {group.events.map((event) => (
          <EventSummaryRow
            asOfDate={asOfDate}
            event={event}
            key={event.id}
            maxHeldInSearchWindow={maxHeldInSearchWindow}
            medianHeldInSearchWindow={medianHeldInSearchWindow}
            showCompetition={false}
          />
        ))}
      </div>
    </article>
  );
}
