export function WorldEmblem() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" className="!h-full !w-full">
      <circle cx="40" cy="40" r="29" stroke="currentColor" strokeWidth=".7" />
      <circle cx="40" cy="40" r="24" stroke="currentColor" strokeWidth=".5" strokeDasharray="1 3" />
      <path d="M40 17v10m0 26v10M17 40h10m26 0h10M24 24l7 7m18 18l7 7M24 56l7-7m18-18l7-7" stroke="currentColor" strokeWidth=".8" />
      <path d="M40 28l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" stroke="currentColor" />
      <ellipse cx="40" cy="40" rx="35" ry="12" transform="rotate(-35 40 40)" stroke="currentColor" strokeWidth=".6" />
    </svg>
  );
}