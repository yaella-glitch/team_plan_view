import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
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
  pmmFocus: 'border-rose-300 bg-rose-50 text-rose-800 ring-rose-200',
  businessKpi: 'border-amber-300 bg-amber-50 text-amber-800 ring-amber-200',
  persona: 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-emerald-200',
  marketingFocal: 'border-sky-300 bg-sky-50 text-sky-800 ring-sky-200',
  croCcoFocal: 'border-indigo-300 bg-indigo-50 text-indigo-800 ring-indigo-200',
  productFocal: 'border-violet-300 bg-violet-50 text-violet-800 ring-violet-200',
  agenticFlow: 'border-slate-300 bg-slate-100 text-slate-800 ring-slate-200',
};

export function OwnershipOverview() {
  const activeTab = useStore((s) => s.activeTopicTab);
  const setActiveTab = useStore((s) => s.setActiveTopicTab);
  const people = useStore((s) => s.people);
  const chips = useStore((s) => s.chips);
  const meta = CATEGORY_BY_ID[activeTab];

  return (
    <section className="mx-auto max-w-7xl px-8 py-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-ink">Ownership by topic</h2>
        <p className="mt-1 text-sm text-muted">
          Click a topic to see what each PMM owns there.
        </p>
      </div>

      {/* Single bounded container */}
      <div className="overflow-hidden rounded-3xl border border-border bg-white/70 shadow-sm">
        {/* Tabs row — each tab takes its category's color when active */}
        <div className="flex flex-wrap gap-2 border-b border-border/80 bg-white/60 px-5 py-4">
          {CATEGORIES.map((c) => {
            const active = c.id === activeTab;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveTab(c.id)}
                className={[
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-all',
                  active
                    ? `${ACTIVE_TAB_STYLE[c.id]} font-semibold shadow-sm ring-1`
                    : 'border-transparent text-muted hover:border-slate-200 hover:bg-white hover:text-ink',
                ].join(' ')}
              >
                <span className="text-base leading-none">{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Active category indicator */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-slate-50/60 px-5 py-2.5 text-xs uppercase tracking-wide text-muted">
          <span className="text-base">{meta.icon}</span>
          <span>Showing</span>
          <span className="font-semibold text-ink normal-case tracking-normal">{meta.label}</span>
          <span className="ml-auto text-[11px] normal-case tracking-normal italic">
            same team, different lens
          </span>
        </div>

        {/* Rows of PMMs — photo + name + chips, inline, no card chrome */}
        <ul className="divide-y divide-border/60">
          {people.map((p) => (
            <PersonRow
              key={p.id}
              person={p}
              category={activeTab}
              chips={chips
                .filter((c) => c.ownerId === p.id && c.category === activeTab)
                .sort((a, b) => a.order - b.order)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function PersonRow({
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

  return (
    <li
      ref={setNodeRef}
      className={[
        'flex items-center gap-4 px-5 py-3 transition-colors',
        isOver ? 'bg-indigo-50/60' : 'hover:bg-slate-50/60',
      ].join(' ')}
    >
      {/* Photo */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white shadow-sm ring-1 ring-slate-200">
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
              'flex h-full w-full items-center justify-center text-xs font-semibold',
              imgFailed ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600',
            ].join(' ')}
          >
            {imgFailed ? '!' : initials(person.name)}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="w-40 shrink-0 truncate text-sm font-medium text-ink">{person.name}</div>

      {/* Chips */}
      <SortableContext items={chips.map((c) => chipDragId(c.id))} strategy={horizontalListSortingStrategy}>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {chips.length === 0 ? (
            <span className="text-xs italic text-muted">—</span>
          ) : (
            chips.map((c) => <Chip key={c.id} chip={c} compact />)
          )}
          <button
            type="button"
            onClick={() => addChip(category, person.id)}
            className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] text-muted hover:border-indigo-400 hover:text-indigo-600"
            title="Add"
          >
            +
          </button>
        </div>
      </SortableContext>
    </li>
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
