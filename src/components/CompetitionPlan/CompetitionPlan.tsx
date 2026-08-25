import {
  formatCompetitionDate,
  formatRelativeAge,
  getCompetitionEventInsights,
} from '../../lib/planner';
import {
  CompetitionEventInsight,
  EventSummary,
  WcaCompetition,
} from '../../lib/types';

interface CompetitionPlanProps {
  asOfDate: string;
  competition: WcaCompetition;
  eventSummaries: EventSummary[];
}

const EventInsightRow = ({
  asOfDate,
  insight,
}: {
  asOfDate: string;
  insight: CompetitionEventInsight;
}) => (
  <li className="flex items-start gap-3 border-t border-gray-100 py-3 first:border-t-0">
    <span
      className={`cubing-icon event-${insight.eventId} mt-0.5 shrink-0 text-lg text-gray-500`}
      aria-hidden="true"
    />
    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-900">{insight.label}</p>
      <p className="mt-0.5 text-xs text-gray-500">
        {insight.lastHeldDate
          ? `${formatRelativeAge(insight.lastHeldDate, asOfDate)} · held ${insight.heldInSearchWindow} time${insight.heldInSearchWindow === 1 ? '' : 's'} in the search window`
          : 'No nearby history'}
      </p>
    </div>
  </li>
);

export function CompetitionPlan({
  asOfDate,
  competition,
  eventSummaries,
}: CompetitionPlanProps) {
  const insights = getCompetitionEventInsights(
    competition.event_ids,
    eventSummaries,
  );

  return (
    <section
      className="mt-4 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm"
      aria-labelledby="competition-plan-heading">
      <header className="border-b border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs font-medium text-blue-700">Competition plan</p>
        <h3
          id="competition-plan-heading"
          className="mt-1 text-lg font-semibold text-gray-900">
          {competition.name}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {formatCompetitionDate(competition.start_date)} · {competition.city}
        </p>
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            Events in this competition
          </h4>
          <ul className="mt-2">
            {insights.selected.length > 0 ? (
              insights.selected.map((insight) => (
                <EventInsightRow
                  asOfDate={asOfDate}
                  insight={insight}
                  key={insight.eventId}
                />
              ))
            ) : (
              <li className="py-3 text-sm text-gray-500">
                No events listed yet.
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            Suggested events
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            Nearby events that are not in this competition, least recent first.
          </p>
          <ul className="mt-2">
            {insights.suggested.length > 0 ? (
              insights.suggested.map((insight) => (
                <EventInsightRow
                  asOfDate={asOfDate}
                  insight={insight}
                  key={insight.eventId}
                />
              ))
            ) : (
              <li className="py-3 text-sm text-gray-500">
                No additional nearby events found.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
