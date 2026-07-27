import { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Era, Universe, ERA_LABELS, UNIVERSE_LABELS } from '@/types/marvel';
import { useSagas } from '@/hooks/useSagas';

type AddSagaContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const AddSagaDialogContext = createContext<AddSagaContextValue | undefined>(undefined);

export function useAddSagaDialog() {
  const ctx = useContext(AddSagaDialogContext);
  if (!ctx) throw new Error('useAddSagaDialog must be used within AddSagaDialogProvider');
  return ctx;
}

export function AddSagaDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AddSagaDialogContext.Provider value={{ open: () => setIsOpen(true), close: () => setIsOpen(false), isOpen }}>
      {children}
      <AddSagaDialog isOpen={isOpen} onOpenChange={(v: boolean) => setIsOpen(v)} />
    </AddSagaDialogContext.Provider>
  );
}

function AddSagaDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (v: boolean) => void }) {
  const { addSaga } = useSagas();
  const [formName, setFormName] = useState('');
  const [formEra, setFormEra] = useState<Era>('modern-age');
  const [formUniverse, setFormUniverse] = useState<Universe>('earth-616');
  const [formYear, setFormYear] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const clear = () => {
    setFormName('');
    setFormEra('modern-age');
    setFormUniverse('earth-616');
    setFormYear('');
    setFormNotes('');
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    addSaga({
      name: formName.trim(),
      era: formEra,
      universe: formUniverse,
      year: formYear.trim() || undefined,
      notes: formNotes.trim() || undefined,
    });
    clear();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Titulo</Label>
            <Input id="name" placeholder="Ex: Civil War, Secret Wars..." value={formName} onChange={(e) => setFormName(e.target.value)} />
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
            <Input id="year" placeholder="Ex: 2006, 2015-2016..." value={formYear} onChange={(e) => setFormYear(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" placeholder="Notas sobre a saga/evento..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2">
          <Button className="w-1/2" onClick={handleSave} disabled={!formName.trim()}>
            Salvar
          </Button>
          <Button variant="outline" className="w-1/2" onClick={() => { onOpenChange(false); clear(); }}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
