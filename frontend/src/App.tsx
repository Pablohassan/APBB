import { useState } from 'react';
import { NavLink, useRoutes } from 'react-router-dom';
import { Menu, PanelLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppRoutes } from './routes';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';

const navigation = [
  { to: '/', label: 'Dashboard' },
  { to: '/cases', label: 'Affaires' },
  { to: '/interventions', label: 'Interventions' },
  { to: '/reviews', label: 'Files de validation' },
  { to: '/technician', label: 'Vue technicien' },
];

export default function App() {
  const element = useRoutes(AppRoutes);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-col bg-white shadow-sm lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
          <PanelLeft className="h-5 w-5 text-blue-500" />
          <span className="text-lg font-semibold text-slate-800">APBB Interventions</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100',
                  isActive ? 'bg-slate-900 text-white hover:bg-slate-900' : 'text-slate-600',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-medium text-slate-500">Plateforme TPE</p>
              <h1 className="text-lg font-semibold text-slate-900">Gestion des interventions</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="font-semibold text-slate-800">Yellen (Admin)</p>
              <p className="text-xs text-slate-500">Bureau</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">{element}</main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="absolute inset-y-0 left-0 w-72 bg-white p-6 shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center gap-2">
                <PanelLeft className="h-5 w-5 text-blue-500" />
                <span className="text-lg font-semibold text-slate-800">APBB Interventions</span>
              </div>
              <nav className="space-y-2">
                {navigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100',
                        isActive ? 'bg-slate-900 text-white hover:bg-slate-900' : 'text-slate-600',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
