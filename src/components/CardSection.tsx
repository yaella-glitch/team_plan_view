import { useState } from 'react';
import type { Category, Topic } from '../types';
import { CATEGORY_BY_ID } from '../constants';
import { useStore } from '../store';

/**
 * One category section of a PMM's Full card.
 *
 * Tags are now sourced from Topics — same data the Ownership-by-topic view
 * uses. A "tag" on Tamar's card under Channels is a Topic in the Channels
 * category whose pmmIds includes Tamar's id.
 */
type Props = {
  ownerId: string;
  category: Category;
  topics: Topic[]; // topics in this category that the owner is a member of
  onRemoveSection?: () => void;
};

export function CardSection({ ownerId, category, topics, onRemoveSection }: Props) {
  const meta = CATEGORY_BY_ID[category];
  const allTopics = useStore((s) => s.topics ?? []);
  const addTopic = useStore((s) => s.addTopic);
  const addPmmToTopic = useStore((s) => s.addPmmToTopic);
  const removePmmFromTopic = useStore((s) => s.removePmmFromTopic);

  const hex = meta.ownershipColor;
  const [picker, setPicker] = useState(false);

  // Topics in this category that this PMM is NOT yet on — for the "+ existing" picker.
  const available = allTopics.filter(
    (t) => t.category === category && !t.pmmIds.includes(ownerId),
  );

  const onPlus = () => {
    if (available.length === 0) {
      const name = prompt(`New ${meta.label} tag for this PMM?`);
      if (name && name.trim()) {
        const id = addTopic(name.trim(), category);
        addPmmToTopic(id, ownerId);
      }
    } else {
      setPicker((v) => !v);
    }
  };

  return (
    <div className="group/section">
      <div className="flex items-baseline gap-2">
        <h4 className="text-base font-bold text-ink">{meta.label}:</h4>
        {onRemoveSection && (
          <button
            type="button"
            onClick={onRemoveSection}
            title="Hide this section on this PMM's card"
            className="ml-auto rounded-full px-1.5 text-xs text-muted opacity-0 hover:text-ink group-hover/section:opacity-100"
          >
            −
          </button>
        )}
      </div>

      <div className="relative mt-1.5 flex flex-wrap items-center gap-1.5">
        {topics.map((t) => (
          <span
            key={t.id}
            className="group/chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            style={{
              background: `${hex}26`,
              border: `1px solid ${hex}66`,
              color: hex,
            }}
          >
            <span>{t.name}</span>
            <button
              type="button"
              onClick={() => removePmmFromTopic(t.id, ownerId)}
              title="Remove this PMM from the tag"
              className="ml-1 opacity-0 transition-opacity hover:opacity-100 group-hover/chip:opacity-60"
            >
              ×
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={onPlus}
          className="rounded-full border border-dashed border-accent/30 px-2 py-0.5 text-[11px] text-muted hover:border-accent hover:text-ink"
          title={available.length === 0 ? 'Add a new tag in this category' : 'Add an existing tag or create new'}
        >
          +
        </button>

        {picker && (
          <div
            className="absolute left-0 top-full z-30 mt-1 max-h-[240px] w-56 overflow-y-auto rounded-lg border border-white/10 p-1 shadow-xl"
            style={{ background: 'rgb(var(--surface))' }}
            onMouseLeave={() => setPicker(false)}
          >
            {available.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  addPmmToTopic(t.id, ownerId);
                  setPicker(false);
                }}
                className="block w-full truncate rounded px-2 py-1 text-left text-xs text-ink hover:bg-white/5"
              >
                {t.name}
              </button>
            ))}
            <div className="my-1 h-px bg-white/10" />
            <button
              type="button"
              onClick={() => {
                setPicker(false);
                const name = prompt(`New ${meta.label} tag?`);
                if (name && name.trim()) {
                  const id = addTopic(name.trim(), category);
                  addPmmToTopic(id, ownerId);
                }
              }}
              className="block w-full rounded px-2 py-1 text-left text-xs text-accent hover:bg-white/5"
            >
              + Create new tag…
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
