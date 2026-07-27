import { NavLink, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, List, BarChart2, Settings } from 'lucide-react';
import { useAddSagaDialog } from './AddSagaDialog';

const navItems = [
  { to: '/add-saga', label: 'Adicionar', Icon: PlusCircle },
  { to: '/titles', label: 'Títulos', Icon: List },
  { to: '/', label: 'Home', Icon: Home },
  { to: '/statistics', label: 'Estatísticas', Icon: BarChart2 },
  { to: '/settings', label: 'Configurações', Icon: Settings },
];

export function BottomNav() {
  const navigate = useNavigate();
  const addSagaCtx = useAddSagaDialog();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around max-w-4xl mx-auto h-16 px-2">
        {navItems.map(({ to, label, Icon }) => {
          if (to === '/add-saga') {
            return (
              <button
                key={to}
                type="button"
                onClick={() => {
                  if (addSagaCtx) {
                    addSagaCtx.open();
                    return;
                  }

                  // Fallback: navigate to add-saga route which will attempt to open the dialog
                  navigate('/add-saga');
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 text-xs transition-colors text-muted-foreground`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] leading-none">{label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-1 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-none">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
