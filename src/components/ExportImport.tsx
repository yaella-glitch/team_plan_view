import { useRef } from 'react';
import { useStore } from '../store';
import type { AppState } from '../types';

export function ExportImport() {
  const state = useStore((s) => ({
    people: s.people,
    chips: s.chips,
    activeTopicTab: s.activeTopicTab,
  }));
  const replaceState = useStore((s) => s.replaceState);
  const resetToSeed = useStore((s) => s.resetToSeed);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text) as AppState;
      if (!Array.isArray(parsed.people) || !Array.isArray(parsed.chips)) {
        alert('Invalid file format.');
        return;
      }
      replaceState(parsed);
    } catch (err) {
      alert(`Failed to import: ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="fixed right-4 top-4 z-30 flex gap-2 rounded-full border border-border bg-white/90 px-2 py-1 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={onExport}
        className="rounded-full px-3 py-1 text-xs font-medium text-ink hover:bg-slate-100"
        title="Download current state as JSON"
      >
        ↓ Export
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="rounded-full px-3 py-1 text-xs font-medium text-ink hover:bg-slate-100"
        title="Load state from a JSON file"
      >
        ↑ Import
      </button>
      <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
      <button
        type="button"
        onClick={() => {
          if (confirm('Reset all changes to the original seed data?')) resetToSeed();
        }}
        className="rounded-full px-3 py-1 text-xs font-medium text-muted hover:bg-rose-50 hover:text-rose-600"
        title="Restore seed data"
      >
        ↺ Reset
      </button>
    </div>
  );
}
