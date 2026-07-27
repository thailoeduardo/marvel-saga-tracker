import { Check, Trash2, Pencil, Copy } from 'lucide-react';
import { useState } from 'react';
import { Issue } from '@/types/marvel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IssueItemProps {
  issue: Issue;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export function IssueItem({ issue, onToggle, onEdit, onDelete, onDuplicate }: IssueItemProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const hasLongNotes = (issue.notes?.length || 0) > 120;

  return (
    <div className={cn('flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 animate-slide-in',
      issue.isRead
        ? 'bg-success/10 border-success/30' 
        : 'bg-card border-border hover:border-primary/50'
      )}>

        <button
          onClick={onToggle}
          className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-1',
            issue.isRead
              ? 'bg-success border-success text-success-foreground'
              : 'border-muted-foreground hover:border-primary'
          )}
        >
          {issue.isRead && <Check className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-normal transition-all',
            issue.isRead && 'text-muted-foreground'
          )}>
            {issue.series}{issue.year && <span className="text-sm font-bold"> {issue.isAnnual ? ' - Anual #' : '#'}{issue.number}</span>}
          </p>
              <p className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                {issue.volume && <span>Vol: {issue.volume}</span>}
              </p>
              <p className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                {issue.readingOrder && <span>Ordem: {issue.readingOrder}</span>}
              </p>
              {issue.notes && (
                <div className="border-l-2 border-primary/30 pl-3 my-2">
                  <p
                    className={cn(
                      "text-muted-foreground/70 italic whitespace-pre-line",
                      !notesExpanded && "line-clamp-2"
                    )}
                  >
                    {issue.notes}
                  </p>
                  {hasLongNotes && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => setNotesExpanded(prev => !prev)}
                    >
                      {notesExpanded ? 'Ler menos' : 'Ler mais'}
                    </Button>
                  )}
                </div>
              )}
          <div className="flex gap-1 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={onEdit}
            >
              <Pencil className="w-3 h-3 mr-1" /> Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={onDuplicate}
              title="Duplicar issue"
            >
              <Copy className="w-3 h-3 mr-1" /> Duplicar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Excluir
            </Button>
          </div>
        </div>
    </div>
  );
}
