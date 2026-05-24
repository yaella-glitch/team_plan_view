import { useState } from 'react';
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
import { OwnershipOverview } from './components/OwnershipOverview';
import { CardsCanvas } from './components/CardsCanvas';
import { Backlog } from './components/Backlog';
import { ExportImport } from './components/ExportImport';
import { ThemePanel } from './components/ThemePanel';
import { useStore } from './store';
import { decodeChipDragId, decodeDropId } from './lib/dnd';
import { CATEGORY_BY_ID } from './constants';
import { resolvePhotoUrl } from './lib/photo';

export default function App() {
  const moveChip = useStore((s) => s.moveChip);
  const chips = useStore((s) => s.chips);
  const people = useStore((s) => s.people);
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [activePhotoChipId, setActivePhotoChipId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragStart = (e: DragStartEvent) => {
    const idStr = String(e.active.id);
    if (idStr.startsWith('chip:')) setActiveChipId(decodeChipDragId(idStr));
    else if (idStr.startsWith('photo:')) {
      const chipId = e.active.data.current?.chipId as string | undefined;
      if (chipId) setActivePhotoChipId(chipId);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveChipId(null);
    setActivePhotoChipId(null);
    if (!e.over) return;
    const activeIdStr = String(e.active.id);
    const overIdStr = String(e.over.id);

    // CASE 1: Dragging a chip (from a card or backlog)
    if (activeIdStr.startsWith('chip:')) {
      const chipId = decodeChipDragId(activeIdStr)!;
      const chip = chips.find((c) => c.id === chipId);
      if (!chip) return;

      // If dropped on another chip → sortable in-bucket reorder
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
      } else if (dest.kind === 'topic-item') {
        // Drop a chip on a topic row in Overview — treat it as a recategorize
        // to that category, owner unchanged. (Edge case — unusual but valid.)
        moveChip(chipId, { ownerId: chip.ownerId, category: dest.category });
      }
      return;
    }

    // CASE 2: Dragging a photo from the OwnershipOverview
    if (activeIdStr.startsWith('photo:')) {
      const chipId = e.active.data.current?.chipId as string | undefined;
      if (!chipId) return;
      const dest = decodeDropId(overIdStr);
      if (!dest) return;

      if (dest.kind === 'topic-item') {
        // Reassign the chip's label to match the destination topic-row's label
        const chip = chips.find((c) => c.id === chipId);
        if (!chip) return;
        // Find the canonical label from any chip in that bucket (case-preserving)
        const sample = chips.find(
          (c) => c.category === dest.category && c.label.trim().toLowerCase() === dest.labelKey,
        );
        const newLabel = sample ? sample.label : chip.label;
        // Update label only if different
        if (newLabel !== chip.label) {
          useStore.getState().updateChipLabel(chipId, newLabel);
        }
        return;
      }
      if (dest.kind === 'backlog') {
        moveChip(chipId, { ownerId: null });
      }
    }
  };

  const activeChip = activeChipId ? chips.find((c) => c.id === activeChipId) : null;
  const activePhotoChip = activePhotoChipId ? chips.find((c) => c.id === activePhotoChipId) : null;
  const activePhotoPerson = activePhotoChip
    ? people.find((p) => p.id === activePhotoChip.ownerId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <ThemePanel />
      <ExportImport />
      <main className="pb-32">
        <Hero />
        <OwnershipOverview />
        <CardsCanvas />
      </main>
      <Backlog />

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
        ) : activePhotoPerson ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white py-0.5 pl-0.5 pr-2 shadow-lg">
            <img src={resolvePhotoUrl(activePhotoPerson.photoUrl)} className="h-7 w-7 rounded-full" alt="" />
            <span className="text-xs font-medium">{activePhotoPerson.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
