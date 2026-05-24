import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store';
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
  pmmFocus: 'border-rose-300 bg-rose-50 text-rose-800',
  businessKpi: 'border-amber-300 bg-amber-50 text-amber-800',
  persona: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  marketingFocal: 'border-sky-300 bg-sky-50 text-sky-800',
  croCcoFocal: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  productFocal: 'border-violet-300 bg-violet-50 text-violet-800',
  agenticFlow: 'border-slate-300 bg-slate-100 text-slate-800',
};

export function OwnershipOverview() {
  const activeTab = useStore((s) => s.activeTopicTab);
  const setActiveTab = useStore((s) => s.setActiveTopicTab);
  const people = useStore((s) => s.people);
  const chips = useStore((s) => s.chips);

  return (
    <section className="mx-auto max-w-7xl px-8 py-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-ink">Ownership by topic</h2>
      </div>

      {/* Single bounded container */}
      <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
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
                    ? `${ACTIVE_TAB_STYLE[c.id]} font-semibold shadow-sm`
                    : 'border-transparent text-muted hover:bg-slate-50 hover:text-ink',
                ].join(' ')}
              >
                <span className="text-base leading-none">{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Horizontal row of PMM tiles */}
        <div className="flex flex-wrap gap-x-6 gap-y-5 pt-2">
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
        'flex w-[150px] flex-col items-center gap-2 rounded-2xl p-2 transition-colors',
        isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : '',
      ].join(' ')}
    >
      {/* Photo */}
      <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-slate-100">
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
              'flex h-full w-full items-center justify-center text-lg font-semibold',
              imgFailed ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600',
            ].join(' ')}
          >
            {imgFailed ? '!' : initials(person.name)}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="w-full truncate text-center text-xs font-semibold text-ink">{person.name}</div>

      {/* Chips for the active category */}
      <SortableContext items={chips.map((c) => chipDragId(c.id))} strategy={rectSortingStrategy}>
        <div className="flex w-full flex-wrap justify-center gap-1">
          {chips.length === 0 ? (
            <span className="text-[11px] italic text-muted">—</span>
          ) : (
            chips.map((c) => <Chip key={c.id} chip={c} compact />)
          )}
          <button
            type="button"
            onClick={() => addChip(category, person.id)}
            className="rounded-full border border-dashed border-slate-300 px-1.5 py-0 text-[10px] text-muted hover:border-indigo-400 hover:text-indigo-600"
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
