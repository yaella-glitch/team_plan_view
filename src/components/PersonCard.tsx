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
  const [editingRole, setEditingRole] = useState(false);
  const [draftRole, setDraftRole] = useState(person.role ?? '');

  const visibleCategories = CATEGORIES.filter((c) => !person.hiddenCategories.includes(c.id));
  const hiddenCategories = CATEGORIES.filter((c) => person.hiddenCategories.includes(c.id));

  return (
    <article className="relative flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AvatarEditor person={person} size={56} className="shrink-0" />
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
              className="w-full bg-transparent text-base font-semibold text-ink outline-none border-b border-indigo-300"
            />
          ) : (
            <h3
              className="cursor-text truncate text-base font-semibold leading-tight text-ink"
              onDoubleClick={() => setEditingName(true)}
              title="Double-click to rename"
            >
              {person.name}
            </h3>
          )}

          {editingRole ? (
            <input
              autoFocus
              value={draftRole}
              onChange={(e) => setDraftRole(e.target.value)}
              onBlur={() => {
                updatePerson(person.id, { role: draftRole.trim() || undefined });
                setEditingRole(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                else if (e.key === 'Escape') {
                  setDraftRole(person.role ?? '');
                  setEditingRole(false);
                }
              }}
              className="mt-0.5 w-full bg-transparent text-xs text-muted outline-none border-b border-indigo-200"
            />
          ) : (
            <p
              className="mt-0.5 cursor-text truncate text-xs text-muted"
              onDoubleClick={() => setEditingRole(true)}
              title="Double-click to edit role"
            >
              {person.role || <span className="italic opacity-60">add a role</span>}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm(`Remove ${person.name} from the team?`)) removePerson(person.id);
          }}
          title="Remove person"
          className="rounded-full px-2 py-0.5 text-xs text-muted opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
        >
          ×
        </button>
      </div>

      {/* Sections */}
      <div className="mt-4 flex flex-col gap-2">
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
          <summary className="cursor-pointer text-muted hover:text-ink">+ Add section</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hiddenCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => showCategoryForPerson(person.id, cat.id)}
                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 hover:border-indigo-300 hover:text-indigo-700"
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}
