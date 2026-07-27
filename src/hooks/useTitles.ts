import { useCallback, useEffect, useState } from 'react';
import { Title } from '@/types/marvel';
import * as storage from '@/lib/storage';
import * as supabaseStorage from '@/lib/supabaseStorage';

export function useTitles() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (supabaseStorage.canUseSupabase()) {
      try {
        setTitles(await supabaseStorage.getTitles());
        return;
      } catch (error) {
        console.error('Error loading titles from Supabase:', error);
      }
    }

    setTitles(storage.getTitles());
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const addTitle = useCallback(async (data: { name: string }) => {
    if (supabaseStorage.canUseSupabase()) {
      const newTitle = await supabaseStorage.addTitle(data);
      await refresh();
      return newTitle;
    }

    const newTitle = storage.addTitle(data);
    refresh();
    return newTitle;
  }, [refresh]);

  const updateTitle = useCallback(async (id: string, updates: Partial<Omit<Title, 'id'>>) => {
    if (supabaseStorage.canUseSupabase()) {
      const updated = await supabaseStorage.updateTitle(id, updates);
      await refresh();
      return updated;
    }

    const updated = storage.updateTitle(id, updates);
    refresh();
    return updated;
  }, [refresh]);

  const deleteTitle = useCallback(async (id: string) => {
    if (supabaseStorage.canUseSupabase()) {
      const result = await supabaseStorage.deleteTitle(id);
      await refresh();
      return result;
    }

    const result = storage.deleteTitle(id);
    refresh();
    return result;
  }, [refresh]);

  const exportTitles = useCallback(async () => {
    if (supabaseStorage.canUseSupabase()) {
      return supabaseStorage.exportTitles();
    }

    return storage.exportTitles();
  }, []);

  const importTitles = useCallback(async (json: string, options?: { merge?: boolean }) => {
    if (supabaseStorage.canUseSupabase()) {
      const result = await supabaseStorage.importTitles(json, options);
      await refresh();
      return result;
    }

    const result = storage.importTitles(json, options);
    refresh();
    return result;
  }, [refresh]);

  return {
    titles,
    loading,
    refresh,
    addTitle,
    updateTitle,
    deleteTitle,
    exportTitles,
    importTitles,
  };
}
