import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AboutImage, AppState, Category, ChipValue, LatestItem, Person, SubTeam } from './types';
import { buildSeed } from './seed';

type Actions = {
  // Chip operations
  addChip: (category: Category, ownerId: string | null, label?: string) => string;
  updateChipLabel: (chipId: string, label: string) => void;
  deleteChip: (chipId: string) => void;
  moveChip: (chipId: string, opts: { ownerId: string | null; category?: Category; targetIndex?: number }) => void;
  toggleChipPrimary: (chipId: string) => void;
  reorderChip: (chipId: string, targetIndex: number) => void;
  // Bulk tag ops (in Ownership-by-topic view a "tag" = one label across all chips with that category)
  renameTag: (category: Category, oldLabelKey: string, newLabel: string) => void;
  deleteTag: (category: Category, labelKey: string) => void;

  // Person operations
  addPerson: (name: string) => string;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  removePerson: (id: string) => void;
  hideCategoryForPerson: (personId: string, category: Category) => void;
  showCategoryForPerson: (personId: string, category: Category) => void;
  togglePersonEnabled: (id: string) => void;
  reorderPerson: (personId: string, targetPersonId: string) => void;

  // Topic tab
  setActiveTopicTab: (cat: Category) => void;

  // About images
  setAboutImage: (index: number, img: AboutImage | null) => void;
  setAboutCaption: (index: number, caption: string) => void;
  addAboutSlide: () => void;
  removeAboutSlide: (index: number) => void;

  // Latest items
  addLatestItem: () => string;
  updateLatestItem: (id: string, patch: Partial<LatestItem>) => void;
  removeLatestItem: (id: string) => void;

  // Sub-teams
  addSubTeam: (title?: string, kind?: 'normal' | 'crossCut') => string;
  updateSubTeamTitle: (id: string, title: string) => void;
  removeSubTeam: (id: string) => void;
  moveMemberToSubTeam: (personId: string, subTeamId: string | null) => void;
  setSubTeamManager: (subTeamId: string, personId: string | null) => void;
  setSubTeamGoalText: (id: string, text: string) => void;
  addSubTeamTag: (id: string, tag: string) => void;
  removeSubTeamTag: (id: string, tagIndex: number) => void;

  // Bulk
  replaceState: (s: AppState) => void;
  resetToSeed: () => void;
};

type Store = AppState & Actions;

const initial: AppState = buildSeed();

function normalizeOrder(chips: ChipValue[], ownerId: string | null, category: Category): ChipValue[] {
  // Re-number the order field for chips matching this (owner, category) bucket so they're 0..n-1.
  const inBucket = chips
    .filter((c) => c.ownerId === ownerId && c.category === category)
    .sort((a, b) => a.order - b.order);
  inBucket.forEach((c, i) => {
    c.order = i;
  });
  return chips;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,

      addChip: (category, ownerId, label = 'New item') => {
        const id = nanoid(8);
        set((state) => {
          const existing = state.chips.filter((c) => c.ownerId === ownerId && c.category === category);
          const chip: ChipValue = {
            id,
            label,
            category,
            ownerId,
            order: existing.length,
            isPrimary: existing.length === 0,
          };
          return { chips: [...state.chips, chip] };
        });
        return id;
      },

      updateChipLabel: (chipId, label) =>
        set((state) => ({
          chips: state.chips.map((c) => (c.id === chipId ? { ...c, label } : c)),
        })),

      deleteChip: (chipId) =>
        set((state) => {
          const removed = state.chips.find((c) => c.id === chipId);
          if (!removed) return {};
          const remaining = state.chips.filter((c) => c.id !== chipId).map((c) => ({ ...c }));
          normalizeOrder(remaining, removed.ownerId, removed.category);
          // If we removed the primary, promote the new top of that bucket.
          if (removed.isPrimary) {
            const top = remaining
              .filter((c) => c.ownerId === removed.ownerId && c.category === removed.category)
              .sort((a, b) => a.order - b.order)[0];
            if (top) top.isPrimary = true;
          }
          return { chips: remaining };
        }),

      moveChip: (chipId, opts) =>
        set((state) => {
          const chip = state.chips.find((c) => c.id === chipId);
          if (!chip) return {};
          const prevOwner = chip.ownerId;
          const prevCategory = chip.category;
          const nextOwner = opts.ownerId;
          const nextCategory = opts.category ?? chip.category;

          const others = state.chips.filter((c) => c.id !== chipId).map((c) => ({ ...c }));
          const updated: ChipValue = {
            ...chip,
            ownerId: nextOwner,
            category: nextCategory,
            // Insert at target index in the destination bucket (or end).
            order: 0,
          };

          const destBucket = others
            .filter((c) => c.ownerId === nextOwner && c.category === nextCategory)
            .sort((a, b) => a.order - b.order);
          const targetIndex =
            opts.targetIndex !== undefined ? Math.max(0, Math.min(destBucket.length, opts.targetIndex)) : destBucket.length;

          destBucket.splice(targetIndex, 0, updated);
          destBucket.forEach((c, i) => (c.order = i));

          // Normalize source bucket ordering (if changed)
          if (prevOwner !== nextOwner || prevCategory !== nextCategory) {
            const srcBucket = others
              .filter((c) => c.ownerId === prevOwner && c.category === prevCategory)
              .sort((a, b) => a.order - b.order);
            srcBucket.forEach((c, i) => (c.order = i));
            // If chip was primary in source, promote new top.
            if (chip.isPrimary && srcBucket.length > 0) {
              srcBucket[0].isPrimary = true;
              updated.isPrimary = false;
            }
          }

          // Destination primary rules: if bucket had no chips before, this one becomes primary.
          const destHadOthers = destBucket.length > 1;
          if (!destHadOthers) {
            updated.isPrimary = true;
          } else if (updated.order !== 0) {
            // Not at top — drop primary marker
            // (existing top in destination keeps whatever it had)
            updated.isPrimary = false;
          }

          // Build full chip list (excluding moved), then add updated chip back.
          const next = others.filter((c) => c.id !== updated.id);
          next.push(updated);
          return { chips: next };
        }),

      toggleChipPrimary: (chipId) =>
        set((state) => {
          const chip = state.chips.find((c) => c.id === chipId);
          if (!chip) return {};
          return {
            chips: state.chips.map((c) => {
              if (c.ownerId !== chip.ownerId || c.category !== chip.category) return c;
              if (c.id === chipId) return { ...c, isPrimary: !chip.isPrimary };
              return chip.isPrimary ? c : { ...c, isPrimary: false };
            }),
          };
        }),

      reorderChip: (chipId, targetIndex) => {
        const chip = get().chips.find((c) => c.id === chipId);
        if (!chip) return;
        get().moveChip(chipId, { ownerId: chip.ownerId, category: chip.category, targetIndex });
      },

      renameTag: (category, oldLabelKey, newLabel) => {
        const v = newLabel.trim();
        if (!v) return;
        set((state) => ({
          chips: state.chips.map((c) =>
            c.category === category && c.label.trim().toLowerCase() === oldLabelKey
              ? { ...c, label: v }
              : c,
          ),
        }));
      },

      deleteTag: (category, labelKey) =>
        set((state) => ({
          chips: state.chips.filter(
            (c) => !(c.category === category && c.label.trim().toLowerCase() === labelKey),
          ),
        })),

      addPerson: (name) => {
        const id = `p_${nanoid(6)}`;
        set((state) => ({
          people: [
            ...state.people,
            {
              id,
              name,
              photoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`,
              hiddenCategories: [],
              order: state.people.length,
            },
          ],
        }));
        return id;
      },

      updatePerson: (id, patch) =>
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePerson: (id) =>
        set((state) => ({
          people: state.people.filter((p) => p.id !== id),
          chips: state.chips.map((c) => (c.ownerId === id ? { ...c, ownerId: null } : c)),
        })),

      hideCategoryForPerson: (personId, category) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === personId
              ? { ...p, hiddenCategories: [...new Set([...p.hiddenCategories, category])] }
              : p,
          ),
        })),

      showCategoryForPerson: (personId, category) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === personId ? { ...p, hiddenCategories: p.hiddenCategories.filter((c) => c !== category) } : p,
          ),
        })),

      togglePersonEnabled: (id) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === id ? { ...p, enabled: p.enabled === false ? true : false } : p,
          ),
        })),

      reorderPerson: (personId, targetPersonId) =>
        set((state) => {
          if (personId === targetPersonId) return {};
          const sorted = [...state.people].sort((a, b) => a.order - b.order);
          const fromIdx = sorted.findIndex((p) => p.id === personId);
          const toIdx = sorted.findIndex((p) => p.id === targetPersonId);
          if (fromIdx < 0 || toIdx < 0) return {};
          const [moved] = sorted.splice(fromIdx, 1);
          sorted.splice(toIdx, 0, moved);
          // Re-number the order field on every person.
          const idToOrder = new Map(sorted.map((p, i) => [p.id, i]));
          return {
            people: state.people.map((p) => ({ ...p, order: idToOrder.get(p.id) ?? p.order })),
          };
        }),

      setActiveTopicTab: (cat) => set({ activeTopicTab: cat }),

      // About
      setAboutImage: (index, img) =>
        set((state) => {
          const next = [...(state.about ?? [null, null, null])];
          while (next.length <= index) next.push(null);
          next[index] = img;
          return { about: next };
        }),
      setAboutCaption: (index, caption) =>
        set((state) => {
          const next = [...(state.about ?? [null, null, null])];
          while (next.length < 3) next.push(null);
          const cur = next[index];
          next[index] = cur ? { ...cur, caption } : { dataUrl: '', caption };
          return { about: next };
        }),
      addAboutSlide: () =>
        set((state) => ({ about: [...(state.about ?? []), null] })),
      removeAboutSlide: (index) =>
        set((state) => {
          const next = [...(state.about ?? [])];
          next.splice(index, 1);
          return { about: next };
        }),

      // Latest
      addLatestItem: () => {
        const id = nanoid(8);
        set((state) => ({ latest: [...(state.latest ?? []), { id }] }));
        return id;
      },
      updateLatestItem: (id, patch) =>
        set((state) => ({
          latest: (state.latest ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      removeLatestItem: (id) =>
        set((state) => ({ latest: (state.latest ?? []).filter((i) => i.id !== id) })),

      // Sub-teams
      addSubTeam: (title = 'New pod', kind = 'normal') => {
        const id = nanoid(8);
        set((state) => ({
          subTeams: [
            ...(state.subTeams ?? []),
            {
              id,
              title,
              managerId: null,
              memberIds: [],
              order: (state.subTeams ?? []).length,
              kind,
              goalText: '',
              tags: [],
            },
          ],
        }));
        return id;
      },
      updateSubTeamTitle: (id, title) =>
        set((state) => ({
          subTeams: (state.subTeams ?? []).map((s) => (s.id === id ? { ...s, title } : s)),
        })),
      removeSubTeam: (id) =>
        set((state) => ({ subTeams: (state.subTeams ?? []).filter((s) => s.id !== id) })),
      moveMemberToSubTeam: (personId, subTeamId) =>
        set((state) => ({
          subTeams: (state.subTeams ?? []).map((s) => {
            const cleanedManager = s.managerId === personId ? null : s.managerId;
            const cleanedMembers = s.memberIds.filter((m) => m !== personId);
            if (s.id === subTeamId) {
              return {
                ...s,
                managerId: cleanedManager,
                memberIds: [...cleanedMembers, personId],
              };
            }
            return { ...s, managerId: cleanedManager, memberIds: cleanedMembers };
          }),
        })),
      setSubTeamGoalText: (id, text) =>
        set((state) => ({
          subTeams: (state.subTeams ?? []).map((s) => (s.id === id ? { ...s, goalText: text } : s)),
        })),
      addSubTeamTag: (id, tag) =>
        set((state) => ({
          subTeams: (state.subTeams ?? []).map((s) =>
            s.id === id ? { ...s, tags: [...(s.tags ?? []), tag] } : s,
          ),
        })),
      removeSubTeamTag: (id, tagIndex) =>
        set((state) => ({
          subTeams: (state.subTeams ?? []).map((s) => {
            if (s.id !== id) return s;
            const next = [...(s.tags ?? [])];
            next.splice(tagIndex, 1);
            return { ...s, tags: next };
          }),
        })),
      setSubTeamManager: (subTeamId, personId) =>
        set((state) => ({
          subTeams: (state.subTeams ?? []).map((s) => {
            // Remove personId from any other sub-team first.
            const cleanedManager = s.managerId === personId ? null : s.managerId;
            const cleanedMembers = s.memberIds.filter((m) => m !== personId);
            if (s.id === subTeamId) {
              // The previous manager (if any) is demoted to a member, unless we're clearing.
              if (personId === null) {
                const ex = s.managerId;
                return {
                  ...s,
                  managerId: null,
                  memberIds: ex
                    ? [...cleanedMembers, ex].filter((id, i, arr) => arr.indexOf(id) === i)
                    : cleanedMembers,
                };
              }
              const ex = s.managerId && s.managerId !== personId ? s.managerId : null;
              return {
                ...s,
                managerId: personId,
                memberIds: ex ? [...cleanedMembers, ex] : cleanedMembers,
              };
            }
            return { ...s, managerId: cleanedManager, memberIds: cleanedMembers };
          }),
        })),

      replaceState: (s) => set(s),
      resetToSeed: () => set(buildSeed()),
    }),
    {
      name: 'team-plan-view-v1',
      version: 2,
      migrate: (persisted, fromVersion) => {
        const s = (persisted ?? {}) as Partial<AppState> & { chips?: ChipValue[]; people?: Person[]; activeTopicTab?: Category };
        if (fromVersion < 2) {
          // v1 → v2: merge marketingFocal + croCcoFocal → channels
          const remap = (cat: string): Category =>
            (cat === 'marketingFocal' || cat === 'croCcoFocal') ? 'channels' : (cat as Category);

          if (Array.isArray(s.chips)) {
            s.chips = s.chips.map((c) => ({ ...c, category: remap(c.category as string) }));
          }
          if (Array.isArray(s.people)) {
            s.people = s.people.map((p) => ({
              ...p,
              hiddenCategories: Array.from(
                new Set((p.hiddenCategories ?? []).map((c) => remap(c as string))),
              ),
            }));
          }
          if (s.activeTopicTab === ('marketingFocal' as Category) || s.activeTopicTab === ('croCcoFocal' as Category)) {
            s.activeTopicTab = 'channels';
          }
        }
        return s as AppState;
      },
    },
  ),
);

// --- Selectors ----------------------------------------------------------------

/** Visible (enabled) people, sorted by their display order. */
export function selectVisiblePeople(state: AppState): Person[] {
  return state.people.filter((p) => p.enabled !== false).sort((a, b) => a.order - b.order);
}

export function selectChipsFor(state: AppState, ownerId: string | null, category: Category): ChipValue[] {
  return state.chips
    .filter((c) => c.ownerId === ownerId && c.category === category)
    .sort((a, b) => a.order - b.order);
}

export function selectChipsInCategory(state: AppState, category: Category): ChipValue[] {
  return state.chips.filter((c) => c.category === category);
}

export function selectBacklog(state: AppState): ChipValue[] {
  return state.chips.filter((c) => c.ownerId === null).sort((a, b) => a.order - b.order);
}

/**
 * For OwnershipOverview: group chips in a category by label, so we can list
 * each distinct label and show which people own it.
 */
export function selectTopicGroups(
  state: AppState,
  category: Category,
): { label: string; chips: ChipValue[] }[] {
  const chips = selectChipsInCategory(state, category).filter((c) => c.ownerId !== null);
  const map = new Map<string, ChipValue[]>();
  chips.forEach((c) => {
    const key = c.label.trim().toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  });
  return Array.from(map.values())
    .map((group) => ({ label: group[0].label, chips: group }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
