--- src/components/icons.tsx (原始)


+++ src/components/icons.tsx (修改后)
interface IconProps {
  size?: number;
  className?: string;
}

const svgProps = (size?: number) =>
  ({
    width: size ?? 18,
    height: size ?? 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  }) as const;

export const PlayIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path d="M8.5 5.4v13.2c0 .5.55.8.98.53l10.1-6.6a.63.63 0 0 0 0-1.06L9.48 4.87a.63.63 0 0 0-.98.53Z" fill="currentColor" />
  </svg>
);

export const PauseIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <rect x="6.2" y="4.8" width="4" height="14.4" rx="1.2" fill="currentColor" />
    <rect x="13.8" y="4.8" width="4" height="14.4" rx="1.2" fill="currentColor" />
  </svg>
);

export const RestartIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path
      d="M20 12a8 8 0 1 1-2.6-5.9"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path d="M20.2 3.4v4.4h-4.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SoundOnIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5H4Z" fill="currentColor" />
    <path d="M15.5 9a4.3 4.3 0 0 1 0 6M17.8 6.5a8 8 0 0 1 0 11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const SoundOffIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5H4Z" fill="currentColor" />
    <path d="m15.5 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const TrophyIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path
      d="M7 4h10v3.5A5 5 0 0 1 7 7.5V4Zm0 1.5H4.5A0.5.5 0 0 0 4 6c0 2.4 1.4 4 3.6 4.4M17 5.5h2.5a.5.5 0 0 1 .5.5c0 2.4-1.4 4-3.6 4.4M12 12.5V15m-3.5 4h7M10 15h4l.6 4H9.4L10 15Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BoltIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path d="M13.2 2.8 5.6 13.1h4.9l-1.7 8.1 7.6-10.3h-4.9l1.7-8.1Z" fill="currentColor" />
  </svg>
);

export const StarIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path
      d="m12 2.8 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.1l6.1-.7L12 2.8Z"
      fill="currentColor"
    />
  </svg>
);

export const ClockIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.9" />
    <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TurnIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path d="M4.5 15.5V10a4 4 0 0 1 4-4h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="m14.5 3 3.4 3-3.4 3M19.5 12v2a4 4 0 0 1-4 4h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SwipeIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    <path
      d="M7.8 7.8a6 6 0 0 1 8.4 0M16.2 16.2a6 6 0 0 1-8.4 0"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path d="m17.6 6.2.5 2.1-2.1-.5M6.4 17.8l-.5-2.1 2.1.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path d="m6 14.2 6-6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const HomeIcon = ({ size, className }: IconProps) => (
  <svg {...svgProps(size)} className={className} aria-hidden="true">
    <path
      d="m4.5 10.8 7.5-6.3 7.5 6.3M6.5 9.5V19h11V9.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LogoMark = ({ size, className }: IconProps) => (
  <svg
    width={size ?? 40}
    height={size ?? 40}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="1" y="1" width="38" height="38" rx="11" fill="#0f271d" stroke="#2c4a3c" strokeWidth="1.5" />
    <path
      d="M11 26c0 3 2.4 5 5.4 5h6.2c3 0 5-1.9 5-4.4s-2-4.4-5-4.4h-5.2c-3 0-5-1.9-5-4.4S14.4 13.4 17.4 13.4h6.4"
      stroke="#a8f65a"
      strokeWidth="3.4"
      strokeLinecap="round"
    />
    <circle cx="26.6" cy="13.4" r="2.7" fill="#a8f65a" />
    <circle cx="27.5" cy="12.6" r="0.9" fill="#0a1d15" />
  </svg>
);
