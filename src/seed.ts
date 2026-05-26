import type { AppState, Category, ChipValue, Person } from './types';
import { nanoid } from 'nanoid';

/**
 * Seed data derived from the user's slide "Breakdown by PMM".
 * Names are placeholders ("PMM 1" etc.) — user fills in real names in the app.
 * The chips reflect the categories as they appeared in the slide.
 */
type SeedRow = {
  name: string;
  role?: string;
  // category -> ordered list of chip labels (first = primary)
  cells: Partial<Record<Category, string[]>>;
};

const seedRows: SeedRow[] = [
  {
    name: 'PMM 1',
    role: 'Overarching',
    cells: {
      pmmFocus: ['ENT offering', 'AI work team orch', 'Overarching VF'],
      businessKpi: ['ENT ARR overarching'],
      persona: ['ENT Executive buyer'],
      channels: ['Rev AI', 'CRO enablement (Uriya)', 'Comms / PR'],
      productFocal: ['EWM'],
      agenticFlow: ['PMM brain'],
    },
  },
  {
    name: 'PMM 2',
    role: 'Admin & Trust',
    cells: {
      pmmFocus: ['Admin & Trust', 'Newsletters', 'Product flows (Lifecycle)'],
      businessKpi: ['Adoption', 'Retention'],
      persona: ['Admin', 'Technical buyer'],
      channels: ['Lifecycle', 'Existing customers / CCO'],
      productFocal: ['AI governance & trust', 'DB', 'Growth adoption'],
      agenticFlow: ['Plotter'],
    },
  },
  {
    name: 'PMM 3',
    role: 'Events & Lead gen',
    cells: {
      pmmFocus: ['Events support', 'Lead gen (SLG squad)', 'ENT competitors'],
      businessKpi: ['Outbound leads'],
      channels: ['Regional mkt', 'SLG squad (Shai masot)'],
      productFocal: ['Human <> agents collab', 'Growth retention'],
      agenticFlow: ['Messaging reviewer'],
    },
  },
  {
    name: 'PMM 4',
    role: 'Upmarket & Analyst',
    cells: {
      pmmFocus: ['Gartner', 'Review sites'],
      businessKpi: ['Analyst perception'],
      persona: ['Upmarket buyer'],
      agenticFlow: ['RFI agent'],
    },
  },
  {
    name: 'PMM 5',
    role: 'DPT lead',
    cells: {
      pmmFocus: ['DPT overarching + 2x DPT', 'ICP definitions'],
      businessKpi: ['ARR from x2 dpt'],
      persona: ['Marketing', 'Legal'],
      channels: ['Enablement & GTM', 'Acquisition (leads)'],
      productFocal: ['Human <> agents collab'],
      agenticFlow: ['Pitcher'],
    },
  },
  {
    name: 'PMM 6',
    role: 'DPT — HR/IT',
    cells: {
      pmmFocus: ['2x DPT', 'Template center'],
      businessKpi: ['ARR from x2 dpt'],
      persona: ['HR', 'IT'],
      channels: ['Acquisition'],
      productFocal: ['AI workflows & automations'],
      agenticFlow: ['ICP agent', 'Glossy'],
    },
  },
  {
    name: 'PMM 7 (NY)',
    role: 'DPT — Product/Sales',
    cells: {
      pmmFocus: ['2x DPT'],
      businessKpi: ['ARR from x2 dpt'],
      persona: ['Product', 'Sales'],
      channels: ['Enablement (field)'],
      agenticFlow: ['TBD'],
    },
  },
  {
    name: 'PMM 8',
    role: 'DPT — PMO/Ops',
    cells: {
      pmmFocus: ['2x DPT', 'Departments Gallery'],
      businessKpi: ['ARR from x2 dpt'],
      persona: ['PMO', 'OPs'],
      channels: ['Acquisition'],
      productFocal: ['Vibe'],
      agenticFlow: ['TBD'],
    },
  },
  {
    name: 'PMM 9',
    role: 'Release strategy',
    cells: {
      pmmFocus: ['Release process strategy', 'Customer zero'],
      businessKpi: ['Product awareness & discoverability'],
      persona: ['Champions'],
      channels: ['PR & comms', 'Social'],
      productFocal: ['Support agents & ecosystem'],
      agenticFlow: ['TBD'],
    },
  },
  {
    name: 'PMM 10',
    role: 'Release machine',
    cells: {
      pmmFocus: ['Release machine', 'Competitors LP & Battle'],
      businessKpi: ['Product awareness'],
      persona: ['Champions / End user'],
      channels: ['Brand', 'Acquisition'],
      productFocal: ['Customer agents', 'Growth onboarding'],
      agenticFlow: ['Benoit'],
    },
  },
  {
    name: 'PMM 11',
    role: 'Product show-off',
    cells: {
      pmmFocus: ['Product show-off / tours', 'Technical PMM'],
      businessKpi: ['Product awareness'],
      persona: ['End user'],
      channels: ['Social'],
      productFocal: ['Ecosystem (3rd party; MCP; connectors)'],
      agenticFlow: ['Motion agent'],
    },
  },
];

export function buildSeed(): AppState {
  const people: Person[] = seedRows.map((row, i) => ({
    id: `p_${i + 1}`,
    name: row.name,
    role: row.role,
    // Blank by default — the AvatarEditor shows initials. User clicks the avatar to set a filename or URL.
    photoUrl: '',
    hiddenCategories: [],
    order: i,
  }));

  const chips: ChipValue[] = [];
  seedRows.forEach((row, i) => {
    const ownerId = `p_${i + 1}`;
    (Object.entries(row.cells) as [Category, string[]][]).forEach(([cat, labels]) => {
      labels.forEach((label, idx) => {
        chips.push({
          id: nanoid(8),
          label,
          category: cat,
          ownerId,
          isPrimary: idx === 0,
          order: idx,
        });
      });
    });
  });

  return {
    people,
    chips,
    activeTopicTab: 'pmmFocus',
    about: [null, null, null],
    latest: [],
    subTeams: [],
  };
}
