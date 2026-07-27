import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Download, Upload, Search } from 'lucide-react';
import { useTitles } from '@/hooks/useTitles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function Titles() {
  const { titles, addTitle, updateTitle, deleteTitle, exportTitles, importTitles, refresh } = useTitles();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const t = titles.find(tt => tt.id === id);
    if (!t) return;
    setEditingId(id);
    setName(t.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) {
      await updateTitle(editingId, { name: name.trim() });
      toast({ title: 'Título atualizado', description: 'O título foi atualizado com sucesso.' });
    } else {
      await addTitle({ name: name.trim() });
      toast({ title: 'Título criado', description: 'O título foi criado com sucesso.' });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteTitle(deletingId);
    setDeletingId(null);
    setDeleteDialogOpen(false);
    toast({ title: 'Título excluído', description: 'O título foi excluído.' });
  };

  const handleExport = async () => {
    const data = await exportTitles();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marvel-titles-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exportado', description: 'Lista de títulos exportada.' });
  };

  const handleImportPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      // attempt merge first
      const result = await importTitles(content, { merge: true });
      if (result.success) {
        refresh();
        toast({ title: 'Importação concluída', description: result.merged ? `${result.merged} títulos mesclados.` : 'Importação concluída.' });
      } else {
        toast({ title: 'Erro', description: 'Arquivo inválido.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 space-y-6 max-w-3xl">
        <div className="flex flex-col">
					<div className='w-full mb-6'>
            <h1 className="text-2xl font-bold">Títulos</h1>

            <p className="text-muted-foreground">Gerencie personagens, equipes e outros</p>
          </div>

          <div className="flex gap-2 justify-between">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportPick} className="hidden" />
            <Button className="w-full" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Importar
            </Button>

            <Button className="w-full" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>

            <Button className="w-full" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Novo
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar títulos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* <div className="bg-card border border-border rounded-lg p-4"> */}
            {(() => {
              const filteredTitles = titles
                .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));
              
              return filteredTitles.length === 0 ? (
                <p className="text-muted-foreground">
                  {search ? 'Nenhum título encontrado.' : 'Nenhum título cadastrado ainda.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredTitles.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-primary/50 transition-all duration-200 animate-fade-in">
                      <div>
                        <div className="font-medium">{t.name}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t.id)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(t.id); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          {/* </div> */}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Titulo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titleName">Nome</Label>
              <Input id="titleName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2">
            <Button className="w-1/2" onClick={handleSave}>Salvar</Button>
            <Button variant="outline" className="w-1/2" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row flex-nowrap gap-4 justify-between">
            <AlertDialogCancel className="w-1/2">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-1/2">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
