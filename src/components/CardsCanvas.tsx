import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { PersonCard } from './PersonCard';
import { resolvePhotoUrl } from '../lib/photo';
import type { Person } from '../types';

export function CardsCanvas() {
  const people = useStore((s) => s.people);
  const addPerson = useStore((s) => s.addPerson);
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
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Full team card</h2>
          <p className="mt-1 text-sm text-muted">
            Pick a teammate on the left. Their full card opens on the right.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const name = prompt('New team member name?');
            if (name && name.trim()) {
              const id = addPerson(name.trim());
              setSelectedId(id);
            }
          }}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          + Add PMM
        </button>
      </div>

      <div className="flex gap-5">
        {/* Left strip: ~15% photo carousel */}
        <aside className="w-[16%] min-w-[120px] shrink-0">
          <div className="sticky top-4 max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-white p-2 shadow-sm">
            <ul className="flex flex-col gap-2">
              {people.map((p) => (
                <PhotoTile
                  key={p.id}
                  person={p}
                  active={p.id === selectedId}
                  onSelect={() => setSelectedId(p.id)}
                />
              ))}
            </ul>
          </div>
        </aside>

        {/* Right: expanded card */}
        <div className="min-w-0 flex-1">
          {selected ? (
            <PersonCard person={selected} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm italic text-muted">
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

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={[
          'group flex w-full flex-col items-center gap-1 rounded-xl p-2 transition-all',
          active ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'hover:bg-slate-50',
        ].join(' ')}
        title={person.name}
      >
        <div
          className={[
            'aspect-square w-full overflow-hidden rounded-lg ring-2',
            active ? 'ring-indigo-300' : 'ring-slate-100 group-hover:ring-indigo-100',
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
                imgFailed ? 'bg-rose-100 text-rose-500' : 'bg-slate-200 text-slate-500',
              ].join(' ')}
            >
              {imgFailed ? '!' : initials(person.name)}
            </div>
          )}
        </div>
        <span
          className={[
            'truncate text-[11px] leading-tight',
            active ? 'font-semibold text-indigo-700' : 'text-muted',
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
