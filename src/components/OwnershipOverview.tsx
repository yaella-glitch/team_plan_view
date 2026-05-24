import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store';
import { CATEGORIES, CATEGORY_BY_ID } from '../constants';
import type { Category, ChipValue, Person } from '../types';
import { encodeSection, chipDragId } from '../lib/dnd';
import { Chip } from './Chip';
import { resolvePhotoUrl } from '../lib/photo';

export function OwnershipOverview() {
  const activeTab = useStore((s) => s.activeTopicTab);
  const setActiveTab = useStore((s) => s.setActiveTopicTab);
  const people = useStore((s) => s.people);
  const chips = useStore((s) => s.chips);
  const addChip = useStore((s) => s.addChip);
  const meta = CATEGORY_BY_ID[activeTab];

  return (
    <section className="mx-auto max-w-7xl px-8 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-ink">Ownership by topic</h2>
        <p className="mt-1 text-sm text-muted">
          Pick a category and see what each PMM owns there. Drag chips between mini cards to reassign.
        </p>
      </div>

      {/* Sausage tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = c.id === activeTab;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveTab(c.id)}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                active
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                  : 'border-border bg-white text-muted hover:border-slate-300 hover:text-ink',
              ].join(' ')}
            >
              <span className="text-base leading-none">{c.icon}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Active tab header */}
      <div className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${meta.tint}`}>
        <span className="text-lg">{meta.icon}</span>
        <span>{meta.label}</span>
      </div>

      {/* Mini cards grid — one per PMM */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {people.map((p) => (
          <MiniCard
            key={p.id}
            person={p}
            category={activeTab}
            chips={chips
              .filter((c) => c.ownerId === p.id && c.category === activeTab)
              .sort((a, b) => a.order - b.order)}
            onAdd={() => addChip(activeTab, p.id)}
          />
        ))}
      </div>
    </section>
  );
}

function MiniCard({
  person,
  category,
  chips,
  onAdd,
}: {
  person: Person;
  category: Category;
  chips: ChipValue[];
  onAdd: () => void;
}) {
  const dropId = encodeSection(person.id, category);
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { ownerId: person.id, category } });
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm transition-all',
        isOver ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-border',
      ].join(' ')}
    >
      {/* Square photo */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
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
              'flex h-full w-full items-center justify-center text-3xl font-bold',
              imgFailed ? 'bg-rose-50 text-rose-400' : 'text-slate-400',
            ].join(' ')}
            title={imgFailed ? `Photo not found: ${person.photoUrl}` : ''}
          >
            {imgFailed ? '!' : initials(person.name)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-ink">{person.name}</h4>
          {person.role && <p className="truncate text-[11px] text-muted">{person.role}</p>}
        </div>

        <SortableContext items={chips.map((c) => chipDragId(c.id))} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
            {chips.length === 0 ? (
              <span className="text-[11px] italic text-muted">—</span>
            ) : (
              chips.map((c) => <Chip key={c.id} chip={c} compact />)
            )}
            <button
              type="button"
              onClick={onAdd}
              className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] text-muted hover:border-indigo-400 hover:text-indigo-600"
              title={`Add ${CATEGORY_BY_ID[category].label}`}
            >
              +
            </button>
          </div>
        </SortableContext>
      </div>
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
