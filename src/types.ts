export type Category =
  | 'pmmFocus'
  | 'businessKpi'
  | 'persona'
  | 'channels'
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
  /** Soft hide — when false, person is filtered out of all display views.
   *  Treat undefined as true (legacy persisted state has no field). */
  enabled?: boolean;
};

export type AboutImage = {
  dataUrl: string;
  caption?: string;
};

export type LatestItem = {
  id: string;
  dataUrl?: string;
  title?: string;
  link?: string;
};

export type SubTeam = {
  id: string;
  title: string;
  managerId: string | null;
  memberIds: string[]; // does NOT include managerId
  order: number;
  /** A 'crossCut' pod renders as a full-width thinner bar above the normal pods. */
  kind?: 'normal' | 'crossCut';
  /** Short free-text "shared goal" line, shown at the bottom of the pod. */
  goalText?: string;
  /** Small tags for key deliverables / focuses / outputs. */
  tags?: string[];
};

export type AppState = {
  people: Person[];
  chips: ChipValue[];
  activeTopicTab: Category;
  about: (AboutImage | null)[]; // 3 slots
  latest: LatestItem[];
  subTeams: SubTeam[];
};
