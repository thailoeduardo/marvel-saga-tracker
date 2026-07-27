import { AppData, AppSettings, Saga, Issue, Theme, DashboardFilters, Title } from '@/types/marvel';

const STORAGE_KEY = 'marvel-reading-tracker';
const CURRENT_VERSION = 1;

const defaultSettings: AppSettings = {
  theme: 'dark',
};

const defaultData: AppData = {
  sagas: [],
  titles: [],
  settings: defaultSettings,
  version: CURRENT_VERSION,
};

export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;
    
    const data = JSON.parse(stored) as AppData;
    const sagas = (data.sagas || []).map((saga: Saga) => ({
      ...saga,
      issues: Array.isArray(saga.issues) ? saga.issues : [],
    }));
    const titles = normalizeTitles(data.titles || []);
    return {
      ...defaultData,
      ...data,
      sagas,
      titles,
      settings: { ...defaultSettings, ...data.settings },
    };
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

export function getSagas(): Saga[] {
  return loadData().sagas;
}

export function saveSagas(sagas: Saga[]): void {
  const data = loadData();
  data.sagas = sagas;
  saveData(data);
}

export function addSaga(saga: Omit<Saga, 'id' | 'issues' | 'createdAt' | 'updatedAt'>): Saga {
  const sagas = getSagas();
  const newSaga: Saga = {
    ...saga,
    id: generateId(),
    issues: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sagas.push(newSaga);
  saveSagas(sagas);
  return newSaga;
}

export function updateSaga(id: string, updates: Partial<Omit<Saga, 'id' | 'createdAt'>>): Saga | null {
  const sagas = getSagas();
  const index = sagas.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  sagas[index] = {
    ...sagas[index],
    ...updates,
    updatedAt: Date.now(),
  };
  saveSagas(sagas);
  return sagas[index];
}

export function deleteSaga(id: string): boolean {
  const sagas = getSagas();
  const filtered = sagas.filter(s => s.id !== id);
  if (filtered.length === sagas.length) return false;
  saveSagas(filtered);
  return true;
}

export function getSaga(id: string): Saga | null {
  return getSagas().find(s => s.id === id) || null;
}

export function addIssue(sagaId: string, issue: Omit<Issue, 'id' | 'createdAt'>): Issue | null {
  const sagas = getSagas();
  const saga = sagas.find(s => s.id === sagaId);
  if (!saga) return null;

  // If a titleId is provided, resolve the title name and keep 'series' synced
  let resolvedSeries = issue.series;
  if ((issue as any).titleId) {
    const title = getTitles().find(t => t.id === (issue as any).titleId);
    if (title) resolvedSeries = title.name;
  }
  
  const newIssue: Issue = {
    ...issue,
    series: resolvedSeries,
    id: generateId(),
    createdAt: Date.now(),
  };
  saga.issues.push(newIssue);
  saga.updatedAt = Date.now();
  saveSagas(sagas);
  return newIssue;
}

export function updateIssue(sagaId: string, issueId: string, updates: Partial<Omit<Issue, 'id' | 'createdAt'>>): Issue | null {
  const sagas = getSagas();
  const saga = sagas.find(s => s.id === sagaId);
  if (!saga) return null;
  
  const issueIndex = saga.issues.findIndex(i => i.id === issueId);
  if (issueIndex === -1) return null;

  // If titleId is updated, sync the series name
  if ((updates as any).titleId) {
    const title = getTitles().find(t => t.id === (updates as any).titleId);
    if (title) (updates as any).series = title.name;
  }

  saga.issues[issueIndex] = {
    ...saga.issues[issueIndex],
    ...updates,
  };
  saga.updatedAt = Date.now();
  saveSagas(sagas);
  return saga.issues[issueIndex];
}

export function deleteIssue(sagaId: string, issueId: string): boolean {
  const sagas = getSagas();
  const saga = sagas.find(s => s.id === sagaId);
  if (!saga) return false;
  
  const originalLength = saga.issues.length;
  saga.issues = saga.issues.filter(i => i.id !== issueId);
  if (saga.issues.length === originalLength) return false;
  
  saga.updatedAt = Date.now();
  saveSagas(sagas);
  return true;
}

export function toggleIssueRead(sagaId: string, issueId: string): boolean {
  const sagas = getSagas();
  const saga = sagas.find(s => s.id === sagaId);
  if (!saga) return false;
  
  const issue = saga.issues.find(i => i.id === issueId);
  if (!issue) return false;
  
  issue.isRead = !issue.isRead;
  saga.updatedAt = Date.now();
  saveSagas(sagas);
  return true;
}

export function resetSagaProgress(sagaId: string): boolean {
  const sagas = getSagas();
  const saga = sagas.find(s => s.id === sagaId);
  if (!saga) return false;
  
  saga.issues.forEach(issue => {
    issue.isRead = false;
  });
  saga.updatedAt = Date.now();
  saveSagas(sagas);
  return true;
}

// Titles management
export function getTitles(): Title[] {
  return loadData().titles || [];
}

export function saveTitles(titles: Title[]): void {
  const data = loadData();
  data.titles = normalizeTitles(titles);
  saveData(data);
}

export function addTitle(title: Omit<Title, 'id'>): Title {
  const titles = getTitles();
  const newTitle: Title = {
    ...title,
    id: generateId(),
  };
  titles.push(newTitle);
  saveTitles(titles);
  return newTitle;
}

export function updateTitle(id: string, updates: Partial<Omit<Title, 'id'>>): Title | null {
  const titles = getTitles();
  const index = titles.findIndex(t => t.id === id);
  if (index === -1) return null;

  titles[index] = {
    ...titles[index],
    ...updates,
  };
  saveTitles(titles);
  return titles[index];
}

export function deleteTitle(id: string): boolean {
  const titles = getTitles();
  const filtered = titles.filter(t => t.id !== id);
  if (filtered.length === titles.length) return false;

  // Remove references to this title from issues but keep series (legacy name)
  const sagas = getSagas();
  sagas.forEach(saga => {
    saga.issues.forEach(issue => {
      if ((issue as any).titleId === id) {
        delete (issue as any).titleId;
      }
    });
  });
  saveSagas(sagas);

  saveTitles(filtered);
  return true;
}

export function exportTitles(): string {
  return JSON.stringify(getTitles(), null, 2);
}

export function importTitles(jsonString: string, options: { merge?: boolean } = { merge: true }): { success: boolean; merged?: number; replaced?: boolean } {
  try {
    const parsed = JSON.parse(jsonString);
    const incoming: Title[] = Array.isArray(parsed) ? parsed : parsed.titles || [];
    if (!Array.isArray(incoming)) throw new Error('Invalid format');

    if (options.merge) {
      const existing = getTitles();
      const byName = new Set(existing.map(t => t.name.toLowerCase()));
      let merged = 0;
      incoming.forEach(t => {
        if (!byName.has(t.name.toLowerCase())) {
          addTitle({ name: t.name });
          merged += 1;
        }
      });
      return { success: true, merged };
    } else {
      // Replace all titles
      const normalized = incoming.map(t => normalizeTitle(t));
      saveTitles(normalized);
      return { success: true, replaced: true };
    }
  } catch {
    return { success: false };
  }
}

export function getSettings(): AppSettings {
  return loadData().settings;
}

export function saveSettings(settings: AppSettings): void {
  const data = loadData();
  data.settings = settings;
  saveData(data);
}

export function setTheme(theme: Theme): void {
  const settings = getSettings();
  settings.theme = theme;
  saveSettings(settings);
}

export function getDashboardFilters(): AppSettings['dashboardFilters'] {
  return getSettings().dashboardFilters;
}

export function saveDashboardFilters(filters: AppSettings['dashboardFilters']): void {
  const settings = getSettings();
  settings.dashboardFilters = filters;
  saveSettings(settings);
}

export function exportData(): string {
  return JSON.stringify(loadData(), null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as AppData;
    if (!data.sagas || !Array.isArray(data.sagas)) {
      throw new Error('Invalid data format');
    }
    saveData({
      ...defaultData,
      ...data,
      version: CURRENT_VERSION,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generate a CUID (Collision-resistant Unique Identifier)
 * 
 * @returns 
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const counter = Math.floor(Math.random() * 1000000).toString(36);
  const fingerprint = Math.random().toString(36).substr(2, 4);
  const random = Math.random().toString(36).substr(2, 4);
  
  return `c${timestamp}${counter}${fingerprint}${random}`;
}

function normalizeTitle(title: Partial<Title> & { id?: string; name?: string }): Title {
  return {
    id: title.id || generateId(),
    name: title.name || '',
  };
}

function normalizeTitles(titles: Array<Partial<Title> & { id?: string; name?: string }>): Title[] {
  return titles
    .filter(title => typeof title.name === 'string' && title.name.trim())
    .map(title => normalizeTitle({ ...title, name: title.name?.trim() }));
}

export function calculateProgress(saga: Saga): number {
  if (saga.issues.length === 0) return 0;
  const readCount = saga.issues.filter(i => i.isRead).length;
  return Math.round((readCount / saga.issues.length) * 100);
}

export function getReadCount(saga: Saga): number {
  return saga.issues.filter(i => i.isRead).length;
}
