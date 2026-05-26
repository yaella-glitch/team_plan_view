import { useEffect, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore, selectVisiblePeople } from '../store';
import { CATEGORIES, CATEGORY_BY_ID } from '../constants';
import type { Category, ChipValue, Person } from '../types';
import { resolvePhotoUrl } from '../lib/photo';

/**
 * Ownership by topic — per-chip card grid.
 *
 * Each chip = one small rectangular card. The card's body is colored with the
 * category's brand hex; the chip label is the big bold text; the owner's photo
 * sits inset in the lower-right corner. If two PMMs own the same label, both
 * appear as separate cards.
 *
 * Drag the inset photo from one card onto another to swap that card's owner.
 */

const ownershipChipDragId = (chipId: string) => `ownership-chip:${chipId}`;
const chipCardDropId = (chipId: string) => `chip-card:${chipId}`;

export function OwnershipOverview() {
  const activeTab = useStore((s) => s.activeTopicTab);
  const setActiveTab = useStore((s) => s.setActiveTopicTab);

  return (
    <section className="mx-auto max-w-7xl px-8 py-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-ink">Ownership by topic</h2>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-sm">
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

        <ChipCards category={activeTab} />
      </div>
    </section>
  );
}

function ChipCards({ category }: { category: Category }) {
  const chips = useStore((s) =>
    s.chips.filter((c) => c.category === category).sort((a, b) => a.label.localeCompare(b.label)),
  );
  const people = useStore(selectVisiblePeople);
  const meta = CATEGORY_BY_ID[category];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {chips.map((chip) => (
        <ChipCard key={chip.id} chip={chip} people={people} />
      ))}
      {chips.length === 0 && (
        <p className="col-span-full text-sm italic text-muted">
          No ownership areas yet in {meta.label}. Add one from Admin → Quick add.
        </p>
      )}
    </div>
  );
}

function ChipCard({ chip, people }: { chip: ChipValue; people: Person[] }) {
  const meta = CATEGORY_BY_ID[chip.category];
  const updateChipLabel = useStore((s) => s.updateChipLabel);
  const deleteChip = useStore((s) => s.deleteChip);
  const owner = chip.ownerId ? people.find((p) => p.id === chip.ownerId) ?? null : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chip.label);
  useEffect(() => setDraft(chip.label), [chip.label]);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: chipCardDropId(chip.id),
    data: { chipId: chip.id, kind: 'chip-card' },
  });

  const commit = () => {
    const v = draft.trim();
    if (v && v !== chip.label) updateChipLabel(chip.id, v);
    else setDraft(chip.label);
    setEditing(false);
  };

  const textColor = pickReadableTextColor(meta.ownershipColor);

  return (
    <div
      ref={setDropRef}
      className={[
        'group/card relative aspect-[5/2] overflow-hidden rounded-xl shadow-md transition-all',
        isOver ? 'ring-2 ring-accent ring-offset-2 ring-offset-canvas' : '',
      ].join(' ')}
      style={{
        background: `radial-gradient(circle at 30% 40%, ${meta.ownershipColor}, ${darken(meta.ownershipColor, 0.7)} 80%)`,
      }}
    >
      {/* Label (top-left) */}
      <div className="absolute inset-x-2.5 top-2 pr-12">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              else if (e.key === 'Escape') {
                setDraft(chip.label);
                setEditing(false);
              }
            }}
            className="w-full bg-transparent text-xs font-bold leading-tight outline-none"
            style={{ color: textColor }}
          />
        ) : (
          <h4
            className="cursor-text text-xs font-bold leading-tight"
            style={{ color: textColor }}
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {chip.label}
          </h4>
        )}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => {
          if (confirm(`Delete "${chip.label}"?`)) deleteChip(chip.id);
        }}
        className="absolute right-1 top-1 rounded-full px-1 text-xs opacity-0 transition-opacity group-hover/card:opacity-60 hover:!opacity-100"
        style={{ color: textColor }}
        title="Delete this ownership area"
      >
        ×
      </button>

      {/* Photo inset in lower-right */}
      <div className="absolute bottom-1.5 right-1.5">
        {owner ? (
          <DraggablePhoto chipId={chip.id} person={owner} ringColor={textColor} />
        ) : (
          <UnownedDropHint chipId={chip.id} ringColor={textColor} />
        )}
      </div>
    </div>
  );
}

function DraggablePhoto({
  chipId,
  person,
  ringColor,
}: {
  chipId: string;
  person: Person;
  ringColor: string;
}) {
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
        boxShadow: `0 0 0 2px ${ringColor}`,
      }}
      className="block h-8 w-8 cursor-grab overflow-hidden rounded-full bg-white transition-transform hover:scale-110 active:cursor-grabbing"
      title={`${person.name} — drag onto another card to swap`}
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
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-700">
          {initials(person.name)}
        </div>
      )}
    </button>
  );
}

function UnownedDropHint({ chipId: _chipId, ringColor }: { chipId: string; ringColor: string }) {
  return (
    <div
      style={{ borderColor: ringColor + '99', color: ringColor }}
      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed text-[10px] italic"
      title="Unowned — drop a photo here"
    >
      ?
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

/** Pick black or white text based on YIQ luminance of the bg color. */
function pickReadableTextColor(hex: string): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return '#0b0b18';
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#0b0b18' : '#ffffff';
}

/** Darken a hex color by mixing toward near-black. ratio = 0..1, 1 = fully dark. */
function darken(hex: string, ratio: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return hex;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const dr = Math.round(r * (1 - ratio) + 10 * ratio);
  const dg = Math.round(g * (1 - ratio) + 10 * ratio);
  const db = Math.round(b * (1 - ratio) + 20 * ratio);
  return `#${[dr, dg, db].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Expose drop IDs for App.tsx to decode
export { ownershipChipDragId, chipCardDropId };
