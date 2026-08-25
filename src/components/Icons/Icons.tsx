interface IconProps {
  className?: string;
}

export function ArrowUpRightIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true">
      <path
        d="M5 15 15 5M7 5h8v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true">
      <rect
        x="3"
        y="4.5"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.5 3v3M13.5 3v3M3 8h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true">
      <path
        d="m5 7.5 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CompassIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m15.8 8.2-2.4 5.2-5.2 2.4 2.4-5.2 5.2-2.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExternalLinkIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true">
      <path
        d="M11.5 4H16v4.5M15.5 4.5l-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11.5V15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MapPinIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true">
      <path
        d="M16 8.3c0 4.2-6 8.2-6 8.2S4 12.5 4 8.3a6 6 0 1 1 12 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="10"
        cy="8.2"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function SearchIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true">
      <circle
        cx="8.8"
        cy="8.8"
        r="5.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m12.7 12.7 3.8 3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SparkIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true">
      <path
        d="M10 2.5 11.6 8l5.9 2-5.9 2-1.6 5.5L8.4 12 2.5 10l5.9-2L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
