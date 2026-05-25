import { useEffect, useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore, selectVisiblePeople } from '../store';
import { PersonCard } from './PersonCard';
import { resolvePhotoUrl } from '../lib/photo';
import type { Person } from '../types';

const personDragId = (id: string) => `person:${id}`;

export function CardsCanvas() {
  const people = useStore(selectVisiblePeople);
  const [selectedId, setSelectedId] = useState<string | null>(people[0]?.id ?? null);

  // Keep selection valid if people list changes.
  useEffect(() => {
    if (people.length === 0) {
      setSelectedId(null);
    } else if (!selectedId || !people.find((p) => p.id === selectedId)) {
      setSelectedId(people[0].id);
    }
  }, [people, selectedId]);

  const selected = people.find((p) => p.id === selectedId) ?? null;

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink">Full card: ownership by PMM</h2>
      </div>

      <div className="flex gap-5">
        {/* Left strip: ~15% photo carousel */}
        <aside className="w-[88px] shrink-0">
          <div className="sticky top-4 max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-sm backdrop-blur">
            <SortableContext
              items={people.map((p) => personDragId(p.id))}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-1.5">
                {people.map((p) => (
                  <PhotoTile
                    key={p.id}
                    person={p}
                    active={p.id === selectedId}
                    onSelect={() => setSelectedId(p.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </div>
        </aside>

        {/* Right: expanded card */}
        <div className="min-w-0 flex-1">
          {selected ? (
            <PersonCard person={selected} />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-sm italic text-muted">
              No team members yet. Click "+ Add PMM" above.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PhotoTile({
  person,
  active,
  onSelect,
}: {
  person: Person;
  active: boolean;
  onSelect: () => void;
}) {
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: personDragId(person.id),
    data: { personId: person.id, kind: 'person-reorder' },
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={[
          'group flex w-full flex-col items-center gap-1 rounded-lg p-1 transition-all',
          active ? 'bg-accent/15 ring-2 ring-accent/60' : 'hover:bg-white/5',
        ].join(' ')}
        title={`${person.name} — drag to reorder`}
        {...attributes}
        {...listeners}
      >
        <div
          className={[
            'aspect-square w-full overflow-hidden rounded-lg ring-2',
            active ? 'ring-accent/60' : 'ring-white/10 group-hover:ring-accent/30',
          ].join(' ')}
        >
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
                'flex h-full w-full items-center justify-center text-base font-bold',
                imgFailed ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-muted',
              ].join(' ')}
            >
              {imgFailed ? '!' : initials(person.name)}
            </div>
          )}
        </div>
        <span
          className={[
            'w-full truncate text-center text-[10px] leading-tight',
            active ? 'font-semibold text-accent' : 'text-muted',
          ].join(' ')}
        >
          {person.name}
        </span>
      </button>
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
