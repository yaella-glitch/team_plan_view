import type { Category } from './types';

export type CategoryMeta = {
  id: Category;
  label: string;
  icon: string;
  /** A tailwind-compatible class for chip background tint */
  tint: string;
  /** Border accent for chips */
  border: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'pmmFocus',
    label: 'PMM focus',
    icon: '🎯',
    tint: 'bg-rose-50 text-rose-900',
    border: 'border-rose-200',
  },
  {
    id: 'businessKpi',
    label: 'Business KPI',
    icon: '📊',
    tint: 'bg-amber-50 text-amber-900',
    border: 'border-amber-200',
  },
  {
    id: 'persona',
    label: 'Persona',
    icon: '👤',
    tint: 'bg-emerald-50 text-emerald-900',
    border: 'border-emerald-200',
  },
  {
    id: 'marketingFocal',
    label: 'Marketing focal',
    icon: '📣',
    tint: 'bg-sky-50 text-sky-900',
    border: 'border-sky-200',
  },
  {
    id: 'croCcoFocal',
    label: 'CRO / CCO focal',
    icon: '💼',
    tint: 'bg-indigo-50 text-indigo-900',
    border: 'border-indigo-200',
  },
  {
    id: 'productFocal',
    label: 'Product focal',
    icon: '🧩',
    tint: 'bg-violet-50 text-violet-900',
    border: 'border-violet-200',
  },
  {
    id: 'agenticFlow',
    label: 'Agentic flow',
    icon: '🤖',
    tint: 'bg-slate-100 text-slate-900',
    border: 'border-slate-200',
  },
];

export const CATEGORY_BY_ID: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category, CategoryMeta>;
