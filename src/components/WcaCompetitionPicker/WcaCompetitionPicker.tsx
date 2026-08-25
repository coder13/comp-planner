import { formatCompetitionDate } from '../../lib/planner';
import { WcaCompetition } from '../../lib/types';

interface WcaCompetitionPickerProps {
  competitions: WcaCompetition[];
  isLoading: boolean;
  selectedCompetitionId: string | null;
  onSelect: (competitionId: string) => void;
}

export function WcaCompetitionPicker({
  competitions,
  isLoading,
  selectedCompetitionId,
  onSelect,
}: WcaCompetitionPickerProps) {
  return (
    <label
      className="block text-sm font-medium text-gray-700"
      htmlFor="wca-competition">
      My upcoming competitions
      <select
        id="wca-competition"
        className="focus-ring mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        disabled={isLoading || competitions.length === 0}
        value={selectedCompetitionId ?? ''}
        onChange={(event) => onSelect(event.target.value)}>
        <option value="">
          {isLoading
            ? 'Loading competitions…'
            : competitions.length > 0
              ? 'Choose a competition'
              : 'No upcoming competitions found'}
        </option>
        {competitions.map((competition) => (
          <option key={competition.id} value={competition.id}>
            {competition.name} · {formatCompetitionDate(competition.start_date)}
          </option>
        ))}
      </select>
    </label>
  );
}
