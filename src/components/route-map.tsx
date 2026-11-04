export function RouteMap({
  className = "",
  minutes,
  homeLabel = "Home",
  techLabel = "Tech",
}: {
  className?: string;
  minutes?: number;
  homeLabel?: string;
  techLabel?: string;
}) {
  return (
    <svg viewBox="0 0 640 360" className={className} role="img" aria-label="Sample route map. Live tiles appear when a Google Maps key is set.">
      <rect width="640" height="360" fill="#e6ebf0" />
      <path d="M0 250 C120 230 180 280 280 250 C380 220 420 180 520 200 C580 212 620 190 640 180 L640 360 L0 360 Z" fill="#d5e4c8" />
      <path d="M40 40 C140 80 160 140 120 200 C90 250 160 300 220 320" fill="none" stroke="#c5d7e6" strokeWidth="18" />
      <g stroke="white" strokeWidth="7" fill="none" strokeLinecap="round">
        <path d="M0 90 H640" />
        <path d="M0 170 H640" />
        <path d="M0 250 H520" />
        <path d="M80 0 V360" />
        <path d="M210 0 V360" />
        <path d="M360 0 V360" />
        <path d="M500 0 V300" />
      </g>
      <g stroke="#d5dbe3" strokeWidth="3" fill="none">
        <path d="M0 130 H640" />
        <path d="M140 0 V360" />
        <path d="M280 0 V360" />
        <path d="M430 0 V360" />
      </g>
      <path d="M120 300 C180 250 220 210 250 180 C300 130 360 100 430 70" fill="none" stroke="#367af4" strokeWidth="6" strokeLinecap="round" />
      <circle cx="120" cy="300" r="9" fill="#367af4" />
      <circle cx="120" cy="300" r="4" fill="white" />
      <g transform="translate(414 42)">
        <rect x="-46" y="-16" width="92" height="28" rx="14" fill="white" />
        <text x="0" y="3" textAnchor="middle" fontSize="12" fontFamily="Inter, sans-serif" fill="#0a0c10">
          {homeLabel}
        </text>
      </g>
      <g transform="translate(430 78)">
        <path d="M0 0 l8 14 h-16 z" fill="#0a0c10" />
        <circle cy="-6" r="8" fill="#0a0c10" />
      </g>
      {typeof minutes === "number" && (
        <g transform="translate(168 248)">
          <rect x="0" y="0" width="78" height="28" rx="14" fill="#0a0c10" />
          <text x="39" y="18" textAnchor="middle" fontSize="12" fill="white" fontFamily="Inter, sans-serif">
            {minutes} min
          </text>
        </g>
      )}
      <text x="108" y="328" fontSize="11" fill="#5b6270" fontFamily="Inter, sans-serif">
        {techLabel}
      </text>
      <text x="12" y="348" fontSize="10" fill="#8b93a1" fontFamily="Inter, sans-serif">
        Sample map. Connect Google Maps for live tiles.
      </text>
    </svg>
  );
}
