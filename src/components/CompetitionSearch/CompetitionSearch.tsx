import { FormEvent, useEffect, useRef } from 'react';
import { formatCompetitionDate } from '../../lib/planner';
import { WcaCompetition } from '../../lib/types';
import { CalendarIcon, MapPinIcon, SearchIcon } from '../Icons';

const AUTOCOMPLETE_DEBOUNCE_MS = 320;

interface CompetitionSearchProps {
  competitions: WcaCompetition[];
  isBusy: boolean;
  onLookup: (query: string) => void;
  onQueryChange: (query: string) => void;
  onSelectCompetition: (competition: WcaCompetition) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  query: string;
}

export function CompetitionSearch({
  competitions,
  isBusy,
  onLookup,
  onQueryChange,
  onSelectCompetition,
  onSubmit,
  query,
}: CompetitionSearchProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelAutocomplete = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  useEffect(() => cancelAutocomplete, []);

  const handleQueryChange = (nextQuery: string) => {
    onQueryChange(nextQuery);
    cancelAutocomplete();

    if (!nextQuery.trim()) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onLookup(nextQuery);
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    cancelAutocomplete();
    onSubmit(event);
  };

  return (
    <div className="relative z-20">
      <form onSubmit={handleSubmit}>
        <label
          className="mb-1 block text-sm font-medium text-gray-700"
          htmlFor="competition-search">
          Pick a competition
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              id="competition-search"
              className="focus-ring h-10 w-full rounded-md border border-gray-300 bg-white px-9 text-sm text-gray-900 placeholder:text-gray-400"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Seattle Summer Open"
              autoComplete="off"
            />
          </div>
          <button
            className="focus-ring inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            type="submit"
            disabled={isBusy || !query.trim()}>
            {isBusy ? 'Finding…' : 'Find competition'}
          </button>
        </div>
      </form>

      {competitions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 max-h-64 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
          role="listbox"
          aria-label="Competition choices">
          <p className="px-3 pb-1 pt-2 text-xs font-medium text-gray-500">
            Choose a competition
          </p>
          <div className="px-1 pb-1">
            {competitions.map((competition) => (
              <button
                className="focus-ring flex w-full items-start gap-2 rounded px-2 py-2 text-left text-sm text-gray-900 transition hover:bg-gray-50"
                key={competition.id}
                type="button"
                role="option"
                onClick={() => {
                  cancelAutocomplete();
                  onSelectCompetition(competition);
                }}>
                <CalendarIcon className="mt-0.5 size-4 shrink-0 text-blue-600" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {competition.name}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      {formatCompetitionDate(competition.start_date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon className="size-3" />
                      {competition.city}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
