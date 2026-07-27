import { useState, useEffect, useCallback } from 'react';
import { Saga, Issue, Era, Universe, SortOption, FilterOption } from '@/types/marvel';
import * as storage from '@/lib/storage';
import * as supabaseStorage from '@/lib/supabaseStorage';

export function useSagas() {
  const [sagas, setSagas] = useState<Saga[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (supabaseStorage.canUseSupabase()) {
      try {
        setSagas(await supabaseStorage.getSagas());
        return;
      } catch (error) {
        console.error('Error loading sagas from Supabase:', error);
      }
    }

    setSagas(storage.getSagas());
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));

    // Listen for storage changes from other components
    const handleStorageChange = () => refresh();
    window.addEventListener('sagas-updated', handleStorageChange);
    return () => window.removeEventListener('sagas-updated', handleStorageChange);
  }, [refresh]);

  const addSaga = useCallback(async (data: { name: string; era: Era; universe: Universe; year?: string; notes?: string }) => {
    if (supabaseStorage.canUseSupabase()) {
      const newSaga = await supabaseStorage.addSaga(data);
      await refresh();
      window.dispatchEvent(new Event('sagas-updated'));
      return newSaga;
    }

    const newSaga = storage.addSaga(data);
    refresh();
    window.dispatchEvent(new Event('sagas-updated'));
    return newSaga;
  }, [refresh]);

  const updateSaga = useCallback(async (id: string, updates: Partial<Omit<Saga, 'id' | 'createdAt'>>) => {
    if (supabaseStorage.canUseSupabase()) {
      const updated = await supabaseStorage.updateSaga(id, updates);
      await refresh();
      window.dispatchEvent(new Event('sagas-updated'));
      return updated;
    }

    const updated = storage.updateSaga(id, updates);
    refresh();
    window.dispatchEvent(new Event('sagas-updated'));
    return updated;
  }, [refresh]);

  const deleteSaga = useCallback(async (id: string) => {
    if (supabaseStorage.canUseSupabase()) {
      const result = await supabaseStorage.deleteSaga(id);
      await refresh();
      window.dispatchEvent(new Event('sagas-updated'));
      return result;
    }

    const result = storage.deleteSaga(id);
    refresh();
    window.dispatchEvent(new Event('sagas-updated'));
    return result;
  }, [refresh]);

  const addIssue = useCallback(async (sagaId: string, issue: Omit<Issue, 'id' | 'createdAt'>) => {
    if (supabaseStorage.canUseSupabase()) {
      const newIssue = await supabaseStorage.addIssue(sagaId, issue);
      await refresh();
      window.dispatchEvent(new Event('sagas-updated'));
      return newIssue;
    }

    const newIssue = storage.addIssue(sagaId, issue);
    refresh();
    window.dispatchEvent(new Event('sagas-updated'));
    return newIssue;
  }, [refresh]);

  const updateIssue = useCallback(async (sagaId: string, issueId: string, updates: Partial<Omit<Issue, 'id' | 'createdAt'>>) => {
    if (supabaseStorage.canUseSupabase()) {
      const updated = await supabaseStorage.updateIssue(sagaId, issueId, updates);
      await refresh();
      window.dispatchEvent(new Event('sagas-updated'));
      return updated;
    }

    const updated = storage.updateIssue(sagaId, issueId, updates);
    refresh();
    window.dispatchEvent(new Event('sagas-updated'));
    return updated;
  }, [refresh]);

  const deleteIssue = useCallback(async (sagaId: string, issueId: string) => {
    if (supabaseStorage.canUseSupabase()) {
      const result = await supabaseStorage.deleteIssue(sagaId, issueId);
      await refresh();
      window.dispatchEvent(new Event('sagas-updated'));
      return result;
    }

    const result = storage.deleteIssue(sagaId, issueId);
    refresh();
    window.dispatchEvent(new Event('sagas-updated'));
    return result;
  }, [refresh]);

  const toggleIssueRead = useCallback(async (sagaId: string, issueId: string) => {
    if (supabaseStorage.canUseSupabase()) {
      const result = await supabaseStorage.toggleIssueRead(sagaId, issueId);
      await refresh();
      window.dispatchEvent(new Event('sagas-updated'));
      return result;
    }

    const result = storage.toggleIssueRead(sagaId, issueId);
    refresh();
    window.dispatchEvent(new Event('sagas-updated'));
    return result;
  }, [refresh]);

  const resetProgress = useCallback(async (sagaId: string) => {
    if (supabaseStorage.canUseSupabase()) {
      const result = await supabaseStorage.resetSagaProgress(sagaId);
      await refresh();
      window.dispatchEvent(new Event('sagas-updated'));
      return result;
    }

    const result = storage.resetSagaProgress(sagaId);
    refresh();
    window.dispatchEvent(new Event('sagas-updated'));
    return result;
  }, [refresh]);

  const getSaga = useCallback((id: string) => {
    return sagas.find(s => s.id === id) || null;
  }, [sagas]);

  return {
    sagas,
    loading,
    refresh,
    addSaga,
    updateSaga,
    deleteSaga,
    addIssue,
    updateIssue,
    deleteIssue,
    toggleIssueRead,
    resetProgress,
    getSaga,
  };
}

export function filterSagas(sagas: Saga[], filter: FilterOption): Saga[] {
  switch (filter) {
    case 'not-started':
      return sagas.filter(s => s.issues.length === 0 || s.issues.every(i => !i.isRead));
    case 'in-progress':
      return sagas.filter(s => {
        const readCount = s.issues.filter(i => i.isRead).length;
        return readCount > 0 && readCount < s.issues.length;
      });
    case 'completed':
      return sagas.filter(s => s.issues.length > 0 && s.issues.every(i => i.isRead));
    default:
      return sagas;
  }
}

export function sortSagas(sagas: Saga[], sort: SortOption): Saga[] {
  const sorted = [...sagas];
  
  switch (sort) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'progress-asc':
      return sorted.sort((a, b) => storage.calculateProgress(a) - storage.calculateProgress(b));
    case 'progress-desc':
      return sorted.sort((a, b) => storage.calculateProgress(b) - storage.calculateProgress(a));
    case 'date-asc':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'date-desc':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'era':
      return sorted.sort((a, b) => a.era.localeCompare(b.era));
    case 'yaer-asc':
      return sorted.sort((a, b) => {
        const yearA = a.year ? parseInt(a.year) : 0;
        const yearB = b.year ? parseInt(b.year) : 0;
        return yearA - yearB;
      });
    case 'yaer-desc':
      return sorted.sort((a, b) => {
        const yearA = a.year ? parseInt(a.year) : 0;
        const yearB = b.year ? parseInt(b.year) : 0;
        return yearB - yearA;
      });
    default:
      return sorted;
  }
}
