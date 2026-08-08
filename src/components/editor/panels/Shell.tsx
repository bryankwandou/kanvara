'use client';

import { useState } from 'react';
import { IconChevron } from '@/components/ui/Icons';

export function PanelHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-4 pb-3 pt-4">
      <div>
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-text-hi">{title}</h2>
        {hint && <p className="mt-0.5 max-w-[26ch] text-[11px] leading-snug text-text-low">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({
  title,
  children,
  defaultOpen = true,
  right,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  right?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line/60 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="-ml-1 flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-text-low transition-colors hover:text-text-mid"
        >
          <IconChevron
            className={`size-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
          {title}
        </button>
        {right}
      </div>
      {open && <div className="pt-1">{children}</div>}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1.5 block text-[11px] text-text-mid">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] text-text-hi outline-none transition-colors focus:border-craft/70';

export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  full,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'ghost' | 'solid' | 'assist' | 'danger';
  disabled?: boolean;
  full?: boolean;
  title?: string;
}) {
  const styles = {
    ghost: 'border-line bg-surface-2 text-text-mid hover:border-line hover:bg-surface-3 hover:text-text-hi',
    solid: 'border-transparent bg-craft text-black hover:bg-craft-soft',
    assist: 'border-transparent bg-assist text-white hover:brightness-110',
    danger: 'border-line bg-surface-2 text-danger hover:bg-danger/10',
  }[variant];

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${styles} ${full ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}

export function Swatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-7 shrink-0 overflow-hidden rounded-md border border-line">
        <input
          type="color"
          value={value.slice(0, 7)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -inset-2 cursor-pointer border-0 bg-transparent p-0"
        />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={`${inputClass} tabular uppercase`}
      />
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-10 text-center text-[12px] leading-relaxed text-text-low">{text}</div>
  );
}
