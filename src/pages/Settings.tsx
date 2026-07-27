import { useState, useRef, useEffect } from 'react';
import { Download, Upload, Trash2, Sun, Moon, Monitor, Smartphone } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useSagas } from '@/hooks/useSagas';
import { useAuth } from '@/hooks/useAuth';
import { Theme } from '@/types/marvel';
import { exportData, importData, clearAllData } from '@/lib/storage';
import * as supabaseStorage from '@/lib/supabaseStorage';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { refresh } = useSagas();
  const { user, signOut, isConfigured } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast({
          title: 'App instalado!',
          description: 'O app foi adicionado à sua tela inicial.',
        });
      }
      setDeferredPrompt(null);
    }
  };

  const handleExport = async () => {
    try {
      const data = supabaseStorage.canUseSupabase()
        ? await supabaseStorage.exportData()
        : exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marvel-reading-tracker-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: 'Seus dados foram exportados com sucesso.',
      });
    } catch {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar seus dados.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const success = supabaseStorage.canUseSupabase()
          ? await supabaseStorage.importData(content)
          : importData(content);

        if (success) {
          await refresh();
          toast({
            title: 'Importação concluída',
            description: supabaseStorage.canUseSupabase()
              ? 'Seus dados foram importados para o Supabase.'
              : 'Seus dados foram importados com sucesso.',
          });
        } else {
          toast({
            title: 'Erro na importação',
            description: 'O arquivo selecionado não é válido.',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Erro na importação',
          description: 'Não foi possível importar o arquivo.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = async () => {
    try {
      if (supabaseStorage.canUseSupabase()) {
        await supabaseStorage.clearAllData();
      } else {
        clearAllData();
      }
      await refresh();
      setClearDialogOpen(false);
      toast({
        title: 'Dados limpos',
        description: 'Todos os seus dados foram excluídos.',
      });
    } catch {
      toast({
        title: 'Erro ao limpar dados',
        description: 'Não foi possível excluir seus dados.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container py-6 space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Personalize sua experiência</p>
        </div>

        {isConfigured && user && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Conta</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        )}

        {/* Theme */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Tema</h2>
            <p className="text-sm text-muted-foreground">Escolha o tema da interface</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  theme === value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Icon className={cn(
                  'w-6 h-6',
                  theme === value ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  theme === value ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Gerenciar Dados</h2>
            <p className="text-sm text-muted-foreground">Exporte, importe ou limpe seus dados</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium">Exportar Dados</p>
                <p className="text-sm text-muted-foreground">Baixe um backup dos seus dados em JSON</p>
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium">Importar Dados</p>
                <p className="text-sm text-muted-foreground">Restaure dados de um backup JSON</p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="font-medium">Limpar Todos os Dados</p>
                <p className="text-sm text-muted-foreground">Apagar permanentemente todas as sagas e issues</p>
              </div>
              <Button variant="destructive" onClick={() => setClearDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Install App */}
        {!isInstalled && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Instalar App</h2>
              <p className="text-sm text-muted-foreground">Adicione o app à sua tela inicial para acesso rápido</p>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium">Instalar na Tela Inicial</p>
                <p className="text-sm text-muted-foreground">
                  {isIOS 
                    ? 'Toque em Compartilhar e depois "Adicionar à Tela de Início"'
                    : 'Instale o app para usar offline'
                  }
                </p>
              </div>
              {!isIOS && deferredPrompt && (
                <Button variant="outline" onClick={handleInstall}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Instalar
                </Button>
              )}
              {isIOS && (
                <div className="text-2xl">📲</div>
              )}
            </div>
          </div>
        )}

        {/* About */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold">Sobre</h2>
          <p className="text-sm text-muted-foreground">
            Marvel Reading Tracker v1.0.0
          </p>
          <p className="text-sm text-muted-foreground">
            Um PWA para acompanhar sua leitura de quadrinhos da Marvel. Funciona 100% offline após o primeiro acesso.
          </p>
        </div>
      </main>

      {/* Clear Data Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as suas sagas, issues e configurações serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-4 flex-row justify-between">
            <AlertDialogCancel className="w-1/2">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-1/2">
              Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
