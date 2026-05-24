import type { Category } from './types';

export type CategoryMeta = {
  id: Category;
  label: string;
  icon: string;
  /** Tailwind classes for chip background + text in dark mode */
  tint: string;
  /** Border class for chips */
  border: string;
};

/**
 * Dark-mode chip palette — soft tinted translucent background with light text.
 */
export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'pmmFocus',
    label: 'PMM focus',
    icon: '🎯',
    tint: 'bg-rose-400/15 text-rose-100',
    border: 'border-rose-400/30',
  },
  {
    id: 'businessKpi',
    label: 'Business KPI',
    icon: '📊',
    tint: 'bg-amber-400/15 text-amber-100',
    border: 'border-amber-400/30',
  },
  {
    id: 'persona',
    label: 'Persona',
    icon: '👤',
    tint: 'bg-emerald-400/15 text-emerald-100',
    border: 'border-emerald-400/30',
  },
  {
    id: 'marketingFocal',
    label: 'Marketing focal',
    icon: '📣',
    tint: 'bg-sky-400/15 text-sky-100',
    border: 'border-sky-400/30',
  },
  {
    id: 'croCcoFocal',
    label: 'CRO / CCO focal',
    icon: '💼',
    tint: 'bg-indigo-400/20 text-indigo-100',
    border: 'border-indigo-400/40',
  },
  {
    id: 'productFocal',
    label: 'Product focal',
    icon: '🧩',
    tint: 'bg-violet-400/20 text-violet-100',
    border: 'border-violet-400/40',
  },
  {
    id: 'agenticFlow',
    label: 'Agentic flow',
    icon: '🤖',
    tint: 'bg-slate-400/15 text-slate-100',
    border: 'border-slate-400/30',
  },
];

export const CATEGORY_BY_ID: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category, CategoryMeta>;
