export interface Issue {
  id: string;
  series: string; // legacy display name (kept for backward compatibility)
  titleId?: string; // optional reference to a Title by id
  number: string;
  volume?: number;
  isAnnual?: boolean;
  readingOrder?: number; // reading order number
  year?: string;
  notes?: string;
  storyType?: StoryType;
  isRead: boolean;
  createdAt: number;
}

export type StoryType = 
  | 'main'
  | 'tie-in'
  | 'prelude'
  | 'epilogue'
  | 'graphic-novel';

export interface Title {
  id: string;
  name: string;
}

export interface Saga {
  id: string;
  name: string;
  era: Era;
  universe: Universe;
  year?: string;
  notes?: string;
  issues: Issue[];
  createdAt: number;
  updatedAt: number;
}

export type Era = 
  | 'golden-age'
  | 'silver-age'
  | 'bronze-age'
  | 'modern-age'
  | 'marvel-now'
  | 'all-new-all-different'
  | 'fresh-start'
  | 'dawn-of-x'
  | 'other';

export type Universe = 
  | 'earth-616'
  | 'ultimate-1610'
  | 'earth-2099'
  | 'earth-1048'
  | 'mcu'
  | 'multiverse'
  | 'other';

export type SortOption = 'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'date-asc' | 'date-desc' | 'era' | 'yaer-desc' | 'yaer-asc';

export type FilterOption = 'all' | 'not-started' | 'in-progress' | 'completed';

export type Theme = 'light' | 'dark' | 'system';

export interface DashboardFilters {
  filter: FilterOption;
  sort: SortOption;
  search: string;
}

export interface AppSettings {
  theme: Theme;
  dashboardFilters?: DashboardFilters;
}

export interface AppData {
  sagas: Saga[];
  titles?: Title[];
  settings: AppSettings;
  version: number;
}

export const ERA_LABELS: Record<Era, string> = {
  'golden-age': 'Era de Ouro (1938-1956)',
  'silver-age': 'Era de Prata (1956-1970)',
  'bronze-age': 'Era de Bronze (1970-1985)',
  'modern-age': 'Era Moderna (1985-2000)',
  'marvel-now': 'Marvel NOW! (2012-2015)',
  'all-new-all-different': 'All-New All-Different (2015-2018)',
  'fresh-start': 'Fresh Start (2018-2022)',
  'dawn-of-x': 'Dawn of X / Krakoa (2019-2024)',
  'other': 'Outra',
};

export const UNIVERSE_LABELS: Record<Universe, string> = {
  'earth-616': 'Terra-616 (Principal)',
  'ultimate-1610': 'Ultimate (Terra-1610)',
  'earth-2099': 'Terra-2099',
  'earth-1048': 'Terra-1048 (Spider-Man PS4)',
  'mcu': 'MCU (Terra-199999)',
  'multiverse': 'Multiverso',
  'other': 'Outro',
};

export const STORY_TYPE_LABELS: Record<StoryType, string> = {
  'main': 'Principal',
  'tie-in': 'Tie-in',
  'prelude': 'preludio',
  'epilogue': 'epilogo',
  'graphic-novel': 'Graphic Novel',
};
