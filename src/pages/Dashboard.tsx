import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Filter, SortAsc, BookOpen, Search } from 'lucide-react';
import { useSagas, filterSagas, sortSagas } from '@/hooks/useSagas';
import { FilterOption, SortOption, Era, Universe, ERA_LABELS, UNIVERSE_LABELS } from '@/types/marvel';
import { SagaCard } from '@/components/SagaCard';
import { StatsCard } from '@/components/StatsCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { calculateProgress, getReadCount, getDashboardFilters, saveDashboardFilters } from '@/lib/storage';
import { cn } from '@/lib/utils';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'not-started', label: 'Não iniciadas' },
  { value: 'in-progress', label: 'Em leitura' },
  { value: 'completed', label: 'Concluídas' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Mais recentes' },
  { value: 'date-asc', label: 'Mais antigas' },
  { value: 'name-asc', label: 'Nome (A-Z)' },
  { value: 'name-desc', label: 'Nome (Z-A)' },
  { value: 'progress-desc', label: 'Maior progresso' },
  { value: 'progress-asc', label: 'Menor progresso' },
  { value: 'era', label: 'Por era' },
  { value: 'yaer-desc', label: 'Ano recentes' },
  { value: 'yaer-asc', label: 'Ano antigas' },
];

export default function Dashboard() {
  const {sagas, addSaga, updateSaga, deleteSaga } = useSagas();

  const savedFilters = getDashboardFilters();
  const [filter, setFilter] = useState<FilterOption>(savedFilters?.filter || 'all');
  const [sort, setSort] = useState<SortOption>(savedFilters?.sort || 'date-desc');
  const [search, setSearch] = useState(savedFilters?.search || '');
  
  // Persist filters when they change
  useEffect(() => {
    saveDashboardFilters({ filter, sort, search });
  }, [filter, sort, search]);
  
  // Dialog states
  const [sagaDialogOpen, setSagaDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSaga, setEditingSaga] = useState<string | null>(null);
  const [deletingSaga, setDeletingSaga] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formEra, setFormEra] = useState<Era>('modern-age');
  const [formUniverse, setFormUniverse] = useState<Universe>('earth-616');
  const [formYear, setFormYear] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Calculate stats
  const totalSagas = sagas.length;
  const totalIssues = sagas.reduce((acc, s) => acc + s.issues.length, 0);
  const totalRead = sagas.reduce((acc, s) => acc + getReadCount(s), 0);
  const completedSagas = sagas.filter(s => s.issues.length > 0 && s.issues.every(i => i.isRead)).length;

  // Filter and sort
  let displayedSagas = filterSagas(sagas, filter);
  if (search) {
    displayedSagas = displayedSagas.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  displayedSagas = sortSagas(displayedSagas, sort);

  const handleOpenCreate = () => {
    setEditingSaga(null);
    setFormName('');
    setFormEra('modern-age');
    setFormUniverse('earth-616');
    setFormYear('');
    setFormNotes('');
    setSagaDialogOpen(true);
  };

  const handleOpenEdit = (sagaId: string) => {
    const saga = sagas.find(s => s.id === sagaId);
    if (!saga) return;
    
    setEditingSaga(sagaId);
    setFormName(saga.name);
    setFormEra(saga.era);
    setFormUniverse(saga.universe);
    setFormYear(saga.year || '');
    setFormNotes(saga.notes || '');
    setSagaDialogOpen(true);
  };

  const handleSaveSaga = () => {
    if (!formName.trim()) return;
    
    if (editingSaga) {
      updateSaga(editingSaga, {
        name: formName.trim(),
        era: formEra,
        universe: formUniverse,
        year: formYear.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    } else {
      addSaga({
        name: formName.trim(),
        era: formEra,
        universe: formUniverse,
        year: formYear.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    }
    
    setSagaDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingSaga) {
      deleteSaga(deletingSaga);
      setDeleteDialogOpen(false);
      setDeletingSaga(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Sagas"
            value={totalSagas}
            icon={BookOpen}
            description={`${completedSagas} concluídas`}
          />
          <StatsCard
            title="Total de Issues"
            value={totalIssues}
            icon={BookOpen}
          />
          <StatsCard
            title="Issues Lidas"
            value={totalRead}
            icon={BookOpen}
            description={totalIssues > 0 ? `${Math.round((totalRead / totalIssues) * 100)}% do total` : undefined}
          />
          <StatsCard
            title="Progresso Geral"
            value={totalIssues > 0 ? `${Math.round((totalRead / totalIssues) * 100)}%` : '0%'}
            icon={BookOpen}
          />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
              <SelectTrigger className="w-full md:w-[250px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SortAsc className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sagas List */}
        {displayedSagas.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedSagas.map(saga => (
              <SagaCard
                key={saga.id}
                saga={saga}
                onEdit={() => handleOpenEdit(saga.id)}
                onDelete={() => {
                  setDeletingSaga(saga.id);
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={search || filter !== 'all' ? 'Nenhuma saga encontrada' : 'Nenhuma saga cadastrada'}
            description={search || filter !== 'all' 
              ? 'Tente ajustar os filtros ou busca' 
              : 'Comece adicionando sua primeira saga para acompanhar sua leitura'}
            action={!search && filter === 'all' && (
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            )}
          />
        )}

      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={sagaDialogOpen} onOpenChange={setSagaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSaga ? 'Atualizar' : 'Adicionar'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Titulo</Label>
              <Input
                id="name"
                placeholder="Ex: Civil War, Secret Wars..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="era">Era</Label>
              <Select value={formEra} onValueChange={(v) => setFormEra(v as Era)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ERA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="universe">Universo</Label>
              <Select value={formUniverse} onValueChange={(v) => setFormUniverse(v as Universe)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIVERSE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano(s)</Label>
              <Input
                id="year"
                placeholder="Ex: 2006, 2015-2016..."
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre a saga/evento..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 flex-row">
            <Button className="w-1/2" onClick={handleSaveSaga} disabled={!formName.trim()}>
              Salvar
            </Button>
            <Button variant="outline" className="w-1/2" onClick={() => setSagaDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir saga?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as issues desta saga também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex flex-nowrap gap-4 flex-row justify-between'>
            <AlertDialogCancel className="w-1/2">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-1/2">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
