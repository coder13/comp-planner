import { formatCompetitionDate, formatRelativeAge } from '../../lib/planner';
import { EventSummary } from '../../lib/types';
import { ArrowUpRightIcon, CalendarIcon } from '../Icons';

interface EventSummaryRowProps {
  event: EventSummary;
  asOfDate: string;
  maxHeldInLast12Months?: number;
  medianHeldInLast12Months?: number;
  showCompetition?: boolean;
}

const UNDER_HELD_COLOR = [224, 102, 102] as const;
const MIDPOINT_COLOR = [255, 255, 255] as const;
const OVER_SATURATED_COLOR = [87, 187, 138] as const;

const interpolateColor = (
  firstColor: readonly number[],
  secondColor: readonly number[],
  ratio: number,
) =>
  firstColor.map((channel, index) =>
    Math.round(channel + (secondColor[index] - channel) * ratio),
  );

const getHeldCountBackground = (
  heldInLast12Months: number,
  maxHeldInLast12Months: number,
  medianHeldInLast12Months: number,
) => {
  if (medianHeldInLast12Months <= 0) {
    return `rgba(${MIDPOINT_COLOR.join(', ')}, 0.5)`;
  }

  const color =
    heldInLast12Months <= medianHeldInLast12Months
      ? interpolateColor(
          UNDER_HELD_COLOR,
          MIDPOINT_COLOR,
          heldInLast12Months / medianHeldInLast12Months,
        )
      : interpolateColor(
          MIDPOINT_COLOR,
          OVER_SATURATED_COLOR,
          maxHeldInLast12Months > medianHeldInLast12Months
            ? (heldInLast12Months - medianHeldInLast12Months) /
                (maxHeldInLast12Months - medianHeldInLast12Months)
            : 1,
        );

  return `rgba(${color.join(', ')}, 0.5)`;
};

export function EventSummaryRow({
  asOfDate,
  event,
  maxHeldInLast12Months = event.heldInLast12Months,
  medianHeldInLast12Months = maxHeldInLast12Months / 2,
  showCompetition = true,
}: EventSummaryRowProps) {
  return (
    <article
      className={`grid gap-4 border-t border-line-light px-5 py-4 sm:items-center sm:px-6 ${
        showCompetition
          ? 'sm:grid-cols-[minmax(0,0.85fr)_minmax(180px,1.2fr)_minmax(110px,0.5fr)_minmax(130px,0.5fr)]'
          : 'sm:grid-cols-[minmax(0,0.85fr)_minmax(130px,0.5fr)]'
      }`}
      style={{
        backgroundColor: getHeldCountBackground(
          event.heldInLast12Months,
          maxHeldInLast12Months,
          medianHeldInLast12Months,
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
              <CalendarIcon className="size-3.5" />
              {formatCompetitionDate(event.lastHeldDate)}
            </span>
          </div>
        </div>
      )}

      {showCompetition && (
        <div className="text-xs font-medium text-ink/65">
          {formatRelativeAge(event.lastHeldDate, asOfDate)}
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
