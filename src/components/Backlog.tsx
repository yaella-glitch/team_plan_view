import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Chip } from './Chip';
import { useStore, selectBacklog } from '../store';
import { BACKLOG_DROP_ID, chipDragId } from '../lib/dnd';
import { CATEGORIES, CATEGORY_BY_ID } from '../constants';
import type { Category } from '../types';

export function Backlog() {
  const chips = useStore(selectBacklog);
  const { setNodeRef, isOver } = useDroppable({ id: BACKLOG_DROP_ID });
  const addPerson = useStore((s) => s.addPerson);
  const addChip = useStore((s) => s.addChip);
  const [openOwnership, setOpenOwnership] = useState(false);

  const onAddPmm = () => {
    const name = prompt('New PMM name?');
    if (name && name.trim()) addPerson(name.trim());
  };

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <h2 className="mb-5 text-2xl font-bold text-ink">Add & manage</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActionCard
          icon="👤"
          title="Add PMM"
          subtitle="A new person joins the team"
          onClick={onAddPmm}
        />
        <ActionCard
          icon="🧩"
          title="Add ownership area"
          subtitle="A new responsibility to assign later"
          onClick={() => setOpenOwnership(true)}
        />
      </div>

      {openOwnership && (
        <AddOwnershipModal
          onClose={() => setOpenOwnership(false)}
          onAdd={(cat, label) => {
            addChip(cat, null, label);
            setOpenOwnership(false);
          }}
        />
      )}

      {/* Unassigned ownership areas — secondary, smaller */}
      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Unassigned ownership areas <span className="ml-1 normal-case text-slate-400">({chips.length})</span>
        </p>
        <div
          ref={setNodeRef}
          className={[
            'min-h-[72px] rounded-2xl border-2 border-dashed p-3 transition-colors',
            isOver ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/[0.02]',
          ].join(' ')}
        >
          <SortableContext items={chips.map((c) => chipDragId(c.id))} strategy={horizontalListSortingStrategy}>
            {chips.length === 0 ? (
              <p className="text-xs italic text-muted">Empty — drop a chip from a card here to park it, or add one above.</p>
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

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-gradient-subtle group block text-left"
    >
      <div className="card-gradient-inner flex items-center gap-4 p-5">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <div className="text-base font-semibold text-ink">+ {title}</div>
          <div className="text-xs text-muted">{subtitle}</div>
        </div>
        <span className="text-2xl text-muted/50 transition-colors group-hover:text-accent">→</span>
      </div>
    </button>
  );
}

function AddOwnershipModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (category: Category, label: string) => void;
}) {
  const [category, setCategory] = useState<Category>('pmmFocus');
  const [label, setLabel] = useState('');

  const submit = () => {
    const v = label.trim();
    if (!v) return;
    onAdd(category, v);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div className="card-gradient w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="card-gradient-inner p-6">
        <h3 className="text-lg font-bold text-ink">Add ownership area</h3>
        <p className="mt-1 text-xs text-muted">It'll live in the Unassigned area below — drag onto a PMM to assign.</p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id} className="bg-surface text-ink">
              {c.icon} {c.label}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          {CATEGORY_BY_ID[category].label}
        </label>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            else if (e.key === 'Escape') onClose();
          }}
          placeholder="e.g. Enterprise ARR"
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-muted hover:bg-white/5 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!label.trim()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
