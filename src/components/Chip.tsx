import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChipValue } from '../types';
import { CATEGORY_BY_ID } from '../constants';
import { useStore } from '../store';
import { chipDragId } from '../lib/dnd';

type Props = {
  chip: ChipValue;
  /** When true, render compact. Default false (card chip). */
  compact?: boolean;
  /** When true, suppress the primary-star button and the bold/ring treatment.
   *  Used in Ownership overview where chips should look equal. */
  hidePrimary?: boolean;
};

export function Chip({ chip, compact = false, hidePrimary = false }: Props) {
  const meta = CATEGORY_BY_ID[chip.category];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chipDragId(chip.id),
    data: { chipId: chip.id },
  });
  const updateChipLabel = useStore((s) => s.updateChipLabel);
  const deleteChip = useStore((s) => s.deleteChip);
  const toggleChipPrimary = useStore((s) => s.toggleChipPrimary);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chip.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(chip.label), [chip.label]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== chip.label) updateChipLabel(chip.id, next);
    else setDraft(chip.label);
    setEditing(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs',
        meta.tint,
        meta.border,
        chip.isPrimary && !hidePrimary ? 'font-semibold ring-1 ring-white/30' : '',
        compact ? 'text-[10px] leading-tight px-1.5 py-0.5' : '',
        'select-none',
      ].join(' ')}
    >
      {!hidePrimary && (
        <button
          type="button"
          onClick={() => toggleChipPrimary(chip.id)}
          title={chip.isPrimary ? 'Primary (click to unmark)' : 'Mark as primary'}
          className="opacity-60 hover:opacity-100"
        >
          {chip.isPrimary ? '★' : '☆'}
        </button>
      )}

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') {
              setDraft(chip.label);
              setEditing(false);
            }
          }}
          className="min-w-[60px] bg-transparent outline-none border-b border-current/40"
          style={{ width: `${Math.max(draft.length, 4)}ch` }}
        />
      ) : (
        <span
          className="cursor-text"
          onDoubleClick={() => setEditing(true)}
          {...listeners}
          {...attributes}
        >
          {chip.label}
        </span>
      )}

      <button
        type="button"
        onClick={() => deleteChip(chip.id)}
        title="Delete"
        className="ml-1 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60"
      >
        ×
      </button>
    </div>
  );
}
