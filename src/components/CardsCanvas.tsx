import { useStore } from '../store';
import { PersonCard } from './PersonCard';

export function CardsCanvas() {
  const people = useStore((s) => s.people);
  const addPerson = useStore((s) => s.addPerson);

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Team</h2>
          <p className="mt-1 text-sm text-muted">
            Each card is one PMM. Drag chips between cards or to the backlog. Double-click to rename. Click ★ to mark a primary focus.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const name = prompt('New team member name?');
            if (name && name.trim()) addPerson(name.trim());
          }}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          + Add PMM
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {people.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>
    </section>
  );
}
