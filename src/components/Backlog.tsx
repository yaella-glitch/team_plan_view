import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Chip } from './Chip';
import { useStore, selectBacklog } from '../store';
import { BACKLOG_DROP_ID, chipDragId } from '../lib/dnd';
import { CATEGORIES } from '../constants';

export function Backlog() {
  const chips = useStore(selectBacklog);
  const { setNodeRef, isOver } = useDroppable({ id: BACKLOG_DROP_ID });

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">Backlog</h2>
            <p className="mt-1 text-sm text-muted">
              Responsibilities not yet assigned. Drop here to park; drag back onto a card to assign.
            </p>
          </div>
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <span key={c.id} className="text-base" title={c.label}>
                {c.icon}
              </span>
            ))}
          </div>
        </div>

        <div
          ref={setNodeRef}
          className={[
            'min-h-[96px] rounded-2xl border-2 border-dashed p-4 transition-colors',
            isOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50/60',
          ].join(' ')}
        >
          <SortableContext items={chips.map((c) => chipDragId(c.id))} strategy={horizontalListSortingStrategy}>
            {chips.length === 0 ? (
              <p className="text-xs italic text-muted">Empty — drop a chip here to park it.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <Chip key={c.id} chip={c} />
                ))}
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    </section>
  );
}
