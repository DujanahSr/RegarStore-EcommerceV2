export default function RegarStoreLogo({ size = 32, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="rsBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A251E" />
          <stop offset="100%" stopColor="#0E1612" />
        </linearGradient>

        <linearGradient id="rsTerracottaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5A43" />
          <stop offset="60%" stopColor="#D9381E" />
          <stop offset="100%" stopColor="#9E2214" />
        </linearGradient>

        <linearGradient id="rsAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Outer Squircle */}
      <rect
        x="6"
        y="6"
        width="116"
        height="116"
        rx="28"
        fill="url(#rsBgGrad)"
        stroke="#B9382B"
        strokeWidth="3"
      />

      {/* Inner subtle speed dashed frame */}
      <rect
        x="11"
        y="11"
        width="106"
        height="106"
        rx="23"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        strokeDasharray="8 4"
      />

      {/* Monogram "R" Pillar */}
      <path d="M34 32 H48 V96 H34 Z" fill="url(#rsTerracottaGrad)" />
      <path d="M34 32 L48 24 V32 H34 Z" fill="#FF7E6B" />

      {/* Monogram "R" Head Loop */}
      <path
        d="M48 32 H76 C86.5 32 94 39.5 94 50 C94 60.5 86.5 68 76 68 H48 V55 H74 C77.5 55 80 52.8 80 50 C80 47.2 77.5 45 74 45 H48 V32 Z"
        fill="url(#rsTerracottaGrad)"
      />

      {/* Dynamic Stride Leg */}
      <path d="M62 64 L81 96 H97 L76 64 H62 Z" fill="url(#rsTerracottaGrad)" />

      {/* Forward Speed Flow Streak */}
      <path d="M34 88 L52 88 L64 74 L52 74 Z" fill="url(#rsAccentGrad)" />
      {/* Dynamic Gold Accent Star */}
      <polygon
        points="90,26 94,34 102,34 95,39 98,47 90,42 82,47 85,39 78,34 86,34"
        fill="#F59E0B"
        transform="scale(0.5) translate(80, 20)"
      />
    </svg>
  );
}
