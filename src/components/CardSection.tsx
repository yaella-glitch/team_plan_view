import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { Category, ChipValue } from '../types';
import { CATEGORY_BY_ID } from '../constants';
import { Chip } from './Chip';
import { encodeSection, chipDragId } from '../lib/dnd';
import { useStore } from '../store';

type Props = {
  ownerId: string | null;
  category: Category;
  chips: ChipValue[];
  onRemoveSection?: () => void;
};

export function CardSection({ ownerId, category, chips, onRemoveSection }: Props) {
  const meta = CATEGORY_BY_ID[category];
  const dropId = encodeSection(ownerId, category);
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { ownerId, category } });
  const addChip = useStore((s) => s.addChip);

  return (
    <div
      ref={setNodeRef}
      className={[
        'group/section rounded-xl border bg-white/60 px-3 py-2 transition-colors',
        isOver ? 'border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-200' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <span className="text-base leading-none">{meta.icon}</span>
          <span className="uppercase tracking-wide">{meta.label}</span>
        </div>
        {onRemoveSection && (
          <button
            type="button"
            onClick={onRemoveSection}
            title="Remove this section"
            className="rounded-full px-1.5 text-xs text-muted opacity-0 hover:bg-slate-100 hover:text-ink group-hover/section:opacity-100"
          >
            −
          </button>
        )}
      </div>

      <SortableContext
        items={chips.map((c) => chipDragId(c.id))}
        strategy={horizontalListSortingStrategy}
      >
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 min-h-[28px]">
          {chips.map((c) => (
            <Chip key={c.id} chip={c} />
          ))}
          <button
            type="button"
            onClick={() => addChip(category, ownerId)}
            className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] text-muted hover:border-indigo-400 hover:text-indigo-600"
            title="Add"
          >
            +
          </button>
        </div>
      </SortableContext>
    </div>
  );
}
