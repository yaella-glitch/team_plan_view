import { useEffect, useState } from 'react';
import type { Person } from '../types';
import { CATEGORIES } from '../constants';
import { useStore } from '../store';
import { CardSection } from './CardSection';
import { AvatarEditor } from './AvatarEditor';
import { useAdminUnlocked } from '../lib/admin';

type Props = { person: Person };

export function PersonCard({ person }: Props) {
  const allTopics = useStore((s) => s.topics ?? []);
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
              topics={allTopics
                .filter((t) => t.category === cat.id && t.pmmIds.includes(person.id))
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

        {/* Your R&R — free-text notes. Editable only when Admin is unlocked. */}
        <RAndRBlock person={person} />
      </article>
    </div>
  );
}

function RAndRBlock({ person }: { person: Person }) {
  const updatePerson = useStore((s) => s.updatePerson);
  const adminUnlocked = useAdminUnlocked();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person.rAndR ?? '');
  useEffect(() => setDraft(person.rAndR ?? ''), [person.rAndR]);

  const text = person.rAndR ?? '';
  const hasContent = text.trim().length > 0;

  // Public viewer with no R&R yet: hide the whole section
  if (!adminUnlocked && !hasContent) return null;

  return (
    <div className="mt-8 border-t border-white/5 pt-6">
      <div className="mb-2 flex items-baseline gap-2">
        <h4 className="text-base font-bold text-ink">Your R&R:</h4>
        {adminUnlocked && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted hover:border-accent/60 hover:text-ink"
          >
            {hasContent ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>

      {editing && adminUnlocked ? (
        <div>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            placeholder={
              '• Main responsibility one\n  – sub point\n  – sub point\n• Main responsibility two\n  – sub point'
            }
            className="w-full whitespace-pre-wrap rounded-lg border border-white/15 bg-white/[0.04] p-3 text-sm leading-relaxed text-ink outline-none focus:border-accent/60"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(person.rAndR ?? '');
                setEditing(false);
              }}
              className="rounded-full px-3 py-1 text-xs text-muted hover:bg-white/5 hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                updatePerson(person.id, { rAndR: draft });
                setEditing(false);
              }}
              className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-canvas hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      ) : hasContent ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{text}</p>
      ) : (
        <p className="text-sm italic text-muted">
          Add roles & responsibilities here — bullets, sub-bullets, anything.
        </p>
      )}
    </div>
  );
}
