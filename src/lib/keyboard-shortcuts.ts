export type ShortcutItem = {
  key: string;
  description: string;
  context: string;
};

export const SHORTCUT_GROUPS: Array<{ title: string; items: ShortcutItem[] }> = [
  {
    title: 'Global',
    items: [
      { key: '?', description: 'Open shortcut help', context: 'Everywhere' },
      { key: 'Esc', description: 'Close modal or drawer', context: 'Everywhere' },
    ],
  },
  {
    title: 'Leads list',
    items: [
      { key: 'N', description: 'Create a new lead', context: 'Leads page' },
      { key: '/', description: 'Focus search', context: 'Leads page' },
      { key: 'J', description: 'Select next lead', context: 'Leads page' },
      { key: 'K', description: 'Select previous lead', context: 'Leads page' },
      { key: 'Enter', description: 'Open selected lead', context: 'Leads page' },
      { key: 'C', description: 'Clear all filters', context: 'Leads page' },
    ],
  },
  {
    title: 'Lead detail',
    items: [
      { key: 'F', description: 'Schedule a follow-up', context: 'Lead detail page' },
    ],
  },
];
