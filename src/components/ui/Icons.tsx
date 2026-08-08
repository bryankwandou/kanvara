/**
 * Hand-drawn on a 24px grid at 1.6 stroke so the whole set shares one optical
 * weight. Pulling in an icon package would have meant shipping several hundred
 * glyphs to use eighteen of them.
 */
type P = { className?: string };

const base = 'size-[18px]';
const svg = (className?: string) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: className ?? base,
  'aria-hidden': true,
});

export const IconCursor = ({ className }: P) => (
  <svg {...svg(className)}><path d="M5 3l6.5 17 2.2-7.3L21 10.5z" /></svg>
);
export const IconCrop = ({ className }: P) => (
  <svg {...svg(className)}><path d="M6 2v16h16M2 6h16v16" /></svg>
);
export const IconSliders = ({ className }: P) => (
  <svg {...svg(className)}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
);
export const IconFilters = ({ className }: P) => (
  <svg {...svg(className)}><circle cx="9" cy="9" r="6" /><circle cx="15" cy="15" r="6" /></svg>
);
export const IconSparkle = ({ className }: P) => (
  <svg {...svg(className)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></svg>
);
export const IconText = ({ className }: P) => (
  <svg {...svg(className)}><path d="M5 5h14M12 5v14M9 19h6" /></svg>
);
export const IconBrush = ({ className }: P) => (
  <svg {...svg(className)}><path d="M15 3l6 6-9.5 9.5a4 4 0 01-2.2 1.1L4 21l1.4-5.3a4 4 0 011.1-2.2z" /><path d="M13 5l6 6" /></svg>
);
export const IconShapes = ({ className }: P) => (
  <svg {...svg(className)}><circle cx="8" cy="8" r="5" /><rect x="11" y="11" width="10" height="10" rx="2" /></svg>
);
export const IconCutout = ({ className }: P) => (
  <svg {...svg(className)}><path d="M12 3v10" /><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /><path d="M9.2 14.8L18 4M14.8 14.8L6 4" /></svg>
);
export const IconLayers = ({ className }: P) => (
  <svg {...svg(className)}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /><path d="M3 17.5l9 5 9-5" /></svg>
);
export const IconMotion = ({ className }: P) => (
  <svg {...svg(className)}><path d="M4 12h4M4 7h9M4 17h6" /><path d="M13 8.5l7 3.5-7 3.5z" /></svg>
);
export const IconExport = ({ className }: P) => (
  <svg {...svg(className)}><path d="M12 16V4M8 8l4-4 4 4" /><path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" /></svg>
);
export const IconUndo = ({ className }: P) => (
  <svg {...svg(className)}><path d="M4 10h9a5 5 0 010 10h-4" /><path d="M8 6l-4 4 4 4" /></svg>
);
export const IconRedo = ({ className }: P) => (
  <svg {...svg(className)}><path d="M20 10h-9a5 5 0 000 10h4" /><path d="M16 6l4 4-4 4" /></svg>
);
export const IconEye = ({ className }: P) => (
  <svg {...svg(className)}><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.6" /></svg>
);
export const IconEyeOff = ({ className }: P) => (
  <svg {...svg(className)}><path d="M4 4l16 16" /><path d="M9.6 5.8A10.5 10.5 0 0112 5.5c6.4 0 10 6.5 10 6.5a17 17 0 01-3.3 4M6.3 8A17 17 0 002 12s3.6 6.5 10 6.5a10.6 10.6 0 004-.75" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></svg>
);
export const IconTrash = ({ className }: P) => (
  <svg {...svg(className)}><path d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14" /></svg>
);
export const IconCopy = ({ className }: P) => (
  <svg {...svg(className)}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></svg>
);
export const IconPlus = ({ className }: P) => (
  <svg {...svg(className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconPlay = ({ className }: P) => (
  <svg {...svg(className)}><path d="M7 4.5l12 7.5-12 7.5z" /></svg>
);
export const IconPause = ({ className }: P) => (
  <svg {...svg(className)}><path d="M8 4v16M16 4v16" /></svg>
);
export const IconImage = ({ className }: P) => (
  <svg {...svg(className)}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M3 17l5-4.5 4 3.5 3-2.5 6 5" /></svg>
);
export const IconLock = ({ className }: P) => (
  <svg {...svg(className)}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
);
export const IconUnlock = ({ className }: P) => (
  <svg {...svg(className)}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 017-2.6" /></svg>
);
export const IconChevron = ({ className }: P) => (
  <svg {...svg(className)}><path d="M9 5l7 7-7 7" /></svg>
);
export const IconReset = ({ className }: P) => (
  <svg {...svg(className)}><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.7L3 8" /><path d="M3 3v5h5" /></svg>
);
