'use client';

const GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Tools',
    rows: [
      ['A', 'Adjust'],
      ['F', 'Looks'],
      ['C', 'Crop'],
      ['T', 'Transform'],
      ['R', 'Cut out'],
      ['X', 'Text'],
      ['B', 'Paint'],
      ['S', 'Shapes'],
      ['M', 'Motion'],
      ['L', 'Layers'],
      ['E', 'Export'],
    ],
  },
  {
    title: 'Canvas',
    rows: [
      ['\\', 'Hold to see the untouched original'],
      ['Space + drag', 'Pan the canvas'],
      ['Ctrl + scroll', 'Zoom around the pointer'],
      ['Shift + drag', 'Fine control on any slider'],
      ['Double-click', 'Return a slider to neutral'],
      ['0', 'Fit the photo to the window'],
    ],
  },
  {
    title: 'Document',
    rows: [
      ['Ctrl O', 'Open a photo'],
      ['Ctrl V', 'Paste from the clipboard'],
      ['Ctrl Z', 'Undo'],
      ['Ctrl Shift Z', 'Redo'],
      ['Ctrl D', 'Duplicate the selected layer'],
      ['Delete', 'Remove the selected layer'],
      ['?', 'Open and close this list'],
    ],
  },
];

function Key({ children }: { children: string }) {
  return (
    <span className="inline-flex min-w-[22px] items-center justify-center rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-text-mid">
      {children}
    </span>
  );
}

export function Shortcuts({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] rounded-panel border border-line bg-surface-1 p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-text-hi">
              Keyboard shortcuts
            </h2>
            <p className="mt-1 text-[12px] text-text-low">
              Every tool sits one key away. Hold rather than toggle where it makes sense.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-text-mid transition-colors hover:text-text-hi"
          >
            Esc
          </button>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-text-low">
                {g.title}
              </h3>
              <ul className="space-y-1.5">
                {g.rows.map(([k, label]) => (
                  <li key={k} className="flex items-baseline gap-2 text-[11.5px] text-text-mid">
                    <span className="flex shrink-0 gap-1">
                      {k.split(' ').map((part, i) =>
                        part === '+' ? (
                          <span key={i} className="text-text-low">
                            +
                          </span>
                        ) : (
                          <Key key={i}>{part}</Key>
                        ),
                      )}
                    </span>
                    <span className="leading-snug">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
