import { useEffect, useState } from 'react';
import type { Person } from '../types';
import { useStore } from '../store';
import { AvatarEditor } from './AvatarEditor';
import { useAdminUnlocked } from '../lib/admin';
import { EditableTags, EditableLine, EditableMultiline, BulletText } from './InlineEditors';

type Props = { person: Person };

export function PersonCard({ person }: Props) {
  const updatePerson = useStore((s) => s.updatePerson);
  const removePerson = useStore((s) => s.removePerson);
  const admin = useAdminUnlocked();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(person.name);
  useEffect(() => setDraftName(person.name), [person.name]);

  // Tag color for all card tags — purple/accent outline per Yaella's mockup
  const tagHex = 'rgb(165 138 255)'; // matches --accent purple

  return (
    <div className="card-gradient group">
      <article className="card-gradient-inner relative flex min-h-[640px] flex-col p-8">
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-white/5 pb-6">
          <AvatarEditor person={person} size={80} className="shrink-0" />
          <div className="min-w-0 flex-1">
            {editingName && admin ? (
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
                className={['truncate text-3xl font-semibold leading-tight text-ink', admin ? 'cursor-text' : ''].join(' ')}
                onDoubleClick={() => admin && setEditingName(true)}
                title={admin ? 'Double-click to rename' : undefined}
              >
                {person.name}
              </h3>
            )}
          </div>

          {/* Business KPI mini-card, top-right */}
          <div className="hidden w-64 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:block">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Business KPI</div>
            <div className="mt-1">
              <EditableLine
                value={person.businessKpi ?? ''}
                onChange={(v) => updatePerson(person.id, { businessKpi: v.trim() || undefined })}
                admin={admin}
                placeholder="free text"
              />
            </div>
          </div>

          {admin && (
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
          )}
        </div>

        {/* Two-column body */}
        <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-2">
          {/* LEFT column */}
          <div className="space-y-6">
            <Field label="Goal">
              <EditableLine
                value={person.goal ?? ''}
                onChange={(v) => updatePerson(person.id, { goal: v.trim() || undefined })}
                admin={admin}
                placeholder="free text"
              />
            </Field>

            <Field label="Who">
              <EditableTags
                values={person.whoPersonas ?? []}
                onChange={(next) => updatePerson(person.id, { whoPersonas: next })}
                admin={admin}
                hex={tagHex}
              />
            </Field>

            <Field label="How" sublabel="(Key focuses)">
              <EditableMultiline
                value={person.howKeyFocuses ?? ''}
                onChange={(v) => updatePerson(person.id, { howKeyFocuses: v })}
                admin={admin}
                placeholder={'• [free text]\n• [free text]\n• [free text]'}
              />
            </Field>
          </div>

          {/* RIGHT column */}
          <div className="space-y-6">
            <Field label="Where" sublabel="(channels)">
              <EditableTags
                values={person.whereChannels ?? []}
                onChange={(next) => updatePerson(person.id, { whereChannels: next })}
                admin={admin}
                hex={tagHex}
              />
            </Field>

            <Field label="Product focus">
              <EditableTags
                values={person.productFocus ?? []}
                onChange={(next) => updatePerson(person.id, { productFocus: next })}
                admin={admin}
                hex={tagHex}
              />
            </Field>

            <Field label="Agents">
              <EditableTags
                values={person.agents ?? []}
                onChange={(next) => updatePerson(person.id, { agents: next })}
                admin={admin}
                hex={tagHex}
              />
            </Field>
          </div>
        </div>

        {/* Your R&R — admin-only edit, public read */}
        <RAndRBlock person={person} admin={admin} />
      </article>
    </div>
  );
}

function Field({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-1.5 text-base font-bold text-ink">
        {label}{' '}
        {sublabel && <span className="text-sm font-normal text-muted">{sublabel}</span>}
      </h4>
      <div>{children}</div>
    </div>
  );
}

function RAndRBlock({ person, admin }: { person: Person; admin: boolean }) {
  const updatePerson = useStore((s) => s.updatePerson);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person.rAndR ?? '');
  useEffect(() => setDraft(person.rAndR ?? ''), [person.rAndR]);

  const text = person.rAndR ?? '';
  const hasContent = text.trim().length > 0;
  if (!admin && !hasContent) return null;

  return (
    <div className="mt-8 border-t border-white/5 pt-6">
      <div className="mb-2 flex items-baseline gap-2">
        <h4 className="text-base font-bold text-ink">Your R&R:</h4>
        {admin && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted hover:border-accent/60 hover:text-ink"
          >
            {hasContent ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>

      {editing && admin ? (
        <div>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            placeholder={'• Main responsibility one\n  – sub point\n• Main responsibility two'}
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
        <BulletText text={text} />
      ) : (
        <p className="text-sm italic text-muted">Add roles & responsibilities here.</p>
      )}
    </div>
  );
}
