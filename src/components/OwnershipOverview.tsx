import { useEffect, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore, selectVisiblePeople } from '../store';
import type { Person, Topic } from '../types';
import { resolvePhotoUrl } from '../lib/photo';

/**
 * Ownership by topic — Topics view.
 *
 * Each Topic is a card. A topic can have multiple PMM owners (many-to-many).
 * Drag a PMM photo from one card to another to MOVE ownership.
 * Click the + on a card to add a PMM (picker shows PMMs not yet on this topic).
 * Hover a photo and click × to remove.
 */

const topicPmmDragId = (topicId: string, personId: string) => `topic-pmm:${topicId}:${personId}`;
const topicDropId = (topicId: string) => `topic:${topicId}`;

// Per-topic background gradient — cycles through a palette so each card is distinct.
const TOPIC_PALETTE = [
  '#fd87e4', // pink
  '#fd956e', // peach
  '#3cbdc8', // teal
  '#c0b0f7', // lavender
  '#38ccde', // cyan
  '#d2faff', // pale
  '#a58aff', // accent purple
  '#ff7a90', // coral
  '#8de2a7', // mint
  '#f5d76e', // sand
];

function colorForTopic(order: number): string {
  return TOPIC_PALETTE[order % TOPIC_PALETTE.length];
}

export function OwnershipOverview() {
  const topics = useStore((s) => s.topics ?? []);
  const sortedTopics = [...topics].sort((a, b) => a.order - b.order);

  return (
    <section className="mx-auto max-w-7xl px-8 py-8">
      <h2 className="mb-4 text-2xl font-bold text-ink">Ownership by topic</h2>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedTopics.map((t) => (
            <TopicCard key={t.id} topic={t} color={colorForTopic(t.order)} />
          ))}
          {sortedTopics.length === 0 && (
            <p className="col-span-full text-sm italic text-muted">
              No topics yet. Add them from Admin → Topics.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function TopicCard({ topic, color }: { topic: Topic; color: string }) {
  const allPeople = useStore(selectVisiblePeople);
  const addPmmToTopic = useStore((s) => s.addPmmToTopic);
  const { setNodeRef, isOver } = useDroppable({
    id: topicDropId(topic.id),
    data: { topicId: topic.id, kind: 'topic-card' },
  });
  const [showPicker, setShowPicker] = useState(false);
  const owners = topic.pmmIds
    .map((pid) => allPeople.find((p) => p.id === pid))
    .filter((p): p is Person => Boolean(p));
  const available = allPeople.filter((p) => !topic.pmmIds.includes(p.id));
  const textColor = pickReadableTextColor(color);

  return (
    <div
      ref={setNodeRef}
      className={[
        'group/card relative aspect-[5/2] overflow-hidden rounded-xl shadow-md transition-all',
        isOver ? 'ring-2 ring-accent ring-offset-2 ring-offset-canvas' : '',
      ].join(' ')}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}, ${darken(color, 0.7)} 80%)`,
      }}
    >
      {/* Topic name (top-left, leaves room for owners on the right) */}
      <div className="absolute inset-x-2.5 top-2 pr-14">
        <h4 className="text-xs font-bold leading-tight" style={{ color: textColor }}>
          {topic.name}
        </h4>
      </div>

      {/* Owner photos (bottom-right, stacked horizontally) */}
      <div className="absolute bottom-1.5 right-1.5 flex flex-wrap items-center justify-end gap-1">
        {owners.map((person) => (
          <DraggableOwner
            key={person.id}
            topicId={topic.id}
            person={person}
            ringColor={textColor}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          title="Add a PMM to this topic"
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed text-xs font-bold transition-transform hover:scale-110"
          style={{ borderColor: textColor + '99', color: textColor }}
        >
          +
        </button>
      </div>

      {/* PMM picker — opens when + is clicked */}
      {showPicker && (
        <div
          className="absolute right-1.5 top-1.5 z-10 max-h-[180px] w-44 overflow-y-auto rounded-lg border border-white/10 bg-surface p-1.5 shadow-xl"
          onMouseLeave={() => setShowPicker(false)}
        >
          {available.length === 0 ? (
            <p className="px-2 py-1 text-[11px] italic text-muted">All PMMs are already on this topic.</p>
          ) : (
            available.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  addPmmToTopic(topic.id, p.id);
                  setShowPicker(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-ink hover:bg-white/5"
              >
                <MiniPhoto person={p} />
                <span className="truncate">{p.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DraggableOwner({
  topicId,
  person,
  ringColor,
}: {
  topicId: string;
  person: Person;
  ringColor: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: topicPmmDragId(topicId, person.id),
    data: { topicId, personId: person.id, kind: 'topic-owner' },
  });
  const removePmmFromTopic = useStore((s) => s.removePmmFromTopic);
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);

  return (
    <div
      className="group/owner relative"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <button
        ref={setNodeRef}
        type="button"
        title={`${person.name} — drag to move to another topic`}
        style={{ boxShadow: `0 0 0 2px ${ringColor}` }}
        className="block h-8 w-8 cursor-grab overflow-hidden rounded-full bg-white transition-transform hover:scale-110 active:cursor-grabbing"
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
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-700">
            {initials(person.name)}
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          removePmmFromTopic(topicId, person.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Remove ${person.name}`}
        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white opacity-0 shadow transition-opacity group-hover/owner:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

function MiniPhoto({ person }: { person: Person }) {
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);
  return (
    <div className="h-6 w-6 overflow-hidden rounded-full bg-white/10">
      {photo && !imgFailed ? (
        <img
          src={photo}
          alt={person.name}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-muted">
          {initials(person.name)}
        </div>
      )}
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

function pickReadableTextColor(hex: string): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return '#0b0b18';
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#0b0b18' : '#ffffff';
}

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

export { topicPmmDragId, topicDropId };
