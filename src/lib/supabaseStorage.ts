import { AppData, Issue, Saga, Title } from '@/types/marvel';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getSettings } from '@/lib/storage';

type SagaRow = {
  id: string;
  name: string;
  era: Saga['era'];
  universe: Saga['universe'];
  year: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type IssueRow = {
  id: string;
  saga_id: string;
  title_id: string | null;
  series: string;
  number: string;
  volume: number | null;
  is_annual: boolean;
  reading_order: number | null;
  year: string | null;
  notes: string | null;
  story_type: Issue['storyType'] | null;
  is_read: boolean;
  created_at: string;
};

type TitleRow = {
  id: string;
  name: string;
};

type TitleInsert = {
  id: string;
  name: string;
};

type SagaInsert = {
  id: string;
  name: string;
  era: Saga['era'];
  universe: Saga['universe'];
  year?: string;
  notes?: string;
};

type IssueInsert = {
  id: string;
  saga_id: string;
  title_id?: string | null;
  series: string;
  number: string;
  volume?: number | null;
  is_annual?: boolean;
  reading_order?: number | null;
  year?: string;
  notes?: string;
  story_type?: Issue['storyType'];
  is_read: boolean;
};

export function canUseSupabase(): boolean {
  return isSupabaseConfigured && supabase !== null;
}

export async function getSagas(): Promise<Saga[]> {
  await ensureSession();

  const [sagasResult, issuesResult] = await Promise.all([
    client().from('sagas').select('*').order('created_at', { ascending: true }),
    client().from('issues').select('*').order('created_at', { ascending: true }),
  ]);

  if (sagasResult.error) throw sagasResult.error;
  if (issuesResult.error) throw issuesResult.error;

  const issuesBySaga = new Map<string, Issue[]>();
  ((issuesResult.data || []) as IssueRow[]).forEach(row => {
    const issues = issuesBySaga.get(row.saga_id) || [];
    issues.push(mapIssue(row));
    issuesBySaga.set(row.saga_id, issues);
  });

  return ((sagasResult.data || []) as SagaRow[]).map(row => ({
    ...mapSaga(row),
    issues: issuesBySaga.get(row.id) || [],
  }));
}

export async function addSaga(data: Omit<Saga, 'id' | 'issues' | 'createdAt' | 'updatedAt'>): Promise<Saga> {
  await ensureSession();

  const insert: SagaInsert = {
    id: generateId(),
    name: data.name,
    era: data.era,
    universe: data.universe,
    year: data.year,
    notes: data.notes,
  };
  const { data: row, error } = await client().from('sagas').insert(insert).select('*').single();
  if (error) throw error;
  return { ...mapSaga(row as SagaRow), issues: [] };
}

export async function updateSaga(id: string, updates: Partial<Omit<Saga, 'id' | 'createdAt'>>): Promise<Saga | null> {
  await ensureSession();

  const { data: row, error } = await client()
    .from('sagas')
    .update({
      name: updates.name,
      era: updates.era,
      universe: updates.universe,
      year: updates.year ?? null,
      notes: updates.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return row ? { ...mapSaga(row as SagaRow), issues: [] } : null;
}

export async function deleteSaga(id: string): Promise<boolean> {
  await ensureSession();
  const { error } = await client().from('sagas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function addIssue(sagaId: string, issue: Omit<Issue, 'id' | 'createdAt'>): Promise<Issue | null> {
  await ensureSession();

  const insert: IssueInsert = {
    id: generateId(),
    saga_id: sagaId,
    title_id: issue.titleId ?? null,
    series: await resolveSeries(issue.series, issue.titleId),
    number: issue.number,
    volume: issue.volume ?? null,
    is_annual: !!issue.isAnnual,
    reading_order: issue.readingOrder ?? null,
    year: issue.year,
    notes: issue.notes,
    story_type: issue.storyType || 'main',
    is_read: issue.isRead,
  };

  const { data: row, error } = await client().from('issues').insert(insert).select('*').single();
  if (error) throw error;
  await touchSaga(sagaId);
  return mapIssue(row as IssueRow);
}

export async function updateIssue(
  sagaId: string,
  issueId: string,
  updates: Partial<Omit<Issue, 'id' | 'createdAt'>>,
): Promise<Issue | null> {
  await ensureSession();

  const titleId = Object.prototype.hasOwnProperty.call(updates, 'titleId') ? updates.titleId ?? null : undefined;
  const series = titleId ? await resolveSeries(updates.series || '', titleId) : updates.series;
  const updatePayload: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(updates, 'titleId')) updatePayload.title_id = titleId;
  if (series !== undefined) updatePayload.series = series;
  if (updates.number !== undefined) updatePayload.number = updates.number;
  if (Object.prototype.hasOwnProperty.call(updates, 'volume')) updatePayload.volume = updates.volume ?? null;
  if (updates.isAnnual !== undefined) updatePayload.is_annual = updates.isAnnual;
  if (Object.prototype.hasOwnProperty.call(updates, 'readingOrder')) updatePayload.reading_order = updates.readingOrder ?? null;
  if (Object.prototype.hasOwnProperty.call(updates, 'year')) updatePayload.year = updates.year ?? null;
  if (Object.prototype.hasOwnProperty.call(updates, 'notes')) updatePayload.notes = updates.notes ?? null;
  if (updates.storyType !== undefined) updatePayload.story_type = updates.storyType;
  if (updates.isRead !== undefined) updatePayload.is_read = updates.isRead;

  const { data: row, error } = await client()
    .from('issues')
    .update(updatePayload)
    .eq('id', issueId)
    .eq('saga_id', sagaId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  await touchSaga(sagaId);
  return row ? mapIssue(row as IssueRow) : null;
}

export async function deleteIssue(sagaId: string, issueId: string): Promise<boolean> {
  await ensureSession();
  const { error } = await client().from('issues').delete().eq('id', issueId).eq('saga_id', sagaId);
  if (error) throw error;
  await touchSaga(sagaId);
  return true;
}

export async function toggleIssueRead(sagaId: string, issueId: string): Promise<boolean> {
  const sagas = await getSagas();
  const issue = sagas.find(saga => saga.id === sagaId)?.issues.find(item => item.id === issueId);
  if (!issue) return false;
  await updateIssue(sagaId, issueId, { isRead: !issue.isRead });
  return true;
}

export async function resetSagaProgress(sagaId: string): Promise<boolean> {
  await ensureSession();
  const { error } = await client().from('issues').update({ is_read: false }).eq('saga_id', sagaId);
  if (error) throw error;
  await touchSaga(sagaId);
  return true;
}

export async function getTitles(): Promise<Title[]> {
  await ensureSession();
  const { data, error } = await client().from('titles').select('id, name').order('name', { ascending: true });
  if (error) throw error;
  return ((data || []) as TitleRow[]).map(mapTitle);
}

export async function addTitle(title: Omit<Title, 'id'>): Promise<Title> {
  await ensureSession();
  const insert: TitleInsert = { id: generateId(), name: title.name };
  const { data, error } = await client().from('titles').insert(insert).select('id, name').single();
  if (error) throw error;
  return mapTitle(data as TitleRow);
}

export async function updateTitle(id: string, updates: Partial<Omit<Title, 'id'>>): Promise<Title | null> {
  await ensureSession();
  const { data, error } = await client()
    .from('titles')
    .update({ name: updates.name })
    .eq('id', id)
    .select('id, name')
    .maybeSingle();
  if (error) throw error;
  return data ? mapTitle(data as TitleRow) : null;
}

export async function deleteTitle(id: string): Promise<boolean> {
  await ensureSession();
  const { error } = await client().from('titles').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function exportTitles(): Promise<string> {
  return JSON.stringify(await getTitles(), null, 2);
}

export async function importTitles(
  jsonString: string,
  options: { merge?: boolean } = { merge: true },
): Promise<{ success: boolean; merged?: number; replaced?: boolean }> {
  try {
    const parsed = JSON.parse(jsonString);
    const incoming: Title[] = Array.isArray(parsed) ? parsed : parsed.titles || [];
    if (!Array.isArray(incoming)) throw new Error('Invalid format');

    if (!options.merge) {
      const existing = await getTitles();
      await Promise.all(existing.map(title => deleteTitle(title.id)));
    }

    const existing = options.merge ? await getTitles() : [];
    const byName = new Set(existing.map(t => t.name.toLowerCase()));
    let merged = 0;

    for (const title of incoming) {
      if (title.name && !byName.has(title.name.toLowerCase())) {
        await addTitle({ name: title.name.trim() });
        merged += 1;
      }
    }

    return options.merge ? { success: true, merged } : { success: true, replaced: true };
  } catch {
    return { success: false };
  }
}

export async function exportData(): Promise<string> {
  const [sagas, titles] = await Promise.all([getSagas(), getTitles()]);
  const payload: AppData = {
    sagas,
    titles,
    settings: getSettings(),
    version: 1,
  };

  return JSON.stringify(payload, null, 2);
}

export async function importData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString) as AppData;
    if (!data.sagas || !Array.isArray(data.sagas)) {
      throw new Error('Invalid data format');
    }

    await ensureSession();
    await clearAllData();

    const titles = normalizeTitles(data.titles || []);
    const titleIds = new Set(titles.map(title => title.id));
    if (titles.length) {
      const { error } = await client().from('titles').insert(titles);
      if (error) throw error;
    }

    const sagaIds = new Map<Saga, string>();
    const sagas = data.sagas.map(saga => {
      const sagaId = saga.id || generateId();
      sagaIds.set(saga, sagaId);
      return {
        id: sagaId,
        name: saga.name,
        era: saga.era,
        universe: saga.universe,
        year: saga.year ?? null,
        notes: saga.notes ?? null,
        created_at: saga.createdAt ? new Date(saga.createdAt).toISOString() : undefined,
        updated_at: saga.updatedAt ? new Date(saga.updatedAt).toISOString() : undefined,
      };
    });

    if (sagas.length) {
      const { error } = await client().from('sagas').insert(sagas);
      if (error) throw error;
    }

    const issues = data.sagas.flatMap(saga =>
      (saga.issues || []).map(issue => ({
        id: issue.id || generateId(),
        saga_id: sagaIds.get(saga)!,
        title_id: issue.titleId && titleIds.has(issue.titleId) ? issue.titleId : null,
        series: issue.series,
        number: issue.number,
        volume: issue.volume ?? null,
        is_annual: !!issue.isAnnual,
        reading_order: issue.readingOrder ?? null,
        year: issue.year ?? null,
        notes: issue.notes ?? null,
        story_type: issue.storyType || 'main',
        is_read: !!issue.isRead,
        created_at: issue.createdAt ? new Date(issue.createdAt).toISOString() : undefined,
      })),
    );

    if (issues.length) {
      const { error } = await client().from('issues').insert(issues);
      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error importing data to Supabase:', error);
    return false;
  }
}

export async function clearAllData(): Promise<void> {
  await ensureSession();
  const supabaseClient = client();

  const issuesResult = await supabaseClient.from('issues').delete().neq('id', '');
  if (issuesResult.error) throw issuesResult.error;

  const sagasResult = await supabaseClient.from('sagas').delete().neq('id', '');
  if (sagasResult.error) throw sagasResult.error;

  const titlesResult = await supabaseClient.from('titles').delete().neq('id', '');
  if (titlesResult.error) throw titlesResult.error;
}

async function resolveSeries(series: string, titleId?: string): Promise<string> {
  if (!titleId) return series;
  const { data, error } = await client().from('titles').select('name').eq('id', titleId).maybeSingle();
  if (error) throw error;
  return (data as Pick<TitleRow, 'name'> | null)?.name || series;
}

async function touchSaga(sagaId: string): Promise<void> {
  const { error } = await client()
    .from('sagas')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sagaId);
  if (error) throw error;
}

async function ensureSession(): Promise<void> {
  const supabaseClient = client();
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  if (data.session) return;

  throw new Error('Usuário não autenticado.');
}

function client() {
  if (!canUseSupabase() || !supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

function mapSaga(row: SagaRow): Saga {
  return {
    id: row.id,
    name: row.name,
    era: row.era,
    universe: row.universe,
    year: row.year || undefined,
    notes: row.notes || undefined,
    issues: [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function mapIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    series: row.series,
    titleId: row.title_id || undefined,
    number: row.number,
    volume: row.volume || undefined,
    isAnnual: row.is_annual,
    readingOrder: row.reading_order || undefined,
    year: row.year || undefined,
    notes: row.notes || undefined,
    storyType: row.story_type || 'main',
    isRead: row.is_read,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mapTitle(row: TitleRow): Title {
  return {
    id: row.id,
    name: row.name,
  };
}

function normalizeTitles(titles: Array<Partial<Title> & { id?: string; name?: string }>): TitleInsert[] {
  const names = new Set<string>();

  return titles
    .filter(title => typeof title.name === 'string' && title.name.trim())
    .reduce<TitleInsert[]>((result, title) => {
      const name = title.name!.trim();
      const normalizedName = name.toLowerCase();
      if (names.has(normalizedName)) return result;

      names.add(normalizedName);
      result.push({
        id: title.id || generateId(),
        name,
      });
      return result;
    }, []);
}

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const counter = Math.floor(Math.random() * 1000000).toString(36);
  const fingerprint = Math.random().toString(36).substr(2, 4);
  const random = Math.random().toString(36).substr(2, 4);

  return `c${timestamp}${counter}${fingerprint}${random}`;
}
