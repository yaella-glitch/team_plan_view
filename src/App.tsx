import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { LatestGallery } from './components/LatestGallery';
import { OwnershipOverview } from './components/OwnershipOverview';
import { CardsCanvas } from './components/CardsCanvas';
import { SubTeamsCanvas, UNASSIGNED_DROP_ID } from './components/SubTeamsCanvas';
import { Backlog } from './components/Backlog';
import { AdminDrawer } from './components/AdminDrawer';
import { applyPaletteToCss, useTheme } from './theme';
import { useStore } from './store';
import { decodeChipDragId, decodeDropId } from './lib/dnd';
import { CATEGORY_BY_ID } from './constants';
import { resolvePhotoUrl } from './lib/photo';

export default function App() {
  const moveChip = useStore((s) => s.moveChip);
  const moveMemberToSubTeam = useStore((s) => s.moveMemberToSubTeam);
  const reorderPerson = useStore((s) => s.reorderPerson);
  const chips = useStore((s) => s.chips);
  const people = useStore((s) => s.people);
  const palette = useTheme((s) => s.palette);
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);

  // Apply the (possibly-customized) palette to CSS variables on mount and whenever it changes.
  useEffect(() => {
    applyPaletteToCss(palette);
  }, [palette]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragStart = (e: DragStartEvent) => {
    const idStr = String(e.active.id);
    if (idStr.startsWith('chip:')) {
      setActiveChipId(decodeChipDragId(idStr));
    } else if (idStr.startsWith('member:')) {
      const personId = e.active.data.current?.personId as string | undefined;
      if (personId) setActiveMemberId(personId);
    } else if (idStr.startsWith('person:')) {
      setActivePersonId(idStr.slice('person:'.length));
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveChipId(null);
    setActiveMemberId(null);
    setActivePersonId(null);
    if (!e.over) return;
    const activeIdStr = String(e.active.id);
    const overIdStr = String(e.over.id);

    // CASE 1: chip drag (cards / backlog / overview rows)
    if (activeIdStr.startsWith('chip:')) {
      const chipId = decodeChipDragId(activeIdStr)!;
      const chip = chips.find((c) => c.id === chipId);
      if (!chip) return;

      // Drop on another chip → sortable in-bucket reorder
      if (overIdStr.startsWith('chip:')) {
        const overChipId = decodeChipDragId(overIdStr)!;
        if (overChipId === chipId) return;
        const overChip = chips.find((c) => c.id === overChipId);
        if (!overChip) return;
        moveChip(chipId, {
          ownerId: overChip.ownerId,
          category: overChip.category,
          targetIndex: overChip.order,
        });
        return;
      }

      const dest = decodeDropId(overIdStr);
      if (!dest) return;
      if (dest.kind === 'section') {
        moveChip(chipId, { ownerId: dest.ownerId, category: dest.category });
      } else if (dest.kind === 'backlog') {
        moveChip(chipId, { ownerId: null, category: chip.category });
      }
      return;
    }

    // CASE 2: person reorder drag (in Ownership view or Full card sidebar)
    if (activeIdStr.startsWith('person:')) {
      if (overIdStr.startsWith('person:')) {
        const fromId = activeIdStr.slice('person:'.length);
        const toId = overIdStr.slice('person:'.length);
        if (fromId !== toId) reorderPerson(fromId, toId);
      }
      return;
    }

    // CASE 3: sub-team member drag
    if (activeIdStr.startsWith('member:')) {
      const personId = e.active.data.current?.personId as string | undefined;
      if (!personId) return;
      if (overIdStr === UNASSIGNED_DROP_ID) {
        moveMemberToSubTeam(personId, null);
        return;
      }
      if (overIdStr.startsWith('subteam-manager:')) {
        const subTeamId = overIdStr.slice('subteam-manager:'.length);
        useStore.getState().setSubTeamManager(subTeamId, personId);
        return;
      }
      if (overIdStr.startsWith('subteam-members:')) {
        const subTeamId = overIdStr.slice('subteam-members:'.length);
        moveMemberToSubTeam(personId, subTeamId);
      }
    }
  };

  const activeChip = activeChipId ? chips.find((c) => c.id === activeChipId) : null;
  const activeMember = activeMemberId ? people.find((p) => p.id === activeMemberId) : null;
  const activePerson = activePersonId ? people.find((p) => p.id === activePersonId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <AdminDrawer />
      <main>
        <Hero />
        <About />
        <LatestGallery />
        <OwnershipOverview />
        <CardsCanvas />
        <SubTeamsCanvas />
        <Backlog />
      </main>

      <DragOverlay>
        {activeChip ? (
          <div
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs shadow-lg ${
              CATEGORY_BY_ID[activeChip.category].tint
            } ${CATEGORY_BY_ID[activeChip.category].border}`}
          >
            <span>{activeChip.isPrimary ? '★' : '☆'}</span>
            <span>{activeChip.label}</span>
          </div>
        ) : activeMember ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-3 shadow-lg">
            <img
              src={resolvePhotoUrl(activeMember.photoUrl)}
              className="h-8 w-8 rounded-full object-cover"
              alt=""
            />
            <span className="text-xs font-medium">{activeMember.name}</span>
          </div>
        ) : activePerson ? (
          <div className="h-14 w-14 overflow-hidden rounded-full shadow-2xl ring-2 ring-accent">
            <img
              src={resolvePhotoUrl(activePerson.photoUrl)}
              className="h-full w-full object-cover"
              alt=""
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
