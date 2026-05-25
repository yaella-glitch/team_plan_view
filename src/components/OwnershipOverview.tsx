import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useStore, selectVisiblePeople } from '../store';
import { CATEGORIES, CATEGORY_BY_ID } from '../constants';
import type { Category, ChipValue, Person } from '../types';
import { encodeSection, chipDragId } from '../lib/dnd';
import { Chip } from './Chip';
import { resolvePhotoUrl } from '../lib/photo';

/**
 * Per-category color treatment for the active tab.
 * Mirrors the chip colors in constants.ts so the active tab visually
 * matches the chip color you'll see for that category.
 */
const ACTIVE_TAB_STYLE: Record<Category, string> = {
  pmmFocus: 'border-rose-400/50 bg-rose-400/15 text-rose-100',
  businessKpi: 'border-amber-400/50 bg-amber-400/15 text-amber-100',
  persona: 'border-emerald-400/50 bg-emerald-400/15 text-emerald-100',
  marketingFocal: 'border-sky-400/50 bg-sky-400/15 text-sky-100',
  croCcoFocal: 'border-indigo-400/50 bg-indigo-400/20 text-indigo-100',
  productFocal: 'border-violet-400/50 bg-violet-400/20 text-violet-100',
  agenticFlow: 'border-slate-400/50 bg-slate-400/15 text-slate-100',
};

export function OwnershipOverview() {
  const activeTab = useStore((s) => s.activeTopicTab);
  const setActiveTab = useStore((s) => s.setActiveTopicTab);
  const people = useStore(selectVisiblePeople);
  const chips = useStore((s) => s.chips);

  return (
    <section className="mx-auto max-w-7xl px-8 py-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-ink">Ownership by topic</h2>
      </div>

      {/* Single bounded container — gradient border */}
      <div className="card-gradient">
        <div className="card-gradient-inner p-5">
        {/* Tabs row */}
        <div className="flex flex-wrap gap-2 pb-4">
          {CATEGORIES.map((c) => {
            const active = c.id === activeTab;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveTab(c.id)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                  active
                    ? `${ACTIVE_TAB_STYLE[c.id]} font-semibold`
                    : 'border-transparent text-muted hover:bg-white/5 hover:text-ink',
                ].join(' ')}
              >
                <span className="text-base leading-none">{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Grid of PMM tiles — each tile lays out photo + name + chips horizontally */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
          {people.map((p) => (
            <PersonTile
              key={p.id}
              person={p}
              category={activeTab}
              chips={chips
                .filter((c) => c.ownerId === p.id && c.category === activeTab)
                .sort((a, b) => a.order - b.order)}
            />
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

function PersonTile({
  person,
  category,
  chips,
}: {
  person: Person;
  category: Category;
  chips: ChipValue[];
}) {
  const addChip = useStore((s) => s.addChip);
  const dropId = encodeSection(person.id, category);
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { ownerId: person.id, category } });
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  const meta = CATEGORY_BY_ID[category];

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex items-center gap-3 rounded-2xl p-2 transition-colors',
        isOver ? 'bg-accent/10 ring-2 ring-accent/40' : '',
      ].join(' ')}
    >
      {/* Photo */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
        {photo && !imgFailed ? (
          <img
            src={photo}
            alt={person.name}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className={[
              'flex h-full w-full items-center justify-center text-sm font-semibold',
              imgFailed ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-muted',
            ].join(' ')}
          >
            {imgFailed ? '!' : initials(person.name)}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="w-[88px] shrink-0 truncate text-sm font-semibold text-ink">{person.name}</div>

      {/* Chips for the active category — flow inline next to name */}
      <SortableContext items={chips.map((c) => chipDragId(c.id))} strategy={rectSortingStrategy}>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {chips.length === 0 ? (
            <span className="text-[11px] italic text-muted">—</span>
          ) : (
            chips.map((c) => <Chip key={c.id} chip={c} compact hidePrimary />)
          )}
          <button
            type="button"
            onClick={() => addChip(category, person.id)}
            className="rounded-full border border-dashed border-accent/30 px-1.5 py-0 text-[10px] text-muted hover:border-accent hover:text-ink"
            title={`Add ${meta.label}`}
          >
            +
          </button>
        </div>
      </SortableContext>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
