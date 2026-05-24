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
    <section className="sticky bottom-0 z-20 mt-8 border-t border-border bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-8 py-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">Backlog — not yet assigned</h3>
            <p className="text-xs text-muted">
              Drop responsibilities here to park them. Drag back onto a card to assign.
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
            'min-h-[64px] rounded-xl border-2 border-dashed p-3 transition-colors',
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
