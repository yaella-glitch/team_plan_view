import type { Category } from '../types';

/**
 * Drop target IDs are encoded strings so we can decode the destination on drop:
 *   section:<personId|null>:<category>   — a section bucket in a person card OR the backlog
 *   topic-item:<category>:<labelKey>     — a row in the OwnershipOverview list
 *   backlog                              — the bottom backlog strip
 */

export type DropTarget =
  | { kind: 'section'; ownerId: string | null; category: Category }
  | { kind: 'topic-item'; category: Category; labelKey: string }
  | { kind: 'backlog' };

export function encodeSection(ownerId: string | null, category: Category): string {
  return `section:${ownerId ?? 'null'}:${category}`;
}

export function encodeTopicItem(category: Category, labelKey: string): string {
  return `topic-item:${category}:${labelKey}`;
}

export const BACKLOG_DROP_ID = 'backlog';

export function decodeDropId(id: string): DropTarget | null {
  if (id === BACKLOG_DROP_ID) return { kind: 'backlog' };
  if (id.startsWith('section:')) {
    const [, ownerRaw, category] = id.split(':');
    return {
      kind: 'section',
      ownerId: ownerRaw === 'null' ? null : ownerRaw,
      category: category as Category,
    };
  }
  if (id.startsWith('topic-item:')) {
    const [, category, ...rest] = id.split(':');
    return { kind: 'topic-item', category: category as Category, labelKey: rest.join(':') };
  }
  return null;
}

export function chipDragId(chipId: string): string {
  return `chip:${chipId}`;
}

export function decodeChipDragId(id: string): string | null {
  if (id.startsWith('chip:')) return id.slice('chip:'.length);
  return null;
}
