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
        'group/section transition-colors',
        isOver ? 'rounded-xl bg-accent/10 ring-1 ring-accent/40' : '',
      ].join(' ')}
    >
      <div className="flex items-baseline gap-2">
        <h4 className="text-base font-bold text-ink">{meta.label}:</h4>
        {onRemoveSection && (
          <button
            type="button"
            onClick={onRemoveSection}
            title="Remove this section"
            className="ml-auto rounded-full px-1.5 text-xs text-muted opacity-0 hover:text-ink group-hover/section:opacity-100"
          >
            −
          </button>
        )}
      </div>

      <SortableContext items={chips.map((c) => chipDragId(c.id))} strategy={horizontalListSortingStrategy}>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <Chip key={c.id} chip={c} />
          ))}
          <button
            type="button"
            onClick={() => addChip(category, ownerId)}
            className="rounded-full border border-dashed border-accent/30 px-2 py-0.5 text-[11px] text-muted hover:border-accent hover:text-ink"
            title="Add"
          >
            +
          </button>
        </div>
      </SortableContext>
    </div>
  );
}
