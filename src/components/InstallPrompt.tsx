import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed recently (24h)
    const dismissedAt = localStorage.getItem('installPromptDismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show modal after 3 seconds for iOS
      const timer = setTimeout(() => setShowModal(true), 3000);
      return () => clearTimeout(timer);
    }

    // For other browsers, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show modal after 3 seconds
      setTimeout(() => setShowModal(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    
    setShowModal(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('installPromptDismissed', Date.now().toString());
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Instalar Marvel Tracker
          </DialogTitle>
          <DialogDescription className="text-center">
            Adicione o app à sua tela inicial para acesso rápido e experiência offline.
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Para instalar no iOS:
            </p>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </span>
                <span>Toque no botão <strong>Compartilhar</strong> na barra do navegador</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  2
                </span>
                <span>Role e toque em <strong>"Adicionar à Tela de Início"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  3
                </span>
                <span>Toque em <strong>"Adicionar"</strong> para confirmar</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Tenha acesso rápido ao seu tracker de leitura diretamente da tela inicial do seu dispositivo.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!isIOS && deferredPrompt && (
            <Button onClick={handleInstall} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Instalar Agora
            </Button>
          )}
          <Button variant="ghost" onClick={handleDismiss} className="w-full">
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
