import { useEffect, useRef, useState } from 'react';

/** Editable list of string tags rendered as outlined pills.
 *  When admin is true, hovering a tag shows × to remove and a + button at
 *  the end opens an input to add a new tag. Read-only otherwise. */
export function EditableTags({
  values,
  onChange,
  admin,
  placeholderEmpty = '—',
  hex = 'rgb(var(--accent))',
}: {
  values: string[];
  onChange: (next: string[]) => void;
  admin: boolean;
  placeholderEmpty?: string;
  hex?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {values.length === 0 && !admin && (
        <span className="text-xs italic text-muted">{placeholderEmpty}</span>
      )}
      {values.map((v, i) => (
        <span
          key={`${v}-${i}`}
          className="group/tag inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs"
          style={{ borderColor: hex, color: hex }}
        >
          <span>{v}</span>
          {admin && (
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="opacity-0 transition-opacity group-hover/tag:opacity-70 hover:!opacity-100"
              title="Remove"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {admin && (
        adding ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              else if (e.key === 'Escape') {
                setDraft('');
                setAdding(false);
              }
            }}
            placeholder="tag…"
            className="rounded-full border-2 bg-white/[0.04] px-3 py-0.5 text-xs outline-none"
            style={{ borderColor: hex, color: hex, minWidth: '80px' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border-2 border-dashed px-3 py-1 text-xs"
            style={{ borderColor: `${hex}99`, color: hex }}
            title="Add tag"
          >
            +
          </button>
        )
      )}
    </div>
  );
}

/** Editable single-line text field. Click to edit; saves on blur/Enter. */
export function EditableLine({
  value,
  onChange,
  admin,
  placeholder = 'free text',
}: {
  value: string;
  onChange: (next: string) => void;
  admin: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (editing && admin) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
          else if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-ink outline-none border-b border-accent/40"
      />
    );
  }

  return (
    <span
      onDoubleClick={() => admin && setEditing(true)}
      className={['block text-sm', value ? 'text-ink' : 'italic text-muted', admin ? 'cursor-text' : ''].join(' ')}
      title={admin ? 'Double-click to edit' : undefined}
    >
      {value || placeholder}
    </span>
  );
}

/** Editable multi-line text — same parser as R&R (bullets + indent). */
export function EditableMultiline({
  value,
  onChange,
  admin,
  placeholder = '• point one\n• point two',
  emptyMessage,
}: {
  value: string;
  onChange: (next: string) => void;
  admin: boolean;
  placeholder?: string;
  emptyMessage?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setDraft(value), [value]);

  if (editing && admin) {
    return (
      <div>
        <textarea
          ref={textareaRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          placeholder={placeholder}
          className="w-full whitespace-pre-wrap rounded-lg border border-white/15 bg-white/[0.04] p-3 text-sm text-ink outline-none focus:border-accent/60"
        />
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="rounded-full px-3 py-1 text-xs text-muted hover:bg-white/5 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(draft);
              setEditing(false);
            }}
            className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-canvas hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  if (!value && !admin) {
    return emptyMessage ? <span className="text-sm italic text-muted">{emptyMessage}</span> : null;
  }

  if (!value && admin) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm italic text-muted hover:text-ink"
      >
        + Add
      </button>
    );
  }

  return (
    <div
      onDoubleClick={() => admin && setEditing(true)}
      className={['text-sm', admin ? 'cursor-text' : ''].join(' ')}
      title={admin ? 'Double-click to edit' : undefined}
    >
      <BulletText text={value} />
    </div>
  );
}

/** Pretty-render free text: lines starting with *, -, •, – become bullet
 *  items; leading whitespace becomes left padding for nesting. */
export function BulletText({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  return (
    <div className="leading-relaxed text-ink">
      {lines.map((raw, i) => {
        if (!raw.trim()) return <div key={i} className="h-2" />;
        const indent = raw.length - raw.trimStart().length;
        const trimmed = raw.trimStart();
        const m = trimmed.match(/^([*\-•–])\s+(.*)$/);
        const isBullet = !!m;
        const content = m ? m[2] : trimmed;
        return (
          <div key={i} className="flex items-start gap-1.5" style={{ paddingLeft: `${indent * 0.45}rem` }}>
            {isBullet && (
              <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            )}
            <span className="flex-1 break-words">{content}</span>
          </div>
        );
      })}
    </div>
  );
}
