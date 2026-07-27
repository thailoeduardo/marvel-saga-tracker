import { useMemo } from 'react';
import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useSagas } from '@/hooks/useSagas';
import { ERA_LABELS } from '@/types/marvel';
import { calculateProgress, getReadCount } from '@/lib/storage';
import { StatsCard } from '@/components/StatsCard';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';

export default function Statistics() {
  const { sagas } = useSagas();

  const stats = useMemo(() => {
    const totalSagas = sagas.length;
    const totalIssues = sagas.reduce((acc, s) => acc + s.issues.length, 0);
    const totalRead = sagas.reduce((acc, s) => acc + getReadCount(s), 0);
    const completedSagas = sagas.filter(s => s.issues.length > 0 && s.issues.every(i => i.isRead)).length;
    const inProgressSagas = sagas.filter(s => {
      const readCount = getReadCount(s);
      return readCount > 0 && readCount < s.issues.length;
    }).length;
    const notStartedSagas = sagas.filter(s => s.issues.length === 0 || s.issues.every(i => !i.isRead)).length;
    
    // Stats by era
    const byEra = Object.keys(ERA_LABELS).reduce((acc, era) => {
      const eraSagas = sagas.filter(s => s.era === era);
      const issues = eraSagas.reduce((sum, s) => sum + s.issues.length, 0);
      const read = eraSagas.reduce((sum, s) => sum + getReadCount(s), 0);
      if (eraSagas.length > 0) {
        acc[era] = {
          sagas: eraSagas.length,
          issues,
          read,
          progress: issues > 0 ? Math.round((read / issues) * 100) : 0,
        };
      }
      return acc;
    }, {} as Record<string, { sagas: number; issues: number; read: number; progress: number }>);

    // Top sagas by progress
    const topSagas = [...sagas]
      .filter(s => s.issues.length > 0)
      .sort((a, b) => calculateProgress(b) - calculateProgress(a))
      .slice(0, 5);

    return {
      totalSagas,
      totalIssues,
      totalRead,
      completedSagas,
      inProgressSagas,
      notStartedSagas,
      overallProgress: totalIssues > 0 ? Math.round((totalRead / totalIssues) * 100) : 0,
      byEra,
      topSagas,
    };
  }, [sagas]);

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Estatísticas</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso de leitura</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Sagas"
            value={stats.totalSagas}
            icon={BookOpen}
          />
          <StatsCard
            title="Total de Issues"
            value={stats.totalIssues}
            icon={BookOpen}
          />
          <StatsCard
            title="Issues Lidas"
            value={stats.totalRead}
            icon={CheckCircle}
            description={`${stats.overallProgress}% concluído`}
            trend={stats.overallProgress > 50 ? 'up' : undefined}
          />
          <StatsCard
            title="Sagas Completas"
            value={stats.completedSagas}
            icon={TrendingUp}
            description={`de ${stats.totalSagas} sagas`}
          />
        </div>

        {/* Progress Overview */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Progresso Geral</h2>
          <ProgressBar progress={stats.overallProgress} size="lg" />
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats.notStartedSagas}</p>
              <p className="text-sm text-muted-foreground">Não iniciadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{stats.inProgressSagas}</p>
              <p className="text-sm text-muted-foreground">Em leitura</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{stats.completedSagas}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </div>
        </div>

        {/* Stats by Era */}
        {Object.keys(stats.byEra).length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Progresso por Era</h2>
            <div className="space-y-4">
              {Object.entries(stats.byEra).map(([era, data]) => (
                <div key={era} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{ERA_LABELS[era as keyof typeof ERA_LABELS].split(' (')[0]}</span>
                    <span className="text-muted-foreground">
                      {data.read}/{data.issues} issues ({data.sagas} sagas)
                    </span>
                  </div>
                  <ProgressBar progress={data.progress} size="sm" showLabel={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Sagas */}
        {stats.topSagas.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Top 5 - Maior Progresso</h2>
            <div className="space-y-3">
              {stats.topSagas.map((saga, index) => {
                const progress = calculateProgress(saga);
                return (
                  <div key={saga.id} className="flex items-center gap-4">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 && 'bg-primary text-primary-foreground',
                      index === 1 && 'bg-muted text-muted-foreground',
                      index === 2 && 'bg-muted text-muted-foreground',
                      index > 2 && 'bg-muted/50 text-muted-foreground'
                    )}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{saga.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getReadCount(saga)}/{saga.issues.length} issues
                      </p>
                    </div>
                    <ProgressBar progress={progress} size="sm" className="w-24" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
