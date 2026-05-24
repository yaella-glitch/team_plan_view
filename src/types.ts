export type Category =
  | 'pmmFocus'
  | 'businessKpi'
  | 'persona'
  | 'marketingFocal'
  | 'croCcoFocal'
  | 'productFocal'
  | 'agenticFlow';

export type ChipValue = {
  id: string;
  label: string;
  category: Category;
  ownerId: string | null; // null = lives in backlog
  isPrimary?: boolean;
  order: number;
};

export type Person = {
  id: string;
  name: string;
  role?: string;
  photoUrl: string;
  hiddenCategories: Category[];
  order: number;
};

export type AppState = {
  people: Person[];
  chips: ChipValue[];
  activeTopicTab: Category;
};
