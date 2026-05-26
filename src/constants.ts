import type { Category } from './types';

export type CategoryMeta = {
  id: Category;
  label: string;
  icon: string;
  /** Tailwind classes for chip background + text in dark mode (used in PersonCard) */
  tint: string;
  /** Border class for chips */
  border: string;
  /** Bold hex color used by the inverted Ownership-by-topic view (where each tag is a colored rectangle) */
  ownershipColor: string;
};

/**
 * 6 categories — Marketing focal and CRO/CCO focal have been merged into "Channels".
 *
 * `ownershipColor` is used by the inverted Ownership-by-topic view; it gives each
 * category a bold solid hex color as specified by Yaella.
 */
export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'pmmFocus',
    label: 'PMM focus',
    icon: '🎯',
    tint: 'bg-rose-400/15 text-rose-100',
    border: 'border-rose-400/30',
    ownershipColor: '#fd87e4', // pink
  },
  {
    id: 'businessKpi',
    label: 'Business KPI',
    icon: '📊',
    tint: 'bg-amber-400/15 text-amber-100',
    border: 'border-amber-400/30',
    ownershipColor: '#fd956e', // orange / peach
  },
  {
    id: 'persona',
    label: 'Persona',
    icon: '👤',
    tint: 'bg-emerald-400/15 text-emerald-100',
    border: 'border-emerald-400/30',
    ownershipColor: '#3cbdc8', // teal
  },
  {
    id: 'channels',
    label: 'Channels',
    icon: '📣',
    tint: 'bg-sky-400/15 text-sky-100',
    border: 'border-sky-400/30',
    ownershipColor: '#c0b0f7', // lavender
  },
  {
    id: 'productFocal',
    label: 'Product focal',
    icon: '🧩',
    tint: 'bg-violet-400/20 text-violet-100',
    border: 'border-violet-400/40',
    ownershipColor: '#38ccde', // cyan
  },
  {
    id: 'agenticFlow',
    label: 'Agentic flow',
    icon: '🤖',
    tint: 'bg-slate-400/15 text-slate-100',
    border: 'border-slate-400/30',
    ownershipColor: '#d2faff', // pale ice blue
  },
];

export const CATEGORY_BY_ID: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category, CategoryMeta>;

/** Categories that show up as tabs in the Ownership-by-topic view.
 *  Order: PMM focus, Persona, Channels, Product focal, Business KPI, Agentic flow. */
export const TOPIC_TAB_CATEGORIES: Category[] = [
  'pmmFocus',
  'persona',
  'channels',
  'productFocal',
  'businessKpi',
  'agenticFlow',
];
