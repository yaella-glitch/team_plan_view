import { useEffect, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore, selectVisiblePeople } from '../store';
import { CATEGORIES, CATEGORY_BY_ID } from '../constants';
import type { Category, ChipValue, Person } from '../types';
import { resolvePhotoUrl } from '../lib/photo';

/**
 * Inverted Ownership-by-topic view.
 *
 * Each tab is a category. Inside the tab we show every distinct chip *label*
 * in that category as a bold colored rectangle ("tag"). Underneath each tag
 * sit the photo circles of the PMMs who own that tag.
 *
 * Drag a photo circle from one tag to another to move ownership of that
 * specific label from one PMM to the other.
 */

const ownershipChipDragId = (chipId: string) => `ownership-chip:${chipId}`;
const tagBucketDropId = (category: Category, labelKey: string) =>
  `tag-bucket:${category}:${labelKey}`;

export function OwnershipOverview() {
  const activeTab = useStore((s) => s.activeTopicTab);
  const setActiveTab = useStore((s) => s.setActiveTopicTab);

  return (
    <section className="mx-auto max-w-7xl px-8 py-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-ink">Ownership by topic</h2>
      </div>

      <div className="rounded-3xl border border-border bg-white/[0.02] p-5 shadow-sm">
        {/* Tabs row */}
        <div className="flex flex-wrap gap-2 pb-5">
          {CATEGORIES.map((c) => {
            const active = c.id === activeTab;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveTab(c.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm transition-all"
                style={
                  active
                    ? {
                        backgroundColor: c.ownershipColor,
                        borderColor: c.ownershipColor,
                        color: pickReadableTextColor(c.ownershipColor),
                        fontWeight: 600,
                      }
                    : {
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        color: 'rgb(var(--muted))',
                      }
                }
              >
                <span className="text-base leading-none">{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        <TagsGrid category={activeTab} />
      </div>
    </section>
  );
}

function TagsGrid({ category }: { category: Category }) {
  const chips = useStore((s) => s.chips);
  const people = useStore(selectVisiblePeople);
  const addChip = useStore((s) => s.addChip);
  const meta = CATEGORY_BY_ID[category];
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  // Group chips by their label (case-insensitive). Keep the original casing
  // of the first occurrence for display.
  const groups = new Map<string, { label: string; chips: ChipValue[] }>();
  for (const chip of chips) {
    if (chip.category !== category) continue;
    const key = chip.label.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, { label: chip.label, chips: [] });
    groups.get(key)!.chips.push(chip);
  }
  const groupList = Array.from(groups.entries()).sort((a, b) =>
    a[1].label.localeCompare(b[1].label),
  );

  const commitNew = () => {
    const v = draft.trim();
    if (v) addChip(category, null, v);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-start gap-3">
      {groupList.map(([key, group]) => (
        <TagBucket key={key} category={category} labelKey={key} label={group.label} chips={group.chips} people={people} />
      ))}

      {/* + add tag tile */}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitNew}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            else if (e.key === 'Escape') {
              setDraft('');
              setAdding(false);
            }
          }}
          placeholder="new tag…"
          className="self-start rounded-md border border-accent/60 bg-white/[0.04] px-3 py-2 text-sm text-ink outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="self-start rounded-md border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-xs text-muted hover:border-accent/60 hover:text-ink"
          title={`Add a new ownership area in ${meta.label}`}
        >
          + Add tag
        </button>
      )}

      {groupList.length === 0 && !adding && (
        <p className="text-sm italic text-muted">
          No ownership areas yet in {meta.label}. Hit + Add tag.
        </p>
      )}
    </div>
  );
}

function TagBucket({
  category,
  labelKey,
  label,
  chips,
  people,
}: {
  category: Category;
  labelKey: string;
  label: string;
  chips: ChipValue[];
  people: Person[];
}) {
  const dropId = tagBucketDropId(category, labelKey);
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { category, labelKey, label } });
  const meta = CATEGORY_BY_ID[category];
  const renameTag = useStore((s) => s.renameTag);
  const deleteTag = useStore((s) => s.deleteTag);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  useEffect(() => setDraft(label), [label]);

  const ownerChipPairs = chips
    .filter((c) => c.ownerId !== null)
    .map((c) => ({ chipId: c.id, ownerId: c.ownerId! }));

  const textColor = pickReadableTextColor(meta.ownershipColor);

  const commitRename = () => {
    const v = draft.trim();
    if (v && v !== label) renameTag(category, labelKey, v);
    else setDraft(label);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={[
        'group/bucket flex flex-col gap-1.5 rounded-xl p-1 transition-all',
        isOver ? 'bg-white/5 ring-2 ring-accent' : '',
      ].join(' ')}
    >
      {/* Tag — bold colored rectangle, content-width */}
      <div
        className="relative inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold leading-tight"
        style={{ backgroundColor: meta.ownershipColor, color: textColor }}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              else if (e.key === 'Escape') {
                setDraft(label);
                setEditing(false);
              }
            }}
            className="min-w-[60px] bg-transparent text-xs font-bold outline-none"
            style={{ color: textColor, width: `${Math.max(draft.length, 4)}ch` }}
          />
        ) : (
          <span
            className="cursor-text"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {label}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            if (
              confirm(
                `Delete the "${label}" tag? This removes ${chips.length} chip(s) across all PMMs in ${meta.label}.`,
              )
            )
              deleteTag(category, labelKey);
          }}
          className="ml-1 opacity-0 transition-opacity group-hover/bucket:opacity-70 hover:opacity-100"
          style={{ color: textColor }}
          title="Delete tag"
        >
          ×
        </button>
      </div>

      {/* Owners — small draggable photo circles */}
      <div className="flex flex-wrap items-center gap-1 pl-0.5 min-h-[28px]">
        {ownerChipPairs.length === 0 ? (
          <span className="text-[10px] italic text-muted">—</span>
        ) : (
          ownerChipPairs.map(({ chipId, ownerId }) => {
            const person = people.find((p) => p.id === ownerId);
            if (!person) return null;
            return <DraggablePhoto key={chipId} chipId={chipId} person={person} />;
          })
        )}
      </div>
    </div>
  );
}

function DraggablePhoto({ chipId, person }: { chipId: string; person: Person }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ownershipChipDragId(chipId),
    data: { chipId, ownerId: person.id, kind: 'ownership-photo' },
  });
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group/photo relative h-8 w-8 cursor-grab overflow-hidden rounded-full ring-2 ring-white/15 transition-transform hover:scale-110 active:cursor-grabbing"
      title={`${person.name} — drag to reassign`}
      {...listeners}
      {...attributes}
    >
      {photo && !imgFailed ? (
        <img
          src={photo}
          alt={person.name}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
          draggable={false}
        />
      ) : (
        <div
          className={[
            'flex h-full w-full items-center justify-center text-[10px] font-semibold',
            imgFailed ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-muted',
          ].join(' ')}
        >
          {imgFailed ? '!' : initials(person.name)}
        </div>
      )}
    </button>
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

/**
 * Pick black or white text based on the YIQ luminance of the bg color.
 * Returns a hex string. The pale tag colors (like #d2faff) need dark text.
 */
function pickReadableTextColor(hex: string): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return '#0b0b18';
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#0b0b18' : '#ffffff';
}

// Expose drop IDs for App.tsx to decode
export { tagBucketDropId, ownershipChipDragId };
