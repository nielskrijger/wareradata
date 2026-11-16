import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

/**
 * The tank-and-chart logo.
 *
 * Its gradient stops animate in step with the wordmark (`.logo-stop` and
 * `.logo-fire-text` in globals.css), so tank and text read as one effect.
 */
export function Logo({ className }: Props) {
  return (
    <svg
      viewBox="3 7 26 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('logo h-6 w-auto', className)}
      aria-hidden="true"
    >
      <defs>
        {/* The gradient spans three tank-widths (x2="3") and tiles (repeat), so a
            bright band is always somewhere on the tank — matching the wordmark,
            whose 300%-wide background means its band is always visible too.
            Sliding one tile-width (translate -1 → 0 in objectBoundingBox units)
            sweeps the band fully across and loops seamlessly. SMIL is used
            because gradientTransform is not reliably animatable via CSS; the 8s
            linear duration and left → right direction match the wordmark. */}
        <linearGradient
          id="logo-gradient"
          className="logo-gradient"
          x1="0"
          y1="0"
          x2="3"
          y2="0"
          gradientUnits="objectBoundingBox"
          spreadMethod="repeat"
        >
          <stop className="logo-stop-base" offset="0%" />
          <stop className="logo-stop-base" offset="20%" />
          <stop className="logo-stop-bright" offset="33.33%" />
          <stop className="logo-stop-base" offset="46.66%" />
          <stop className="logo-stop-base" offset="100%" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="0 0"
            to="-1 0"
            dur="8s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <path d="M3 17 L29 17 L27 14 L5 14 Z" fill="url(#logo-gradient)" />
      <circle cx="7" cy="19" r="2.5" fill="url(#logo-gradient)" />
      <circle cx="13" cy="19" r="2.5" fill="url(#logo-gradient)" />
      <circle cx="19" cy="19" r="2.5" fill="url(#logo-gradient)" />
      <circle cx="25" cy="19" r="2.5" fill="url(#logo-gradient)" />
      <rect x="10" y="9" width="10" height="5" rx="1" fill="url(#logo-gradient)" />
      <path
        d="M20 11.5 L24 11.5 L26 8.5 L29 9.5"
        stroke="url(#logo-gradient)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="29" cy="9.5" r="1.1" fill="url(#logo-gradient)" />
    </svg>
  )
}
