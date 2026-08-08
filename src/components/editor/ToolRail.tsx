'use client';

import {
  IconBrush,
  IconCrop,
  IconCutout,
  IconExport,
  IconFilters,
  IconLayers,
  IconMotion,
  IconShapes,
  IconSliders,
  IconSparkle,
  IconText,
} from '@/components/ui/Icons';
import { setTool, useEditor, type ToolId } from '@/engine/store';

const TOOLS: { id: ToolId; label: string; key: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'adjust', label: 'Adjust', key: 'A', icon: IconSliders },
  { id: 'filters', label: 'Looks', key: 'F', icon: IconFilters },
  { id: 'crop', label: 'Crop', key: 'C', icon: IconCrop },
  { id: 'effects', label: 'Transform', key: 'T', icon: IconSparkle },
  { id: 'cutout', label: 'Cut out', key: 'R', icon: IconCutout },
  { id: 'text', label: 'Text', key: 'X', icon: IconText },
  { id: 'draw', label: 'Paint', key: 'B', icon: IconBrush },
  { id: 'shapes', label: 'Shapes', key: 'S', icon: IconShapes },
  { id: 'animate', label: 'Motion', key: 'M', icon: IconMotion },
  { id: 'layers', label: 'Layers', key: 'L', icon: IconLayers },
  { id: 'export', label: 'Export', key: 'E', icon: IconExport },
];

export const TOOL_SHORTCUTS = Object.fromEntries(
  TOOLS.map((t) => [t.key.toLowerCase(), t.id]),
) as Record<string, ToolId>;

export function ToolRail() {
  const active = useEditor((s) => s.tool);

  return (
    <nav
      aria-label="Tools"
      className="flex w-[72px] shrink-0 flex-col items-center gap-0.5 border-r border-line bg-surface-1 py-3"
    >
      {TOOLS.map(({ id, label, key, icon: Icon }) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            title={`${label}  ·  ${key}`}
            aria-pressed={on}
            className={`group relative flex w-[60px] flex-col items-center gap-1 rounded-lg py-2 transition-colors duration-150 ${
              on ? 'text-craft' : 'text-text-low hover:text-text-hi'
            }`}
          >
            {/* The active marker is a rail on the left edge rather than a
                filled pill, so it never competes with the photo for attention. */}
            <span
              className={`absolute left-0 top-1/2 h-6 w-[2.5px] -translate-y-1/2 rounded-r-full bg-craft transition-all duration-200 ${
                on ? 'opacity-100' : 'scale-y-0 opacity-0'
              }`}
            />
            <span
              className={`flex size-9 items-center justify-center rounded-lg transition-colors duration-150 ${
                on ? 'bg-craft/10' : 'group-hover:bg-surface-2'
              }`}
            >
              <Icon />
            </span>
            <span className="text-[10px] leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
