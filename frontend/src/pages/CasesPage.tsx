import { useMemo, useState } from 'react';
import { useApiQuery } from '../hooks/use-api';
import { Card, CardContent, CardHeader } from '../components/ui/card';
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
}

interface CaseItem {
  id: string;
  title: string;
  description?: string;
  priority: 'STANDARD' | 'URGENT';
  status: string;
  client: { name: string };
  site: { label: string; city: string };
  interventions: Intervention[];
}

const statusFilter = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'OPEN', label: 'Ouvertes' },
  { id: 'IN_PROGRESS', label: 'En cours' },
  { id: 'WAITING_PARTS', label: 'En attente pièces' },
  { id: 'WAITING_CLIENT', label: 'En attente client' },
  { id: 'REPORT_PENDING', label: 'CR à valider' },
];

export function CasesPage() {
  const { data, isLoading } = useApiQuery<CaseItem[]>(['cases'], '/cases');
  const [filter, setFilter] = useState('ALL');

  const filteredCases = useMemo(() => {
    if (!data) return [];
    if (filter === 'ALL') return data;
    return data.filter((item) => item.status === filter);
  }, [data, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Affaires</h1>
          <p className="text-sm text-slate-500">Suivi des affaires, interventions liées et état d'avancement.</p>
        </div>
        <Button>Nouvelle affaire</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilter.map((item) => (
          <Button
            key={item.id}
            variant={filter === item.id ? 'default' : 'secondary'}
            onClick={() => setFilter(item.id)}
            className="text-xs"
          >
            {item.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4">
          {filteredCases.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{item.title}</h2>
                        <Badge variant={item.priority === 'URGENT' ? 'destructive' : 'default'}>
                          {item.priority === 'URGENT' ? 'Urgent' : 'Standard'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {item.client.name} • {item.site.label} ({item.site.city})
                      </p>
                    </div>
                    <Badge>{item.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.description && <p className="text-sm text-slate-600">{item.description}</p>}

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">Interventions</h3>
                    <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {item.interventions.map((intervention) => (
                        <div
                          key={intervention.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800">{intervention.title}</span>
                            <Badge variant={intervention.priority === 'URGENT' ? 'destructive' : 'success'}>
                              {intervention.priority === 'URGENT' ? 'Urgent' : 'Planifié'}
                            </Badge>
                          </div>
                          <div className="mt-1">Statut : {intervention.status}</div>
                          <div>Type : {intervention.type}</div>
                        </div>
                      ))}
                      {item.interventions.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                          Aucune intervention enregistrée pour le moment.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filteredCases.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-slate-500">Aucune affaire pour ce filtre.</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
