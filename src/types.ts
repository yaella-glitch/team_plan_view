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
  /** Free-text roles & responsibilities. Multi-line. Admin-only editable. */
  rAndR?: string;

  // --- New Full card fields (decoupled from Topics) ---
  /** Single-line goal description. */
  goal?: string;
  /** Persona tags (free-text strings). */
  whoPersonas?: string[];
  /** "How" key focuses — multi-line free text with bullets. */
  howKeyFocuses?: string;
  /** Short Business KPI description. */
  businessKpi?: string;
  /** Channel tags. */
  whereChannels?: string[];
  /** Product focus tags. */
  productFocus?: string[];
  /** Agent tags. */
  agents?: string[];
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

export type Topic = {
  id: string;
  name: string;
  /** Which Ownership tab this topic lives under. */
  category: Category;
  /** Many-to-many: a topic can have multiple PMM owners. */
  pmmIds: string[];
  order: number;
};

export type AppState = {
  people: Person[];
  chips: ChipValue[];
  activeTopicTab: Category;
  about: (AboutImage | null)[]; // 3 slots
  latest: LatestItem[];
  subTeams: SubTeam[];
  subTeams2: SubTeam[];
  topics: Topic[];
  /** Hero illustration data URL. Kept in state so it travels with snapshots. */
  heroImage?: string;
};
