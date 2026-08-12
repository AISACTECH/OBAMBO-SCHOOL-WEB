export default function SchoolLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="St Mark's Secondary School Obambo crest (temporary placeholder identity)"
    >
      <path
        d="M32 3 58 12v18c0 18-11.5 27.5-26 31C17.5 57.5 6 48 6 30V12L32 3Z"
        fill="url(#smk-grad)"
        stroke="#0a3d62"
        strokeWidth="1.5"
      />
      <path d="M32 3 58 12v18c0 18-11.5 27.5-26 31" fill="none" stroke="#f2b134" strokeWidth="1.2" opacity="0.6" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontFamily="Sora, sans-serif"
        fontWeight="700"
        fontSize="20"
        fill="white"
      >
        SM
      </text>
      <defs>
        <linearGradient id="smk-grad" x1="6" y1="3" x2="58" y2="61" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a3d62" />
          <stop offset="1" stopColor="#0b6e4f" />
        </linearGradient>
      </defs>
    </svg>
  );
}
