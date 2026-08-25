interface UpcomingCompetitionToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function UpcomingCompetitionToggle({
  checked,
  onChange,
}: UpcomingCompetitionToggleProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input
        className="peer sr-only"
        type="checkbox"
        checked={checked}
        aria-label="Include upcoming competitions"
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        aria-hidden="true">
        <span
          className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-gray-700">
          Include upcoming
        </span>
        <span className="block text-xs text-gray-500">Next 2 years</span>
      </span>
    </label>
  );
}
