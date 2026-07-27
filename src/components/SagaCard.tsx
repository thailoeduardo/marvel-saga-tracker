import { Link } from 'react-router-dom';
import { ChevronRight, Book, Trash2, Edit2 } from 'lucide-react';
import { Saga, ERA_LABELS, UNIVERSE_LABELS } from '@/types/marvel';
import { calculateProgress, getReadCount } from '@/lib/storage';
import { ProgressBar } from './ProgressBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SagaCardProps {
  saga: Saga;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SagaCard({ saga, onEdit, onDelete }: SagaCardProps) {
  const progress = calculateProgress(saga);
  const readCount = getReadCount(saga);
  const totalIssues = saga.issues.length;

  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-200 animate-fade-in">
      <Link to={`/saga/${saga.id}`} className="block">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between min-w-0">
              <h3 className="font-semibold text-lg text-foreground text-ellipsis md:truncate group-hover:text-primary transition-colors">
                {saga.name}
              </h3>

              <div className={cn('flex gap-1','pointer-events-none group-hover:pointer-events-auto')}>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {saga.year && (
                  <Badge variant="secondary" className="text-xs">
                    {saga?.year}
                  </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {ERA_LABELS[saga.era].split(' (')[0]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {UNIVERSE_LABELS[saga.universe].split(' (')[0]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Book className="w-4 h-4" />
            <span>
              {readCount} / {totalIssues} issues
            </span>
          </div>
          <ProgressBar progress={progress} size="md" />
        </div>
      </Link>
    </div>
  );
}
