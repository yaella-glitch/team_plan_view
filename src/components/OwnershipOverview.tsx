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
  const meta = CATEGORY_BY_ID[category];

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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {groupList.map(([key, group]) => (
        <TagBucket key={key} category={category} labelKey={key} label={group.label} chips={group.chips} people={people} />
      ))}
      {groupList.length === 0 && (
        <p className="col-span-full text-sm italic text-muted">
          No ownership areas yet in {meta.label}. Add chips on the PMM cards below.
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

  // Owners for this tag = chips' owner ids (de-duped, ignore null owners)
  const ownerChipPairs = chips
    .filter((c) => c.ownerId !== null)
    .map((c) => ({ chipId: c.id, ownerId: c.ownerId! }));

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex flex-col gap-2 rounded-xl p-2.5 transition-all',
        isOver ? 'bg-white/5 ring-2 ring-accent' : '',
      ].join(' ')}
    >
      {/* Tag — bold colored rectangle */}
      <div
        className="rounded-md px-3 py-2 text-sm font-bold leading-tight"
        style={{
          backgroundColor: meta.ownershipColor,
          color: pickReadableTextColor(meta.ownershipColor),
        }}
      >
        {label}
      </div>

      {/* Owners — small draggable photo circles */}
      <div className="flex flex-wrap items-center gap-1.5 pl-1 min-h-[36px]">
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
