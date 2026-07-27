import { ReactNode } from 'react';
import { Header } from './Header';
import BottomNav from './BottomNav';
import { AddSagaDialogProvider } from './AddSagaDialog';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <AddSagaDialogProvider>
        <Header />

        {/* Main content sits between header and bottom nav */}
        <main className="pb-20" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>
          {children}
        </main>

        <BottomNav />
      </AddSagaDialogProvider>
    </div>
  );
}

export default Layout;
