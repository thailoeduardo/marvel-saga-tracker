import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronsUpDown, Pencil, Plus, RotateCcw, Trash2, Layers, Download, Upload } from 'lucide-react';
import { useSagas } from '@/hooks/useSagas';
import { useTitles } from '@/hooks/useTitles';
import { useToast } from '@/hooks/use-toast';
import { Era, Universe, ERA_LABELS, UNIVERSE_LABELS, StoryType, STORY_TYPE_LABELS } from '@/types/marvel';
import { calculateProgress, getReadCount } from '@/lib/storage';
import { ProgressBar } from '@/components/ProgressBar';
import { IssueItem } from '@/components/IssueItem';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SagaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sagas, updateSaga, addIssue, updateIssue, deleteIssue, toggleIssueRead, resetProgress, deleteSaga } = useSagas();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Ensure detail pages always start scrolled to top when opened
  // This prevents inheriting the Dashboard scroll position when navigating from the list
  useEffect(() => {
    try {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    } catch (e) {
      // ignore in non-browser environments
    }
  }, []);

  const saga = sagas.find(s => s.id === id);
  
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [sagaDialogOpen, setSagaDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  
  // Issue form states
  const [formSeries, setFormSeries] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formVolume, setFormVolume] = useState('none');
  const [formIsAnnual, setFormIsAnnual] = useState(false);
  const [formReadingOrder, setFormReadingOrder] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStoryType, setFormStoryType] = useState<StoryType>('main');
  const { titles, addTitle } = useTitles();
  const { toast } = useToast();
  // selectedTitleId is the selected title id when a title was chosen, or null when a free-form series is used
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [titleSearchOpen, setTitleSearchOpen] = useState(false);
  const [titleSearchValue, setTitleSearchValue] = useState('');
  const [batchTitleSearchOpen, setBatchTitleSearchOpen] = useState(false);
  const [batchTitleSearchValue, setBatchTitleSearchValue] = useState('');

  // Batch registration (Cadastro em série)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchSeries, setBatchSeries] = useState('');
  const [batchStart, setBatchStart] = useState('');
  const [batchEnd, setBatchEnd] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [batchStoryType, setBatchStoryType] = useState<StoryType>('main');
  const [batchPreview, setBatchPreview] = useState<Array<{number: string; year?: string; notes?: string}>>([]);
  const [batchSelectedTitleId, setBatchSelectedTitleId] = useState<string | null>(null);

  // JSON Import Dialog
  const [jsonImportDialogOpen, setJsonImportDialogOpen] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');

  // Saga form states
  const [sagaName, setSagaName] = useState('');
  const [sagaEra, setSagaEra] = useState('modern' as Era);
  const [sagaUniverse, setSagaUniverse] = useState('616' as Universe);
  const [sagaYear, setSagaYear] = useState('');
  const [sagaNotes, setSagaNotes] = useState('');

  if (!saga) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-6">
          <EmptyState
            icon={Trash2}
            title="Saga não encontrada"
            description="A saga que você procura não existe ou foi excluída."
            action={
              <Button asChild>
                <Link to="/">Voltar ao Dashboard</Link>
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  const progress = calculateProgress(saga);
  const readCount = getReadCount(saga);
  
  // Define story type order
  const storyTypeOrder: Record<StoryType, number> = {
    'prelude': 1,
    'main': 2,
    'tie-in': 3,
    'epilogue': 4,
    'graphic-novel': 5,
  };
  
  const sortedIssues = [...saga.issues].sort((a, b) => {
    // Sort by story type first
    const typeA = a.storyType || 'main';
    const typeB = b.storyType || 'main';
    const typeOrderA = storyTypeOrder[typeA];
    const typeOrderB = storyTypeOrder[typeB];
    
    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }
    
    // Within same story type, sort by reading order first, then by volume and number
    if (a.readingOrder !== undefined && b.readingOrder !== undefined) {
      return a.readingOrder - b.readingOrder;
    }
    if (a.readingOrder !== undefined) return -1;
    if (b.readingOrder !== undefined) return 1;

    const volumeA = a.volume ?? 0;
    const volumeB = b.volume ?? 0;
    if (volumeA !== volumeB) return volumeA - volumeB;

    if (!!a.isAnnual !== !!b.isAnnual) return a.isAnnual ? 1 : -1;
    
    const numA = parseFloat(a.number) || 0;
    const numB = parseFloat(b.number) || 0;
    return numA - numB;
  });

  const handleOpenCreateIssue = () => {
    setEditingIssueId(null);
    setFormSeries('');
    setFormNumber('');
    setFormVolume('none');
    setFormIsAnnual(false);
    setFormReadingOrder('');
    setFormYear('');
    setFormNotes('');
    setFormStoryType('main');
    setSelectedTitleId(null);
    setTitleSearchValue('');
    setIssueDialogOpen(true);
  };

  const handleCreateTitleFromSearch = async (name: string, origin: 'issue' | 'batch') => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const existingTitle = titles.find(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    const title = existingTitle || await addTitle({ name: trimmedName });

    if (origin === 'batch') {
      setBatchSelectedTitleId(title.id);
      setBatchSeries(title.name);
      setBatchTitleSearchValue('');
      setBatchTitleSearchOpen(false);
    } else {
      setSelectedTitleId(title.id);
      setFormSeries(title.name);
      setTitleSearchValue('');
      setTitleSearchOpen(false);
    }

    if (!existingTitle) {
      toast({ title: 'Título criado', description: 'Novo título adicionado.' });
    }
  };

  const handleExportIssues = () => {
    try {
      if (!saga.issues.length) {
        toast({
          title: 'Nada para exportar',
          description: 'Esta saga ainda não possui issues cadastradas.',
        });
        return;
      }

      const exportPayload = {
        sagaId: saga.id,
        sagaName: saga.name,
        exportedAt: new Date().toISOString(),
        issues: saga.issues.map(issue => {
          const { id, createdAt, ...rest } = issue as any;
          return {
            ...rest,
            volume: issue.volume ?? null,
            isAnnual: !!issue.isAnnual,
          };
        }),
      };

      const json = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = saga.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

      a.href = url;
      a.download = `saga-${safeName || saga.id}-issues.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Issues exportadas',
        description: 'Arquivo JSON gerado com sucesso.',
      });
    } catch {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o arquivo de exportação.',
      });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleJsonImport = () => {
    if (!jsonImportText.trim()) {
      toast({ title: 'Campo vazio', description: 'Cole o JSON no campo de texto.' });
      return;
    }

    try {
      const parsed = JSON.parse(jsonImportText);
      const incomingIssues = Array.isArray(parsed) ? parsed : [parsed];

      type IncomingIssue = {
        series: string;
        titleId?: string;
        number: string;
        volume?: number;
        isAnnual?: boolean;
        readingOrder?: number;
        year?: string;
        notes?: string;
        storyType?: StoryType;
        isRead?: boolean;
      };

      const errors: string[] = [];
      const validIssues: IncomingIssue[] = [];

      incomingIssues.forEach((issue, idx) => {
        if (!issue || typeof issue.series !== 'string' || typeof issue.number !== 'string') {
          errors.push(`Issue ${idx + 1}: campos obrigatórios ausentes (series, number)`);
          return;
        }

        // Validate titleId if present
        if (issue.titleId && !titles.find(t => t.id === issue.titleId)) {
          errors.push(`Issue ${idx + 1}: titleId "${issue.titleId}" não existe`);
          return;
        }

        validIssues.push(issue);
      });

      if (errors.length > 0) {
        toast({
          title: 'Erros de validação',
          description: errors.join(' • '),
          variant: 'destructive',
        });
        return;
      }

      if (!validIssues.length) {
        toast({ title: 'Nenhuma issue válida', description: 'Verifique o formato do JSON.' });
        return;
      }

      let added = 0;
      const skipped: string[] = [];

      validIssues.forEach(issue => {
        const exists = saga.issues.some(i => i.series === issue.series && i.number === issue.number);
        if (exists) {
          skipped.push(`${issue.series} #${issue.number}`);
          return;
        }

        addIssue(saga.id, {
          series: issue.series,
          titleId: issue.titleId,
          number: issue.number,
          volume: issue.volume,
          isAnnual: !!issue.isAnnual,
          readingOrder: issue.readingOrder,
          year: issue.year,
          notes: issue.notes,
          storyType: issue.storyType || 'main',
          isRead: !!issue.isRead,
        });
        added += 1;
      });

      setJsonImportDialogOpen(false);
      setJsonImportText('');

      const descParts = [];
      if (added) descParts.push(`${added} issue(s) adicionada(s)`);
      if (skipped.length) descParts.push(`${skipped.length} duplicata(s) ignorada(s)`);

      toast({
        title: 'Importação concluída',
        description: descParts.join(' • ') || 'Nenhuma issue adicionada.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao processar JSON',
        description: 'Verifique se o JSON está válido.',
        variant: 'destructive',
      });
    }
  };

  const handleImportIssues = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incomingIssues = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.issues)
          ? parsed.issues
          : null;

      if (!incomingIssues) {
        throw new Error('Formato inválido');
      }

      type IncomingIssue = {
        series: string;
        titleId?: string;
        number: string;
        volume?: number;
        isAnnual?: boolean;
        readingOrder?: number;
        year?: string;
        notes?: string;
        storyType?: StoryType;
        isRead?: boolean;
      };

      const validIssues = (incomingIssues as IncomingIssue[]).filter(
        issue => issue && typeof issue.series === 'string' && typeof issue.number === 'string',
      );

      if (!validIssues.length) {
        toast({
          title: 'Nenhuma issue válida',
          description: 'O arquivo não contém issues em um formato reconhecido.',
        });
        return;
      }

      // Remove todas as issues atuais da saga
      saga.issues.forEach(issue => {
        deleteIssue(saga.id, issue.id);
      });

      // Recria a lista de issues a partir do arquivo
      let added = 0;
      validIssues.forEach(issue => {
        addIssue(saga.id, {
          series: issue.series,
          titleId: issue.titleId,
          number: issue.number,
          volume: issue.volume,
          isAnnual: !!issue.isAnnual,
          readingOrder: issue.readingOrder,
          year: issue.year,
          notes: issue.notes,
          storyType: issue.storyType || 'main',
          isRead: !!issue.isRead,
        });
        added += 1;
      });

      toast({
        title: 'Importação concluída',
        description: `${added} issue(s) importada(s) e lista sobrescrita.`,
      });
    } catch {
      toast({
        title: 'Erro ao importar',
        description: 'Verifique se o arquivo é um JSON válido gerado pelo app.',
      });
    } finally {
      // permite selecionar o mesmo arquivo novamente no futuro
      event.target.value = '';
    }
  };

  const handleOpenEditIssue = (issueId: string) => {
    const issue = saga.issues.find(i => i.id === issueId);
    if (!issue) return;
    
    setEditingIssueId(issueId);
    setFormSeries(issue.series);
    setFormNumber(issue.number);
    setFormVolume(issue.volume ? issue.volume.toString() : 'none');
    setFormIsAnnual(!!issue.isAnnual);
    setFormReadingOrder(issue.readingOrder?.toString() || '');
    setFormYear(issue.year || '');
    setFormNotes(issue.notes || '');
    setFormStoryType(issue.storyType || 'main');

    if ((issue as any).titleId) {
      setSelectedTitleId((issue as any).titleId);
    } else {
      // legacy/manual entries: keep series text and clear selection
      setSelectedTitleId(null);
      setFormSeries(issue.series || '');
    }

    setIssueDialogOpen(true);
  };

  function incrementIssueNumber(prev: string) {
    // Try to increment trailing number while preserving padding: '001' -> '002', 'Anual 1' -> 'Anual 2'
    const match = prev.match(/(\d+)$/);
    if (!match) return prev;
    const numStr = match[1];
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return prev;
    const next = (num + 1).toString().padStart(numStr.length, '0');
    return prev.slice(0, match.index) + next;
  }

  const handleSaveIssue = () => {
    const titleIdToSave = selectedTitleId || undefined;
    const seriesToSave = formSeries.trim();
    const volumeToSave = formVolume === 'none' ? undefined : parseInt(formVolume, 10);
    const readingOrderToSave = formReadingOrder.trim() ? parseInt(formReadingOrder.trim()) : undefined;

    if (!seriesToSave || !formNumber.trim()) return;

    // Prevent duplicate (same series + same number + same volume + same annual flag)
    const isDuplicate = saga.issues.some(i =>
      i.series === seriesToSave &&
      i.number === formNumber.trim() &&
      i.volume === volumeToSave &&
      !!i.isAnnual === formIsAnnual &&
      i.id !== editingIssueId
    );
    if (isDuplicate) {
      toast({ title: 'Issue duplicada', description: 'Já existe uma issue com o mesmo título, número, volume e tipo nesta saga.' });
      return;
    }

    if (editingIssueId) {
      updateIssue(saga.id, editingIssueId, {
        series: seriesToSave,
        titleId: titleIdToSave,
        number: formNumber.trim(),
        volume: volumeToSave,
        isAnnual: formIsAnnual,
        readingOrder: readingOrderToSave,
        year: formYear.trim() || undefined,
        notes: formNotes.trim() || undefined,
        storyType: formStoryType,
      });
    } else {
      addIssue(saga.id, {
        series: seriesToSave,
        titleId: titleIdToSave,
        number: formNumber.trim(),
        volume: volumeToSave,
        isAnnual: formIsAnnual,
        readingOrder: readingOrderToSave,
        year: formYear.trim() || undefined,
        notes: formNotes.trim() || undefined,
        storyType: formStoryType,
        isRead: false,
      });
    }

    setFormSeries('');
    setFormNumber('');
    setFormVolume('none');
    setFormIsAnnual(false);
    setFormReadingOrder('');
    setFormYear('');
    setFormNotes('');
    setSelectedTitleId(null);
    setEditingIssueId(null);
    setIssueDialogOpen(false);
  };

  const handleSaveAndNext = () => {
    const titleIdToSave = selectedTitleId || undefined;
    const seriesToSave = formSeries.trim();
    const volumeToSave = formVolume === 'none' ? undefined : parseInt(formVolume, 10);
    const readingOrderToSave = formReadingOrder.trim() ? parseInt(formReadingOrder.trim()) : undefined;

    if (!seriesToSave || !formNumber.trim()) return;

    // Prevent duplicate
    const isDuplicate = saga.issues.some(i =>
      i.series === seriesToSave &&
      i.number === formNumber.trim() &&
      i.volume === volumeToSave &&
      !!i.isAnnual === formIsAnnual &&
      i.id !== editingIssueId
    );
    if (isDuplicate) {
      toast({ title: 'Issue duplicada', description: 'Já existe uma issue com o mesmo título, número, volume e tipo nesta saga.' });
      return;
    }

    if (editingIssueId) {
      // Save current edit
      updateIssue(saga.id, editingIssueId, {
        series: seriesToSave,
        titleId: titleIdToSave,
        number: formNumber.trim(),
        volume: volumeToSave,
        isAnnual: formIsAnnual,
        readingOrder: readingOrderToSave,
        year: formYear.trim() || undefined,
        notes: formNotes.trim() || undefined,
        storyType: formStoryType,
      });
    } else {
      addIssue(saga.id, {
        series: seriesToSave,
        titleId: titleIdToSave,
        number: formNumber.trim(),
        volume: volumeToSave,
        isAnnual: formIsAnnual,
        readingOrder: readingOrderToSave,
        year: formYear.trim() || undefined,
        notes: formNotes.trim() || undefined,
        storyType: formStoryType,
        isRead: false,
      });
    }

    // Prepare next issue with incremented number, keep other fields
    const nextNumber = incrementIssueNumber(formNumber.trim());
    const nextReadingOrder = readingOrderToSave ? (readingOrderToSave + 1).toString() : '';
    setEditingIssueId(null);
    setFormNumber(nextNumber);
    setFormReadingOrder(nextReadingOrder);
    setFormYear(formYear);
    setFormNotes(formNotes);
    // series and selectedTitleId remain
    setIssueDialogOpen(true);
    toast({ title: 'Issue adicionada', description: 'Adicione a próxima issue ou ajuste os campos.' });
  };

  const handleDuplicateIssue = (issueId: string) => {
    const issue = saga.issues.find(i => i.id === issueId);
    if (!issue) return;

    // Prefill dialog with issue data but clear the number and isRead
    setEditingIssueId(null);
    setFormSeries(issue.series);
    setFormNumber('');
    setFormVolume(issue.volume ? issue.volume.toString() : 'none');
    setFormIsAnnual(!!issue.isAnnual);
    setFormReadingOrder(issue.readingOrder?.toString() || '');
    setFormYear(issue.year || '');
    setFormNotes(issue.notes || '');
    setFormStoryType(issue.storyType || 'main');

    if ((issue as any).titleId) {
      setSelectedTitleId((issue as any).titleId);
    } else {
      setSelectedTitleId(null);
    }

    setIssueDialogOpen(true);
  };

  // ------------------ Batch creation helpers ------------------
  function buildSequence(startStr: string, endStr: string): string[] | null {
    const startMatch = startStr.match(/(.*?)(\d+)$/);
    const endMatch = endStr.match(/(.*?)(\d+)$/);

    if (startMatch && endMatch && startMatch[1] === endMatch[1]) {
      const prefix = startMatch[1];
      const startNumStr = startMatch[2];
      const endNumStr = endMatch[2];
      const startNum = parseInt(startNumStr, 10);
      const endNum = parseInt(endNumStr, 10);
      if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) return null;
      const width = Math.max(startNumStr.length, endNumStr.length);
      const out: string[] = [];
      for (let n = startNum; n <= endNum; n++) {
        out.push(prefix + n.toString().padStart(width, '0'));
      }
      return out;
    }

    // fallback: if both are plain numbers
    const sNum = parseInt(startStr, 10);
    const eNum = parseInt(endStr, 10);
    if (!isNaN(sNum) && !isNaN(eNum) && sNum <= eNum) {
      const out: string[] = [];
      for (let n = sNum; n <= eNum; n++) out.push(n.toString());
      return out;
    }

    return null;
  }

  const handleBatchPreview = () => {
    const seriesToUse = batchSelectedTitleId ? (titles.find(t => t.id === batchSelectedTitleId)?.name || '') : batchSeries;
    if (!seriesToUse?.trim() || !batchStart.trim() || !batchEnd.trim()) return;
    const seq = buildSequence(batchStart.trim(), batchEnd.trim());
    if (!seq) {
      toast({ title: 'Intervalo inválido', description: 'Forneça um intervalo numérico válido (ex: 001 → 010 ou 1 → 5).' });
      return;
    }
    const preview = seq.map(num => ({ number: num, year: batchYear.trim() || undefined, notes: batchNotes.trim() || undefined }));
    setBatchPreview(preview);
  };

  const handleRemovePreviewItem = (index: number) => {
    setBatchPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmBatch = () => {
    if (batchPreview.length === 0) return;
    let added = 0;
    const skipped: string[] = [];

    const seriesToUse = batchSelectedTitleId ? (titles.find(t => t.id === batchSelectedTitleId)?.name || '') : batchSeries.trim();
    const titleIdToSave = batchSelectedTitleId || undefined;

    batchPreview.forEach(item => {
      const exists = saga.issues.some(i => i.series === seriesToUse && i.number === item.number);
      if (exists) {
        skipped.push(item.number);
        return;
      }
      addIssue(saga.id, {
        series: seriesToUse,
        titleId: titleIdToSave,
        number: item.number,
        year: item.year,
        notes: item.notes,
        storyType: batchStoryType,
        isRead: false,
      });
      added += 1;
    });

    setBatchDialogOpen(false);
    setBatchPreview([]);
    setBatchStart('');
    setBatchEnd('');
    setBatchSelectedTitleId(null);
    setBatchSeries('');
    setBatchTitleSearchValue('');

    const descParts = [];
    if (added) descParts.push(`${added} adicionada(s)`);
    if (skipped.length) descParts.push(`${skipped.length} pularam (duplicatas): ${skipped.join(', ')}`);

    toast({ title: 'Batch concluído', description: descParts.join(' • ') || 'Nenhuma issue adicionada.' });
  };

  // -----------------------------------------------------------


  const handleDeleteIssue = () => {
    if (deletingIssueId) {
      deleteIssue(saga.id, deletingIssueId);
      setDeletingIssueId(null);
    }
  };

  const handleReset = () => {
    resetProgress(saga.id);
    setResetDialogOpen(false);
  };

  const handleDeleteSaga = () => {
    deleteSaga(saga.id);
    navigate('/');
  };

  const handleOpenEditSaga = () => {
    setSagaName(saga.name);
    setSagaEra(saga.era);
    setSagaUniverse(saga.universe);
    setSagaYear(saga.year || '');
    setSagaNotes(saga.notes || '');
    setSagaDialogOpen(true);
  };

  const handleSaveSaga = () => {
    if (!sagaName.trim()) return;
    updateSaga(saga.id, {
      name: sagaName.trim(),
      era: sagaEra,
      universe: sagaUniverse,
      year: sagaYear.trim() || undefined,
      notes: sagaNotes.trim() || undefined,
    });
    setSagaDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container py-6 space-y-6">
        {/* Saga Header */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{saga.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {saga.year && (
                  <Badge variant="secondary">
                    {saga.year}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {ERA_LABELS[saga.era].split(' (')[0]}
                </Badge>
                <Badge variant="outline">
                  {UNIVERSE_LABELS[saga.universe].split(' (')[0]}
                </Badge>
              </div>
            </div>
          </div>

          {saga.notes && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 mt-2">
              {saga.notes}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{readCount} / {saga.issues.length} issues</span>
            </div>
            <ProgressBar progress={progress} size="lg" />
          </div>

          <div className="flex gap-2">
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              onClick={handleOpenEditSaga}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              disabled={saga.issues.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-white w-full"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Issues Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Issues</h2>
            <div className="flex w-full flex-wrap gap-2 mt-2 sm:mt-0 sm:w-auto">
              <Button size="sm" className="flex-1 sm:flex-none" onClick={handleOpenCreateIssue}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                variant="outline"
                onClick={() => setBatchDialogOpen(true)}
              >
                <Layers className="w-4 h-4 mr-2" />
                Adicionar múltiplas
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none"
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar/Exportar
                    <ChevronsUpDown className="w-4 h-4 ml-2 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={handleExportIssues}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleImportClick}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar arquivo
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setJsonImportDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {sortedIssues.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const groupedIssues: Record<StoryType, typeof sortedIssues> = {
                  'prelude': [],
                  'main': [],
                  'tie-in': [],
                  'epilogue': [],
                  'graphic-novel': []
                };
                
                sortedIssues.forEach(issue => {
                  const type = issue.storyType || 'main';
                  groupedIssues[type].push(issue);
                });
                
                return Object.entries(groupedIssues)
                  .filter(([_, issues]) => issues.length > 0)
                  .map(([type, issues]) => (
                    <div key={type} className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {STORY_TYPE_LABELS[type as StoryType]}
                      </h3>
                      <div className="space-y-2">
                        {issues.map(issue => (
                          <IssueItem
                            key={issue.id}
                            issue={issue}
                            onToggle={() => toggleIssueRead(saga.id, issue.id, !issue.isRead)}
                            onEdit={() => handleOpenEditIssue(issue.id)}
                            onDuplicate={() => handleDuplicateIssue(issue.id)}
                            onDelete={() => setDeletingIssueId(issue.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ));
              })()
            }
            </div>
          ) : (
            <EmptyState
              icon={Plus}
              title="Nenhuma issue cadastrada"
              description="Adicione as issues desta saga para acompanhar sua leitura"
              action={
                <Button onClick={handleOpenCreateIssue}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Issue
                </Button>
              }
            />
          )}
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportIssues}
      />

      {/* Add/Edit Issue Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIssueId ? 'Editar Issue' : 'Adicionar Issue'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="series">Titulo</Label>

              <Popover open={titleSearchOpen} onOpenChange={(open) => {
                setTitleSearchOpen(open);
                if (!open) setTitleSearchValue('');
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={titleSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedTitleId ? titles.find(t => t.id === selectedTitleId)?.name : formSeries || "Selecionar título..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar título..."
                      value={titleSearchValue}
                      onValueChange={setTitleSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty className="p-1 text-left">
                        {titleSearchValue.trim() ? (
                          <button
                            type="button"
                            className="block w-full truncate rounded-sm px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleCreateTitleFromSearch(titleSearchValue, 'issue')}
                          >
                            Cadastrar "{titleSearchValue.trim()}"
                          </button>
                        ) : (
                          <span className="text-muted-foreground">Digite para buscar um título.</span>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {titles.map(t => (
                          <CommandItem
                            key={t.id}
                            onSelect={() => {
                              setSelectedTitleId(t.id);
                              setFormSeries(t.name);
                              setTitleSearchValue('');
                              setTitleSearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedTitleId === t.id ? "opacity-100" : "opacity-0"}`}
                            />
                            {t.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="volume">Volume</Label>
              <Select value={formVolume} onValueChange={setFormVolume}>
                <SelectTrigger id="volume">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem volume</SelectItem>
                  {Array.from({ length: 10 }, (_, index) => {
                    const value = String(index + 1);
                    return (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                placeholder="Ex: 1, 121..."
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
              />
            </div>

            <div className="w-full">
              <div className="flex h-10 items-center gap-2">
                <Checkbox
                  id="isAnnual"
                  checked={formIsAnnual}
                  onCheckedChange={(checked) => setFormIsAnnual(checked === true)}
                />
                <Label htmlFor="isAnnual">Anual</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueYear">Ano(s)</Label>
              <Input
                id="issueYear"
                placeholder="Ex: 2006, 2015-2016..."
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyType">Tipo de História</Label>
              <Select value={formStoryType} onValueChange={(v: StoryType) => setFormStoryType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STORY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="readingOrder">Ordem de Leitura</Label>
              <Input
                id="readingOrder"
                type="number"
                placeholder="Ex: 1, 2, 3..."
                value={formReadingOrder}
                onChange={(e) => setFormReadingOrder(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueNotes">Notas</Label>
              <Textarea
                id="issueNotes"
                placeholder="Notas sobre a issue..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 flex-wrap sm:flex-col-reverse justify-between">
            <div className="w-full">
              <Button variant="outline" className="w-full" onClick={handleSaveAndNext} disabled={!formSeries.trim() || !formNumber.trim()}>
                Adicionar sequencia
              </Button>
            </div>

            <div className="flex flex-nowrap gap-2 w-full justify-between space-x-0">
              <Button className="w-1/2" onClick={handleSaveIssue} disabled={!formSeries.trim() || !formNumber.trim()}>
                Salvar
              </Button>
              <Button variant="outline" className="w-1/2" onClick={() => setIssueDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Creation Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro em série</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batchSeries">Título</Label>
              <Popover open={batchTitleSearchOpen} onOpenChange={(open) => {
                setBatchTitleSearchOpen(open);
                if (!open) setBatchTitleSearchValue('');
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={batchTitleSearchOpen}
                    className="w-full justify-between"
                  >
                    {batchSelectedTitleId ? titles.find(t => t.id === batchSelectedTitleId)?.name : batchSeries || "Selecionar título..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar título..."
                      value={batchTitleSearchValue}
                      onValueChange={setBatchTitleSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty className="p-1 text-left">
                        {batchTitleSearchValue.trim() ? (
                          <button
                            type="button"
                            className="block w-full truncate rounded-sm px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleCreateTitleFromSearch(batchTitleSearchValue, 'batch')}
                          >
                            Cadastrar "{batchTitleSearchValue.trim()}"
                          </button>
                        ) : (
                          <span className="text-muted-foreground">Digite para buscar um título.</span>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {titles.map(t => (
                          <CommandItem
                            key={t.id}
                            onSelect={() => {
                              setBatchSelectedTitleId(t.id);
                              setBatchSeries(t.name);
                              setBatchTitleSearchValue('');
                              setBatchTitleSearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${batchSelectedTitleId === t.id ? "opacity-100" : "opacity-0"}`}
                            />
                            {t.name}
                        </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="batchStart">Número inicial</Label>
                <Input id="batchStart" placeholder="Ex: 001 or 1" value={batchStart} onChange={(e) => setBatchStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchEnd">Número final</Label>
                <Input id="batchEnd" placeholder="Ex: 010 or 5" value={batchEnd} onChange={(e) => setBatchEnd(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchYear">Ano(s) (opcional)</Label>
              <Input id="batchYear" placeholder="Ex: 2006" value={batchYear} onChange={(e) => setBatchYear(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNotes">Notas (opcional)</Label>
              <Textarea id="batchNotes" placeholder="Notas aplicadas a todas as issues" value={batchNotes} onChange={(e) => setBatchNotes(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchStoryType">Tipo de História</Label>
              <Select value={batchStoryType} onValueChange={(v: StoryType) => setBatchStoryType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STORY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='w-full'>
              <Button className='w-full' variant="outline" onClick={handleBatchPreview}>Gerar pré-visualização</Button>
            </div>

            {batchPreview.length > 0 && (
              <div className="space-y-2">
                <Label>Pré-visualização</Label>
                <div className="space-y-1 max-h-40 overflow-auto">
                  {batchPreview.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <div className="font-medium">#{item.number} {batchYear && <span className="text-muted-foreground">({item.year})</span>}</div>
                        {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                      </div>
                      <div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemovePreviewItem(idx)} title="Remover">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row flex-nowrap gap-4 sm:flex-row-reverse justify-between">
            <Button className="w-1/2" variant="outline" onClick={() => { setBatchDialogOpen(false); setBatchPreview([]); setBatchStart(''); setBatchEnd(''); }}>Cancelar</Button>
            {/* <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-4"> */}
              <Button className="w-1/2" onClick={handleConfirmBatch} disabled={batchPreview.length === 0}>Confirmar e salvar</Button>
            {/* </div> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Saga Dialog */}
      <Dialog open={sagaDialogOpen} onOpenChange={setSagaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sagaName">Titulo</Label>
              <Input
                id="sagaName"
                placeholder="Ex: Civil War, Secret Wars..."
                value={sagaName}
                onChange={(e) => setSagaName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sagaYear">Ano(s)</Label>
              <Input
                id="sagaYear"
                placeholder="Ex: 2006, 2015-2016..."
                value={sagaYear}
                onChange={(e) => setSagaYear(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="era">Era</Label>
              <Select value={sagaEra} onValueChange={(value: Era) => setSagaEra(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ERA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="universe">Universo</Label>
              <Select value={sagaUniverse} onValueChange={(value: Universe) => setSagaUniverse(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIVERSE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sagaNotes">Nota(s)</Label>
              <Textarea
                id="sagaNotes"
                placeholder="Notas sobre a saga/evento..."
                value={sagaNotes}
                onChange={(e) => setSagaNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className='flex gap-2 flex-row'>
            <Button className="w-1/2" onClick={handleSaveSaga} disabled={!sagaName.trim()}>
              Salvar
            </Button>
            <Button className="w-1/2" variant="outline" onClick={() => setSagaDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Progress Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar progresso?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as issues serão marcadas como não lidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-nowrap gap-4 flex-row justify-between">
            <AlertDialogCancel className="w-1/2">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="w-1/2">
              Resetar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Saga Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir saga?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as issues desta saga também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex flex-nowrap gap-4 flex-row justify-between'>
            <AlertDialogCancel className='w-1/2'>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSaga} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-1/2">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Issue Dialog */}
      <AlertDialog open={!!deletingIssueId} onOpenChange={(open) => !open && setDeletingIssueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir issue?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-nowrap gap-4 flex-row justify-between">
            <AlertDialogCancel className="w-1/2">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIssue} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-1/2">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* JSON Import Dialog */}
      <Dialog open={jsonImportDialogOpen} onOpenChange={setJsonImportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Issues via JSON</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="jsonImport">Cole o JSON aqui</Label>
              <Textarea
                id="jsonImport"
                placeholder='Exemplo: {"series": "The Amazing Spider-Man", "titleId": "123", "number": "1", "volume": 1, "isAnnual": false, "readingOrder": 1, "year": "1963", "storyType": "main", "isRead": false}'
                value={jsonImportText}
                onChange={(e) => setJsonImportText(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Aceita um objeto ou array de objetos. Campos obrigatórios: series, number. O titleId será validado se fornecido.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex flex-row gap-2">
            <Button className="w-1/2" onClick={handleJsonImport}>
              Importar
            </Button>
            <Button className="w-1/2" variant="outline" onClick={() => { setJsonImportDialogOpen(false); setJsonImportText(''); }}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
