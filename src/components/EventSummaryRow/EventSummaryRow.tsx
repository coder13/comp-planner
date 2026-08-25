import { formatCompetitionDate, formatRelativeAge } from '../../lib/planner';
import { EventSummary } from '../../lib/types';
import { ArrowUpRightIcon, CalendarIcon } from '../Icons';

interface EventSummaryRowProps {
  event: EventSummary;
  asOfDate: string;
  maxHeldInLast12Months?: number;
  showCompetition?: boolean;
}

const UNDER_HELD_COLOR = [224, 244, 235] as const;
const OVER_SATURATED_COLOR = [249, 225, 216] as const;

const getHeldCountBackground = (
  heldInLast12Months: number,
  maxHeldInLast12Months: number,
) => {
  const ratio =
    maxHeldInLast12Months > 0
      ? Math.min(heldInLast12Months / maxHeldInLast12Months, 1)
      : 0;
  const color = UNDER_HELD_COLOR.map((underHeldChannel, index) =>
    Math.round(
      underHeldChannel +
        (OVER_SATURATED_COLOR[index] - underHeldChannel) * ratio,
    ),
  );

  return `rgb(${color.join(', ')})`;
};

export function EventSummaryRow({
  asOfDate,
  event,
  maxHeldInLast12Months = event.heldInLast12Months,
  showCompetition = true,
}: EventSummaryRowProps) {
  return (
    <article
      className={`grid gap-4 border-t border-line-light px-5 py-4 sm:items-center sm:px-6 ${
        showCompetition
          ? 'sm:grid-cols-[minmax(0,0.85fr)_minmax(180px,1.4fr)_minmax(130px,0.5fr)]'
          : 'sm:grid-cols-[minmax(0,0.85fr)_minmax(130px,0.5fr)]'
      }`}
      style={{
        backgroundColor: getHeldCountBackground(
          event.heldInLast12Months,
          maxHeldInLast12Months,
        ),
      }}>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`cubing-icon event-${event.id} shrink-0 text-xl text-ink/55`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h4 className="truncate text-base font-semibold text-ink">
            {event.label}
          </h4>
        </div>
      </div>

      {showCompetition && (
        <div className="min-w-0">
          {event.lastCompetitionUrl ? (
            <a
              className="focus-ring inline-flex max-w-full items-center gap-1 text-xs font-semibold text-ink transition hover:text-coral-dark"
              href={event.lastCompetitionUrl}
              target="_blank"
              rel="noreferrer">
              <span className="truncate">{event.lastCompetitionName}</span>
              <ArrowUpRightIcon className="size-3.5 shrink-0 opacity-45" />
            </a>
          ) : (
            <p className="text-xs font-semibold text-ink">
              {event.lastCompetitionName}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/45">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-medium text-ink/65">
                {formatRelativeAge(event.lastHeldDate, asOfDate)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              {formatCompetitionDate(event.lastHeldDate)}
            </span>
          </div>
        </div>
      )}

      <div
        className="-my-4 flex min-w-0 items-center justify-end px-3 py-4 text-right"
        aria-label={`${event.heldInLast12Months} times held in the last year`}>
        <span className="text-base font-semibold text-ink">
          {event.heldInLast12Months}
        </span>
      </div>
    </article>
  );
}
