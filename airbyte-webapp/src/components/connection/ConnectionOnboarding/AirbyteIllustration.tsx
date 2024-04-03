import styles from "./AirbyteIllustration.module.scss";

export type HighlightIndex = 0 | 1 | 2 | 3;

interface AirbyteIllustrationProps {
  className?: string;
  sourceHighlighted: HighlightIndex;
  destinationHighlighted: HighlightIndex;
}

const regularPath = {
  stroke: styles.darkBlue,
  strokeWidth: 1.5,
  strokeDasharray: "3 6",
  opacity: 0.2,
};

const highlightedSource = {
  stroke: "url(#highlightedSource)",
  strokeWidth: 5,
};

const highlightedDestination = {
  stroke: "url(#highlightedDestination)",
  strokeWidth: 5,
};

export const AirbyteIllustration: React.FC<AirbyteIllustrationProps> = ({
  className,
  sourceHighlighted,
  destinationHighlighted,
}) => (
  <svg
    width="492"
    height="318"
    viewBox="0 0 492 318"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      id="sourcePath0"
      d="M0 25H16.3176C38.7973 25 58.5134 40.0021 64.5074 61.668L80.4605 119.332C86.4545 140.998 106.171 156 128.65 156H179"
      strokeLinejoin="round"
      {...(sourceHighlighted === 0 ? highlightedSource : regularPath)}
    />
    <path
      id="sourcePath1"
      d="M0 115H31.8265C46.1566 115 59.798 121.149 69.2887 131.885L75.6792 139.115C85.1699 149.851 98.8113 156 113.141 156H179"
      strokeLinejoin="round"
      {...(sourceHighlighted === 1 ? highlightedSource : regularPath)}
    />
    <path
      id="sourcePath2"
      d="M0 202H30.1023C45.422 202 59.8962 194.977 69.3771 182.943L75.5908 175.057C85.0717 163.023 99.5459 156 114.866 156H179"
      strokeLinejoin="round"
      {...(sourceHighlighted === 2 ? highlightedSource : regularPath)}
    />
    <path
      id="sourcePath3"
      d="M0 288H16.2406C38.7565 288 58.495 272.95 64.4563 251.238L80.5116 192.762C86.4729 171.049 106.211 156 128.727 156H179"
      strokeLinejoin="round"
      {...(sourceHighlighted === 3 ? highlightedSource : regularPath)}
    />
    {/* We need to render the highlighted element once more, so it will overlap the other dashed lines (since there's no z-index in SVG) */}
    <use xlinkHref={`#sourcePath${sourceHighlighted}`} />

    <path
      id="destinationPath0"
      d="M492 25H475.682C453.203 25 433.487 40.0021 427.493 61.668L411.539 119.332C405.545 140.998 385.829 156 363.35 156H313"
      strokeLinejoin="round"
      {...(destinationHighlighted === 0 ? highlightedDestination : regularPath)}
    />
    <path
      id="destinationPath1"
      d="M492 115H460.173C445.843 115 432.202 121.149 422.711 131.885L416.321 139.115C406.83 149.851 393.189 156 378.859 156H313"
      {...(destinationHighlighted === 1 ? highlightedDestination : regularPath)}
      strokeLinejoin="round"
    />
    <path
      id="destinationPath2"
      d="M492 202H461.898C446.578 202 432.104 194.977 422.623 182.943L416.409 175.057C406.928 163.023 392.454 156 377.134 156H313"
      strokeLinejoin="round"
      {...(destinationHighlighted === 2 ? highlightedDestination : regularPath)}
    />
    <path
      id="destinationPath3"
      d="M492 288H475.759C453.243 288 433.505 272.95 427.544 251.238L411.488 192.762C405.527 171.049 385.789 156 363.273 156H313"
      strokeLinejoin="round"
      {...(destinationHighlighted === 3 ? highlightedDestination : regularPath)}
    />
    {/* We need to render the highlighted element once more, so it will overlap the other dashed lines (since there's no z-index in SVG) */}
    <use xlinkHref={`#destinationPath${destinationHighlighted}`} />

    <circle cx="0" cy="0" r="6" fill={styles.dotColor} stroke="white" strokeWidth={2}>
      <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
        {/* Animate the dot along the current highlighted source path */}
        <mpath xlinkHref={`#sourcePath${sourceHighlighted}`} />
      </animateMotion>
    </circle>
    <circle cx="0" cy="0" r="6" fill={styles.dotColor} stroke="white" strokeWidth={2}>
      <animateMotion dur="3s" repeatCount="indefinite" rotate="auto" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
        <mpath xlinkHref={`#destinationPath${destinationHighlighted}`} />
      </animateMotion>
    </circle>
    <g filter="url(#backgroundGradient)">
      <rect x="179" y="88" width="134" height="134" rx="48" fill="currentColor" />
    </g>
    <defs>
      <filter
        id="backgroundGradient"
        x="101"
        y="0"
        width="297"
        height="318"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology radius="10" operator="erode" in="SourceAlpha" result="effect1_dropShadow_3082_52204" />
        <feOffset dy="13" />
        <feGaussianBlur stdDeviation="9" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.101961 0 0 0 0 0.0980392 0 0 0 0 0.301961 0 0 0 0.17 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3082_52204" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="23" dy="-27" />
        <feGaussianBlur stdDeviation="30.5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.984314 0 0 0 0 0.223529 0 0 0 0 0.372549 0 0 0 0.2 0" />
        <feBlend mode="normal" in2="effect1_dropShadow_3082_52204" result="effect2_dropShadow_3082_52204" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="-20" dy="2" />
        <feGaussianBlur stdDeviation="29" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.262745 0 0 0 0 0.231373 0 0 0 0 0.984314 0 0 0 0.3 0" />
        <feBlend mode="normal" in2="effect2_dropShadow_3082_52204" result="effect3_dropShadow_3082_52204" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="12" dy="23" />
        <feGaussianBlur stdDeviation="36.5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.404861 0 0 0 0 0.854625 0 0 0 0 0.883333 0 0 0 0.41 0" />
        <feBlend mode="normal" in2="effect3_dropShadow_3082_52204" result="effect4_dropShadow_3082_52204" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect4_dropShadow_3082_52204" result="shape" />
      </filter>
      <linearGradient id="highlightedSource" x1="490" y1="25" x2="5.00002" y2="115" gradientUnits="userSpaceOnUse">
        <stop stopColor={styles.gradientOrange} />
        <stop offset="1" stopColor={styles.gradientBlue} />
      </linearGradient>
      <linearGradient id="highlightedDestination" x1="492" y1="25" x2="-2" y2="115" gradientUnits="userSpaceOnUse">
        <stop stopColor={styles.gradientOrange} />
        <stop offset="1" stopColor={styles.gradientBlue} />
      </linearGradient>
    </defs>
  </svg>
);
