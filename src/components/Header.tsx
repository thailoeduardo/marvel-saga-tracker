import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, Maximize, Minimize } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/statistics', label: 'Estatísticas' },
  { path: '/titles', label: 'Títulos' },
  { path: '/settings', label: 'Configurações' },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, isConfigured } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          {/* <span className="font-bold text-sm sm:text-lg truncate">Marvel Reading Tracker</span> */}
        </Link>

        <div className="flex items-center gap-2">
          {isConfigured && user && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex max-w-48 truncate"
              onClick={() => signOut()}
              title={user.email || 'Sair'}
            >
              Sair
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:flex rounded-lg"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair do modo tela cheia' : 'Modo tela cheia'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
