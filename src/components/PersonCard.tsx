import { useState } from 'react';
import type { Person } from '../types';
import { CATEGORIES } from '../constants';
import { useStore } from '../store';
import { CardSection } from './CardSection';
import { AvatarEditor } from './AvatarEditor';

type Props = { person: Person };

export function PersonCard({ person }: Props) {
  const chips = useStore((s) => s.chips);
  const updatePerson = useStore((s) => s.updatePerson);
  const hideCategoryForPerson = useStore((s) => s.hideCategoryForPerson);
  const showCategoryForPerson = useStore((s) => s.showCategoryForPerson);
  const removePerson = useStore((s) => s.removePerson);

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(person.name);

  const visibleCategories = CATEGORIES.filter((c) => !person.hiddenCategories.includes(c.id));
  const hiddenCategories = CATEGORIES.filter((c) => person.hiddenCategories.includes(c.id));

  return (
    <div className="card-gradient group">
      <article className="card-gradient-inner relative flex min-h-[560px] flex-col p-8">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <AvatarEditor person={person} size={80} className="shrink-0" />
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => {
                  if (draftName.trim()) updatePerson(person.id, { name: draftName.trim() });
                  else setDraftName(person.name);
                  setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                  else if (e.key === 'Escape') {
                    setDraftName(person.name);
                    setEditingName(false);
                  }
                }}
                className="w-full bg-transparent text-3xl font-semibold text-ink outline-none border-b border-accent/40"
              />
            ) : (
              <h3
                className="cursor-text truncate text-3xl font-semibold leading-tight text-ink"
                onDoubleClick={() => setEditingName(true)}
                title="Double-click to rename"
              >
                {person.name}
              </h3>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove ${person.name} from the team?`)) removePerson(person.id);
            }}
            title="Remove person"
            className="rounded-full px-2 py-0.5 text-xs text-muted opacity-0 hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
          >
            ×
          </button>
        </div>

        {/* Sections — 2 columns, column-major so left=PMM focus/KPI/Persona,
            right=Channels/Product/Agentic. grid-rows-3 + grid-flow-col fills
            the left column first then the right. */}
        <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-7 md:grid-flow-col md:grid-cols-2 md:grid-rows-3">
          {visibleCategories.map((cat) => (
            <CardSection
              key={cat.id}
              ownerId={person.id}
              category={cat.id}
              chips={chips
                .filter((c) => c.ownerId === person.id && c.category === cat.id)
                .sort((a, b) => a.order - b.order)}
              onRemoveSection={() => hideCategoryForPerson(person.id, cat.id)}
            />
          ))}
        </div>

        {/* Add-section menu */}
        {hiddenCategories.length > 0 && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-muted hover:text-ink">+</summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {hiddenCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => showCategoryForPerson(person.id, cat.id)}
                  className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-ink hover:border-accent/50"
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </details>
        )}
      </article>
    </div>
  );
}
