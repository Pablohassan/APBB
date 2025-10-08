import { useMemo } from 'react';
import { useApiQuery } from '../hooks/use-api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { motion } from 'framer-motion';

interface Intervention {
  id: string;
  title: string;
  status: string;
  type: string;
  priority: 'STANDARD' | 'URGENT';
  case: {
    client: { name: string };
    site: { label: string; city: string };
  };
}

export function TechnicianMobilePage() {
  const { data, isLoading } = useApiQuery<Intervention[]>(['interventions'], '/interventions');

  const urgent = useMemo(() => data?.filter((item) => item.priority === 'URGENT') ?? [], [data]);
  const assigned = useMemo(() => data?.filter((item) => item.status === 'ASSIGNED') ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 p-6 text-white">
        <h1 className="text-xl font-semibold">Application technicien</h1>
        <p className="mt-2 text-sm text-slate-300">
          Vue mobile Android : prise d’urgence, statut terrain, photos et demandes de devis.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Urgences disponibles</h2>
            {urgent.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-600">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.case.client.name}</p>
                    </div>
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{item.case.site.label}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1">
                      Je prends
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1">
                      Voir détails
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            {urgent.length === 0 && <p className="text-sm text-slate-500">Pas d’urgence en file.</p>}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Missions assignées</h2>
            {assigned.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.case.client.name}</p>
                    </div>
                    <Badge variant="success">Assignée</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{item.case.site.city}</p>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600">
                    <Button size="sm" variant="secondary">
                      En route
                    </Button>
                    <Button size="sm" variant="secondary">
                      Démarrée
                    </Button>
                    <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600">
                      Terminer + envoyer CR
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            {assigned.length === 0 && <p className="text-sm text-slate-500">Aucune mission assignée.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
